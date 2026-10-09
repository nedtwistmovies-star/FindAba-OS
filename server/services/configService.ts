/**
 * server/services/configService.ts
 *
 * Centralized, authoritative persistent configuration service for FindAba-OS.
 * Ensures GitHub connection, target branch, deployment configuration,
 * and external service connections persist across:
 * - Page refreshes
 * - Logout / login
 * - Server restarts & rebuilds
 * - Vercel / serverless cold starts
 * - New deployments
 *
 * Primary Cloud Storage: Supabase `system_git_config` table (service role)
 * Secondary Durable Cache: Local filesystem `server-persistent-config.json`
 */

import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { supabase } from "./supabase";
import { env } from "./env";
import { normalizeRepo } from "./github";

export interface SystemDeploymentConfig {
  environment: "production" | "staging" | "development";
  deployTarget: "vercel" | "cloud" | "custom";
  autoSync: boolean;
  autoDeploy: boolean;
  activeProfile: string;
  provider: string;
  webhookUrl?: string;
  vercelProjectId?: string;
  [key: string]: any;
}

export interface SystemConfig {
  id?: string;
  repository: string;
  branch: string;                     // Active working branch
  workingBranch?: string;              // Explicit user-selected working branch
  deploymentBranch?: string;           // Intended deployment branch (e.g. main, production)
  defaultBranch?: string;              // Remote default branch (e.g. main)
  githubToken?: string;
  githubUsername?: string;
  githubEmail?: string;
  githubInstallationId?: string;
  connected: boolean;
  active: boolean;
  lastSync?: string | null;
  lastCommitSha?: string | null;       // Last confirmed remote commit SHA
  lastSyncedSha?: string | null;       // Last successfully synchronized commit SHA
  lastValidatedAt?: string | null;     // ISO timestamp of last successful remote authorization check
  validationError?: string | null;     // Error message if authorization failed
  vercelProjectId?: string | null;
  deployment: SystemDeploymentConfig;
  updatedAt?: string;
}

export interface SanitizedConfigResponse {
  success: boolean;
  configured: boolean;
  repository: string;
  branch: string;                      // User-selected working branch
  workingBranch: string;               // User-selected working branch
  deploymentBranch: string;            // Intended deployment branch
  defaultBranch: string;               // Repository default branch
  owner: string;
  repoName: string;
  connected: boolean;
  active: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  githubUsername: string | null;
  githubEmail: string | null;
  githubInstallationId: string | null;
  lastSync: string | null;
  lastCommitSha: string | null;
  lastSyncedSha: string | null;
  lastValidatedAt: string | null;
  validationError: string | null;
  vercelProjectId: string | null;
  deployment: SystemDeploymentConfig;
  externalServices: {
    supabase: {
      connected: boolean;
      url: string;
      hasServiceKey: boolean;
      hasAnonKey: boolean;
    };
    github: {
      connected: boolean;
      repository: string;
      branch: string;
      workingBranch: string;
      deploymentBranch: string;
      defaultBranch: string;
      username: string | null;
      hasToken: boolean;
      lastValidatedAt: string | null;
    };
    vercel: {
      isVercel: boolean;
      connected: boolean;
      projectId: string | null;
      deployTarget: string;
    };
    paystack: {
      configured: boolean;
    };
    ai: {
      configured: boolean;
      provider: string;
    };
  };
  updatedAt?: string;
  source: "supabase" | "cache" | "default";
}

const DURABLE_CACHE_PATH = path.join(process.cwd(), "server-persistent-config.json");

// Default initial configuration
const DEFAULT_DEPLOYMENT: SystemDeploymentConfig = {
  environment: "production",
  deployTarget: "vercel",
  autoSync: true,
  autoDeploy: true,
  activeProfile: "production-main",
  provider: "vercel",
};

let inMemoryConfig: SystemConfig = {
  repository: env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS",
  branch: env.GITHUB_BRANCH || "main",
  workingBranch: env.GITHUB_BRANCH || "main",
  deploymentBranch: "main",
  defaultBranch: "main",
  githubToken: env.GITHUB_TOKEN || "",
  connected: Boolean(env.GITHUB_REPO && (env.GITHUB_TOKEN || process.env.GITHUB_TOKEN)),
  active: true,
  lastSync: null,
  lastCommitSha: null,
  lastSyncedSha: null,
  lastValidatedAt: null,
  validationError: null,
  vercelProjectId: null,
  deployment: { ...DEFAULT_DEPLOYMENT },
};

let configLoadedFromDb = false;

/** Export accessor for in-memory config */
export function getInMemoryConfig(): SystemConfig {
  return inMemoryConfig;
}

/**
 * Mask a secret token for safe display (e.g., "ghp_abc...1234").
 */
function maskSecret(token?: string): string | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Extracts owner from owner/repo
 */
function extractOwner(repo: string): string {
  if (!repo) return "";
  const parts = repo.split("/");
  return parts.length >= 2 ? parts[0] : "";
}

/**
 * Extracts repository name from owner/repo
 */
function extractRepoName(repo: string): string {
  if (!repo) return "";
  const parts = repo.split("/");
  return parts.length >= 2 ? parts[1] : repo;
}

interface ParsedMetadataContainer {
  email?: string;
  deployment: SystemDeploymentConfig;
  workingBranch?: string;
  deploymentBranch?: string;
  defaultBranch?: string;
  lastSyncedSha?: string;
  lastValidatedAt?: string;
  vercelProjectId?: string;
}

/**
 * Safely parses the stored github_email column which acts as a durable JSON container.
 */
function parseMetadataAndDeployment(raw?: string | null): ParsedMetadataContainer {
  const result: ParsedMetadataContainer = {
    deployment: { ...DEFAULT_DEPLOYMENT },
  };

  if (!raw || typeof raw !== "string") return result;
  const trimmed = raw.trim();

  // If raw is a plain email string (not JSON)
  if (!trimmed.startsWith("{") && trimmed.includes("@")) {
    result.email = trimmed;
    return result;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      // If parsed has a nested deployment object, or itself is the deployment config
      if (parsed.deployment && typeof parsed.deployment === "object") {
        result.deployment = { ...DEFAULT_DEPLOYMENT, ...parsed.deployment };
      } else if (parsed.environment || parsed.deployTarget) {
        result.deployment = { ...DEFAULT_DEPLOYMENT, ...parsed };
      }

      if (parsed.email && typeof parsed.email === "string") result.email = parsed.email;
      if (parsed.workingBranch && typeof parsed.workingBranch === "string") result.workingBranch = parsed.workingBranch.trim();
      if (parsed.deploymentBranch && typeof parsed.deploymentBranch === "string") result.deploymentBranch = parsed.deploymentBranch.trim();
      if (parsed.defaultBranch && typeof parsed.defaultBranch === "string") result.defaultBranch = parsed.defaultBranch.trim();
      if (parsed.lastSyncedSha && typeof parsed.lastSyncedSha === "string") result.lastSyncedSha = parsed.lastSyncedSha.trim();
      if (parsed.lastValidatedAt && typeof parsed.lastValidatedAt === "string") result.lastValidatedAt = parsed.lastValidatedAt.trim();
      if (parsed.vercelProjectId && typeof parsed.vercelProjectId === "string") result.vercelProjectId = parsed.vercelProjectId.trim();
    }
  } catch {
    // If not valid JSON, treat as raw email if applicable
    if (trimmed.includes("@")) result.email = trimmed;
  }

  return result;
}

/**
 * Loads system configuration from Supabase with durable fallback.
 */
export async function loadSystemConfig(forceRefresh = false): Promise<SystemConfig> {
  if (configLoadedFromDb && !forceRefresh) {
    return inMemoryConfig;
  }

  // 1. Try reading from Supabase system_git_config table
  try {
    const { data, error } = await supabase
      .from("system_git_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      const parsedMeta = parseMetadataAndDeployment(row.github_email);

      const resolvedWorkingBranch = row.branch?.trim() || parsedMeta.workingBranch || inMemoryConfig.workingBranch || inMemoryConfig.branch || "main";
      const resolvedDeployBranch = parsedMeta.deploymentBranch || inMemoryConfig.deploymentBranch || "main";
      const resolvedDefaultBranch = parsedMeta.defaultBranch || inMemoryConfig.defaultBranch || "main";

      inMemoryConfig = {
        id: row.id,
        repository: row.repository ? normalizeRepo(row.repository) : inMemoryConfig.repository,
        branch: resolvedWorkingBranch,
        workingBranch: resolvedWorkingBranch,
        deploymentBranch: resolvedDeployBranch,
        defaultBranch: resolvedDefaultBranch,
        githubToken: row.github_token || inMemoryConfig.githubToken,
        githubUsername: row.github_username || extractOwner(row.repository || inMemoryConfig.repository),
        githubEmail: parsedMeta.email || (row.github_email && !row.github_email.startsWith("{") ? row.github_email : undefined),
        connected: typeof row.connected === "boolean" ? row.connected : true,
        active: typeof row.active === "boolean" ? row.active : true,
        lastSync: row.last_sync || null,
        lastCommitSha: row.last_commit_sha || null,
        lastSyncedSha: parsedMeta.lastSyncedSha || null,
        lastValidatedAt: parsedMeta.lastValidatedAt || null,
        vercelProjectId: parsedMeta.vercelProjectId || null,
        deployment: parsedMeta.deployment,
        updatedAt: row.updated_at || new Date().toISOString(),
      };

      // Propagate to server environment variables
      if (inMemoryConfig.repository) {
        process.env.GITHUB_REPO = inMemoryConfig.repository;
        env.GITHUB_REPO = inMemoryConfig.repository;
      }
      if (inMemoryConfig.branch) {
        process.env.GITHUB_BRANCH = inMemoryConfig.branch;
        env.GITHUB_BRANCH = inMemoryConfig.branch;
      }
      if (inMemoryConfig.githubToken) {
        process.env.GITHUB_TOKEN = inMemoryConfig.githubToken;
        env.GITHUB_TOKEN = inMemoryConfig.githubToken;
      }

      configLoadedFromDb = true;

      // Update durable local cache asynchronously
      await writeDurableCache(inMemoryConfig).catch(() => {});

      console.log(`[ConfigService] Loaded persistent config from Supabase: repo=${inMemoryConfig.repository}, workingBranch=${inMemoryConfig.workingBranch}, deployBranch=${inMemoryConfig.deploymentBranch}`);
      return inMemoryConfig;
    }
  } catch (dbErr) {
    console.warn("[ConfigService] Supabase read error (falling back to cache):", dbErr);
  }

  // 2. Fallback to durable filesystem cache
  try {
    const cachedRaw = await fs.readFile(DURABLE_CACHE_PATH, "utf-8");
    const cached = JSON.parse(cachedRaw);
    if (cached && (cached.repository || cached.branch)) {
      const workingBranch = cached.workingBranch || cached.branch || inMemoryConfig.workingBranch || "main";
      inMemoryConfig = {
        ...inMemoryConfig,
        ...cached,
        branch: workingBranch,
        workingBranch,
        deploymentBranch: cached.deploymentBranch || inMemoryConfig.deploymentBranch || "main",
        defaultBranch: cached.defaultBranch || inMemoryConfig.defaultBranch || "main",
        deployment: { ...DEFAULT_DEPLOYMENT, ...(cached.deployment || {}) },
      };

      if (inMemoryConfig.repository) {
        process.env.GITHUB_REPO = inMemoryConfig.repository;
        env.GITHUB_REPO = inMemoryConfig.repository;
      }
      if (inMemoryConfig.branch) {
        process.env.GITHUB_BRANCH = inMemoryConfig.branch;
        env.GITHUB_BRANCH = inMemoryConfig.branch;
      }
      if (inMemoryConfig.githubToken) {
        process.env.GITHUB_TOKEN = inMemoryConfig.githubToken;
        env.GITHUB_TOKEN = inMemoryConfig.githubToken;
      }

      console.log(`[ConfigService] Loaded config from durable cache: repo=${inMemoryConfig.repository}, workingBranch=${inMemoryConfig.workingBranch}`);
      return inMemoryConfig;
    }
  } catch {
    // No durable cache found yet
  }

  return inMemoryConfig;
}

/**
 * Saves system configuration persistently to Supabase, durable cache, and environment.
 */
export async function saveSystemConfig(
  updates: Partial<SystemConfig> & {
    repo?: string;
    token?: string;
  }
): Promise<SanitizedConfigResponse> {
  // Ensure we have current state
  await loadSystemConfig();

  // Clean inputs
  const targetRepo = updates.repository || updates.repo;
  if (targetRepo !== undefined) {
    inMemoryConfig.repository = normalizeRepo(targetRepo);
    inMemoryConfig.githubUsername = updates.githubUsername || inMemoryConfig.githubUsername || extractOwner(inMemoryConfig.repository);
  }

  // Handle working branch: user-selected working branch is authoritative
  const targetWorkingBranch = updates.workingBranch || updates.branch;
  if (targetWorkingBranch !== undefined && targetWorkingBranch.trim()) {
    inMemoryConfig.branch = targetWorkingBranch.trim();
    inMemoryConfig.workingBranch = targetWorkingBranch.trim();
  }

  // Handle deployment branch
  if (updates.deploymentBranch !== undefined && updates.deploymentBranch.trim()) {
    inMemoryConfig.deploymentBranch = updates.deploymentBranch.trim();
  }

  // Handle default branch
  if (updates.defaultBranch !== undefined && updates.defaultBranch.trim()) {
    inMemoryConfig.defaultBranch = updates.defaultBranch.trim();
  }

  if (updates.githubUsername !== undefined) {
    inMemoryConfig.githubUsername = updates.githubUsername;
  }

  if (updates.githubEmail !== undefined) {
    inMemoryConfig.githubEmail = updates.githubEmail;
  }

  if (updates.githubInstallationId !== undefined) {
    inMemoryConfig.githubInstallationId = updates.githubInstallationId;
  }

  const targetToken = updates.githubToken !== undefined ? updates.githubToken : updates.token;
  if (targetToken !== undefined) {
    const trimmed = targetToken.trim();
    if (trimmed) {
      inMemoryConfig.githubToken = trimmed;
    } else {
      inMemoryConfig.githubToken = undefined;
    }
  }

  if (typeof updates.connected === "boolean") {
    inMemoryConfig.connected = updates.connected;
  }

  if (typeof updates.active === "boolean") {
    inMemoryConfig.active = updates.active;
  }

  if (updates.lastSync !== undefined) {
    inMemoryConfig.lastSync = updates.lastSync;
  }

  if (updates.lastCommitSha !== undefined) {
    inMemoryConfig.lastCommitSha = updates.lastCommitSha;
  }

  if (updates.lastSyncedSha !== undefined) {
    inMemoryConfig.lastSyncedSha = updates.lastSyncedSha;
  }

  if (updates.lastValidatedAt !== undefined) {
    inMemoryConfig.lastValidatedAt = updates.lastValidatedAt;
  }

  if (updates.validationError !== undefined) {
    inMemoryConfig.validationError = updates.validationError;
  }

  if (updates.vercelProjectId !== undefined) {
    inMemoryConfig.vercelProjectId = updates.vercelProjectId;
  }

  if (updates.deployment) {
    inMemoryConfig.deployment = {
      ...inMemoryConfig.deployment,
      ...updates.deployment,
    };
  }

  inMemoryConfig.updatedAt = new Date().toISOString();

  // 1. Update runtime environment immediately
  if (inMemoryConfig.repository) {
    process.env.GITHUB_REPO = inMemoryConfig.repository;
    env.GITHUB_REPO = inMemoryConfig.repository;
  }
  if (inMemoryConfig.branch) {
    process.env.GITHUB_BRANCH = inMemoryConfig.branch;
    env.GITHUB_BRANCH = inMemoryConfig.branch;
  }
  if (inMemoryConfig.githubToken) {
    process.env.GITHUB_TOKEN = inMemoryConfig.githubToken;
    env.GITHUB_TOKEN = inMemoryConfig.githubToken;
  }

  // 2. Persist to Supabase `system_git_config`
  let savedToDb = false;
  try {
    const serializedMetaContainer = JSON.stringify({
      email: inMemoryConfig.githubEmail || undefined,
      deployment: inMemoryConfig.deployment,
      workingBranch: inMemoryConfig.workingBranch || inMemoryConfig.branch,
      deploymentBranch: inMemoryConfig.deploymentBranch || "main",
      defaultBranch: inMemoryConfig.defaultBranch || "main",
      lastSyncedSha: inMemoryConfig.lastSyncedSha || null,
      lastValidatedAt: inMemoryConfig.lastValidatedAt || null,
      vercelProjectId: inMemoryConfig.vercelProjectId || null,
    });

    const payload = {
      repository: inMemoryConfig.repository,
      branch: inMemoryConfig.workingBranch || inMemoryConfig.branch,
      github_token: inMemoryConfig.githubToken || null,
      github_username: inMemoryConfig.githubUsername || extractOwner(inMemoryConfig.repository),
      github_email: serializedMetaContainer,
      connected: inMemoryConfig.connected,
      active: inMemoryConfig.active,
      last_sync: inMemoryConfig.lastSync,
      last_commit_sha: inMemoryConfig.lastCommitSha,
      updated_at: inMemoryConfig.updatedAt,
    };

    if (inMemoryConfig.id) {
      const { data, error } = await supabase
        .from("system_git_config")
        .update(payload)
        .eq("id", inMemoryConfig.id)
        .select();

      if (!error && data && data.length > 0) {
        savedToDb = true;
      }
    }

    if (!savedToDb) {
      // Check existing row first
      const { data: existing } = await supabase
        .from("system_git_config")
        .select("id")
        .limit(1);

      if (existing && existing.length > 0) {
        inMemoryConfig.id = existing[0].id;
        const { error } = await supabase
          .from("system_git_config")
          .update(payload)
          .eq("id", existing[0].id);

        if (!error) savedToDb = true;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("system_git_config")
          .insert([payload])
          .select();

        if (!insertErr && inserted && inserted.length > 0) {
          inMemoryConfig.id = inserted[0].id;
          savedToDb = true;
        }
      }
    }
  } catch (dbErr) {
    console.warn("[ConfigService] Failed to persist to Supabase:", dbErr);
  }

  // 3. Persist to durable filesystem cache and .env
  await writeDurableCache(inMemoryConfig).catch(() => {});
  await updateDotEnvFile(inMemoryConfig).catch(() => {});

  return getSanitizedConfig(savedToDb ? "supabase" : "cache");
}

/**
 * Writes config to local JSON file
 */
async function writeDurableCache(config: SystemConfig): Promise<void> {
  try {
    await fs.writeFile(DURABLE_CACHE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ConfigService] Could not write durable cache file:", err);
  }
}

/**
 * Updates .env file on disk if writable
 */
async function updateDotEnvFile(config: SystemConfig): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = "";
    try {
      content = await fs.readFile(envPath, "utf-8");
    } catch {
      content = "";
    }

    if (config.repository) {
      if (content.includes("GITHUB_REPO=")) {
        content = content.replace(/GITHUB_REPO=.*/g, `GITHUB_REPO=${config.repository}`);
      } else {
        content += `\nGITHUB_REPO=${config.repository}`;
      }
    }

    if (config.branch) {
      if (content.includes("GITHUB_BRANCH=")) {
        content = content.replace(/GITHUB_BRANCH=.*/g, `GITHUB_BRANCH=${config.branch}`);
      } else {
        content += `\nGITHUB_BRANCH=${config.branch}`;
      }
    }

    if (config.githubToken) {
      if (content.includes("GITHUB_TOKEN=")) {
        content = content.replace(/GITHUB_TOKEN=.*/g, `GITHUB_TOKEN=${config.githubToken}`);
      } else {
        content += `\nGITHUB_TOKEN=${config.githubToken}`;
      }
    }

    await fs.writeFile(envPath, content.trim() + "\n", "utf-8");
  } catch (err) {
    console.warn("[ConfigService] Could not update .env file:", err);
  }
}

/**
 * Validates the current GitHub connection against remote configuration.
 * Verifies authorization, repository access, and selected branches.
 * Does NOT overwrite user-selected working branch with default branch.
 */
export async function validateGitConnection(forceRemoteCheck = false): Promise<{
  valid: boolean;
  connected: boolean;
  username: string | null;
  repo: string;
  workingBranch: string;
  deploymentBranch: string;
  defaultBranch: string;
  lastCommitSha: string | null;
  branchExists: boolean;
  error?: string;
  reauthorizeRequired?: boolean;
}> {
  const current = await loadSystemConfig();
  const token = current.githubToken || env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const repo = current.repository || env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";
  const workingBranch = current.workingBranch || current.branch || "main";
  const deploymentBranch = current.deploymentBranch || "main";

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return {
      valid: false,
      connected: false,
      username: current.githubUsername || null,
      repo,
      workingBranch,
      deploymentBranch,
      defaultBranch: current.defaultBranch || "main",
      lastCommitSha: current.lastCommitSha || null,
      branchExists: false,
      error: "Invalid repository format. Must be 'owner/repo'.",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FindAba-City-OS",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    // 1. Check authenticated user profile if token is present
    let remoteUsername = current.githubUsername || null;
    let remoteEmail = current.githubEmail || null;
    if (token) {
      try {
        const userRes = await axios.get("https://api.github.com/user", { headers, timeout: 8000 });
        if (userRes.data?.login) {
          remoteUsername = userRes.data.login;
          if (userRes.data.email) remoteEmail = userRes.data.email;
        }
      } catch (userErr: any) {
        if (userErr.response?.status === 401 || userErr.response?.status === 403) {
          const authError = "GitHub token expired or revoked. Re-authorization required.";
          await saveSystemConfig({
            connected: false,
            validationError: authError,
          }).catch(() => {});
          return {
            valid: false,
            connected: false,
            username: remoteUsername,
            repo,
            workingBranch,
            deploymentBranch,
            defaultBranch: current.defaultBranch || "main",
            lastCommitSha: current.lastCommitSha || null,
            branchExists: false,
            error: authError,
            reauthorizeRequired: true,
          };
        }
      }
    }

    // 2. Check repository metadata
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, { headers, timeout: 8000 });
    const remoteDefaultBranch = repoRes.data.default_branch || "main";

    // 3. Check user-selected working branch
    let branchExists = true;
    let latestSha = current.lastCommitSha || null;
    try {
      const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${name}/branches/${encodeURIComponent(workingBranch)}`, {
        headers,
        timeout: 8000,
      });
      if (branchRes.data?.commit?.sha) {
        latestSha = branchRes.data.commit.sha;
      }
    } catch (branchErr: any) {
      if (branchErr.response?.status === 404) {
        branchExists = false;
      }
    }

    const nowIso = new Date().toISOString();
    const branchError = branchExists
      ? undefined
      : `Working branch '${workingBranch}' was not found or was renamed/deleted on remote repository. Please select an active branch.`;

    // Persist verified state
    await saveSystemConfig({
      githubUsername: remoteUsername || undefined,
      githubEmail: remoteEmail || undefined,
      defaultBranch: remoteDefaultBranch,
      lastCommitSha: latestSha || undefined,
      lastValidatedAt: nowIso,
      connected: true,
      validationError: branchError || null,
    }).catch(() => {});

    return {
      valid: true,
      connected: true,
      username: remoteUsername,
      repo,
      workingBranch,
      deploymentBranch,
      defaultBranch: remoteDefaultBranch,
      lastCommitSha: latestSha,
      branchExists,
      error: branchError,
      reauthorizeRequired: false,
    };
  } catch (err: any) {
    const status = err.response?.status;
    const isAuthErr = status === 401 || status === 403;
    const errMsg = isAuthErr
      ? "GitHub authorization failed or token is invalid. Please reconnect."
      : (err.response?.data?.message || err.message || "Unable to reach GitHub repository.");

    await saveSystemConfig({
      connected: !isAuthErr,
      validationError: errMsg,
    }).catch(() => {});

    return {
      valid: false,
      connected: !isAuthErr,
      username: current.githubUsername || null,
      repo,
      workingBranch,
      deploymentBranch,
      defaultBranch: current.defaultBranch || "main",
      lastCommitSha: current.lastCommitSha || null,
      branchExists: false,
      error: errMsg,
      reauthorizeRequired: isAuthErr,
    };
  }
}

/**
 * Generates sanitized public/admin configuration object without leaking secrets.
 */
export async function getSanitizedConfig(sourceOverride?: "supabase" | "cache" | "default"): Promise<SanitizedConfigResponse> {
  const current = await loadSystemConfig();
  const repo = current.repository || env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";
  const workingBranch = current.workingBranch || current.branch || env.GITHUB_BRANCH || "main";
  const deploymentBranch = current.deploymentBranch || "main";
  const defaultBranch = current.defaultBranch || "main";
  const hasToken = Boolean(current.githubToken || env.GITHUB_TOKEN);

  return {
    success: true,
    configured: Boolean(repo && hasToken),
    repository: repo,
    branch: workingBranch,
    workingBranch,
    deploymentBranch,
    defaultBranch,
    owner: extractOwner(repo),
    repoName: extractRepoName(repo),
    connected: current.connected,
    active: current.active,
    hasToken,
    tokenMasked: maskSecret(current.githubToken || env.GITHUB_TOKEN),
    githubUsername: current.githubUsername || extractOwner(repo) || null,
    githubEmail: current.githubEmail || null,
    githubInstallationId: current.githubInstallationId || null,
    lastSync: current.lastSync || null,
    lastCommitSha: current.lastCommitSha || null,
    lastSyncedSha: current.lastSyncedSha || null,
    lastValidatedAt: current.lastValidatedAt || null,
    validationError: current.validationError || null,
    vercelProjectId: current.vercelProjectId || current.deployment?.vercelProjectId || null,
    deployment: current.deployment || { ...DEFAULT_DEPLOYMENT },
    externalServices: {
      supabase: {
        connected: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        url: env.SUPABASE_URL || "",
        hasServiceKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(env.SUPABASE_ANON_KEY),
      },
      github: {
        connected: current.connected,
        repository: repo,
        branch: workingBranch,
        workingBranch,
        deploymentBranch,
        defaultBranch,
        username: current.githubUsername || null,
        hasToken,
        lastValidatedAt: current.lastValidatedAt || null,
      },
      vercel: {
        isVercel: env.IS_VERCEL,
        connected: true,
        projectId: current.vercelProjectId || null,
        deployTarget: current.deployment?.deployTarget || "vercel",
      },
      paystack: {
        configured: Boolean(env.PAYSTACK_PUBLIC_KEY),
      },
      ai: {
        configured: Boolean(env.GEMINI_API_KEY || env.OPENROUTER_API_KEY),
        provider: env.DEFAULT_AI_PROVIDER || "openrouter",
      },
    },
    updatedAt: current.updatedAt,
    source: sourceOverride || (configLoadedFromDb ? "supabase" : "cache"),
  };
}

/**
 * Public accessor for safe git connection and branch configuration (no secrets exposed).
 */
export async function getPublicGitConfig(): Promise<SanitizedConfigResponse> {
  return getSanitizedConfig();
}

/**
 * Tests live connection for external services.
 */
export async function testSystemConnections(): Promise<{
  github: { success: boolean; latency?: string; error?: string };
  supabase: { success: boolean; latency?: string; error?: string };
  overall: boolean;
}> {
  const config = await loadSystemConfig();
  const results = {
    github: { success: false, latency: "0ms", error: undefined as string | undefined },
    supabase: { success: false, latency: "0ms", error: undefined as string | undefined },
    overall: false,
  };

  // 1. Test Supabase
  try {
    const start = Date.now();
    const { count, error } = await supabase.from("businesses").select("*", { count: "exact", head: true });
    results.supabase.latency = `${Date.now() - start}ms`;
    if (!error || typeof count === "number") {
      results.supabase.success = true;
    } else {
      results.supabase.error = error.message;
    }
  } catch (err: any) {
    results.supabase.error = err.message;
  }

  // 2. Test GitHub
  try {
    const token = config.githubToken || env.GITHUB_TOKEN;
    const repo = config.repository || env.GITHUB_REPO;
    const start = Date.now();

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "FindAba-City-OS",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const [owner, name] = repo.split("/");
    if (owner && name) {
      const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
        headers,
        timeout: 7000,
      });
      results.github.latency = `${Date.now() - start}ms`;
      if (ghRes.status === 200) {
        results.github.success = true;
        // Update connected state persistently
        await saveSystemConfig({ connected: true, validationError: null }).catch(() => {});
      }
    } else {
      results.github.error = "Invalid repository format";
    }
  } catch (err: any) {
    results.github.error = err.response?.data?.message || err.message;
    await saveSystemConfig({ connected: false, validationError: results.github.error }).catch(() => {});
  }

  results.overall = results.supabase.success && results.github.success;
  return results;
}
