import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Initializing FindAba City OS Server...");

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    // Trust proxy is required for correct protocol/host detection behind nginx
    app.set('trust proxy', true);

    app.use(cors());
    // Increase limits for large repository syncs
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.use(cookieParser());

    // API Routes
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

  // GitHub OAuth URL
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }

    // Robust redirectUri construction
    let redirectUri: string;
    if (process.env.APP_URL) {
      // Use the provided APP_URL, ensuring it doesn't have a trailing slash before adding path
      const baseUrl = process.env.APP_URL.replace(/\/$/, "");
      redirectUri = `${baseUrl}/api/auth/github/callback`;
    } else {
      const host = req.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      redirectUri = `${protocol}://${host}/api/auth/github/callback`;
    }
    
    console.log(`GitHub Auth: Constructing redirectUri: ${redirectUri}`);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user repo",
      state: Math.random().toString(36).substring(7),
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // GitHub OAuth Callback
  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing code or configuration");
    }

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const { access_token } = response.data;

      if (!access_token) {
        return res.status(400).send("Failed to obtain access token");
      }

      // Set cookie with token
      res.cookie("github_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth Error:", error);
      res.status(500).send("Internal Server Error during GitHub OAuth");
    }
  });

  // Get GitHub User Info
  app.get("/api/github/user", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated with GitHub" });
    }

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GitHub user" });
    }
  });

  // Logout GitHub
  app.post("/api/auth/github/logout", (req, res) => {
    res.clearCookie("github_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });

  // Automatic Git Repo Connection
  app.get("/api/git/sync", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN || req.cookies.github_token;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured for automatic sync" });
    }

    // Robustness: Strip URL prefix and .git suffix if provided
    repo = repo.replace(/^https?:\/\/github\.com\//i, '')
               .replace(/\.git$/i, '')
               .replace(/\/$/, '');

    try {
      // Fetch the repository content (specifically looking for registry.json or similar)
      const [owner, name] = repo.split("/");
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid GITHUB_REPO format. Use owner/repo" });
      }

      try {
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/contents/registry.json`,
          {
            headers: token ? { 
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json"
            } : {
              Accept: "application/vnd.github.v3+json"
            },
          }
        );

        const content = Buffer.from(response.data.content, "base64").toString("utf-8");
        const registry = JSON.parse(content);

        res.json({ 
          success: true, 
          repo, 
          lastUpdated: new Date().toISOString(),
          data: registry 
        });
      } catch (fileError: any) {
        // If the file is missing (404), return a success with empty data instead of a 500 error
        if (fileError.response?.status === 404) {
          return res.json({ 
            success: true, 
            repo, 
            lastUpdated: null,
            data: null,
            message: "Registry file not found in repository. Ready for first commit."
          });
        }
        throw fileError;
      }
    } catch (error: any) {
      console.error("Git Sync Error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to sync with Git repository", 
        details: error.response?.data?.message || error.message 
      });
    }
  });

  // Full System Sync (Server-side)
  app.post("/api/git/sync-full", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = req.cookies.github_token || process.env.GITHUB_TOKEN;
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
      const files: { path: string, content: string }[] = [];
      const excludeDirs = ['node_modules', 'dist', '.git', '.next', '.vercel', 'build', 'public'];
      const excludeFiles = ['package-lock.json', '.env', '.env.local', 'github_token', '.DS_Store'];
      const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.sql'];

      async function readDir(dir: string, relativePath: string = "") {
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
              version: "17.0",
              lastUpdated: new Date().toISOString(),
              businesses
            };
            // Update or add registry.json to the files list
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
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
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

      res.json({ success: true, commit: commitRes.data.html_url });
    } catch (error: any) {
      console.error("Full Sync Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to perform full sync", details: error.response?.data?.message || error.message });
    }
  });

  // Get all project files for full sync
  app.get("/api/git/all-files", async (req, res) => {
    try {
      const rootDir = process.cwd();
      const files: { path: string, data: string }[] = [];
      
      const excludeDirs = ['node_modules', 'dist', '.git', '.next', '.vercel', 'build', 'public'];
      const excludeFiles = ['package-lock.json', '.env', '.env.local', 'github_token', '.DS_Store'];
      const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.sql'];

      async function readDir(dir: string, relativePath: string = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await readDir(fullPath, relPath);
            }
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (!excludeFiles.includes(entry.name) && (includeExtensions.includes(ext) || entry.name === 'LICENSE')) {
              try {
                const content = await fs.readFile(fullPath, "utf-8");
                files.push({ path: relPath, data: content });
              } catch (e) {
                console.warn(`Skipping file ${relPath}: ${e}`);
              }
            }
          }
        }
      }

      await readDir(rootDir);
      console.log(`Full Sync: Found ${files.length} files to commit.`);
      res.json({ files });
    } catch (error: any) {
      console.error("Failed to read project files:", error);
      res.status(500).json({ 
        error: "Failed to read project files", 
        details: error.message,
        path: error.path || 'unknown'
      });
    }
  });

  // Get README content
  app.get("/api/readme", async (req, res) => {
    try {
      const readmePath = path.join(process.cwd(), "README.md");
      const content = await fs.readFile(readmePath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(404).json({ error: "README.md not found" });
    }
  });

  // Commit to Git Repo (Atomic Multi-file Commit)
  app.post("/api/git/commit", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = req.cookies.github_token || process.env.GITHUB_TOKEN;
    const { files, message = "Update via FindAba City OS" } = req.body;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured" });
    }

    // Robustness: Strip URL prefix and .git suffix if provided
    repo = repo.replace(/^https?:\/\/github\.com\//i, '')
               .replace(/\.git$/i, '')
               .replace(/\/$/, '');

    if (!token) {
      return res.status(401).json({ error: "GitHub authentication required" });
    }
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files provided for commit" });
    }

    try {
      const [owner, name] = repo.split("/");
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid GITHUB_REPO format. Use owner/repo" });
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      };

      const gitClient = axios.create({
        headers,
        timeout: 60000 // 60 seconds
      });

      // 1. Get the default branch
      const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
      const defaultBranch = repoInfo.data.default_branch;

      // 2. Get the latest commit SHA of the default branch
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
      try {
        const branchRes = await gitClient.get(
          `https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`
        );
        latestCommitSha = branchRes.data.commit.sha;
        baseTreeSha = branchRes.data.commit.commit.tree.sha;
      } catch (e) {
        // Repo might be empty, which is fine
      }

      // 3. Create a new tree
      const treeItems = files.map(file => {
        // If data is a string, use it directly (for README.md, etc.)
        // Otherwise, stringify as JSON (for registry.json, package.json)
        const content = typeof file.data === 'string' 
          ? file.data 
          : JSON.stringify(file.data, null, 2);

        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          content
        };
      });

      const treeRes = await gitClient.post(
        `https://api.github.com/repos/${owner}/${name}/git/trees`,
        {
          base_tree: baseTreeSha,
          tree: treeItems
        }
      );
      const newTreeSha = treeRes.data.sha;

      // 4. Create a new commit
      const commitRes = await gitClient.post(
        `https://api.github.com/repos/${owner}/${name}/git/commits`,
        {
          message,
          tree: newTreeSha,
          parents: latestCommitSha ? [latestCommitSha] : []
        }
      );
      const newCommitSha = commitRes.data.sha;

      // 5. Update the branch reference
      if (latestCommitSha) {
        await gitClient.patch(
          `https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`,
          { sha: newCommitSha }
        );
      } else {
        // Create the branch if it doesn't exist
        await gitClient.post(
          `https://api.github.com/repos/${owner}/${name}/git/refs`,
          {
            ref: `refs/heads/${defaultBranch}`,
            sha: newCommitSha
          }
        );
      }

      res.json({ 
        success: true, 
        message: "Full System Sync Successful",
        commit: `https://github.com/${owner}/${name}/commit/${newCommitSha}`
      });
    } catch (error: any) {
      console.error("Git Commit Error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to commit to GitHub", 
        details: error.response?.data?.message || error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});
