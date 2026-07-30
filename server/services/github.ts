import axios, { AxiosInstance } from "axios";
import { Request } from "express";
import { env } from "./env";

/**
 * ---------------------------------------------------------
 * GitHub API Client
 * ---------------------------------------------------------
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
 * ---------------------------------------------------------
 * Resolve GitHub Token
 * Priority:
 * 1. Logged-in user's cookie
 * 2. Environment variable
 * ---------------------------------------------------------
 */
export function resolveGithubToken(req: Request): string | null {
  try {
    const cookieToken =
      typeof (req as any).cookies?.github_token === "string"
        ? (req as any).cookies.github_token.trim()
        : "";

    if (cookieToken.length > 0) {
      return cookieToken;
    }

    if (env.GITHUB_TOKEN?.trim()) {
      return env.GITHUB_TOKEN.trim();
    }

    return null;
  } catch {
    return env.GITHUB_TOKEN || null;
  }
}

/**
 * ---------------------------------------------------------
 * Authorization Headers
 * Works for:
 * - Fine-Grained PAT
 * - Classic PAT
 * - GitHub App Tokens
 * ---------------------------------------------------------
 */
export function authHeaders(token: string | null) {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * ---------------------------------------------------------
 * Normalize Repository
 *
 * Converts:
 * https://github.com/user/repo.git
 * github.com/user/repo
 * user/repo/
 *
 * Into:
 * user/repo
 * ---------------------------------------------------------
 */
export function normalizeRepo(repo: string): string {
  return repo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^www\.github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
}

/**
 * ---------------------------------------------------------
 * Repository Validation
 * ---------------------------------------------------------
 */
export function validateRepository(repo: string) {
  const cleaned = normalizeRepo(repo);

  const parts = cleaned.split("/");

  if (parts.length !== 2) {
    throw new Error(
      `Invalid repository "${repo}". Expected format: owner/repository`
    );
  }

  return {
    owner: parts[0],
    name: parts[1],
    repo: cleaned,
  };
}

/**
 * ---------------------------------------------------------
 * Repository Metadata Cache
 * ---------------------------------------------------------
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const repoMetaCache = new Map<string, CacheEntry<any>>();

const CACHE_TTL = 5 * 60 * 1000;

/**
 * ---------------------------------------------------------
 * Fetch Repository Metadata
 * ---------------------------------------------------------
 */
export async function getRepoMeta(
  owner: string,
  name: string,
  token: string | null
) {
  const cacheKey = `${owner}/${name}`;

  const cached = repoMetaCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await githubClient.get(
    `/repos/${owner}/${name}`,
    {
      headers: authHeaders(token),
    }
  );

  repoMetaCache.set(cacheKey, {
    value: response.data,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return response.data;
}

/**
 * ---------------------------------------------------------
 * Remove Cached Repository
 * ---------------------------------------------------------
 */
export function invalidateRepoMetaCache(
  owner: string,
  name: string
) {
  repoMetaCache.delete(`${owner}/${name}`);
}

/**
 * ---------------------------------------------------------
 * Validate GitHub Token
 * Useful for Admin Dashboard
 * ---------------------------------------------------------
 */
export async function validateGithubToken(token: string) {
  const response = await githubClient.get("/user", {
    headers: authHeaders(token),
  });

  return {
    authenticated: true,
    login: response.data.login,
    id: response.data.id,
    avatar: response.data.avatar_url,
    profile: response.data.html_url,
    name: response.data.name,
  };
}

/**
 * ---------------------------------------------------------
 * Verify Repository Access
 * Confirms the token has permission to access the repo.
 * ---------------------------------------------------------
 */
export async function verifyRepositoryAccess(
  repo: string,
  token: string
) {
  const { owner, name } = validateRepository(repo);

  const response = await githubClient.get(
    `/repos/${owner}/${name}`,
    {
      headers: authHeaders(token),
    }
  );

  return {
    repository: response.data.full_name,
    private: response.data.private,
    defaultBranch: response.data.default_branch,
    permissions: response.data.permissions,
  };
}
