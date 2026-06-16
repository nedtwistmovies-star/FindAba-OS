/**
 * Git Configuration Service
 * Programmatically loads the repository settings from metadata.json
 * and ensures they are synchronized with the local storage configuration.
 */

export interface RepositoryConfig {
  type: string;
  url: string;
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

/**
 * Initializes and synchronizes the Git Repository configuration from metadata.json to local storage.
 * This is non-blocking and handles failures gracefully with fallback values.
 */
export async function initializeRepositoryConfig(): Promise<string> {
  const defaultRepo = 'nedtwistmovies-star/FindAba-OS';
  const defaultBranch = 'main';

  try {
    console.log('[GitConfigService] Fetching metadata.json...');
    const response = await fetch('/metadata.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata.json: Server returned status ${response.status}`);
    }
    
    const metadata: AppMetadata = await response.json();
    console.log('[GitConfigService] Metadata loaded successfully:', metadata);

    let targetRepo = defaultRepo;
    
    if (metadata.repository && metadata.repository.url) {
      const parsedRepo = cleanRepositoryName(metadata.repository.url);
      if (parsedRepo) {
        targetRepo = parsedRepo;
        console.log(`[GitConfigService] Detected repository from metadata: ${targetRepo}`);
      }
    }

    // Update localStorage
    const currentLocalRepo = localStorage.getItem('findaba_git_repo');
    if (currentLocalRepo !== targetRepo) {
      console.log(`[GitConfigService] Updating repository in localStorage: ${currentLocalRepo} -> ${targetRepo}`);
      localStorage.setItem('findaba_git_repo', targetRepo);
    }

    if (!localStorage.getItem('findaba_git_branch')) {
      localStorage.setItem('findaba_git_branch', defaultBranch);
    }

    return targetRepo;
  } catch (error: any) {
    console.warn('[GitConfigService] Failed to read metadata.json programmatically, using fallback configuration:', error.message || error);
    
    // Fallback synchronization
    if (!localStorage.getItem('findaba_git_repo')) {
      localStorage.setItem('findaba_git_repo', defaultRepo);
    }
    if (!localStorage.getItem('findaba_git_branch')) {
      localStorage.setItem('findaba_git_branch', defaultBranch);
    }
    
    return localStorage.getItem('findaba_git_repo') || defaultRepo;
  }
}
