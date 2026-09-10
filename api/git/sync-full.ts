import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  applyCors,
  resolveGithubToken,
  normalizeRepo,
  getRepoMeta,
  formatGithubError,
  getBranchCommitAndTree,
  createTreeAndCommit,
  getSafeSupabase,
  verifyAdminCaller,
} from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Verify that the request has admin rights
  const adminCheck = await verifyAdminCaller(req);
  if (!adminCheck.isAdmin) {
    return res.status(adminCheck.status || 401).json({
      success: false,
      error: adminCheck.error || 'Unauthorized: Admin privileges required.',
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
      error: 'GitHub authentication required. Configure GITHUB_TOKEN in Vercel environment variables or provide token.',
    });
  }

  const { message = 'Full System Sync via FindAba City OS' } = req.body || {};

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const treeItems: Array<{ path: string; mode?: string; type?: string; content: string }> = [];

    // Fetch active registry records from Supabase if configured
    try {
      const supabase = getSafeSupabase();
      if (supabase) {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (businesses && businesses.length > 0) {
          const registryContent = JSON.stringify(
            {
              version: 'v6.0-prod',
              lastUpdated: new Date().toISOString(),
              repo,
              recordsCount: businesses.length,
              businesses,
            },
            null,
            2
          );
          treeItems.push({ path: 'registry.json', content: registryContent });
        }
      }
    } catch (e: any) {
      console.warn('[GitSyncFull] Supabase fetch notice:', e.message);
    }

    // Ensure baseline registry.json is present if database was empty
    if (treeItems.length === 0) {
      treeItems.push({
        path: 'registry.json',
        content: JSON.stringify(
          {
            version: 'v6.0-init',
            lastUpdated: new Date().toISOString(),
            repo,
            status: 'initialized',
          },
          null,
          2
        ),
      });
    }

    const repoMeta = await getRepoMeta(owner, name, token);
    const targetBranch = branchOverride || repoMeta.default_branch || 'main';

    const { commitSha, treeSha } = await getBranchCommitAndTree(owner, name, targetBranch, token);

    const { htmlUrl } = await createTreeAndCommit({
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
      repo,
      branch: targetBranch,
      message: 'Full registry and data sync committed to GitHub successfully.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const { status, details, message: errMsg } = formatGithubError(error, repo, token);
    return res.status(status).json({
      success: false,
      error: errMsg || 'Failed to perform full sync',
      details,
      status,
    });
  }
}
