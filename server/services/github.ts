import axios, { AxiosInstance } from "axios";
import { Request } from "express";
import { env } from "./env";

/** Shared axios instance for GitHub API calls. */
export const githubClient: AxiosInstance = axios.create({
  baseURL: "https://api.github.com",
  timeout: 60000,
  headers: {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FindAba-City-OS",
  },
});

export function resolveGithubToken(req: Request): string | null {
  const cookieToken = (req as any).cookies?.github_token;
  const token = cookieToken?.trim() || env.GITHUB_TOKEN || null;
  return token;
}

export function authHeaders(token: string | null) {
  if (!token) return {};
  const prefix = token.startsWith("ghp_") ? "token" : "Bearer";
  return { Authorization: `${prefix} ${token}` };
}

export function normalizeRepo(repo: string): string {
  return repo
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
}

/** In-memory cache for GitHub repository metadata. */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const repoMetaCache = new Map<string, CacheEntry<any>>();
const REPO_META_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getRepoMeta(owner: string, name: string, token: string | null) {
  const cacheKey = `${owner}/${name}`;
  const cached = repoMetaCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await githubClient.get(`/repos/${owner}/${name}`, {
    headers: authHeaders(token),
  });
  repoMetaCache.set(cacheKey, { value: response.data, expiresAt: Date.now() + REPO_META_TTL_MS });
  return response.data;
}

export function invalidateRepoMetaCache(owner: string, name: string) {
  repoMetaCache.delete(`${owner}/${name}`);
}
