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
  workingBranch: string;
  deploymentBranch: string;
  defaultBranch: string;
  owner: string;
  repoName?: string;
  connected: boolean;
  active: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  githubUsername?: string | null;
  githubEmail?: string | null;
  lastSync: string | null;
  lastCommitSha: string | null;
  lastSyncedSha?: string | null;
  lastValidatedAt?: string | null;
  validationError?: string | null;
  vercelProjectId?: string | null;
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
      workingBranch?: string;
      deploymentBranch?: string;
      defaultBranch?: string;
      username?: string | null;
      hasToken: boolean;
      lastValidatedAt?: string | null;
    };
    vercel: {
      isVercel: boolean;
      connected: boolean;
      projectId?: string | null;
      deployTarget?: string;
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

  // 1. Try /api/git/config first (accessible and non-gated)
  try {
    const gitRes = await fetch('/api/git/config', { headers });
    if (gitRes.ok) {
      const gitData = await gitRes.json();
      if (gitData && gitData.success) {
        const repo = gitData.repository || gitData.repo || localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS';
        const workingBranch = gitData.workingBranch || gitData.branch || localStorage.getItem('findaba_git_branch') || 'main';
        const deploymentBranch = gitData.deploymentBranch || localStorage.getItem('findaba_git_deploy_branch') || 'main';
        const defaultBranch = gitData.defaultBranch || 'main';

        const configResponse: SystemConfigResponse = {
          success: true,
          configured: Boolean(repo && (gitData.hasToken || Boolean(localStorage.getItem('findaba_github_pat')))),
          repository: repo,
          branch: workingBranch,
          workingBranch,
          deploymentBranch,
          defaultBranch,
          owner: gitData.owner || repo.split('/')[0] || '',
          repoName: gitData.repoName || repo.split('/')[1] || repo,
          connected: typeof gitData.connected === 'boolean' ? gitData.connected : true,
          active: true,
          hasToken: Boolean(gitData.hasToken || localStorage.getItem('findaba_github_pat')),
          tokenMasked: gitData.tokenMasked || null,
          githubUsername: gitData.githubUsername || null,
          githubEmail: gitData.githubEmail || null,
          lastSync: gitData.lastSync || null,
          lastCommitSha: gitData.lastCommitSha || null,
          lastSyncedSha: gitData.lastSyncedSha || null,
          lastValidatedAt: gitData.lastValidatedAt || null,
          validationError: gitData.validationError || null,
          vercelProjectId: gitData.vercelProjectId || null,
          deployment: gitData.deployment || {
            environment: 'production',
            deployTarget: 'vercel',
            autoSync: true,
            autoDeploy: true,
            activeProfile: 'production-main',
            provider: 'vercel',
          },
          externalServices: gitData.externalServices || {
            supabase: { connected: true, url: '', hasServiceKey: true, hasAnonKey: true },
            github: { connected: gitData.connected, repository: repo, branch: workingBranch, workingBranch, deploymentBranch, defaultBranch, hasToken: !!gitData.hasToken },
            vercel: { isVercel: false, connected: true },
            paystack: { configured: true },
            ai: { configured: true, provider: 'openrouter' },
          },
          source: gitData.source || 'cache',
          updatedAt: gitData.updatedAt,
        };

        cachedSystemConfig = configResponse;

        // Persist to local storage cache
        if (configResponse.repository) localStorage.setItem('findaba_git_repo', configResponse.repository);
        if (configResponse.workingBranch) localStorage.setItem('findaba_git_branch', configResponse.workingBranch);
        if (configResponse.deploymentBranch) localStorage.setItem('findaba_git_deploy_branch', configResponse.deploymentBranch);
        if (configResponse.defaultBranch) localStorage.setItem('findaba_git_default_branch', configResponse.defaultBranch);
        localStorage.setItem('findaba_git_connected', String(configResponse.connected));
        if (configResponse.githubUsername) localStorage.setItem('findaba_git_username', configResponse.githubUsername);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('findaba:system_config_updated', { detail: configResponse }));
          window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
            detail: {
              repo: configResponse.repository,
              branch: configResponse.workingBranch,
              workingBranch: configResponse.workingBranch,
              deploymentBranch: configResponse.deploymentBranch,
              defaultBranch: configResponse.defaultBranch,
              connected: configResponse.connected,
              username: configResponse.githubUsername,
              lastCommitSha: configResponse.lastCommitSha,
            },
          }));
        }

        return configResponse;
      }
    }
  } catch (err) {
    console.warn('[SystemConfig] Failed to fetch /api/git/config:', err);
  }

  // 2. Try /api/admin/config if available
  try {
    const res = await fetch('/api/admin/config', { headers });
    if (res.ok) {
      const data: SystemConfigResponse = await res.json();
      if (data && data.success) {
        cachedSystemConfig = data;
        if (data.repository) localStorage.setItem('findaba_git_repo', data.repository);
        if (data.workingBranch || data.branch) localStorage.setItem('findaba_git_branch', data.workingBranch || data.branch);
        if (data.deploymentBranch) localStorage.setItem('findaba_git_deploy_branch', data.deploymentBranch);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('findaba:system_config_updated', { detail: data }));
          window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
            detail: { repo: data.repository, branch: data.workingBranch || data.branch, connected: data.connected },
          }));
        }

        return data;
      }
    }
  } catch (err) {
    console.warn('[SystemConfig] Failed to fetch /api/admin/config:', err);
  }

  // Return last cached or safe default
  if (cachedSystemConfig) return cachedSystemConfig;

  const defaultBranch = localStorage.getItem('findaba_git_default_branch') || 'main';
  const defaultWorking = localStorage.getItem('findaba_git_branch') || 'main';
  const defaultDeploy = localStorage.getItem('findaba_git_deploy_branch') || 'main';
  const defaultRepo = localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS';

  return {
    success: true,
    configured: true,
    repository: defaultRepo,
    branch: defaultWorking,
    workingBranch: defaultWorking,
    deploymentBranch: defaultDeploy,
    defaultBranch,
    owner: defaultRepo.split('/')[0] || '',
    connected: localStorage.getItem('findaba_git_connected') === 'true',
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
      provider: 'vercel',
    },
    externalServices: {
      supabase: { connected: true, url: '', hasServiceKey: true, hasAnonKey: true },
      github: { connected: true, repository: defaultRepo, branch: defaultWorking, hasToken: true },
      vercel: { isVercel: false, connected: true },
      paystack: { configured: true },
      ai: { configured: true, provider: 'openrouter' },
    },
    source: 'default',
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

/**
 * Fetches available remote branches for the repository.
 */
export async function fetchRemoteBranches(repo?: string): Promise<{
  branches: Array<{ name: string; protected: boolean; sha: string }>;
  workingBranch: string;
  deploymentBranch: string;
  defaultBranch: string;
}> {
  const params = new URLSearchParams();
  if (repo) params.append('repo', repo);

  const res = await fetch(`/api/git/branches?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch branches (${res.status})`);
  }

  return res.json();
}

/**
 * Sets user-selected working branch or deployment branch, persisting choice immediately across sessions.
 */
export async function selectTargetBranch(
  branch: string,
  type: 'working' | 'deployment' = 'working',
  repo?: string
): Promise<SystemConfigResponse> {
  const cleanBranch = branch.trim();
  if (!cleanBranch) throw new Error('Branch name cannot be empty');

  if (type === 'deployment') {
    localStorage.setItem('findaba_git_deploy_branch', cleanBranch);
  } else {
    localStorage.setItem('findaba_git_branch', cleanBranch);
  }

  const res = await fetch('/api/git/branch/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch: cleanBranch, type, repo }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to persist branch selection (${res.status})`);
  }

  const result = await res.json();
  const updatedConfig = result.data || (await fetchSystemConfig());
  cachedSystemConfig = updatedConfig;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:system_config_updated', { detail: updatedConfig }));
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: {
        repo: updatedConfig.repository,
        branch: updatedConfig.workingBranch,
        workingBranch: updatedConfig.workingBranch,
        deploymentBranch: updatedConfig.deploymentBranch,
        defaultBranch: updatedConfig.defaultBranch,
        connected: updatedConfig.connected,
      },
    }));
  }

  return updatedConfig;
}
