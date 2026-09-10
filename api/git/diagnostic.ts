import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { applyCors, normalizeRepo, resolveGithubToken } from './common';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  try {
    const queryRepo = req.query?.repo ? String(req.query.repo) : undefined;
    const bodyRepo = (req.body as any)?.repo ? String((req.body as any).repo) : undefined;
    const repo = normalizeRepo(bodyRepo || queryRepo);

    const queryBranch = req.query?.branch ? String(req.query.branch) : undefined;
    const bodyBranch = (req.body as any)?.branch ? String((req.body as any).branch) : undefined;
    const branch = bodyBranch || queryBranch || process.env.GITHUB_BRANCH || 'main';

    const token = resolveGithubToken(req);
    const hasToken = Boolean(token);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'FindAba-City-OS',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const checkList: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }> = [];

    // Check 1: Token Configuration
    if (hasToken) {
      checkList.push({
        name: 'GitHub Credential',
        status: 'ok',
        message: 'Personal Access Token / Server GITHUB_TOKEN configured.',
      });
    } else {
      checkList.push({
        name: 'GitHub Credential',
        status: 'warning',
        message: 'No GITHUB_TOKEN detected. Rate limits will be restricted and private repositories will be inaccessible.',
      });
    }

    let githubApiReachable = false;
    let rateLimitRemaining = 0;
    let rateLimitLimit = 60;

    // Check 2: GitHub API Reachability
    try {
      const rateLimitRes = await axios.get('https://api.github.com/rate_limit', {
        headers,
        timeout: 10000,
      });
      githubApiReachable = true;
      rateLimitRemaining = rateLimitRes.data.resources?.core?.remaining ?? 0;
      rateLimitLimit = rateLimitRes.data.resources?.core?.limit ?? 60;
      checkList.push({
        name: 'GitHub API Connectivity',
        status: 'ok',
        message: `GitHub API reachable. Rate limit: ${rateLimitRemaining}/${rateLimitLimit} requests remaining.`,
      });
    } catch (err: any) {
      checkList.push({
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
    const [owner, name] = repo.split('/');

    if (githubApiReachable) {
      if (owner && name) {
        try {
          const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
            headers,
            timeout: 15000,
          });
          repositoryAccessible = true;
          isPrivate = Boolean(repoRes.data.private);
          defaultBranch = repoRes.data.default_branch || branch;
          permissions = {
            push: Boolean(repoRes.data.permissions?.push),
            pull: Boolean(repoRes.data.permissions?.pull ?? true),
            admin: Boolean(repoRes.data.permissions?.admin),
          };
          checkList.push({
            name: 'Repository Validation',
            status: 'ok',
            message: `Repository '${repo}' exists and is accessible (${isPrivate ? 'private' : 'public'}). Default branch: '${defaultBranch}'.`,
          });
        } catch (err: any) {
          const status = err.response?.status;
          if (status === 404) {
            checkList.push({
              name: 'Repository Validation',
              status: 'error',
              message: `Repository '${repo}' not found on GitHub. Verify ownership and name, or ensure token has 'repo' scope if private.`,
            });
          } else if (status === 401 || status === 403) {
            checkList.push({
              name: 'Repository Validation',
              status: 'error',
              message: `Authentication denied (${status}) for repository '${repo}'. Verify token validity and scopes.`,
            });
          } else {
            checkList.push({
              name: 'Repository Validation',
              status: 'error',
              message: `Repository access error: ${err.message}`,
            });
          }
        }
      } else {
        checkList.push({
          name: 'Repository Validation',
          status: 'error',
          message: `Invalid repository specification '${repo}'. Format must be 'owner/repo'.`,
        });
      }
    }

    // Check 4: Registry Content Check
    let registryExists = false;
    if (repositoryAccessible && owner && name) {
      try {
        const regRes = await axios.get(`https://api.github.com/repos/${owner}/${name}/contents/registry.json?ref=${encodeURIComponent(branch)}`, {
          headers,
          timeout: 15000,
        });
        registryExists = true;
        checkList.push({
          name: 'Registry Snapshot',
          status: 'ok',
          message: `Snapshot file 'registry.json' found on branch '${branch}' (${regRes.data.size || 0} bytes).`,
        });
      } catch (regErr: any) {
        if (regErr.response?.status === 404) {
          checkList.push({
            name: 'Registry Snapshot',
            status: 'warning',
            message: `'registry.json' not found on branch '${branch}'. Ready for initial database commit.`,
          });
        }
      }
    }

    const allPassed = checkList.every((c) => c.status !== 'error');

    return res.status(200).json({
      success: allPassed,
      // Compatibility keys for GitIntegrationDiagnostics component
      apiReachable: githubApiReachable,
      githubApiReachable,
      repoValid: repositoryAccessible,
      repositoryAccessible,
      envRepo: repo,
      repo,
      envBranch: branch,
      branch,
      hasToken,
      isPrivate,
      defaultBranch,
      permissions,
      rateLimitRemaining,
      rateLimitLimit,
      registryExists,
      timestamp: new Date().toISOString(),
      message: allPassed
        ? 'GitHub integration diagnostics verified successfully. Connection is healthy.'
        : 'GitHub integration diagnostics identified issues. Review details below.',
      // Array representation for detailed log view
      checkList,
      // Object map representation for property access checks
      checks: {
        envRepo: repo ? 'PRESENT' : 'MISSING',
        repoFormat: (owner && name) ? 'VALID' : 'INVALID',
        hasToken: hasToken ? 'CONFIGURED' : 'ANONYMOUS',
        apiReachable: githubApiReachable ? 'OK' : 'ERROR',
        repoAccess: repositoryAccessible ? 'OK' : 'ERROR',
      },
    });
  } catch (fatalError: any) {
    console.error('[Git Diagnostic] Fatal error:', fatalError);
    return res.status(200).json({
      success: false,
      apiReachable: false,
      githubApiReachable: false,
      repoValid: false,
      repositoryAccessible: false,
      envRepo: process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
      repo: process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
      envBranch: process.env.GITHUB_BRANCH || 'main',
      branch: process.env.GITHUB_BRANCH || 'main',
      hasToken: Boolean(process.env.GITHUB_TOKEN),
      rateLimitRemaining: 0,
      timestamp: new Date().toISOString(),
      message: `Diagnostic execution failed: ${fatalError.message}`,
      checkList: [
        {
          name: 'Diagnostic Execution',
          status: 'error',
          message: fatalError.message || 'Internal serverless handler error',
        },
      ],
      checks: {
        envRepo: 'ERROR',
        repoFormat: 'ERROR',
        hasToken: 'ERROR',
        apiReachable: 'ERROR',
        repoAccess: 'ERROR',
      },
    });
  }
}
