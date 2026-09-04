import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  githubClient,
  resolveGithubToken,
  authHeaders,
  normalizeRepo,
  formatGithubError,
} from '../../server/services/github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
  const bodyRepo = req.body?.repo ? String(req.body.repo) : undefined;
  let repo = normalizeRepo(bodyRepo || queryRepo);

  const queryBranch = req.query?.branch ? String(req.query.branch) : undefined;
  const bodyBranch = req.body?.branch ? String(req.body.branch) : undefined;
  const branch = bodyBranch || queryBranch || process.env.GITHUB_BRANCH || 'main';

  const token = resolveGithubToken(req);

  try {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Invalid repository format. Expected owner/repo.' });
    }

    const headers = authHeaders(token);

    try {
      const response = await githubClient.get(`/repos/${owner}/${name}/contents/registry.json?ref=${encodeURIComponent(branch)}`, {
        headers,
      });

      let rawContent = '';
      if (response.data?.content) {
        rawContent = Buffer.from(response.data.content, 'base64').toString('utf8');
      } else if (response.data?.download_url) {
        // Large file fallback
        const blobRes = await githubClient.get(response.data.download_url);
        rawContent = typeof blobRes.data === 'string' ? blobRes.data : JSON.stringify(blobRes.data);
      }

      if (!rawContent) {
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
      } catch (parseError) {
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
        // Fallback: check if the repo is reachable
        try {
          const repoRes = await githubClient.get(`/repos/${owner}/${name}`, { headers });
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
          // If repo check also fails, fall through to error formatter
        }
      }
      throw fileError;
    }
  } catch (error: any) {
    const { status, details, message } = formatGithubError(error, repo, token);
    return res.status(status).json({
      success: false,
      error: message || 'GitHub sync failed',
      details,
      status,
    });
  }
}