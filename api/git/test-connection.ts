import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  githubClient,
  resolveGithubToken,
  authHeaders,
  normalizeRepo,
  formatGithubError,
} from '../../server/services/github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = req.body?.repo ? String(req.body.repo) : undefined;
  let repo = normalizeRepo(bodyRepo || queryRepo);

  const token = resolveGithubToken(req);

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const headers = authHeaders(token);
    const repoRes = await githubClient.get(`/repos/${owner}/${name}`, { headers });

    const data = repoRes.data;
    const permissions = {
      push: Boolean(data.permissions?.push),
      pull: Boolean(data.permissions?.pull ?? true),
      admin: Boolean(data.permissions?.admin),
    };

    const rateLimitRemaining = Number(repoRes.headers['x-ratelimit-remaining']) || 0;

    let authStatus = 'Public Access (No Token)';
    if (token) {
      authStatus = permissions.push ? 'Authenticated (Read/Write)' : 'Authenticated (Read Only)';
    }

    return res.status(200).json({
      success: true,
      repo: data.full_name,
      exists: true,
      private: Boolean(data.private),
      defaultBranch: data.default_branch || 'main',
      permissions,
      rateLimitRemaining,
      authStatus,
      htmlUrl: data.html_url,
      tokenValid: Boolean(token),
      message: `GitHub repository connection to '${data.full_name}' verified successfully.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const { status, details, message } = formatGithubError(error, repo, token);
    return res.status(status).json({
      success: false,
      repo,
      exists: false,
      message: message || 'GitHub connection test failed',
      details,
      status,
    });
  }
}
