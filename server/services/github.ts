import axios, { AxiosInstance } from "axios";
import { env } from "./env";

/** Shared axios instance for GitHub API calls. */
export const githubClient: AxiosInstance = axios.create({
  baseURL: "https://api.github.com",
  timeout: 60000,
  headers: {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FindAba-City-OS",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

export interface GenericRequest {
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
}

/**
 * Resolves the GitHub token strictly from server environment or secure headers/body.
 * Query string tokens are explicitly rejected for security.
 */
export function resolveGithubToken(req?: GenericRequest): string | null {
  const headerToken = req?.headers?.["x-github-token"];
  const resolvedHeaderToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const bodyToken = req?.body?.githubToken || req?.body?.token;
  const envToken = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const token = (resolvedHeaderToken || bodyToken || envToken || "")?.trim();
  return token || null;
}

export function authHeaders(token: string | null) {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function normalizeRepo(repo?: string): string {
  if (!repo || !repo.trim()) {
    return env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";
  }
  return repo
    .trim()
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

/** Standardized safe GitHub error formatter */
export function formatGithubError(error: any, repo: string, token: string | null): { status: number; details: string; message: string } {
  const status = error.response?.status || 500;
  let rawMsg = "Unknown error";

  if (error.response?.data) {
    if (typeof error.response.data === "string") {
      rawMsg = error.response.data;
    } else if (typeof error.response.data === "object" && error.response.data !== null) {
      rawMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
    }
  } else if (error.message) {
    rawMsg = typeof error.message === "string" ? error.message : String(error.message);
  }

  if (typeof rawMsg === "string" && (rawMsg.includes("Unexpected end of JSON input") || rawMsg.includes("JSON") || rawMsg.includes("Unexpected token"))) {
    rawMsg = `GitHub API payload could not be parsed. Ensure repository '${repo || "configured"}' exists and contains a valid registry.json.`;
  }

  if (status === 404) {
    return {
      status: 404,
      details: `Repository '${repo}' or registry file not found. If it's a private repository, ensure your token is valid and has 'repo' scope.`,
      message: `Repository '${repo}' not found on GitHub.`,
    };
  }

  if (status === 403 || status === 401 || (typeof rawMsg === "string" && rawMsg.includes("Resource not accessible"))) {
    const isRateLimit = error.response?.headers?.["x-ratelimit-remaining"] === "0";
    if (isRateLimit) {
      return {
        status: 429,
        details: "GitHub API rate limit exceeded. Please provide a valid GITHUB_TOKEN.",
        message: "GitHub rate limit reached.",
      };
    }
    if ((typeof rawMsg === "string" && rawMsg.includes("Resource not accessible")) || status === 403) {
      return {
        status: 403,
        details: `GitHub token lacks required permissions for repository '${repo}'. Ensure 'repo' scope (classic PAT) or 'Contents: Read & Write' (fine-grained PAT).`,
        message: "Insufficient permissions for repository.",
      };
    }
    return {
      status: 401,
      details: token ? "Invalid or expired GitHub Token. Please verify the server token." : "Authentication required for private repository.",
      message: "GitHub authentication required or invalid token.",
    };
  }

  return { status, details: String(rawMsg), message: String(rawMsg) };
}

/**
 * Retrieves the latest commit and tree SHA for a branch in GitHub.
 */
export async function getBranchCommitAndTree(owner: string, name: string, branch: string, token: string | null) {
  const headers = authHeaders(token);
  try {
    const branchRes = await githubClient.get(`/repos/${owner}/${name}/branches/${branch}`, { headers });
    return {
      commitSha: branchRes.data.commit.sha as string,
      treeSha: branchRes.data.commit.commit.tree.sha as string,
    };
  } catch (err: any) {
    // If branch doesn't exist, try getting default branch or return null
    return { commitSha: null, treeSha: null };
  }
}

/**
 * Creates a git tree, commit, and updates the branch ref atomically via GitHub REST API.
 */
export async function createTreeAndCommit(params: {
  owner: string;
  name: string;
  branch: string;
  token: string;
  message: string;
  treeItems: Array<{ path: string; mode?: string; type?: string; content: string }>;
  baseTreeSha?: string | null;
  parentCommitSha?: string | null;
}) {
  const { owner, name, branch, token, message, treeItems, baseTreeSha, parentCommitSha } = params;
  const headers = authHeaders(token);

  const formattedItems = treeItems.map((item) => ({
    path: item.path,
    mode: item.mode || "100644",
    type: item.type || "blob",
    content: item.content,
  }));

  const treePayload: any = { tree: formattedItems };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await githubClient.post(`/repos/${owner}/${name}/git/trees`, treePayload, { headers });
  const newTreeSha = treeRes.data.sha;

  const commitPayload: any = {
    message,
    tree: newTreeSha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };

  const commitRes = await githubClient.post(`/repos/${owner}/${name}/git/commits`, commitPayload, { headers });
  const newCommitSha = commitRes.data.sha;

  if (parentCommitSha) {
    await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${branch}`, { sha: newCommitSha }, { headers });
  } else {
    // Branch ref doesn't exist yet, create it
    try {
      await githubClient.post(`/repos/${owner}/${name}/git/refs`, { ref: `refs/heads/${branch}`, sha: newCommitSha }, { headers });
    } catch {
      await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${branch}`, { sha: newCommitSha, force: true }, { headers });
    }
  }

  return {
    commitSha: newCommitSha,
    htmlUrl: `https://github.com/${owner}/${name}/commit/${newCommitSha}`,
  };
}
