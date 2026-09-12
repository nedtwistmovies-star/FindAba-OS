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

export const AUTHORITATIVE_DEFAULT_BRANCH = 'prod-stabilize/phase1-foundation';
export const AUTHORITATIVE_DEFAULT_REPO = 'nedtwistmovies-star/FindAba-OS';

/**
 * Initializes and synchronizes the Git Repository configuration.
 * Queries /api/git/config as the primary authoritative source of truth,
 * with fallback to /metadata.json and built-in defaults.
 */
export async function initializeRepositoryConfig(): Promise<{ repo: string; branch: string }> {
  let targetRepo = AUTHORITATIVE_DEFAULT_REPO;
  let targetBranch = AUTHORITATIVE_DEFAULT_BRANCH;

  // 1. Try fetching authoritative config from server
  try {
    const configRes = await fetch('/api/git/config');
    if (configRes.ok) {
      const configData = await configRes.json();
      if (configData.success) {
        if (configData.repo) targetRepo = cleanRepositoryName(configData.repo);
        if (configData.branch) targetBranch = configData.branch.trim();
      }
    }
  } catch (apiErr) {
    console.warn('[GitConfigService] /api/git/config not reachable, falling back to metadata.json:', apiErr);
  }

  // 2. Supplement/fallback from metadata.json if needed
  try {
    const metaRes = await fetch('/metadata.json');
    if (metaRes.ok) {
      const metadata: AppMetadata = await metaRes.json();
      if (metadata.repository?.url && (!targetRepo || targetRepo === AUTHORITATIVE_DEFAULT_REPO)) {
        const parsed = cleanRepositoryName(metadata.repository.url);
        if (parsed) targetRepo = parsed;
      }
      if (metadata.repository?.branch && targetBranch === AUTHORITATIVE_DEFAULT_BRANCH) {
        targetBranch = metadata.repository.branch.trim();
      }
    }
  } catch (metaErr) {
    console.warn('[GitConfigService] metadata.json read error:', metaErr);
  }

  // 3. Authoritative sync with localStorage
  // If stored branch is 'main' while authoritative target is prod-stabilize/phase1-foundation,
  // promote to the authoritative branch so UI and API never mismatch.
  const currentLocalBranch = localStorage.getItem('findaba_git_branch')?.trim();
  if (!currentLocalBranch || currentLocalBranch === 'main') {
    localStorage.setItem('findaba_git_branch', targetBranch);
  } else {
    targetBranch = currentLocalBranch;
  }

  const currentLocalRepo = localStorage.getItem('findaba_git_repo')?.trim();
  if (!currentLocalRepo) {
    localStorage.setItem('findaba_git_repo', targetRepo);
  } else {
    targetRepo = currentLocalRepo;
  }

  // 4. Dispatch event so active UI components react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('findaba:git_config_updated', {
      detail: { repo: targetRepo, branch: targetBranch }
    }));
  }

  return { repo: targetRepo, branch: targetBranch };
}
