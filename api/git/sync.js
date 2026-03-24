
import axios from "axios";

export default async function handler(req, res) {
  let repo = req.query.repo || process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    return res.status(400).json({ error: "GITHUB_REPO not configured" });
  }

  repo = repo.replace(/^https?:\/\/github\.com\//i, '')
             .replace(/\.git$/i, '')
             .replace(/\/$/, '');

  try {
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

      res.status(200).json({ 
        success: true, 
        repo, 
        lastUpdated: new Date().toISOString(),
        data: registry 
      });
    } catch (fileError) {
      if (fileError.response?.status === 404) {
        return res.status(200).json({ 
          success: true, 
          repo, 
          lastUpdated: null,
          data: null,
          message: "Registry file not found in repository. Ready for first commit."
        });
      }
      throw fileError;
    }
  } catch (error) {
    console.error("Git Sync Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to sync with Git repository", 
      details: error.response?.data?.message || error.message 
    });
  }
}
