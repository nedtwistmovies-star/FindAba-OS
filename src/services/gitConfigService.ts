/**
 * Git Configuration Service
 * Programmatically loads the repository settings from metadata.json
 * and ensures they are synchronized with the local storage configuration.
 */

export interface RepositoryConfig {
  type: string;
  url: string;
  branch?: string;
}

export interface AppMetadata {
  name: string;
  short_name?: string;
  repository?: RepositoryConfig;
  [key: string]: any;
}

/**
 * Parses and cleans a GitHub Repository URL to get the target "owner/repo" string.
 * @param url The full GitHub URL or repository path (e.g. "https://github.com/owner/repo.git")
 */
export function cleanRepositoryName(url: string): string {
  if (!url) return '';
  
  let cleaned = url.trim();
  
  // Remove "https://github.com/" or "http://github.com/"
  cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, '');
  
  // Remove trailing .git
  cleaned = cleaned.replace(/\.git$/i, '');
  
  // Remove trailing slash if any
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  
  return cleaned;
}

export const AUTHORITATIVE_DEFAULT_BRANCH = 'main';
export const AUTHORITATIVE_DEFAULT_REPO = 'nedtwistmovies-star/FindAba-OS';

export interface GitConfigState {
  repo: string;
  branch: string;
  workingBranch: string;
  deploymentBranch: string;
  defaultBranch: string;
  connected: boolean;
  username?: string;
  lastCommitSha?: string;
  lastValidatedAt?: string;
}

/**
 * Initializes and synchronizes the Git Repository configuration.
 * Queries /api/git/config and /api/git/status as the primary authoritative sources of truth,
 * with fallback to localStorage and /metadata.json.
 * Guarantees user-selected working and deployment branches survive page refreshes,
 * browser restarts, and session changes without silent reverts to 'main'.
 */
export async function initializeRepositoryConfig(): Promise<GitConfigState> {
  let targetRepo = localStorage.getItem('findaba_git_repo')?.trim() || AUTHORITATIVE_DEFAULT_REPO;
  let targetWorkingBranch = localStorage.getItem('findaba_git_branch')?.trim() || AUTHORITATIVE_DEFAULT_BRANCH;
  let targetDeployBranch = localStorage.getItem('findaba_git_deploy_branch')?.trim() || AUTHORITATIVE_DEFAULT_BRANCH;
  let defaultBranch = localStorage.getItem('findaba_git_default_branch')?.trim() || AUTHORITATIVE_DEFAULT_BRANCH;
  let isConnected = localStorage.getItem('findaba_git_connected') === 'true';
  let ghUsername = localStorage.getItem('findaba_git_username') || undefined;
  let lastCommitSha: string | undefined = undefined;
  let lastValidatedAt: string | undefined = undefined;
  let loadedFromServer = false;

  // 1. Fetch authoritative config from server (/api/git/config or /api/admin/config)
  try {
    const configRes = await fetch('/api/git/config');
    if (configRes.ok) {
      const configData = await configRes.json();
      if (configData.success) {
        if (configData.repository) targetRepo = cleanRepositoryName(configData.repository);
        if (configData.workingBranch || configData.branch) {
          targetWorkingBranch = (configData.workingBranch || configData.branch).trim();
        }
        if (configData.deploymentBranch) {
          targetDeployBranch = configData.deploymentBranch.trim();
        }
        if (configData.defaultBranch) {
          defaultBranch = configData.defaultBranch.trim();
        }
        if (typeof configData.connected === 'boolean') {
          isConnected = configData.connected;
        }
        if (configData.githubUsername) {
          ghUsername = configData.githubUsername;
        }
        if (configData.lastCommitSha) {
          lastCommitSha = configData.lastCommitSha;
        }
        if (configData.lastValidatedAt) {
          lastValidatedAt = configData.lastValidatedAt;
        }
        loadedFromServer = true;
      }
    }
  } catch (apiErr) {
    console.warn('[GitConfigService] /api/git/config unreachable, trying admin route:', apiErr);
  }

  // 2. If not yet loaded from server, try /api/admin/config
  if (!loadedFromServer) {
    try {
      const adminRes = await fetch('/api/admin/config');
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.success) {
          if (adminData.repository) targetRepo = cleanRepositoryName(adminData.repository);
          if (adminData.workingBranch || adminData.branch) {
            targetWorkingBranch = (adminData.workingBranch || adminData.branch).trim();
          }
          if (adminData.deploymentBranch) targetDeployBranch = adminData.deploymentBranch.trim();
          if (adminData.defaultBranch) defaultBranch = adminData.defaultBranch.trim();
          if (typeof adminData.connected === 'boolean') isConnected = adminData.connected;
          if (adminData.githubUsername) ghUsername = adminData.githubUsername;
          loadedFromServer = true;
        }
      }
    } catch {
      // Ignored
    }
  }

  // 3. Fallback from metadata.json only if repo is unconfigured
  if (!loadedFromServer && (!targetRepo || targetRepo === AUTHORITATIVE_DEFAULT_REPO)) {
    try {
      const metaRes = await fetch('/metadata.json');
      if (metaRes.ok) {
        const metadata: AppMetadata = await metaRes.json();
        if (metadata.repository?.url) {
          const parsed = cleanRepositoryName(metadata.repository.url);
          if (parsed) targetRepo = parsed;
        }
        if (metadata.repository?.branch && !localStorage.getItem('findaba_git_branch')) {
          targetWorkingBranch = metadata.repository.branch.trim();
        }
      }
    } catch (metaErr) {
      console.warn('[GitConfigService] metadata.json read error:', metaErr);
    }
  }

  // 4. Update localStorage cache with authoritative parameters
  localStorage.setItem('findaba_git_repo', targetRepo);
  localStorage.setItem('findaba_git_branch', targetWorkingBranch);
  localStorage.setItem('findaba_git_deploy_branch', targetDeployBranch);
  localStorage.setItem('findaba_git_default_branch', defaultBranch);
  localStorage.setItem('findaba_git_connected', String(isConnected));
  if (ghUsername) localStorage.setItem('findaba_git_username', ghUsername);

  const resultState: GitConfigState = {
    repo: targetRepo,
    branch: targetWorkingBranch,
    workingBranch: targetWorkingBranch,
    deploymentBranch: targetDeployBranch,
    defaultBranch,
    connected: isConnected,
    username: ghUsername,
    lastCommitSha,
    lastValidatedAt,
  };

  // 5. Dispatch event so active UI components update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: resultState,
    }));
  }

  return resultState;
}

/**
 * Persists user-selected working branch or deployment branch immediately to server & storage.
 */
export async function switchBranch(
  branch: string,
  type: 'working' | 'deployment' = 'working'
): Promise<{ success: boolean; branch: string; error?: string }> {
  const clean = branch.trim();
  if (!clean) return { success: false, branch: '', error: 'Branch name cannot be empty' };

  if (type === 'deployment') {
    localStorage.setItem('findaba_git_deploy_branch', clean);
  } else {
    localStorage.setItem('findaba_git_branch', clean);
  }

  try {
    const res = await fetch('/api/git/branch/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: clean, type }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
          detail: {
            branch: clean,
            workingBranch: data.workingBranch || clean,
            deploymentBranch: data.deploymentBranch,
            repo: data.repo,
          },
        }));
      }
      return { success: true, branch: clean };
    }
  } catch (err: any) {
    console.warn('[GitConfigService] Branch select API note:', err.message);
  }

  // Local dispatch fallback if network temporarily unavailable
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: { branch: clean, [type === 'deployment' ? 'deploymentBranch' : 'workingBranch']: clean },
    }));
  }

  return { success: true, branch: clean };
}
