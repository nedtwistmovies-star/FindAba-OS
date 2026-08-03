import axios from "axios";

export default async function handler(req, res) {
  try {
    let repo = req.query.repo || process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured" });
    }

    repo = repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');

    const [owner, name] = repo.split('/');
    if (!owner || !name) return res.status(400).json({ error: 'Invalid GITHUB_REPO format. Use owner/repo' });

    const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } : { Accept: 'application/vnd.github.v3+json' };

    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/contents/registry.json`, { headers });
      if (!response.data || typeof response.data.content !== 'string') {
        return res.status(200).json({ success: true, repo, lastUpdated: null, data: null, message: 'No registry file found or empty content.' });
      }

      const raw = Buffer.from(response.data.content, 'base64').toString('utf-8').trim();
      if (!raw) {
        return res.status(200).json({ success: true, repo, lastUpdated: null, data: null, message: 'Registry file is empty.' });
      }

      let registry = null;
      try {
        registry = JSON.parse(raw);
      } catch (parseErr) {
        console.error('[api/git/sync] registry.json parse failed:', parseErr.message);
        return res.status(500).json({ error: 'Invalid registry.json in repo (JSON parse failed)', details: parseErr.message, rawPreview: raw.substring(0, 200) });
      }

      return res.status(200).json({ success: true, repo, lastUpdated: new Date().toISOString(), data: registry });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(200).json({ success: true, repo, lastUpdated: null, data: null, message: 'Registry file not found in repository. Ready for first commit.' });
      }
      console.error('[api/git/sync] Error:', err.response?.data || err.message || err);
      return res.status(500).json({ error: 'Failed to sync with Git repository', details: err.response?.data?.message || err.message });
    }
  } catch (outerErr) {
    console.error('[api/git/sync] Fatal:', outerErr);
    res.status(500).json({ error: outerErr?.message || String(outerErr) });
  }
}
