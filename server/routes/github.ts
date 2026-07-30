import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ensureAdmin } from "../middleware/admin";
import { env } from "../services/env";
import { supabase } from "../services/supabase";
import {
  githubClient,
  resolveGithubToken,
  authHeaders,
  normalizeRepo,
  getRepoMeta,
} from "../services/github";

export const githubRouter = Router();

const EXCLUDE_DIRS = ["node_modules", "dist", ".git", ".next", ".vercel", "build", "public", "coverage", "logs"];
const EXCLUDE_FILES = ["package-lock.json", "yarn.lock", ".env", ".env.local", "github_token", ".DS_Store"];
const INCLUDE_EXT = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md", ".sql"];

async function collectProjectFiles(rootDir: string) {
  const files: { path: string; content: string }[] = [];

  async function readDir(dir: string, relativePath = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (!EXCLUDE_DIRS.includes(entry.name)) await readDir(fullPath, relPath);
          return;
        }
        const ext = path.extname(entry.name).toLowerCase();
        if (EXCLUDE_FILES.includes(entry.name) || (!INCLUDE_EXT.includes(ext) && entry.name !== "LICENSE")) return;

        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > 1024 * 1024) {
            console.warn(`[GitSync] Skipping large file: ${relPath} (${stats.size} bytes)`);
            return;
          }
          const content = await fs.readFile(fullPath, "utf-8");
          files.push({ path: relPath, content });
        } catch (e) {
          console.warn(`[GitSync] Skipping ${relPath}: ${e}`);
        }
      })
    );
  }

  await readDir(rootDir);
  return files;
}

/** Read-only registry pull. */
githubRouter.get("/sync", async (req, res) => {
  let repo = (req.query.repo as string) || env.GITHUB_REPO;
  const branch = (req.query.branch as string) || env.GITHUB_BRANCH;
  const token = resolveGithubToken(req);

  repo = normalizeRepo(repo);

  try {
    const [owner, name] = repo.split("/");
    if (!owner || !name) throw new Error(`Invalid repo format: ${repo}. Use owner/repo`);

    const url = `/repos/${owner}/${name}/contents/registry.json?ref=${branch}`;

    try {
      const response = await githubClient.get(url, { headers: authHeaders(token) });
      if (!response.data || typeof response.data.content !== "string") {
        throw new Error("Invalid response from GitHub API while fetching registry.json.");
      }

      const rawContent = Buffer.from(response.data.content, "base64").toString("utf-8").trim();
      if (!rawContent) {
        return res.json({ success: true, repo, lastUpdated: new Date().toISOString(), data: null, message: "Registry file is empty." });
      }

      const registry = JSON.parse(rawContent);
      res.json({ success: true, repo, lastUpdated: new Date().toISOString(), data: registry });
    } catch (fileError: any) {
      if (fileError.response?.status === 404) {
        return res.json({ success: true, repo, lastUpdated: null, data: null, message: "Registry not found. Ready for initialization." });
      }
      if (fileError.response?.status === 403 || fileError.response?.status === 401) {
        const isRateLimit = fileError.response?.headers?.["x-ratelimit-remaining"] === "0";
        throw {
          response: {
            status: fileError.response.status,
            data: {
              message: isRateLimit
                ? "GitHub API rate limit exceeded. Set GITHUB_TOKEN in environment."
                : token
                ? "Invalid GitHub Token. Please reconnect."
                : "Authentication required for private repository.",
            },
          },
        };
      }
      throw fileError;
    }
  } catch (error: any) {
    const status = error.response?.status || 500;
    const details = error.response?.data?.message || error.message;
    console.error("[GitSync] Failed:", { status, details });
    res.status(status).json({ success: false, error: "GitHub sync failed", details, status });
  }
});

/** Full repo sync — writes to GitHub, admin only. */
githubRouter.post("/sync-full", ensureAdmin, async (req, res) => {
  let repo = (req.query.repo as string) || env.GITHUB_REPO;
  const branchOverride = (req.query.branch as string) || undefined;
  const token = resolveGithubToken(req);
  const { message = "Full System Sync via FindAba City OS" } = req.body || {};

  if (!token) return res.status(401).json({ error: "GitHub authentication required. Set GITHUB_TOKEN or login." });

  repo = normalizeRepo(repo);

  try {
    const [owner, name] = repo.split("/");
    const headers = authHeaders(token);

    const files = await collectProjectFiles(process.cwd());
    console.log(`[GitSync] Found ${files.length} files to sync.`);

    try {
      const { data: businesses } = await supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(500);
      if (businesses) {
        const registryContent = JSON.stringify({ version: "v6.0", lastUpdated: new Date().toISOString(), businesses }, null, 2);
        const existingIdx = files.findIndex((f) => f.path === "registry.json");
        if (existingIdx >= 0) files[existingIdx].content = registryContent;
        else files.push({ path: "registry.json", content: registryContent });
      }
    } catch (e) {
      console.error("[GitSync] Supabase registry fetch failed:", e);
    }

    const repoMeta = await getRepoMeta(owner, name, token);
    const targetBranch = branchOverride || repoMeta.default_branch;

    let latestCommitSha: string | null = null;
    let baseTreeSha: string | null = null;
    try {
      const branchRes = await githubClient.get(`/repos/${owner}/${name}/branches/${targetBranch}`, { headers });
      latestCommitSha = branchRes.data.commit.sha;
      baseTreeSha = branchRes.data.commit.commit.tree.sha;
    } catch {
      // Empty repo
    }

    const syncFiles = files.slice(0, 1000);
    const warning = files.length > 1000 ? `Project has ${files.length} files. Only syncing first 1,000 for stability.` : null;

    const treeItems = syncFiles.map((file) => ({ path: file.path, mode: "100644", type: "blob", content: file.content }));

    const treeRes = await githubClient.post(`/repos/${owner}/${name}/git/trees`, { base_tree: baseTreeSha, tree: treeItems }, { headers });
    const commitRes = await githubClient.post(
      `/repos/${owner}/${name}/git/commits`,
      { message, tree: treeRes.data.sha, parents: latestCommitSha ? [latestCommitSha] : [] },
      { headers }
    );
    await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${targetBranch}`, { sha: commitRes.data.sha }, { headers });

    res.json({ success: true, commit: commitRes.data.html_url, warning });
  } catch (error: any) {
    console.error("[GitSync] Full sync error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to perform full sync", details: error.response?.data?.message || error.message });
  }
});

/** Atomic multi-file commit — admin only. */
githubRouter.post("/commit", ensureAdmin, async (req, res) => {
  let repo = (req.query.repo as string) || env.GITHUB_REPO;
  const branchOverride = (req.query.branch as string) || undefined;
  const token = resolveGithubToken(req);
  const { files = [], message = "Update via FindAba City OS" } = req.body || {};

  if (!token) return res.status(401).json({ error: "GitHub authentication required. Set GITHUB_TOKEN or login." });
  if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: "No files provided for commit" });

  repo = normalizeRepo(repo);

  try {
    const [owner, name] = repo.split("/");
    if (!owner || !name) return res.status(400).json({ error: "Invalid repo format. Use owner/repo" });

    const headers = authHeaders(token);
    const repoMeta = await getRepoMeta(owner, name, token);
    const targetBranch = branchOverride || repoMeta.default_branch;

    let latestCommitSha: string | null = null;
    let baseTreeSha: string | null = null;
    try {
      const branchRes = await githubClient.get(`/repos/${owner}/${name}/branches/${targetBranch}`, { headers });
      latestCommitSha = branchRes.data.commit.sha;
      baseTreeSha = branchRes.data.commit.commit.tree.sha;
    } catch {
      // Empty repo
    }

    const treeItems = files.map((file: any) => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: typeof file.data === "string" ? file.data : JSON.stringify(file.data, null, 2),
    }));

    const treeRes = await githubClient.post(`/repos/${owner}/${name}/git/trees`, { base_tree: baseTreeSha, tree: treeItems }, { headers });
    const commitRes = await githubClient.post(
      `/repos/${owner}/${name}/git/commits`,
      { message, tree: treeRes.data.sha, parents: latestCommitSha ? [latestCommitSha] : [] },
      { headers }
    );

    if (latestCommitSha) {
      await githubClient.patch(`/repos/${owner}/${name}/git/refs/heads/${targetBranch}`, { sha: commitRes.data.sha }, { headers });
    } else {
      await githubClient.post(`/repos/${owner}/${name}/git/refs`, { ref: `refs/heads/${targetBranch}`, sha: commitRes.data.sha }, { headers });
    }

    res.json({ success: true, message: "Commit successful", commit: `https://github.com/${owner}/${name}/commit/${commitRes.data.sha}` });
  } catch (error: any) {
    console.error("[GitSync] Commit error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to commit to GitHub", details: error.response?.data?.message || error.message });
  }
});

githubRouter.post("/branch", ensureAdmin, async (req, res) => {
  const { branch, from, repo: bodyRepo } = req.body;
  let repo = (req.query.repo as string) || bodyRepo || env.GITHUB_REPO;
  const token = resolveGithubToken(req);

  if (!token || !branch) return res.status(400).json({ error: "Missing parameters for branch creation" });

  repo = normalizeRepo(repo);

  try {
    const [owner, name] = repo.split("/");
    const headers = authHeaders(token);

    let sourceBranch = from;
    if (!sourceBranch) {
      const repoMeta = await getRepoMeta(owner, name, token);
      sourceBranch = repoMeta.default_branch;
    }

    const branchRes = await githubClient.get(`/repos/${owner}/${name}/branches/${sourceBranch}`, { headers });
    await githubClient.post(`/repos/${owner}/${name}/git/refs`, { ref: `refs/heads/${branch}`, sha: branchRes.data.commit.sha }, { headers });

    res.json({ success: true, message: `Branch ${branch} created from ${sourceBranch}` });
  } catch (error: any) {
    console.error("[GitSync] Branch creation error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create branch", details: error.response?.data?.message || error.message });
  }
});

githubRouter.get("/all-files", ensureAdmin, async (req, res) => {
  try {
    const files = await collectProjectFiles(process.cwd());
    res.json({ files: files.map((f) => ({ path: f.path, data: f.content })) });
  } catch (error: any) {
    console.error("[GitSync] Failed to read project files:", error);
    res.status(500).json({ error: "Failed to read project files", details: error.message });
  }
});

/** GitHub App/webhook. */
githubRouter.post("/webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  const secret = env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const digest = "sha256=" + crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");
    if (signature !== digest) {
      console.warn("[GitHub Webhook] Invalid signature detected.");
      return res.status(401).send("Invalid signature");
    }
  }

  const event = req.headers["x-github-event"];
  if (event === "push") {
    const branch = req.body.ref?.replace("refs/heads/", "");
    if (branch === env.GITHUB_BRANCH) {
      console.log(`[GitHub Webhook] Push to ${branch} detected.`);
    }
  }

  res.status(200).send("OK");
});
