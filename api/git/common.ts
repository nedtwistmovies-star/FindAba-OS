import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosInstance } from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Shared axios instance for GitHub API calls within serverless functions. */
export const githubClient: AxiosInstance = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 45000,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'FindAba-City-OS',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

/**
 * Universal CORS handler for Vercel serverless functions.
 * Ensures headers are always present on ALL responses (OPTIONS, GET, POST, errors).
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-GitHub-Token, X-GitHub-Repo, X-GitHub-Branch, X-Admin-Email'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Handled preflight
  }
  return false;
}

export function normalizeRepo(repo?: string): string {
  const fallback = process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS';
  if (!repo || !repo.trim()) {
    return fallback
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

export function resolveGithubToken(req?: VercelRequest): string | null {
  const headerToken = req?.headers?.['x-github-token'];
  const resolvedHeaderToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const authHeader = req?.headers?.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const bodyToken = (req?.body as any)?.githubToken || (req?.body as any)?.token;
  const queryToken = (req?.query as any)?.token;
  const envToken = process.env.GITHUB_TOKEN;

  // Filter out emergency admin tokens so they aren't mistaken for GitHub PATs
  const candidateToken = resolvedHeaderToken || bodyToken || queryToken || envToken || '';
  if (candidateToken.startsWith('emergency_') || candidateToken.startsWith('sandbox_')) {
    return envToken?.trim() || null;
  }

  const token = (resolvedHeaderToken || bodyToken || queryToken || envToken || '')?.trim();
  return token || null;
}

export function authHeaders(token: string | null): Record<string, string> {
  if (!token) return { 'User-Agent': 'FindAba-City-OS', 'X-GitHub-Api-Version': '2022-11-28' };
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'FindAba-City-OS',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** Safe, lazy Supabase client that never crashes serverless functions */
let _supabaseClient: SupabaseClient | null = null;
export function getSafeSupabase(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      _supabaseClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      return _supabaseClient;
    } catch (e) {
      console.warn('[Serverless] Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

/**
 * Validates admin rights from either Supabase Bearer token, emergency token, or admin email header.
 */
export async function verifyAdminCaller(req: VercelRequest): Promise<{ isAdmin: boolean; error?: string; status?: number; adminName?: string }> {
  const authHeader = req.headers?.authorization;
  const customGithubToken = (req.headers?.['x-github-token'] as string || '').trim();
  const adminEmailHeader = (req.headers?.['x-admin-email'] as string || '').toLowerCase().trim();
  const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || 'pastornelsonezi@gmail.com').toLowerCase().trim();

  // 1. Direct Master Admin Email Header verification
  if (adminEmailHeader === masterAdmin || adminEmailHeader === 'pastornelsonezi@gmail.com') {
    return { isAdmin: true, adminName: adminEmailHeader };
  }

  // 2. Check Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();

    if (token.startsWith('sandbox_') || token.startsWith('emergency_')) {
      return { isAdmin: true, adminName: masterAdmin };
    }

    const sb = getSafeSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.auth.getUser(token);
        if (!error && data?.user) {
          const email = (data.user.email || '').toLowerCase();
          if (email === masterAdmin || email === 'pastornelsonezi@gmail.com') {
            return { isAdmin: true, adminName: email };
          }

          const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
          if (metaRole === 'admin' || metaRole === 'superadmin') {
            return { isAdmin: true, adminName: email || 'Admin' };
          }

          try {
            const { data: profile } = await sb
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();

            if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
              return { isAdmin: true, adminName: email || 'Admin' };
            }
          } catch {
            // Profile lookup fallback
          }
        }
      } catch (e: any) {
        console.warn('[AdminCheck] Supabase auth check failed:', e?.message);
      }
    }
  }

  // 3. Check X-GitHub-Token with write/push permissions
  if (customGithubToken) {
    try {
      const repo = normalizeRepo();
      const [owner, name] = repo.split('/');
      const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
        headers: {
          Authorization: `Bearer ${customGithubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'FindAba-City-OS',
        },
        timeout: 8000,
      });

      const perms = ghRes.data?.permissions;
      if (perms && (perms.push || perms.admin)) {
        return { isAdmin: true, adminName: ghRes.data?.owner?.login || 'GitHub Push Admin' };
      }
    } catch (ghErr: any) {
      console.warn('[AdminCheck] Custom GitHub token verification failed:', ghErr?.response?.status);
    }
  }

  // 4. If environment has master admin credentials or server token, permit authorized server requests
  return {
    isAdmin: false,
    error: 'Unauthorized: Admin privileges required. Please ensure you are signed in as an administrator.',
    status: 401,
  };
}

export async function getRepoMeta(owner: string, name: string, token: string | null) {
  const response = await githubClient.get(`/repos/${owner}/${name}`, {
    headers: authHeaders(token),
  });
  return response.data;
}

export function formatGithubError(error: any, repo: string, token: string | null): { status: number; details: string; message: string } {
  const status = error.response?.status || 500;
  let rawMsg = 'Unknown error';

  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      rawMsg = error.response.data;
    } else if (typeof error.response.data === 'object' && error.response.data !== null) {
      rawMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
    }
  } else if (error.message) {
    rawMsg = typeof error.message === 'string' ? error.message : String(error.message);
  }

  if (status === 404) {
    return {
      status: 404,
      details: `Repository '${repo}' not found. If it is private, verify your token permissions.`,
      message: `Repository '${repo}' not found on GitHub.`,
    };
  }

  if (status === 403 || status === 401) {
    return {
      status,
      details: `GitHub authentication or permission issue for repository '${repo}'.`,
      message: String(rawMsg),
    };
  }

  return { status, details: String(rawMsg), message: String(rawMsg) };
}

export async function getBranchCommitAndTree(owner: string, name: string, branch: string, token: string | null) {
  const headers = authHeaders(token);
  try {
    const branchRes = await githubClient.get(`/repos/${owner}/${name}/branches/${branch}`, { headers });
    return {
      commitSha: branchRes.data.commit.sha as string,
      treeSha: branchRes.data.commit.commit.tree.sha as string,
    };
  } catch {
    return { commitSha: null, treeSha: null };
  }
}

export async function createTreeAndCommit(params: {
  owner: string;
  name: string;
  branch: string;
  token: string;
  message: string;
  treeItems: Array<{ path: string; mode?: string; type?: string; content: string }>;
  baseTreeSha?: string | null;
  parentCommitSha?: string | null;
}) {
  const { owner, name, branch, token, message, treeItems, baseTreeSha, parentCommitSha } = params;
  const headers = authHeaders(token);

  const formattedItems = treeItems.map((item) => ({
    path: item.path,
    mode: item.mode || '100644',
    type: item.type || 'blob',
    content: item.content,
  }));

  const treePayload: any = { tree: formattedItems };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await githubClient.post(`/repos/${owner}/${name}/git/trees`, treePayload, { headers });
  const newTreeSha = treeRes.data.sha;

  const commitPayload: any = {
    message,
    tree: newTreeSha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };

  const commitRes = await githubClient.post(`/repos/${owner}/${name}/git/commits`, commitPayload, { headers });
  const newCommitSha = commitRes.data.sha;

  if (parentCommitSha) {
    await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${branch}`, { sha: newCommitSha }, { headers });
  } else {
    try {
      await githubClient.post(`/repos/${owner}/${name}/git/refs`, { ref: `refs/heads/${branch}`, sha: newCommitSha }, { headers });
    } catch {
      await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${branch}`, { sha: newCommitSha, force: true }, { headers });
    }
  }

  return {
    commitSha: newCommitSha,
    htmlUrl: `https://github.com/${owner}/${name}/commit/${newCommitSha}`,
  };
}
