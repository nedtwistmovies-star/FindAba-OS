import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {
  applyCors,
  resolveGithubToken,
  normalizeRepo,
  getRepoMeta,
  formatGithubError,
  getBranchCommitAndTree,
  createTreeAndCommit,
  authHeaders,
  githubClient,
  verifyAdminCaller,
} from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  // Admin Verification Gate
  const auth = await verifyAdminCaller(req);
  if (!auth.isAdmin) {
    return res.status(auth.status || 403).json({
      success: false,
      error: auth.error || 'Admin privileges required to push changes.',
    });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = req.body?.repo ? String(req.body.repo) : undefined;
  let repo = normalizeRepo(bodyRepo || queryRepo);

  const queryBranch = req.query?.branch ? String(req.query.branch) : undefined;
  const bodyBranch = req.body?.branch ? String(req.body.branch) : undefined;
  const branchOverride = bodyBranch || queryBranch;

  const token = resolveGithubToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'GitHub authentication required. Set GITHUB_TOKEN or provide X-GitHub-Token.',
    });
  }

  const {
    files = [],
    message = 'Push changes via FindAba City OS',
    author = auth.adminName || 'FindAba Admin',
    createBranchIfMissing = true,
  } = req.body || {};

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const headers = authHeaders(token);
    const repoMeta = await getRepoMeta(owner, name, token);
    const targetBranch = branchOverride || process.env.GITHUB_BRANCH || repoMeta.default_branch || 'prod-stabilize/phase1-foundation';

    const treeItems: Array<{ path: string; mode?: string; type?: string; content: string }> = [];

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        let content = file.content;
        if (content === undefined && file.data !== undefined) {
          content = typeof file.data === 'string' ? file.data : JSON.stringify(file.data, null, 2);
        } else if (typeof content !== 'string') {
          content = JSON.stringify(content, null, 2);
        }
        treeItems.push({
          path: file.path,
          mode: file.mode || '100644',
          type: file.type || 'blob',
          content,
        });
      }
    } else {
      // Auto-collect registry.json if available
      try {
        const localRegPath = path.join(process.cwd(), 'registry.json');
        if (fs.existsSync(localRegPath)) {
          treeItems.push({
            path: 'registry.json',
            mode: '100644',
            type: 'blob',
            content: fs.readFileSync(localRegPath, 'utf8'),
          });
        }
      } catch (e) {
        console.warn('[PushAPI] Fallback registry read note:', e);
      }
    }

    if (treeItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No files or modifications detected to push.' });
    }

    let branchInfo = await getBranchCommitAndTree(owner, name, targetBranch, token);

    // If branch is missing, fork from default branch
    if (!branchInfo.commitSha && createBranchIfMissing && targetBranch !== repoMeta.default_branch) {
      const defaultBranchInfo = await getBranchCommitAndTree(owner, name, repoMeta.default_branch, token);
      if (defaultBranchInfo.commitSha) {
        try {
          await githubClient.post(
            `/repos/${owner}/${name}/git/refs`,
            { ref: `refs/heads/${targetBranch}`, sha: defaultBranchInfo.commitSha },
            { headers }
          );
          branchInfo = defaultBranchInfo;
        } catch (refErr) {
          console.warn(`[PushAPI] Could not fork branch '${targetBranch}':`, refErr);
        }
      }
    }

    const { commitSha, htmlUrl } = await createTreeAndCommit({
      owner,
      name,
      branch: targetBranch,
      token,
      message,
      treeItems,
      baseTreeSha: branchInfo.treeSha,
      parentCommitSha: branchInfo.commitSha,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully pushed changes to branch '${targetBranch}'.`,
      commit: htmlUrl,
      commitSha,
      branch: targetBranch,
      repo: `${owner}/${name}`,
      filesCount: treeItems.length,
      files: treeItems.map((t) => t.path),
      timestamp: new Date().toISOString(),
      admin: auth.adminName,
    });
  } catch (error: any) {
    const { status, details, message: errMsg } = formatGithubError(error, repo, token);
    return res.status(status).json({
      success: false,
      error: errMsg || 'Failed to push changes to GitHub',
      details,
      status,
    });
  }
}
