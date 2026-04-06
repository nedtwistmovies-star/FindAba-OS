
import { useState, useEffect } from 'react';

export interface GitSyncStatus {
  connected: boolean;
  repo?: string;
  lastUpdated?: string;
  data?: any;
  error?: string;
}

export const useGitSync = () => {
  const [status, setStatus] = useState<GitSyncStatus>({ connected: false });
  const [loading, setLoading] = useState(false);

  const sync = async (manualRepo?: string) => {
    setLoading(true);
    try {
      const savedRepo = localStorage.getItem('findaba_git_repo');
      const targetRepo = manualRepo !== undefined ? manualRepo : (savedRepo || '');
      
      if (manualRepo === '' && !savedRepo) {
        // Explicitly clearing
        setStatus({ connected: false });
        return;
      }

      const url = targetRepo ? `/api/git/sync?repo=${encodeURIComponent(targetRepo)}` : '/api/git/sync';
      const response = await fetch(url);
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          setStatus({
            connected: true,
            repo: result.repo,
            lastUpdated: result.lastUpdated,
            data: result.data
          });
        } else {
          setStatus({ connected: false, error: result.error || 'Sync Failed' });
        }
      } else {
        const text = await response.text();
        console.error("[GitSync] Non-JSON response:", text);
        setStatus({ connected: false, error: `Server Error: ${response.status}` });
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
      const response = await fetch(`/api/git/commit?repo=${encodeURIComponent(repo)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, message })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          return { success: true, commit: result.commit };
        } else {
          return { success: false, error: result.details || result.error || 'Commit Failed' };
        }
      } else {
        const text = await response.text();
        console.error("[GitSync] Commit Non-JSON response:", text);
        return { success: false, error: `Server Error: ${response.status}` };
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
      const response = await fetch(`/api/git/sync-full?repo=${encodeURIComponent(repo)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          return { success: true, commit: result.commit, warning: result.warning };
        } else {
          return { success: false, error: result.details || result.error || 'Full Sync Failed' };
        }
      } else {
        const text = await response.text();
        console.error("[GitSync] Full Sync Non-JSON response:", text);
        return { success: false, error: `Server Error: ${response.status}` };
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
