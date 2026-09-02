import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function normalizeRepo(repo: string): string {
  return repo
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
}

function formatGithubError(
  error: any,
  repo: string,
  token: string | null
): { status: number; details: string } {
  const status = error.response?.status || 500;
  let rawMsg = "Unknown error";

  if (error.response?.data) {
    if (typeof error.response.data === "string") {
      rawMsg = error.response.data;
    } else if (
      typeof error.response.data === "object" &&
      error.response.data !== null
    ) {
      rawMsg =
        error.response.data.message ||
        error.response.data.error ||
        JSON.stringify(error.response.data);
    }
  } else if (error.message) {
    rawMsg =
      typeof error.message === "string"
        ? error.message
        : String(error.message);
  }

  if (
    typeof rawMsg === "string" &&
    (rawMsg.includes("Unexpected end of JSON input") ||
      rawMsg.includes("JSON") ||
      rawMsg.includes("Unexpected token"))
  ) {
    rawMsg = `GitHub API payload could not be parsed. Ensure repository '${repo || "configured"}' exists and is accessible.`;
  }

  if (status === 404) {
    return {
      status: 404,
      details: `Repository '${repo}' not found. If it is private, ensure your GitHub token is valid and has repository access.`,
    };
  }

  if (status === 403 || status === 401) {
    const remaining =
      error.response?.headers?.["x-ratelimit-remaining"];

    if (remaining === "0") {
      return {
        status: 429,
        details:
          "GitHub API rate limit exceeded. Please provide a valid GITHUB_TOKEN.",
      };
    }

    if (status === 403) {
      return {
        status: 403,
        details: `GitHub Personal Access Token lacks required permissions for repository '${repo}'.`,
      };
    }

    return {
      status: 401,
      details: token
        ? "Invalid or expired GitHub Token. Please update your token or reconnect."
        : "Authentication required for this repository.",
    };
  }

  return {
    status,
    details: String(rawMsg),
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const configuredRepo =
    process.env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";

  const inputRepo =
    typeof req.body?.repo === "string"
      ? req.body.repo
      : typeof req.query.repo === "string"
        ? req.query.repo
        : configuredRepo;

  const inputToken =
    typeof req.body?.token === "string"
      ? req.body.token.trim()
      : "";

  const headerToken =
    typeof req.headers["x-github-token"] === "string"
      ? req.headers["x-github-token"].trim()
      : "";

  const token =
    inputToken ||
    headerToken ||
    process.env.GITHUB_TOKEN?.trim() ||
    null;

  const repo = normalizeRepo(String(inputRepo || ""));

  if (!repo) {
    return res.status(400).json({
      success: false,
      message:
        "No GitHub repository provided. Please configure GITHUB_REPO.",
    });
  }

  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    return res.status(400).json({
      success: false,
      message: `Invalid repository format '${repo}'. Use 'owner/repo'.`,
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "FindAba-City-OS",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    let response;
    let tokenRejected = false;

    try {
      response = await axios.get(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
        {
          headers,
          timeout: 30000,
        }
      );
    } catch (authErr: any) {
      if (authErr.response?.status === 401 && token) {
        tokenRejected = true;

        response = await axios.get(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "FindAba-City-OS",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout: 30000,
          }
        );
      } else {
        throw authErr;
      }
    }

    const repoData = response.data;

    const rateLimitRemaining = parseInt(
      response.headers["x-ratelimit-remaining"] || "60",
      10
    );

    const isPrivate = !!repoData.private;
    const defaultBranch = repoData.default_branch || "main";
    const permissions = repoData.permissions || null;

    let authStatus = tokenRejected
      ? "Token Rejected (401 Bad Credentials) - Public Read Fallback Active"
      : token
        ? "Authenticated via Token"
        : "Anonymous / Public Only";

    if (!tokenRejected && token && permissions) {
      if (permissions.push || permissions.admin) {
        authStatus += " (Read & Write Authorized)";
      } else {
        authStatus += " (Read Only Access)";
      }
    }

    const message = tokenRejected
      ? `Repository '${repoData.full_name}' is verified and reachable, but the supplied GitHub token was rejected.`
      : `Repository '${repoData.full_name}' is reachable! (${isPrivate ? "Private" : "Public"}, default branch: ${defaultBranch}). Token status: ${authStatus}`;

    return res.status(200).json({
      success: true,
      repo: repoData.full_name,
      exists: true,
      private: isPrivate,
      defaultBranch,
      permissions,
      rateLimitRemaining,
      authStatus,
      tokenValid: !tokenRejected && !!token,
      htmlUrl: repoData.html_url,
      description: repoData.description,
      message,
    });
  } catch (error: any) {
    const { status, details } = formatGithubError(
      error,
      repo,
      token
    );

    console.warn("[GitSync] Vercel test connection failed:", {
      status,
      details,
      repo,
    });

    return res.status(status).json({
      success: false,
      repo,
      exists: false,
      status,
      details,
      message: `Connection test failed for '${repo}': ${details}`,
    });
  }
}
