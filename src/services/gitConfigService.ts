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

/**
 * Initializes and synchronizes the Git Repository configuration.
 * Queries /api/admin/config and /api/git/config as the primary authoritative sources of truth,
 * with fallback to /metadata.json and localStorage.
 * Ensures configured branches ('main', 'master', 'production', 'release', etc.) persist reliably.
 */
export async function initializeRepositoryConfig(): Promise<{ repo: string; branch: string }> {
  let targetRepo = AUTHORITATIVE_DEFAULT_REPO;
  let targetBranch = AUTHORITATIVE_DEFAULT_BRANCH;
  let loadedFromServer = false;

  // 1. Try fetching authoritative config from server (admin/config or git/config)
  try {
    const configRes = await fetch('/api/admin/config');
    if (configRes.ok) {
      const configData = await configRes.json();
      if (configData.success) {
        if (configData.repository) targetRepo = cleanRepositoryName(configData.repository);
        if (configData.branch) {
          targetBranch = configData.branch.trim();
          loadedFromServer = true;
        }
      }
    } else {
      // Fallback to /api/git/config
      const gitRes = await fetch('/api/git/config');
      if (gitRes.ok) {
        const gitData = await gitRes.json();
        if (gitData.success) {
          if (gitData.repo) targetRepo = cleanRepositoryName(gitData.repo);
          if (gitData.branch) {
            targetBranch = gitData.branch.trim();
            loadedFromServer = true;
          }
        }
      }
    }
  } catch (apiErr) {
    console.warn('[GitConfigService] Server config not reachable, checking local sources:', apiErr);
  }

  // 2. Supplement/fallback from metadata.json if not loaded from server
  if (!loadedFromServer) {
    try {
      const metaRes = await fetch('/metadata.json');
      if (metaRes.ok) {
        const metadata: AppMetadata = await metaRes.json();
        if (metadata.repository?.url && (!targetRepo || targetRepo === AUTHORITATIVE_DEFAULT_REPO)) {
          const parsed = cleanRepositoryName(metadata.repository.url);
          if (parsed) targetRepo = parsed;
        }
        if (metadata.repository?.branch) {
          targetBranch = metadata.repository.branch.trim();
        }
      }
    } catch (metaErr) {
      console.warn('[GitConfigService] metadata.json read error:', metaErr);
    }
  }

  // 3. Sync with localStorage: if loaded from server, update localStorage.
  // If not loaded from server, read from localStorage.
  const currentLocalBranch = localStorage.getItem('findaba_git_branch')?.trim();
  if (loadedFromServer) {
    localStorage.setItem('findaba_git_branch', targetBranch);
  } else if (currentLocalBranch) {
    targetBranch = currentLocalBranch;
  } else {
    localStorage.setItem('findaba_git_branch', targetBranch);
  }

  const currentLocalRepo = localStorage.getItem('findaba_git_repo')?.trim();
  if (loadedFromServer) {
    localStorage.setItem('findaba_git_repo', targetRepo);
  } else if (currentLocalRepo) {
    targetRepo = currentLocalRepo;
  } else {
    localStorage.setItem('findaba_git_repo', targetRepo);
  }

  // 4. Dispatch event so active UI components react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: { repo: targetRepo, branch: targetBranch }
    }));
  }

  return { repo: targetRepo, branch: targetBranch };
}
