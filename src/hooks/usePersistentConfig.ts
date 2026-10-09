import { useState, useEffect, useCallback } from 'react';
import { 
  fetchSystemConfig, 
  saveSystemConfig, 
  SystemConfigResponse,
  SystemDeploymentConfig
} from '../services/systemConfigService';

/**
 * Authoritative hook for managing persistent system configuration.
 * Syncs with server-side Supabase storage and local cache.
 */
export const usePersistentConfig = () => {
  const [config, setConfig] = useState<SystemConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemConfig();
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (payload: {
    repository?: string;
    branch?: string;
    githubToken?: string;
    connected?: boolean;
    active?: boolean;
    deployment?: Partial<SystemDeploymentConfig>;
  }) => {
    setLoading(true);
    try {
      const updated = await saveSystemConfig(payload);
      setConfig(updated);
      return { success: true, data: updated };
    } catch (err: any) {
      setError(err.message || 'Failed to update system configuration');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for external updates (e.g. from other components calling saveSystemConfig)
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('findaba:system_config_updated', handleUpdate);
    
    // Initial load
    refresh();

    return () => {
      window.removeEventListener('findaba:system_config_updated', handleUpdate);
    };
  }, [refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    update,
    repository: config?.repository || '',
    branch: config?.workingBranch || config?.branch || '',
    workingBranch: config?.workingBranch || config?.branch || '',
    deploymentBranch: config?.deploymentBranch || 'main',
    defaultBranch: config?.defaultBranch || 'main',
    connected: config?.connected || false,
    lastCommitSha: config?.lastCommitSha || null,
    lastValidatedAt: config?.lastValidatedAt || null,
    deployment: config?.deployment
  };
};
