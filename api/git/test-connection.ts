import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { applyCors, normalizeRepo, resolveGithubToken } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = (req.body as any)?.repo ? String((req.body as any).repo) : undefined;
  let repo = normalizeRepo(bodyRepo || queryRepo);

  const token = resolveGithubToken(req);

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'FindAba-City-OS',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
      headers,
      timeout: 15000,
    });

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
    const status = error.response?.status || 500;
    const details = error.response?.data?.message || error.message || 'Unknown error';
    let message = `Failed to connect to GitHub repository '${repo}'.`;

    if (status === 404) {
      message = `Repository '${repo}' not found on GitHub.`;
    } else if (status === 401 || status === 403) {
      message = `Access denied for repository '${repo}'. Verify personal access token.`;
    }

    return res.status(status).json({
      success: false,
      error: message,
      details,
      status,
    });
  }
}
