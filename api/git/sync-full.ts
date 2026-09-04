import type { VercelRequest, VercelResponse } from "@vercel/node";
import { githubClient, authHeaders, normalizeRepo, getRepoMeta } from "../../server/services/github";
import { env } from "../../server/services/env";
import { supabase } from "../../server/services/supabase";

function getToken(req: VercelRequest): string | null {
  const headerToken =
    typeof req.headers["x-github-token"] === "string"
      ? req.headers["x-github-token"]
      : "";

  const bodyToken =
    req.body &&
    typeof req.body === "object" &&
    typeof req.body.githubToken === "string"
      ? req.body.githubToken
      : "";

  return (headerToken || bodyToken || env.GITHUB_TOKEN || "").trim() || null;
}

function githubError(error: any, repo: string) {
  const status = error?.response?.status || 500;

  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unknown GitHub error";

  if (status === 401) {
    return {
      status: 401,
      details: "GitHub token is invalid or expired.",
    };
  }

  if (status === 403) {
    return {
      status: 403,
      details:
        `GitHub token does not have sufficient write permission for '${repo}'.`,
    };
  }

  if (status === 404) {
    return {
      status: 404,
      details:
        `Repository '${repo}' or the requested branch was not found.`,
    };
  }

  return {
    status,
    details: String(message),
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "GitHub authentication required.",
    });
  }

  const requestedRepo =
    typeof req.query.repo === "string"
      ? req.query.repo
      : env.GITHUB_REPO || "";

  const repo = normalizeRepo(requestedRepo);

  const parts = repo.split("/");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return res.status(400).json({
      success: false,
      error: "Invalid repository format. Expected owner/repository.",
    });
  }

  const [owner, name] = parts;

  const branch =
    typeof req.query.branch === "string"
      ? req.query.branch
      : undefined;

  const message =
    req.body &&
    typeof req.body === "object" &&
    typeof req.body.message === "string" &&
    req.body.message.trim()
      ? req.body.message.trim()
      : "Full System Sync via FindAba City OS";

  try {
    console.log(`[GitSync] Full sync starting: ${repo}`);

    const headers = authHeaders(token);

    const repoMeta = await getRepoMeta(owner, name, token);

    const targetBranch =
      branch ||
      repoMeta.default_branch ||
      "main";

    /*
     * The Vercel function should not attempt to recursively upload
     * the entire deployed filesystem. Instead, synchronize the
     * repository through GitHub's existing tree as the source of truth.
     *
     * First verify repository/branch access and then create a
     * lightweight synchronization commit.
     */

    let latestCommitSha: string | null = null;
    let baseTreeSha: string | null = null;

    try {
      const branchResponse = await githubClient.get(
        `/repos/${owner}/${name}/branches/${encodeURIComponent(targetBranch)}`,
        { headers }
      );

      latestCommitSha = branchResponse.data.commit.sha;
      baseTreeSha = branchResponse.data.commit.commit.tree.sha;
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }
    }

    /*
     * Pull the current repository tree. This gives us a safe
     * production-side synchronization baseline.
     */
    const treeResponse = await githubClient.get(
      `/repos/${owner}/${name}/git/trees/${encodeURIComponent(
        baseTreeSha || "HEAD"
      )}?recursive=1`,
      { headers }
    ).catch(() => null);

    const registryResponse = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    let registryContent: string | null = null;

    if (!registryResponse.error && registryResponse.data) {
      registryContent = JSON.stringify(
        {
          version: "v6.0",
          lastUpdated: new Date().toISOString(),
          businesses: registryResponse.data,
        },
        null,
        2
      );
    }

    const treeItems: any[] = [];

    if (registryContent) {
      treeItems.push({
        path: "registry.json",
        mode: "100644",
        type: "blob",
        content: registryContent,
      });
    }

    /*
     * If there is nothing to commit, report that clearly instead of
     * producing an invalid GitHub commit.
     */
    if (treeItems.length === 0 && !latestCommitSha) {
      return res.status(400).json({
        success: false,
        error: "No files available for synchronization.",
      });
    }

    const treePayload: Record<string, unknown> = {
      tree: treeItems,
    };

    if (baseTreeSha) {
      treePayload.base_tree = baseTreeSha;
    }

    const newTree = await githubClient.post(
      `/repos/${owner}/${name}/git/trees`,
      treePayload,
      { headers }
    );

    const commitPayload: Record<string, unknown> = {
      message,
      tree: newTree.data.sha,
    };

    if (latestCommitSha) {
      commitPayload.parents = [latestCommitSha];
    }

    const commit = await githubClient.post(
      `/repos/${owner}/${name}/git/commits`,
      commitPayload,
      { headers }
    );

    const refPath =
      `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(
        targetBranch
      )}`;

    if (latestCommitSha) {
      await githubClient.patch(
        refPath,
        { sha: commit.data.sha },
        { headers }
      );
    } else {
      await githubClient.post(
        `/repos/${owner}/${name}/git/refs`,
        {
          ref: `refs/heads/${targetBranch}`,
          sha: commit.data.sha,
        },
        { headers }
      );
    }

    console.log(
      `[GitSync] Full sync completed: ${commit.data.sha}`
    );

    return res.status(200).json({
      success: true,
      commit: commit.data.html_url,
      commitSha: commit.data.sha,
      repository: repo,
      branch: targetBranch,
      filesSynced: treeItems.length,
      registrySync: Boolean(registryContent),
      repositoryTreeAvailable: Boolean(treeResponse),
    });
  } catch (error: any) {
    const result = githubError(error, repo);

    console.error("[GitSync] Full sync failed:", result);

    return res.status(result.status).json({
      success: false,
      error: "Failed to perform full sync",
      details: result.details,
      status: result.status,
    });
  }
}