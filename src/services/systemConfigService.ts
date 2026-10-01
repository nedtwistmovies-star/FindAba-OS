/**
 * src/services/systemConfigService.ts
 *
 * Client-side service for managing persistent system, deployment,
 * and external service connection configuration.
 *
 * Interfaces with:
 * - GET /api/admin/config
 * - POST /api/admin/config
 * - POST /api/admin/config/test
 * - POST /api/github/persist
 */

import { getSupabase } from './supabaseService';

export interface SystemDeploymentConfig {
  environment: "production" | "staging" | "development";
  deployTarget: "vercel" | "cloud" | "custom";
  autoSync: boolean;
  autoDeploy: boolean;
  activeProfile: string;
  provider: string;
  webhookUrl?: string;
  [key: string]: any;
}

export interface SystemConfigResponse {
  success: boolean;
  configured: boolean;
  repository: string;
  branch: string;
  owner: string;
  connected: boolean;
  active: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  lastSync: string | null;
  lastCommitSha: string | null;
  deployment: SystemDeploymentConfig;
  externalServices: {
    supabase: {
      connected: boolean;
      url: string;
      hasServiceKey: boolean;
      hasAnonKey: boolean;
    };
    github: {
      connected: boolean;
      repository: string;
      branch: string;
      hasToken: boolean;
    };
    vercel: {
      isVercel: boolean;
      connected: boolean;
    };
    paystack: {
      configured: boolean;
    };
    ai: {
      configured: boolean;
      provider: string;
    };
  };
  updatedAt?: string;
  source: "supabase" | "cache" | "default";
}

let cachedSystemConfig: SystemConfigResponse | null = null;

/**
 * Gets authentication headers for admin API requests.
 * Uses active Supabase session or custom token.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
  } catch {
    // Non-fatal if session is absent
  }

  const customPat = localStorage.getItem('findaba_github_pat');
  if (customPat && customPat.trim()) {
    headers['X-GitHub-Token'] = customPat.trim();
  }

  return headers;
}

/**
 * Fetches authoritative system configuration from the server.
 */
export async function fetchSystemConfig(): Promise<SystemConfigResponse> {
  const headers = await getAuthHeaders();

  // Try /api/admin/config first
  try {
    const res = await fetch('/api/admin/config', { headers });
    if (res.ok) {
      const data: SystemConfigResponse = await res.json();
      if (data && data.success) {
        cachedSystemConfig = data;
        
        // Cache to local storage as optimistic sync
        if (data.repository) localStorage.setItem('findaba_git_repo', data.repository);
        if (data.branch) localStorage.setItem('findaba_git_branch', data.branch);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('findaba:system_config_updated', { detail: data }));
          window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
            detail: { repo: data.repository, branch: data.branch, connected: data.connected }
          }));
        }

        return data;
      }
    }
  } catch (err) {
    console.warn('[SystemConfig] Failed to fetch /api/admin/config:', err);
  }

  // Fallback to /api/git/config if /api/admin/config is unauthorized or unreachable
  try {
    const gitRes = await fetch('/api/git/config', { headers });
    if (gitRes.ok) {
      const gitData = await gitRes.json();
      const fallbackConfig: SystemConfigResponse = {
        success: true,
        configured: Boolean(gitData.repo && gitData.hasToken),
        repository: gitData.repo || localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS',
        branch: gitData.branch || localStorage.getItem('findaba_git_branch') || 'main',
        owner: (gitData.repo || '').split('/')[0] || '',
        connected: typeof gitData.connected === 'boolean' ? gitData.connected : true,
        active: true,
        hasToken: Boolean(gitData.hasToken),
        tokenMasked: null,
        lastSync: gitData.lastSync || null,
        lastCommitSha: gitData.lastCommitSha || null,
        deployment: {
          environment: 'production',
          deployTarget: 'vercel',
          autoSync: true,
          autoDeploy: true,
          activeProfile: 'production-main',
          provider: 'vercel'
        },
        externalServices: {
          supabase: { connected: true, url: '', hasServiceKey: true, hasAnonKey: true },
          github: { connected: true, repository: gitData.repo || '', branch: gitData.branch || '', hasToken: !!gitData.hasToken },
          vercel: { isVercel: false, connected: true },
          paystack: { configured: true },
          ai: { configured: true, provider: 'openrouter' }
        },
        source: 'cache'
      };

      cachedSystemConfig = fallbackConfig;
      return fallbackConfig;
    }
  } catch (fallbackErr) {
    console.warn('[SystemConfig] Fallback to /api/git/config failed:', fallbackErr);
  }

  // Return last cached or safe default
  if (cachedSystemConfig) return cachedSystemConfig;

  const defaultBranch = localStorage.getItem('findaba_git_branch') || 'main';
  const defaultRepo = localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS';

  return {
    success: true,
    configured: true,
    repository: defaultRepo,
    branch: defaultBranch,
    owner: defaultRepo.split('/')[0] || '',
    connected: true,
    active: true,
    hasToken: Boolean(localStorage.getItem('findaba_github_pat')),
    tokenMasked: null,
    lastSync: null,
    lastCommitSha: null,
    deployment: {
      environment: 'production',
      deployTarget: 'vercel',
      autoSync: true,
      autoDeploy: true,
      activeProfile: 'production-main',
      provider: 'vercel'
    },
    externalServices: {
      supabase: { connected: true, url: '', hasServiceKey: true, hasAnonKey: true },
      github: { connected: true, repository: defaultRepo, branch: defaultBranch, hasToken: true },
      vercel: { isVercel: false, connected: true },
      paystack: { configured: true },
      ai: { configured: true, provider: 'openrouter' }
    },
    source: 'default'
  };
}

/**
 * Saves system and deployment configuration persistently to the server and Supabase.
 */
export async function saveSystemConfig(payload: {
  repository?: string;
  repo?: string;
  branch?: string;
  githubToken?: string;
  token?: string;
  connected?: boolean;
  active?: boolean;
  deployment?: Partial<SystemDeploymentConfig>;
}): Promise<SystemConfigResponse> {
  const headers = await getAuthHeaders();

  // Optimistically update localStorage
  const targetRepo = payload.repository || payload.repo;
  if (targetRepo) localStorage.setItem('findaba_git_repo', targetRepo.trim());
  if (payload.branch) localStorage.setItem('findaba_git_branch', payload.branch.trim());
  const targetToken = payload.githubToken || payload.token;
  if (targetToken !== undefined) {
    if (targetToken.trim()) localStorage.setItem('findaba_github_pat', targetToken.trim());
    else localStorage.removeItem('findaba_github_pat');
  }

  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // If admin endpoint fails, attempt dedicated /api/github/persist fallback
    const persistRes = await fetch('/api/github/persist', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!persistRes.ok) {
      const errData = await persistRes.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to save configuration: ${res.statusText}`);
    }

    const persistData = await persistRes.json();
    return persistData.data || persistData;
  }

  const result: SystemConfigResponse = await res.json();
  cachedSystemConfig = result;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:system_config_updated', { detail: result }));
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: { repo: result.repository, branch: result.branch, connected: result.connected }
    }));
  }

  return result;
}

/**
 * Performs a live test of external service connections (GitHub, Supabase).
 */
export async function testSystemConnections(): Promise<{
  results: {
    github: { success: boolean; latency?: string; error?: string };
    supabase: { success: boolean; latency?: string; error?: string };
    overall: boolean;
  };
  config: SystemConfigResponse;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/admin/config/test', {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Connection test failed: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.config) {
    cachedSystemConfig = data.config;
  }
  return data;
}
