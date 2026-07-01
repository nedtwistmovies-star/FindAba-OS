
import { useState, useEffect } from 'react';

export interface GitSyncStatus {
  connected: boolean;
  repo?: string;
  branch?: string;
  lastUpdated?: string;
  data?: any;
  error?: string;
}

export const useGitSync = () => {
  const [status, setStatus] = useState<GitSyncStatus>({ connected: false });
  const [loading, setLoading] = useState(false);

  const sync = async (manualRepo?: string, manualBranch?: string) => {
    setLoading(true);
    try {
      const savedRepo = localStorage.getItem('findaba_git_repo');
      const savedBranch = localStorage.getItem('findaba_git_branch');
      
      const targetRepo = manualRepo !== undefined ? manualRepo : (savedRepo || '');
      const targetBranch = manualBranch !== undefined ? manualBranch : (savedBranch || '');
      
      let url = '/api/git/sync';
      const params = new URLSearchParams();
      if (targetRepo) params.append('repo', targetRepo);
      if (targetBranch) params.append('branch', targetBranch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        credentials: 'include', // Crucial for sending github_token cookie in iframes
        headers: { 'Accept': 'application/json' }
      });
      const text = await response.text();
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[GitSync] Failed to parse JSON response:", text);
        setStatus({ connected: false, error: `Industrial Signal Invalid: ${response.status}` });
        return;
      }
      
      if (response.ok) {
        setStatus({
          connected: true,
          repo: result.repo,
          branch: targetBranch || 'main',
          lastUpdated: result.lastUpdated,
          data: result.data || [],
          error: undefined
        });
        console.log(`[GitSync] Handshake successful: ${targetRepo || 'default'}`);
      } else {
        const errorMsg = result.details || result.error || `Sync Handshake Failed (${response.status})`;
        console.warn(`[GitSync] Handshake failed: ${errorMsg}`);
        setStatus({ 
          connected: false, 
          error: errorMsg,
          lastUpdated: undefined 
        });
      }
    } catch (err: any) {
      console.error("[GitSync] Network fault during handshake:", err.message);
      setStatus({ 
        connected: false, 
        error: `Connectivity Fault: ${err.message}. Ensure the Registry Backend is online.` 
      });
    } finally {
      setLoading(false);
    }
  };

  const commit = async (files: { path: string; data: any }[], message?: string) => {
    setLoading(true);
    try {
      const repo = localStorage.getItem('findaba_git_repo') || '';
      const branch = localStorage.getItem('findaba_git_branch') || '';
      
      let url = `/api/git/commit`;
      const params = new URLSearchParams();
      if (repo) params.append('repo', repo);
      if (branch) params.append('branch', branch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ files, message })
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[GitSync] Commit Failed Parse JSON:", text);
        return { success: false, error: `Server System Error: ${response.status}` };
      }

      if (response.ok) {
        return { success: true, commit: result.commit };
      } else {
        return { success: false, error: result.details || result.error || 'Commit Failed' };
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
      const repo = localStorage.getItem('findaba_git_repo') || '';
      const branch = localStorage.getItem('findaba_git_branch') || '';
      
      let url = `/api/git/sync-full`;
      const params = new URLSearchParams();
      if (repo) params.append('repo', repo);
      if (branch) params.append('branch', branch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[GitSync] Full Sync Failed Parse JSON:", text);
        return { success: false, error: `Server Error: ${response.status}` };
      }

      if (response.ok) {
        return { success: true, commit: result.commit, warning: result.warning };
      } else {
        return { success: false, error: result.details || result.error || 'Full Sync Failed' };
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

  // Auto-sync on mount
  useEffect(() => {
    sync();
  }, []);

  return { status, loading, sync, commit, fullSync };
};
