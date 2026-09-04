import axios, { AxiosInstance } from "axios";
import { Request } from "express";
import { env } from "./env.js";

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
  const headerToken = req.headers["x-github-token"] as string;
  const cookieToken = (req as any).cookies?.github_token;
  const bodyToken = req.body?.githubToken;
  const queryToken = req.query?.githubToken as string;
  const token = (headerToken || cookieToken || bodyToken || queryToken || env.GITHUB_TOKEN || "")?.trim();
  return token || null;
}

export function authHeaders(token: string | null) {
  if (!token) return {};
  // GitHub REST API accepts Bearer for all modern and classic PATs & OAuth tokens
  const prefix = token.startsWith("ghp_") || token.startsWith("github_pat_") ? "Bearer" : "Bearer";
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
