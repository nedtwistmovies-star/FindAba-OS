
import fs from "fs/promises";
import path from "path";
import axios from "axios";

// Mirroring the EXCLUDE logic from the router
const EXCLUDE_DIRS = ["node_modules", "dist", ".git", ".next", ".vercel", "build", "public", "coverage", "logs"];
const EXCLUDE_FILES = ["package-lock.json", "yarn.lock", ".env", ".env.local", "github_token", ".DS_Store", "server-persistent-config.json", "deployed_sha.txt", "deployed_url.txt"];
const INCLUDE_EXT = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md", ".sql"];

async function collectFiles(dir: string, baseDir: string = dir): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        files.push(...(await collectFiles(fullPath, baseDir)));
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!EXCLUDE_FILES.includes(entry.name) && (INCLUDE_EXT.includes(ext) || entry.name === "LICENSE" || entry.name === "vercel.json")) {
        const content = await fs.readFile(fullPath, "utf-8");
        files.push({ path: relPath, content });
      }
    }
  }
  return files;
}

async function triggerDeploy() {
  try {
    const configRaw = await fs.readFile("server-persistent-config.json", "utf-8");
    const config = JSON.parse(configRaw);
    const token = config.githubToken;
    const repo = config.repository;
    const branch = config.branch || "main";

    console.log(`🚀 Triggering deployment for ${repo} on branch ${branch}...`);

    const files = await collectFiles(process.cwd());
    console.log(`📦 Collected ${files.length} files to push.`);

    const [owner, name] = repo.split("/");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // 1. Get latest commit
    const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${name}/branches/${branch}`, { headers });
    const latestCommitSha = branchRes.data.commit.sha;
    const baseTreeSha = branchRes.data.commit.commit.tree.sha;

    // 2. Create Tree
    const treeItems = files.map(f => ({
      path: f.path,
      mode: "100644",
      type: "blob",
      content: f.content
    }));

    const treeRes = await axios.post(`https://api.github.com/repos/${owner}/${name}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeItems
    }, { headers });
    const newTreeSha = treeRes.data.sha;

    // 3. Create Commit
    const commitRes = await axios.post(`https://api.github.com/repos/${owner}/${name}/git/commits`, {
      message: "🚀 Production Deployment: Verified Release Candidate",
      tree: newTreeSha,
      parents: [latestCommitSha]
    }, { headers });
    const newCommitSha = commitRes.data.sha;

    // 4. Update Ref
    await axios.patch(`https://api.github.com/repos/${owner}/${name}/git/refs/heads/${branch}`, {
      sha: newCommitSha
    }, { headers });

    console.log(`✅ Successfully pushed to GitHub!`);
    console.log(`🔗 Commit: https://github.com/${repo}/commit/${newCommitSha}`);
    console.log(`📡 Vercel deployment should start automatically.`);

    // Record SHA for reporting
    await fs.writeFile("deployed_sha.txt", newCommitSha);

  } catch (error: any) {
    console.error("❌ Deployment Trigger Failed:", error.response?.data || error.message);
  }
}

triggerDeploy();
