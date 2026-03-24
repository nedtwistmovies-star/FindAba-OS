import axios from "axios";

export default async function handler(req, res) {
  try {
    const repo = req.query.repo || process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured" });
    }

    const [owner, name] = repo.split("/");

    const url = `https://api.github.com/repos/${owner}/${name}/contents/registry.json`;

    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    const registry = JSON.parse(content);

    res.status(200).json({ success: true, data: registry });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Git sync failed" });
  }
}
