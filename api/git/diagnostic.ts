import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  githubClient,
  resolveGithubToken,
  authHeaders,
  normalizeRepo,
} from '../../server/services/github.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = req.body?.repo ? String(req.body.repo) : undefined;
  const repo = normalizeRepo(bodyRepo || queryRepo);

  const queryBranch = req.query?.branch ? String(req.query.branch) : undefined;
  const bodyBranch = req.body?.branch ? String(req.body.branch) : undefined;
  const branch = bodyBranch || queryBranch || process.env.GITHUB_BRANCH || 'main';

  const token = resolveGithubToken(req);
  const hasToken = Boolean(token);

  const checks: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }> = [];

  // Check 1: Token Configuration
  if (hasToken) {
    checks.push({
      name: 'GitHub Credential',
      status: 'ok',
      message: 'Server-side GitHub token configured.',
    });
  } else {
    checks.push({
      name: 'GitHub Credential',
      status: 'warning',
      message: 'No server-side GITHUB_TOKEN configured. Read-only access for public repos only.',
    });
  }

  let githubApiReachable = false;
  let rateLimitRemaining = 0;

  // Check 2: GitHub API Reachability
  try {
    const rateLimitRes = await githubClient.get('/rate_limit', {
      headers: authHeaders(token),
    });
    githubApiReachable = true;
    rateLimitRemaining = rateLimitRes.data.resources?.core?.remaining ?? 0;
    checks.push({
      name: 'GitHub API Connectivity',
      status: 'ok',
      message: `GitHub API reachable. Rate limit remaining: ${rateLimitRemaining}.`,
    });
  } catch (err: any) {
    checks.push({
      name: 'GitHub API Connectivity',
      status: 'error',
      message: `Failed to connect to GitHub API: ${err.message}`,
    });
  }

  // Check 3: Repository Access
  let repositoryAccessible = false;
  let isPrivate = false;
  let defaultBranch = branch;
  let permissions = { push: false, pull: false, admin: false };

  if (githubApiReachable) {
    const [owner, name] = repo.split('/');
    if (owner && name) {
      try {
        const repoRes = await githubClient.get(`/repos/${owner}/${name}`, {
          headers: authHeaders(token),
        });
        repositoryAccessible = true;
        isPrivate = Boolean(repoRes.data.private);
        defaultBranch = repoRes.data.default_branch || branch;
        permissions = {
          push: Boolean(repoRes.data.permissions?.push),
          pull: Boolean(repoRes.data.permissions?.pull ?? true),
          admin: Boolean(repoRes.data.permissions?.admin),
        };
        checks.push({
          name: 'Repository Validation',
          status: 'ok',
          message: `Repository ${repo} exists and is accessible (${isPrivate ? 'private' : 'public'}).`,
        });
      } catch (err: any) {
        checks.push({
          name: 'Repository Validation',
          status: 'error',
          message: err.response?.status === 404
            ? `Repository ${repo} not found on GitHub.`
            : `Repository access error: ${err.message}`,
        });
      }
    } else {
      checks.push({
        name: 'Repository Validation',
        status: 'error',
        message: `Invalid repository specification: ${repo}`,
      });
    }
  }

  const allPassed = checks.every((c) => c.status !== 'error');

  return res.status(200).json({
    success: allPassed,
    repo,
    branch,
    hasToken,
    githubApiReachable,
    repositoryAccessible,
    isPrivate,
    defaultBranch,
    permissions,
    rateLimitRemaining,
    timestamp: new Date().toISOString(),
    checks,
    message: allPassed
      ? 'GitHub integration diagnostics verified successfully.'
      : 'GitHub integration diagnostics identified issues.',
  });
}