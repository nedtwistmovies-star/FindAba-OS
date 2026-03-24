
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let repo = req.query.repo || process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const { files, message = "Update via FindAba City OS" } = req.body;

  if (!repo) {
    return res.status(400).json({ error: "GITHUB_REPO not configured" });
  }

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
    let latestCommitSha = null;
    let baseTreeSha = null;
    
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
        {
          sha: newCommitSha
        }
      );
    } else {
      await gitClient.post(
        `https://api.github.com/repos/${owner}/${name}/git/refs`,
        {
          ref: `refs/heads/${defaultBranch}`,
          sha: newCommitSha
        }
      );
    }

    res.status(200).json({ success: true, commit: commitRes.data.html_url });
  } catch (error) {
    console.error("Commit Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to perform commit", 
      details: error.response?.data?.message || error.message 
    });
  }
}
