import axios, { AxiosInstance } from "axios";
import { Request } from "express";
import { env } from "./env";

/**
 * ============================================================
 * FindAba OS GitHub Service
 * Central GitHub client & authentication utilities
 * ============================================================
 */

export const githubClient: AxiosInstance = axios.create({
  baseURL: "https://api.github.com",
  timeout: 60000,
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "FindAba-City-OS",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

/**
 * ------------------------------------------------------------
 * Resolve GitHub Token
 *
 * Priority:
 * 1. Valid github_token cookie
 * 2. GITHUB_TOKEN environment variable
 * ------------------------------------------------------------
 */
export function resolveGithubToken(req: Request): string | null {
  try {
    const cookieToken =
      typeof req.cookies?.github_token === "string"
        ? req.cookies.github_token.trim()
        : "";

    if (
      cookieToken &&
      (
        cookieToken.startsWith("github_pat_") ||
        cookieToken.startsWith("ghp_") ||
        cookieToken.startsWith("gho_")
      )
    ) {
      return cookieToken;
    }

    if (env.GITHUB_TOKEN?.trim()) {
      return env.GITHUB_TOKEN.trim();
    }

    return null;
  } catch {
    return env.GITHUB_TOKEN?.trim() || null;
  }
}

/**
 * ------------------------------------------------------------
 * Authorization Headers
 * ------------------------------------------------------------
 */
export function authHeaders(token: string | null): Record<string, string> {
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * ------------------------------------------------------------
 * Normalize Repository
 * ------------------------------------------------------------
 */
export function normalizeRepo(repo: string): string {
  return repo
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
}

/**
 * ------------------------------------------------------------
 * Validate Repository
 * ------------------------------------------------------------
 */
export function validateRepository(repo: string) {
  const cleaned = normalizeRepo(repo);

  const [owner, name] = cleaned.split("/");

  if (!owner || !name) {
    throw new Error(
      `Invalid repository "${repo}". Expected owner/repository`
    );
  }

  return {
    owner,
    name,
    repo: cleaned,
  };
}

/**
 * ------------------------------------------------------------
 * Repository Metadata Cache
 * ------------------------------------------------------------
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const repoCache = new Map<string, CacheEntry<any>>();

const CACHE_TIME = 5 * 60 * 1000;

/**
 * ------------------------------------------------------------
 * Repository Metadata
 * ------------------------------------------------------------
 */
export async function getRepoMeta(
  owner: string,
  name: string,
  token: string | null
) {
  const key = `${owner}/${name}`;

  const cached = repoCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const { data } = await githubClient.get(
    `/repos/${owner}/${name}`,
    {
      headers: authHeaders(token),
    }
  );

  repoCache.set(key, {
    value: data,
    expiresAt: Date.now() + CACHE_TIME,
  });

  return data;
}

/**
 * ------------------------------------------------------------
 * Clear Metadata Cache
 * ------------------------------------------------------------
 */
export function invalidateRepoMetaCache(
  owner: string,
  name: string
) {
  repoCache.delete(`${owner}/${name}`);
}

/**
 * ------------------------------------------------------------
 * Validate GitHub Token
 * ------------------------------------------------------------
 */
export async function validateGithubToken(token: string) {
  try {
    const { data } = await githubClient.get("/user", {
      headers: authHeaders(token),
    });

    return {
      valid: true,
      login: data.login,
      id: data.id,
      avatar: data.avatar_url,
      profile: data.html_url,
      name: data.name,
    };
  } catch (error: any) {
    return {
      valid: false,
      status: error.response?.status ?? 500,
      message:
        error.response?.data?.message ||
        "Unable to validate GitHub token.",
    };
  }
}

/**
 * ------------------------------------------------------------
 * Verify Repository Access
 * ------------------------------------------------------------
 */
export async function verifyRepositoryAccess(
  repo: string,
  token: string
) {
  const { owner, name } = validateRepository(repo);

  try {
    const { data } = await githubClient.get(
      `/repos/${owner}/${name}`,
      {
        headers: authHeaders(token),
      }
    );

    return {
      accessible: true,
      repository: data.full_name,
      private: data.private,
      defaultBranch: data.default_branch,
      permissions: data.permissions,
    };
  } catch (error: any) {
    return {
      accessible: false,
      status: error.response?.status ?? 500,
      message:
        error.response?.data?.message ||
        "Repository not accessible.",
    };
  }
}

/**
 * ------------------------------------------------------------
 * Full Connection Diagnostic
 * ------------------------------------------------------------
 */
export async function diagnoseGithubConnection(
  repo: string,
  token: string
) {
  const tokenInfo = await validateGithubToken(token);

  if (!tokenInfo.valid) {
    return {
      success: false,
      stage: "authentication",
      details: tokenInfo,
    };
  }

  const repoInfo = await verifyRepositoryAccess(repo, token);

  if (!repoInfo.accessible) {
    return {
      success: false,
      stage: "repository",
      details: repoInfo,
    };
  }

  return {
    success: true,
    user: tokenInfo,
    repository: repoInfo,
  };
}
