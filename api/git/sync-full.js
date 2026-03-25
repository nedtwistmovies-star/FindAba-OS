
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let repo = req.query.repo || process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const { message = "Full System Sync via FindAba City OS" } = req.body;

  if (!repo) {
    return res.status(400).json({ error: "GITHUB_REPO not configured" });
  }

  repo = repo.replace(/^https?:\/\/github\.com\//i, '')
             .replace(/\.git$/i, '')
             .replace(/\/$/, '');

  if (!token) {
    return res.status(401).json({ error: "GitHub authentication required" });
  }

  try {
    const [owner, name] = repo.split("/");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    const gitClient = axios.create({ headers, timeout: 120000 });

    // 1. Gather all local files
    const rootDir = process.cwd();
    const files = [];
    const excludeDirs = ['node_modules', 'dist', '.git', '.next', '.vercel', 'build', 'public'];
    const excludeFiles = ['package-lock.json', '.env', '.env.local', 'github_token', '.DS_Store'];
    const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.sql'];

    async function readDir(dir, relativePath = "") {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) await readDir(fullPath, relPath);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (!excludeFiles.includes(entry.name) && (includeExtensions.includes(ext) || entry.name === 'LICENSE')) {
            try {
              const content = await fs.readFile(fullPath, "utf-8");
              files.push({ path: relPath, content });
            } catch (e) { console.warn(`Skipping ${relPath}`); }
          }
        }
      }
    }
    await readDir(rootDir);

    // 2. Fetch Registry Data from Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: businesses } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
        if (businesses) {
          const registry = {
            version: "v6.0",
            lastUpdated: new Date().toISOString(),
            businesses
          };
          const existingIdx = files.findIndex(f => f.path === 'registry.json');
          const registryContent = JSON.stringify(registry, null, 2);
          if (existingIdx >= 0) files[existingIdx].content = registryContent;
          else files.push({ path: 'registry.json', content: registryContent });
        }
      } catch (e) { console.error("Supabase fetch failed during sync", e); }
    }

    // 3. GitHub Commit Logic
    const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
    const defaultBranch = repoInfo.data.default_branch;
    let latestCommitSha = null;
    let baseTreeSha = null;
    
    try {
      const branchRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`);
      latestCommitSha = branchRes.data.commit.sha;
      baseTreeSha = branchRes.data.commit.commit.tree.sha;
    } catch (e) {}

    const treeItems = files.map(file => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: file.content
    }));

    const treeRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeItems
    });
    
    const commitRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/commits`, {
      message,
      tree: treeRes.data.sha,
      parents: latestCommitSha ? [latestCommitSha] : []
    });

    await gitClient.patch(`https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`, {
      sha: commitRes.data.sha
    });

    res.status(200).json({ success: true, commit: commitRes.data.html_url });
  } catch (error) {
    console.error("Full Sync Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to perform full sync", details: error.response?.data?.message || error.message });
  }
}
