/**
 * src/services/githubService.ts
 *
 * Client-side service for querying GitHub repository activity,
 * commit streams, and deployment integrity metrics.
 */

import { getSupabase } from './supabaseService';

export interface CommitItem {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorLogin?: string;
  authorEmail?: string;
  authorAvatar?: string | null;
  authorUrl?: string | null;
  date: string;
  htmlUrl: string;
  verified: boolean;
}

export interface CommitHistoryResponse {
  success: boolean;
  repo: string;
  branch: string;
  count: number;
  commits: CommitItem[];
  tokenRejected?: boolean;
  message?: string;
}

export class GithubService {
  /**
   * Helper to construct authorized request headers (Supabase session + optional custom PAT).
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {
        // Fallback for non-authenticated states
      }
    }

    const customPat = localStorage.getItem('findaba_github_pat')?.trim();
    if (customPat) {
      headers['X-GitHub-Token'] = customPat;
    }

    return headers;
  }

  /**
   * Fetches the 5 most recent commit messages (or custom limit) from the repository
   * configured in environment variables or passed explicitly.
   */
  public static async getRecentCommits(
    limit: number = 5,
    customRepo?: string,
    customBranch?: string
  ): Promise<CommitItem[]> {
    const history = await this.fetchCommitHistory(limit, customRepo, customBranch);
    return history.commits || [];
  }

  /**
   * Full commit history query with repository and branch metadata.
   */
  public static async fetchCommitHistory(
    limit: number = 5,
    customRepo?: string,
    customBranch?: string
  ): Promise<CommitHistoryResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const savedRepo = localStorage.getItem('findaba_git_repo');
      const savedBranch = localStorage.getItem('findaba_git_branch');

      const targetRepo = customRepo || savedRepo || '';
      const targetBranch = customBranch || savedBranch || '';

      const params = new URLSearchParams();
      params.append('limit', String(limit));
      if (targetRepo) params.append('repo', targetRepo);
      if (targetBranch) params.append('branch', targetBranch);

      const response = await fetch(`/api/git/commits?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commits (HTTP ${response.status})`);
      }

      const data = await response.json();
      return {
        success: data.success ?? true,
        repo: data.repo || targetRepo || 'nedtwistmovies-star/FindAba-OS',
        branch: data.branch || targetBranch || 'main',
        count: data.count || (data.commits ? data.commits.length : 0),
        tokenRejected: data.tokenRejected,
        commits: data.commits || [],
        message: data.message,
      };
    } catch (err: any) {
      console.warn('[GithubService] Failed to load commits from API, attempting public fallback...', err);
      return this.fetchPublicFallback(limit, customRepo, customBranch);
    }
  }

  /**
   * Resilient client fallback that queries public GitHub API directly if the backend is unreachable.
   */
  private static async fetchPublicFallback(
    limit: number = 5,
    customRepo?: string,
    customBranch?: string
  ): Promise<CommitHistoryResponse> {
    const rawRepo = customRepo || localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS';
    const cleanRepo = rawRepo.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '').replace(/\.git$/i, '');
    const branch = customBranch || localStorage.getItem('findaba_git_branch') || 'main';

    try {
      const res = await fetch(`https://api.github.com/repos/${cleanRepo}/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        throw new Error(`Direct GitHub API returned status ${res.status}`);
      }

      const raw = await res.json();
      const commits: CommitItem[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
        sha: item.sha,
        shortSha: item.sha ? item.sha.substring(0, 7) : '',
        message: item.commit?.message || 'No commit message',
        authorName: item.commit?.author?.name || item.author?.login || 'Unknown',
        authorLogin: item.author?.login,
        authorEmail: item.commit?.author?.email,
        authorAvatar: item.author?.avatar_url || null,
        authorUrl: item.author?.html_url || null,
        date: item.commit?.author?.date || item.commit?.committer?.date || new Date().toISOString(),
        htmlUrl: item.html_url || `https://github.com/${cleanRepo}/commit/${item.sha}`,
        verified: !!item.commit?.verification?.verified,
      }));

      return {
        success: true,
        repo: cleanRepo,
        branch,
        count: commits.length,
        commits,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        repo: cleanRepo,
        branch,
        count: 0,
        commits: [],
        message: fallbackErr.message || 'Unable to retrieve commit feed',
      };
    }
  }
}

// Named exports for flexibility
export const fetchRecentCommits = (limit?: number) => GithubService.getRecentCommits(limit);
export const githubService = GithubService;
export default GithubService;
