import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { applyCors, normalizeRepo, resolveGithubToken } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = (req.body as any)?.repo ? String((req.body as any).repo) : undefined;
  const repo = normalizeRepo(bodyRepo || queryRepo);

  const queryBranch = req.query?.branch ? String(req.query.branch) : undefined;
  const bodyBranch = (req.body as any)?.branch ? String((req.body as any).branch) : undefined;
  const branch = bodyBranch || queryBranch || process.env.GITHUB_BRANCH || 'prod-stabilize/phase1-foundation';

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

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${name}/contents/registry.json?ref=${encodeURIComponent(branch)}`,
        { headers, timeout: 20000 }
      );

      let rawContent = '';
      if (response.data?.content) {
        rawContent = Buffer.from(response.data.content, 'base64').toString('utf8');
      } else if (response.data?.download_url) {
        // Fallback for files > 1MB where GitHub omits content field
        const blobRes = await axios.get(response.data.download_url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          timeout: 25000,
        });
        rawContent = typeof blobRes.data === 'string' ? blobRes.data : JSON.stringify(blobRes.data);
      } else if (response.data?.sha) {
        // Fallback using Git Data Blobs API (supports up to 100MB)
        const blobRes = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/git/blobs/${response.data.sha}`,
          { headers, timeout: 25000 }
        );
        if (blobRes.data?.content) {
          rawContent = Buffer.from(blobRes.data.content, 'base64').toString('utf8');
        }
      }

      if (!rawContent || !rawContent.trim()) {
        return res.status(200).json({
          success: true,
          repo,
          branch,
          lastUpdated: new Date().toISOString(),
          data: null,
          message: 'Registry file is empty.',
          systemHasToken: Boolean(token),
          systemConfigured: true,
        });
      }

      let registry: any = null;
      try {
        registry = JSON.parse(rawContent);
      } catch {
        return res.status(422).json({
          success: false,
          error: 'Registry file is corrupted or not valid JSON.',
          details: "The 'registry.json' file in your GitHub repository contains invalid JSON syntax.",
        });
      }

      return res.status(200).json({
        success: true,
        repo,
        branch,
        lastUpdated: new Date().toISOString(),
        data: registry,
        systemHasToken: Boolean(token),
        systemConfigured: true,
      });
    } catch (fileError: any) {
      if (fileError.response?.status === 404) {
        // Verify if repository exists
        try {
          const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, { headers, timeout: 10000 });
          if (repoRes.data) {
            return res.status(200).json({
              success: true,
              repo: repoRes.data.full_name || repo,
              branch,
              lastUpdated: null,
              data: null,
              message: "Repository connected! 'registry.json' not created yet. Trigger a Full OS Sync or Supabase Commit to initialize.",
              systemHasToken: Boolean(token),
              systemConfigured: true,
            });
          }
        } catch {
          // Repo check failed, fall through to main error handler
        }
      }
      throw fileError;
    }
  } catch (error: any) {
    const status = error.response?.status || 500;
    const details = error.response?.data?.message || error.message || 'Unknown GitHub API error';
    let message = 'GitHub sync failed';

    if (status === 401 || status === 403) {
      message = 'GitHub authentication denied. Ensure GITHUB_TOKEN is valid and has repository access permissions.';
    } else if (status === 404) {
      message = `Repository '${repo}' or branch '${branch}' not found on GitHub.`;
    }

    return res.status(status).json({
      success: false,
      error: message,
      details,
      status,
      repo,
      branch,
    });
  }
}
