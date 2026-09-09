import type { VercelRequest, VercelResponse } from '@vercel/node';

function normalizeRepo(repo?: string): string {
  if (!repo || !repo.trim()) {
    return (process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS')
      .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/$/, '');
  }
  return repo
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GitHub-Token');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      repo: process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
      branch: process.env.GITHUB_BRANCH || 'main',
      hasToken: Boolean(process.env.GITHUB_TOKEN),
    });
  }

  if (req.method === 'POST') {
    const { repo, branch, token } = req.body || {};

    if (repo !== undefined) {
      const cleanRepo = normalizeRepo(repo);
      process.env.GITHUB_REPO = cleanRepo;
    }
    if (branch !== undefined) {
      process.env.GITHUB_BRANCH = branch;
    }
    if (token !== undefined && token.trim()) {
      process.env.GITHUB_TOKEN = token.trim();
    }

    return res.status(200).json({
      success: true,
      message: 'GitHub repository environment settings updated!',
      repo: process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
      branch: process.env.GITHUB_BRANCH || 'main',
      hasToken: Boolean(process.env.GITHUB_TOKEN),
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
