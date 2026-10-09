
import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseService';

export interface GitSyncStatus {
  connected: boolean;
  repo?: string;
  branch?: string;
  workingBranch?: string;
  deploymentBranch?: string;
  defaultBranch?: string;
  lastUpdated?: string;
  data?: any;
  error?: string;
  details?: string;
  systemHasToken?: boolean;
  systemConfigured?: boolean;
  username?: string;
  lastCommitSha?: string;
}

export const useGitSync = () => {
  const [status, setStatus] = useState<GitSyncStatus>(() => {
    const savedRepo = localStorage.getItem('findaba_git_repo') || undefined;
    const savedBranch = localStorage.getItem('findaba_git_branch') || 'main';
    const savedDeploy = localStorage.getItem('findaba_git_deploy_branch') || 'main';
    const savedDefault = localStorage.getItem('findaba_git_default_branch') || 'main';
    const savedConnected = localStorage.getItem('findaba_git_connected') === 'true';
    const savedUsername = localStorage.getItem('findaba_git_username') || undefined;
    return {
      connected: savedConnected,
      repo: savedRepo,
      branch: savedBranch,
      workingBranch: savedBranch,
      deploymentBranch: savedDeploy,
      defaultBranch: savedDefault,
      username: savedUsername,
    };
  });
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (e) {
        // Ignore auth error
      }
    }

    const userEmail = (localStorage.getItem('findaba_auth_email') || '').toLowerCase().trim();
    const userRole = localStorage.getItem('findaba_auth_role');
    const isAdminAuth = localStorage.getItem('findaba_admin_auth') === 'true';

    // If no Supabase session token exists but client has verified admin state
    if (!headers['Authorization'] && (userRole === 'admin' || userRole === 'superadmin' || isAdminAuth) && userEmail) {
      headers['Authorization'] = `Bearer emergency_admin_${btoa(userEmail)}`;
    }

    // Support both PAT storage keys seamlessly
    const savedPat = (localStorage.getItem('findaba_github_pat') || localStorage.getItem('findaba_git_token') || '').trim();
    if (savedPat) {
      headers['X-GitHub-Token'] = savedPat;
    }

    return headers;
  };

  const sync = useCallback(async (manualRepo?: string, manualBranch?: string, retriesLeft: number = 2) => {
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const targetRepo = manualRepo || localStorage.getItem('findaba_git_repo') || undefined;
      const targetBranch = manualBranch || localStorage.getItem('findaba_git_branch') || undefined;
      
      let url = '/api/git/sync';
      const params = new URLSearchParams();
      if (targetRepo) params.append('repo', targetRepo);
      if (targetBranch) params.append('branch', targetBranch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        headers: { 
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      const text = await response.text();
      
      const isHtml = text.trim().startsWith('<');
      let result: any = {};
      if (!isHtml) {
        try {
          result = text && text.trim() ? JSON.parse(text) : {};
        } catch (e) {
          console.warn("[GitSync] Handshake response not valid JSON");
        }
      }

      if (isHtml || !response.ok) {
          if (isHtml) {
          if (retriesLeft > 0) {
            console.log(`[GitSync] Server starting up or returning HTML. Retrying handshake in 3s... (${retriesLeft} retries left)`);
            setTimeout(() => { sync(manualRepo, manualBranch, retriesLeft - 1).catch(() => {}); }, 3000);
            return;
          }
          setStatus({ connected: false, error: "Server initializing... Please retry in a moment." });
          return;
        }

        const rawErr = result.details || result.error;
        let errorMsg = typeof rawErr === 'object' && rawErr !== null
          ? (rawErr.message || JSON.stringify(rawErr))
          : (rawErr || `Sync Handshake Failed (${response.status})`);
        
        if (response.status === 401 || response.status === 403) {
          errorMsg = "Authentication Failed: Please ensure your GITHUB_TOKEN is valid and has 'repo' scope permissions.";
        } else if (response.status === 404) {
          errorMsg = `Repository Not Found: Ensure '${manualRepo || "configured repo"}' exists and is accessible.`;
        } else if (typeof errorMsg === 'string' && (errorMsg.includes('Unexpected end of JSON input') || errorMsg.includes('JSON'))) {
          errorMsg = `GitHub API payload unreachable or invalid. Verify repository name '${manualRepo || "configured"}' and Personal Access Token.`;
        }
        
        console.warn(`[GitSync] Handshake failed: ${errorMsg}`);
        setStatus({ 
          connected: false, 
          error: errorMsg,
          lastUpdated: undefined 
        });
        return;
      }
      
      const resolvedBranch = result.branch || manualBranch || 'main';

      setStatus({
        connected: true,
        repo: result.repo,
        branch: resolvedBranch,
        lastUpdated: result.lastUpdated,
        data: result.data || [],
        systemHasToken: result.systemHasToken,
        systemConfigured: result.systemConfigured,
        error: undefined
      });
      console.log(`[GitSync] Handshake successful: ${result.repo || 'default'} on branch ${resolvedBranch}`);
    } catch (err: any) {
      if (retriesLeft > 0 && err.message === 'Failed to fetch') {
        console.log(`[GitSync] Network fault during handshake. Retrying in 3s... (${retriesLeft} retries left)`);
        setTimeout(() => { sync(manualRepo, manualBranch, retriesLeft - 1).catch(() => {}); }, 3000);
        return;
      }
      console.warn("[GitSync] Network fault during handshake:", err.message);
      setStatus({ 
        connected: false, 
        error: `Connectivity Fault: ${err.message === 'Failed to fetch' ? 'Server starting or unreachable' : err.message}. Ensure the Registry Backend is online.` 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const commit = async (files: { path: string; data: any }[], message?: string) => {
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      
      const url = `/api/git/commit`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ files, message })
      });
      
      const text = await response.text();
      const isHtml = text.trim().startsWith('<');
      let result: any = {};
      if (!isHtml) {
        try {
          result = text && text.trim() ? JSON.parse(text) : {};
        } catch (e) {
          console.warn("[GitSync] Commit Failed Parse JSON");
        }
      } else {
        return { success: false, error: `Server System Error or Warmup (${response.status})` };
      }

      if (response.ok) {
        return { success: true, commit: result.commit };
      } else {
        let errorMsg = result.details || result.error || 'Commit Failed';
        if (typeof errorMsg === 'string' && errorMsg.includes('Unexpected end of JSON input')) {
          errorMsg = 'GitHub API returned invalid response. Verify repository credentials and permissions.';
        }
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      console.error('Commit Error:', err);
      return { 
        success: false, 
        error: err.message === 'Failed to fetch' 
          ? 'Network error: Server unreachable or payload too large' 
          : `Sync Fault: ${err.message}` 
      };
    } finally {
      setLoading(false);
    }
  };

  const fullSync = async (message?: string) => {
    setLoading(true);
    console.log(`[GitSync] Initiating full sync (Aba Mesh)...`);
    
    // Create a timeout controller for 10 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const authHeaders = await getAuthHeaders();
      const url = `/api/git/sync-full`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const text = await response.text();
      const isHtml = text.trim().startsWith('<');
      let result: any = {};
      if (!isHtml) {
        try {
          result = text && text.trim() ? JSON.parse(text) : {};
        } catch (e) {
          console.warn("[GitSync] Full Sync Failed Parse JSON");
        }
      } else {
        return { success: false, error: `Server Error or Warmup (${response.status})` };
      }

      if (response.ok) {
        return { success: true, commit: result.commit, warning: result.warning };
      } else {
        let errorMsg = result.details || result.error || 'Full Sync Failed';
        if (typeof errorMsg === 'string' && errorMsg.includes('Unexpected end of JSON input')) {
          errorMsg = 'GitHub API returned invalid response. Verify repository permissions.';
        }
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Full Sync Error:', err);
      
      if (err.name === 'AbortError') {
        return { success: false, error: 'Sync timed out after 10 minutes. The operation might still be processing on the server. Please check your GitHub repository in a few moments.' };
      }

      let errorMsg = `Sync Error: ${err.message}`;
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMsg = 'Network error: Server unreachable or request timed out. The project might be too large for a single sync, but it might still be running on the server. Check your GitHub repo in 5 minutes.';
      }
      
      return { 
        success: false, 
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  };

  const pushChanges = async (options?: {
    branch?: string;
    message?: string;
    files?: Array<{ path: string; data?: any; content?: string }>;
    repo?: string;
  }): Promise<{ success: boolean; commit?: string; commitSha?: string; branch?: string; filesCount?: number; error?: string }> => {
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const targetRepo = options?.repo || status.repo || localStorage.getItem('findaba_git_repo')?.trim();
      const targetBranch = options?.branch || status.workingBranch || status.branch || localStorage.getItem('findaba_git_branch')?.trim() || 'main';

      let url = `/api/git/push`;
      const params = new URLSearchParams();
      if (targetRepo) params.append('repo', targetRepo);
      if (targetBranch) params.append('branch', targetBranch);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          repo: targetRepo,
          branch: targetBranch,
          message: options?.message || 'Push changes via FindAba City OS',
          files: options?.files || [],
        }),
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = text && text.trim() ? JSON.parse(text) : {};
      } catch (e) {
        console.warn('[GitSync] Push Failed Parse JSON:', text);
      }

      if (response.ok && result.success) {
        return {
          success: true,
          commit: result.commit,
          commitSha: result.commitSha,
          branch: result.branch,
          filesCount: result.filesCount,
        };
      } else {
        const errorMsg = result.details || result.error || `Push failed (${response.status})`;
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      console.error('[GitSync] Push Error:', err);
      return {
        success: false,
        error: err.message === 'Failed to fetch' ? 'Server unreachable or network error' : err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const clearError = useCallback(() => {
    setStatus(prev => ({ ...prev, error: undefined }));
  }, []);

  // Listen for real-time Git configuration changes across all windows & components
  useEffect(() => {
    const handleGitConfigUpdated = (e: any) => {
      if (e.detail) {
        setStatus(prev => ({
          ...prev,
          repo: e.detail.repo ?? prev.repo,
          branch: e.detail.workingBranch ?? e.detail.branch ?? prev.branch,
          workingBranch: e.detail.workingBranch ?? e.detail.branch ?? prev.workingBranch,
          deploymentBranch: e.detail.deploymentBranch ?? prev.deploymentBranch,
          defaultBranch: e.detail.defaultBranch ?? prev.defaultBranch,
          connected: typeof e.detail.connected === 'boolean' ? e.detail.connected : prev.connected,
          username: e.detail.username ?? prev.username,
          lastCommitSha: e.detail.lastCommitSha ?? prev.lastCommitSha,
        }));
      }
    };
    window.addEventListener('findaba:git_config_updated', handleGitConfigUpdated);
    return () => window.removeEventListener('findaba:git_config_updated', handleGitConfigUpdated);
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    sync().catch(() => {});
  }, []);

  return { status, loading, sync, commit, fullSync, pushChanges, clearError };
};
