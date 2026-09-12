import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { applyCors, normalizeRepo, resolveGithubToken } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const repo = normalizeRepo(queryRepo);

  const token = resolveGithubToken(req);

  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    return res.status(400).json({
      success: false,
      message: `Invalid repository format '${repo}'. Use 'owner/repo'.`,
      branches: [],
    });
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'FindAba-City-OS',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/branches?per_page=100`, {
      headers,
      timeout: 15000,
    });
    const branches = (response.data || []).map((b: any) => ({
      name: b.name,
      protected: Boolean(b.protected),
      sha: b.commit?.sha?.substring(0, 7) || '',
    }));

    return res.status(200).json({
      success: true,
      repo,
      branches,
      count: branches.length,
      defaultBranch: process.env.GITHUB_BRANCH || 'prod-stabilize/phase1-foundation',
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const details = error.response?.data?.message || error.message || 'Unknown error';
    return res.status(status).json({
      success: false,
      message: `Failed to fetch branches for '${repo}': ${details}`,
      branches: [],
    });
  }
}
