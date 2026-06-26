
import { useState, useEffect } from 'react';

export interface GitSyncStatus {
  connected: boolean;
  repo?: string;
  branch?: string;
  lastUpdated?: string;
  data?: any;
  error?: string;
  details?: string;
  systemConfigured?: boolean;
  systemHasToken?: boolean;
}

export const useGitSync = () => {
  const [status, setStatus] = useState<GitSyncStatus>({ connected: false });
  const [loading, setLoading] = useState(false);

  const checkSystemStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          systemConfigured: data.configured,
          systemHasToken: data.hasToken
        }));
        return data;
      }
    } catch (e) {
      console.warn('Failed to check Git system status');
    }
    return null;
  };

  const sync = async (manualRepo?: string, manualBranch?: string) => {
    setLoading(true);
    try {
      const savedRepo = localStorage.getItem('findaba_git_repo');
      const savedBranch = localStorage.getItem('findaba_git_branch');
      const savedToken = localStorage.getItem('findaba_git_token');
      
      const targetRepo = manualRepo !== undefined ? manualRepo : (savedRepo || '');
      const targetBranch = manualBranch !== undefined ? manualBranch : (savedBranch || '');
      
      let url = '/api/git/sync';
      const params = new URLSearchParams();
      if (targetRepo) params.append('repo', targetRepo);
      if (targetBranch) params.append('branch', targetBranch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const headers: HeadersInit = {};
      if (savedToken) {
        headers['X-Git-Token'] = savedToken;
      }

      const response = await fetch(url, { headers });
      const text = await response.text();
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[GitSync] Failed to parse JSON response:", text);
        setStatus({ connected: false, error: `Invalid Server Response: ${response.status}` });
        return;
      }
      
      if (response.ok) {
        setStatus({
          connected: true,
          repo: result.repo,
          branch: targetBranch || 'main',
          lastUpdated: result.lastUpdated,
          data: result.data
        });
      } else {
        setStatus({ 
          connected: false, 
          error: result.error || 'Sync Failed',
          details: result.details
        });
      }
    } catch (err) {
      console.warn("Registry sync failed, using fallback state");
      setStatus({ connected: false, error: 'Network error during Git sync' });
    } finally {
      setLoading(false);
    }
  };

  const commit = async (files: { path: string; data: any }[], message?: string) => {
    setLoading(true);
    try {
      const repo = localStorage.getItem('findaba_git_repo') || '';
      const branch = localStorage.getItem('findaba_git_branch') || '';
      const savedToken = localStorage.getItem('findaba_git_token');
      
      let url = `/api/git/commit`;
      const params = new URLSearchParams();
      if (repo) params.append('repo', repo);
      if (branch) params.append('branch', branch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (savedToken) {
        headers['X-Git-Token'] = savedToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ files, message })
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[GitSync] Commit Failed Parse JSON:", text);
        return { success: false, error: `Server Error: ${response.status}` };
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
          : `Sync Error: ${err.message}` 
      };
    } finally {
      setLoading(false);
    }
  };

  const fullSync = async (message?: string) => {
    setLoading(true);
    console.log(`[GitSync] Initiating full sync...`);
    
    // Create a timeout controller for 10 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const repo = localStorage.getItem('findaba_git_repo') || '';
      const branch = localStorage.getItem('findaba_git_branch') || '';
      const savedToken = localStorage.getItem('findaba_git_token');
      
      let url = `/api/git/sync-full`;
      const params = new URLSearchParams();
      if (repo) params.append('repo', repo);
      if (branch) params.append('branch', branch);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (savedToken) {
        headers['X-Git-Token'] = savedToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
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
    checkSystemStatus();
    sync();
  }, []);

  return { status, loading, sync, commit, fullSync, checkSystemStatus };
};
