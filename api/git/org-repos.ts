import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { applyCors, resolveGithubToken } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const org = (req.query?.org ? String(req.query.org) : '').trim();
  const token = resolveGithubToken(req);

  if (!org) {
    return res.status(400).json({ success: false, message: 'Organization name is required.', repos: [] });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'FindAba-City-OS',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    let reposData: any[] = [];
    try {
      const response = await axios.get(`https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=updated`, {
        headers,
        timeout: 15000,
      });
      reposData = response.data;
    } catch (orgErr: any) {
      if (orgErr.response?.status === 404) {
        // Fallback to user repos if org is a personal user account
        const userRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(org)}/repos?per_page=100&sort=updated`, {
          headers,
          timeout: 15000,
        });
        reposData = userRes.data;
      } else {
        throw orgErr;
      }
    }

    const repos = (reposData || []).map((r: any) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description || 'No description provided',
      private: Boolean(r.private),
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      updatedAt: r.updated_at,
      defaultBranch: r.default_branch || 'main',
      language: r.language || 'TypeScript',
      htmlUrl: r.html_url,
    }));

    return res.status(200).json({
      success: true,
      org,
      repos,
      count: repos.length,
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const details = error.response?.data?.message || error.message || 'Unknown error';
    return res.status(status).json({
      success: false,
      message: `Failed to fetch repositories for '${org}': ${details}`,
      repos: [],
    });
  }
}
