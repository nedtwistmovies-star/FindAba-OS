import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, normalizeRepo } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      repo: process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
      branch: process.env.GITHUB_BRANCH || 'prod-stabilize/phase1-foundation',
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
      branch: process.env.GITHUB_BRANCH || 'prod-stabilize/phase1-foundation',
      hasToken: Boolean(process.env.GITHUB_TOKEN),
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
