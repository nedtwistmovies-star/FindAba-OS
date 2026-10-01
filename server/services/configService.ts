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
  [key: string]: any;
}

export interface SystemConfig {
  id?: string;
  repository: string;
  branch: string;
  githubToken?: string;
  githubUsername?: string;
  githubEmail?: string;
  connected: boolean;
  active: boolean;
  lastSync?: string | null;
  lastCommitSha?: string | null;
  deployment: SystemDeploymentConfig;
  updatedAt?: string;
}

export interface SanitizedConfigResponse {
  success: boolean;
  configured: boolean;
  repository: string;
  branch: string;
  owner: string;
  connected: boolean;
  active: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  lastSync: string | null;
  lastCommitSha: string | null;
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
      hasToken: boolean;
    };
    vercel: {
      isVercel: boolean;
      connected: boolean;
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
  githubToken: env.GITHUB_TOKEN || "",
  connected: Boolean(env.GITHUB_REPO && (env.GITHUB_TOKEN || process.env.GITHUB_TOKEN)),
  active: true,
  deployment: { ...DEFAULT_DEPLOYMENT },
};

let configLoadedFromDb = false;

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
 * Parses deployment settings stored in the database or returns default
 */
function parseDeploymentSettings(raw?: string | null): SystemDeploymentConfig {
  if (!raw) return { ...DEFAULT_DEPLOYMENT };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DEPLOYMENT, ...parsed };
  } catch {
    return { ...DEFAULT_DEPLOYMENT };
  }
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
      const parsedDeploy = parseDeploymentSettings(row.github_email);

      inMemoryConfig = {
        id: row.id,
        repository: row.repository ? normalizeRepo(row.repository) : inMemoryConfig.repository,
        branch: row.branch ? row.branch.trim() : inMemoryConfig.branch,
        githubToken: row.github_token || inMemoryConfig.githubToken,
        githubUsername: row.github_username || extractOwner(row.repository || inMemoryConfig.repository),
        githubEmail: row.github_email || undefined,
        connected: typeof row.connected === "boolean" ? row.connected : true,
        active: typeof row.active === "boolean" ? row.active : true,
        lastSync: row.last_sync || null,
        lastCommitSha: row.last_commit_sha || null,
        deployment: parsedDeploy,
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

      console.log(`[ConfigService] Loaded persistent config from Supabase: repo=${inMemoryConfig.repository}, branch=${inMemoryConfig.branch}`);
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
      inMemoryConfig = {
        ...inMemoryConfig,
        ...cached,
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

      console.log(`[ConfigService] Loaded config from durable cache: repo=${inMemoryConfig.repository}, branch=${inMemoryConfig.branch}`);
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
    inMemoryConfig.githubUsername = extractOwner(inMemoryConfig.repository);
  }

  if (updates.branch !== undefined && updates.branch.trim()) {
    inMemoryConfig.branch = updates.branch.trim();
  }

  const targetToken = updates.githubToken !== undefined ? updates.githubToken : updates.token;
  if (targetToken !== undefined) {
    const trimmed = targetToken.trim();
    if (trimmed) {
      inMemoryConfig.githubToken = trimmed;
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
    const payload = {
      repository: inMemoryConfig.repository,
      branch: inMemoryConfig.branch,
      github_token: inMemoryConfig.githubToken || null,
      github_username: inMemoryConfig.githubUsername || extractOwner(inMemoryConfig.repository),
      github_email: JSON.stringify(inMemoryConfig.deployment),
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
 * Generates sanitized public/admin configuration object without leaking secrets.
 */
export async function getSanitizedConfig(sourceOverride?: "supabase" | "cache" | "default"): Promise<SanitizedConfigResponse> {
  const current = await loadSystemConfig();
  const repo = current.repository || env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";
  const branch = current.branch || env.GITHUB_BRANCH || "main";
  const hasToken = Boolean(current.githubToken || env.GITHUB_TOKEN);

  return {
    success: true,
    configured: Boolean(repo && hasToken),
    repository: repo,
    branch,
    owner: extractOwner(repo),
    connected: current.connected,
    active: current.active,
    hasToken,
    tokenMasked: maskSecret(current.githubToken || env.GITHUB_TOKEN),
    lastSync: current.lastSync || null,
    lastCommitSha: current.lastCommitSha || null,
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
        branch,
        hasToken,
      },
      vercel: {
        isVercel: env.IS_VERCEL,
        connected: true,
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
        await saveSystemConfig({ connected: true }).catch(() => {});
      }
    } else {
      results.github.error = "Invalid repository format";
    }
  } catch (err: any) {
    results.github.error = err.response?.data?.message || err.message;
    await saveSystemConfig({ connected: false }).catch(() => {});
  }

  results.overall = results.supabase.success && results.github.success;
  return results;
}
