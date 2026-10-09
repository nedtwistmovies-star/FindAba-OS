import { useState, useEffect, useCallback } from 'react';
import { 
  initializeRepositoryConfig, 
  switchBranch, 
  cleanRepositoryName, 
  GitConfigState 
} from '../services/gitConfigService';

export interface GitPersistenceState {
  repo: string;
  branch: string;
  workingBranch: string;
  deploymentBranch: string;
  defaultBranch: string;
  connected: boolean;
  username: string | null;
  lastCommitSha: string | null;
  lastValidatedAt: string | null;
  isValidating: boolean;
  error: string | null;
  branchExists: boolean;
  reauthorizeRequired: boolean;
}

/**
 * Custom React hook for managing the synchronization of repository,
 * branch, and connection state with localStorage and the server,
 * providing validateConnection to reconcile with the remote GitHub environment.
 */
export function useGitPersistence() {
  const [state, setState] = useState<GitPersistenceState>(() => {
    const repo = localStorage.getItem('findaba_git_repo')?.trim() || 'nedtwistmovies-star/FindAba-OS';
    const workingBranch = localStorage.getItem('findaba_git_branch')?.trim() || 'main';
    const deploymentBranch = localStorage.getItem('findaba_git_deploy_branch')?.trim() || 'main';
    const defaultBranch = localStorage.getItem('findaba_git_default_branch')?.trim() || 'main';
    const connected = localStorage.getItem('findaba_git_connected') === 'true';
    const username = localStorage.getItem('findaba_git_username') || null;

    return {
      repo,
      branch: workingBranch,
      workingBranch,
      deploymentBranch,
      defaultBranch,
      connected,
      username,
      lastCommitSha: null,
      lastValidatedAt: null,
      isValidating: false,
      error: null,
      branchExists: true,
      reauthorizeRequired: false,
    };
  });

  // Reconcile and validate connection with remote GitHub environment
  const validateConnection = useCallback(async (forceRemoteCheck = true) => {
    setState((prev) => ({ ...prev, isValidating: true, error: null }));
    try {
      const url = `/api/git/status?validate=${forceRemoteCheck ? 'true' : 'false'}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const validatedRepo = data.repo ? cleanRepositoryName(data.repo) : state.repo;
          const validatedWorkingBranch = (data.workingBranch || data.branch || state.workingBranch).trim();
          const validatedDeployBranch = (data.deploymentBranch || state.deploymentBranch).trim();
          const validatedDefaultBranch = (data.defaultBranch || state.defaultBranch).trim();
          const validatedConnected = Boolean(data.connected);
          const validatedUsername = data.username || state.username;
          const lastCommitSha = data.lastCommitSha || state.lastCommitSha;
          const branchExists = typeof data.branchExists === 'boolean' ? data.branchExists : true;
          const reauthReq = Boolean(data.reauthorizeRequired);
          const validationError = data.error || null;

          // Sync localStorage
          localStorage.setItem('findaba_git_repo', validatedRepo);
          localStorage.setItem('findaba_git_branch', validatedWorkingBranch);
          localStorage.setItem('findaba_git_deploy_branch', validatedDeployBranch);
          localStorage.setItem('findaba_git_default_branch', validatedDefaultBranch);
          localStorage.setItem('findaba_git_connected', String(validatedConnected));
          if (validatedUsername) {
            localStorage.setItem('findaba_git_username', validatedUsername);
          }

          setState({
            repo: validatedRepo,
            branch: validatedWorkingBranch,
            workingBranch: validatedWorkingBranch,
            deploymentBranch: validatedDeployBranch,
            defaultBranch: validatedDefaultBranch,
            connected: validatedConnected,
            username: validatedUsername,
            lastCommitSha,
            lastValidatedAt: new Date().toISOString(),
            isValidating: false,
            error: validationError,
            branchExists,
            reauthorizeRequired: reauthReq,
          });

          return {
            success: true,
            valid: data.valid,
            connected: validatedConnected,
            lastCommitSha,
            error: validationError,
          };
        }
      }
      throw new Error(`Failed to validate connection: HTTP ${res.status}`);
    } catch (err: any) {
      const errMsg = err.message || 'Remote validation failed';
      setState((prev) => ({
        ...prev,
        isValidating: false,
        error: errMsg,
      }));
      return { success: false, error: errMsg };
    }
  }, [state.repo, state.workingBranch, state.deploymentBranch, state.defaultBranch, state.username, state.lastCommitSha]);

  // Set user working branch and persist
  const setWorkingBranch = useCallback(async (newBranch: string) => {
    const trimmed = newBranch.trim();
    if (!trimmed) return { success: false, error: 'Branch name cannot be empty' };

    localStorage.setItem('findaba_git_branch', trimmed);
    setState((prev) => ({ ...prev, branch: trimmed, workingBranch: trimmed }));

    const result = await switchBranch(trimmed, 'working');
    return result;
  }, []);

  // Set deployment branch and persist
  const setDeploymentBranch = useCallback(async (newBranch: string) => {
    const trimmed = newBranch.trim();
    if (!trimmed) return { success: false, error: 'Branch name cannot be empty' };

    localStorage.setItem('findaba_git_deploy_branch', trimmed);
    setState((prev) => ({ ...prev, deploymentBranch: trimmed }));

    const result = await switchBranch(trimmed, 'deployment');
    return result;
  }, []);

  // Set repository and persist
  const setRepository = useCallback(async (newRepo: string) => {
    const cleaned = cleanRepositoryName(newRepo);
    if (!cleaned) return { success: false, error: 'Invalid repository name' };

    localStorage.setItem('findaba_git_repo', cleaned);
    setState((prev) => ({ ...prev, repo: cleaned }));

    try {
      await fetch('/api/git/branch/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: cleaned, branch: state.workingBranch, type: 'working' }),
      });
    } catch {
      // Local storage already persisted
    }

    return { success: true, repo: cleaned };
  }, [state.workingBranch]);

  // Sync with global events and initialize on mount
  useEffect(() => {
    const handleConfigEvent = (e: CustomEvent<GitConfigState>) => {
      if (e.detail) {
        setState((prev) => ({
          ...prev,
          repo: e.detail.repo || prev.repo,
          branch: e.detail.workingBranch || e.detail.branch || prev.workingBranch,
          workingBranch: e.detail.workingBranch || e.detail.branch || prev.workingBranch,
          deploymentBranch: e.detail.deploymentBranch || prev.deploymentBranch,
          defaultBranch: e.detail.defaultBranch || prev.defaultBranch,
          connected: typeof e.detail.connected === 'boolean' ? e.detail.connected : prev.connected,
          username: e.detail.username || prev.username,
          lastCommitSha: e.detail.lastCommitSha || prev.lastCommitSha,
          lastValidatedAt: e.detail.lastValidatedAt || prev.lastValidatedAt,
        }));
      }
    };

    window.addEventListener('findaba:git_config_updated' as any, handleConfigEvent);

    // Initial silent sync
    initializeRepositoryConfig().then((cfg) => {
      setState((prev) => ({
        ...prev,
        repo: cfg.repo,
        branch: cfg.workingBranch,
        workingBranch: cfg.workingBranch,
        deploymentBranch: cfg.deploymentBranch,
        defaultBranch: cfg.defaultBranch,
        connected: cfg.connected,
        username: cfg.username || prev.username,
        lastCommitSha: cfg.lastCommitSha || prev.lastCommitSha,
        lastValidatedAt: cfg.lastValidatedAt || prev.lastValidatedAt,
      }));
    }).catch(console.warn);

    return () => {
      window.removeEventListener('findaba:git_config_updated' as any, handleConfigEvent);
    };
  }, []);

  return {
    ...state,
    validateConnection,
    setWorkingBranch,
    setDeploymentBranch,
    setRepository,
  };
}
