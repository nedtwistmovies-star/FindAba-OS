import axios from "axios";

export default async function handler(req, res) {
  let repo = req.query.repo || process.env.GITHUB_REPO;

  if (!repo) {
    return res.status(400).json({ error: "GITHUB_REPO not configured" });
  }

  repo = repo.replace(/^https?:\/\/github\.com\//i, "")
             .replace(/\.git$/i, "")
             .replace(/\/$/, "");

  try {
    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return res.status(400).json({
        error: "Invalid GITHUB_REPO format. Use owner/repo"
      });
    }

    const branch =
      process.env.GITHUB_BRANCH ||
      process.env.VERCEL_GIT_COMMIT_REF ||
      "main";

    const rawUrl =
      `https://raw.githubusercontent.com/${owner}/${name}/${encodeURIComponent(branch)}/registry.json`;

    const response = await axios.get(rawUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FindAba-OS"
      },
      responseType: "text"
    });

    const content = response.data;

    if (!content || !content.trim()) {
      return res.status(500).json({
        error: "registry.json is empty"
      });
    }

    let registry;

    try {
      registry = JSON.parse(content);
    } catch (parseError) {
      console.error("Registry JSON Parse Error:", parseError.message);

      return res.status(500).json({
        error: "registry.json contains invalid JSON",
        details: parseError.message
      });
    }

    return res.status(200).json({
      success: true,
      repo,
      branch,
      lastUpdated: new Date().toISOString(),
      data: registry
    });

  } catch (error) {
    console.error(
      "Git Sync Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        repo,
        lastUpdated: null,
        data: null,
        message: "Registry file not found in repository. Ready for first commit."
      });
    }

    return res.status(500).json({
      error: "Failed to sync with Git repository",
      details: error.response?.data?.message || error.message
    });
  }
}
