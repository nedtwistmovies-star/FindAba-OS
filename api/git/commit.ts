import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveGithubToken,
  normalizeRepo,
  getRepoMeta,
  formatGithubError,
  getBranchCommitAndTree,
  createTreeAndCommit,
} from '../../server/services/github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
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
      error: 'GitHub authentication required. Set GITHUB_TOKEN in environment variables.',
    });
  }

  const { files = [], message = 'Update registry via FindAba OS' } = req.body || {};

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files provided for commit.' });
  }

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const treeItems: Array<{ path: string; mode?: string; type?: string; content: string }> = files.map((file: any) => {
      let content = file.content;
      if (typeof content !== 'string') {
        content = JSON.stringify(file.data !== undefined ? file.data : file, null, 2);
      }
      return {
        path: file.path,
        mode: file.mode || '100644',
        type: file.type || 'blob',
        content,
      };
    });

    const repoMeta = await getRepoMeta(owner, name, token);
    const targetBranch = branchOverride || repoMeta.default_branch || 'main';

    const { commitSha, treeSha } = await getBranchCommitAndTree(owner, name, targetBranch, token);

    const { htmlUrl, commitSha: newSha } = await createTreeAndCommit({
      owner,
      name,
      branch: targetBranch,
      token,
      message,
      treeItems,
      baseTreeSha: treeSha,
      parentCommitSha: commitSha,
    });

    return res.status(200).json({
      success: true,
      commit: htmlUrl,
      sha: newSha,
      filesCount: treeItems.length,
      message: 'Files committed successfully to GitHub.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const { status, details, message: errMsg } = formatGithubError(error, repo, token);
    return res.status(status).json({
      success: false,
      error: errMsg || 'Failed to commit files',
      details,
      status,
    });
  }
}
