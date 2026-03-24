
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

async function commitRegistry() {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    console.error("GITHUB_REPO or GITHUB_TOKEN not set");
    process.exit(1);
  }

  const [owner, name] = repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').split('/');

  try {
    const filePath = path.join(process.cwd(), 'registry.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const base64Content = Buffer.from(content).toString('base64');

    // Get current file SHA if it exists
    let sha: string | undefined;
    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${owner}/${name}/contents/registry.json`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      sha = data.sha;
    } catch (e) {
      // File doesn't exist yet
    }

    await axios.put(
      `https://api.github.com/repos/${owner}/${name}/contents/registry.json`,
      {
        message: "chore: add registry.json",
        content: base64Content,
        sha
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("Successfully committed registry.json to GitHub");
  } catch (error: any) {
    console.error("Failed to commit registry.json:", error.response?.data || error.message);
    process.exit(1);
  }
}

commitRegistry();
