import axios from "axios";

export default async function handler(req, res) {
  const repo = req.query.repo;
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    return res.status(400).json({ error: "Missing repo" });
  }

  const [owner, name] = repo.split("/");

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${name}/contents/registry.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const content = Buffer.from(response.data.content, "base64").toString("utf-8");

    res.json({
      success: true,
      data: JSON.parse(content),
    });
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
          }
