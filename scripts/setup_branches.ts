import axios from 'axios';

async function setup() {
  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;

  if (!token || !repo) {
    console.error("Missing GITHUB_TOKEN or GITHUB_REPO in environment.");
    process.exit(1);
  }

  repo = repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
  const [owner, name] = repo.split('/');
  
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    console.log(`Repository: ${owner}/${name}`);
    
    // 1. Get default branch SHA
    const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${name}`, { headers });
    const defaultBranch = repoInfo.data.default_branch;
    const branchInfo = await axios.get(`https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`, { headers });
    const sha = branchInfo.data.commit.sha;

    const branches = ['findaba-v1-archive', 'findaba-v2-rebuild'];

    for (const branch of branches) {
      console.log(`Creating branch ${branch} from ${defaultBranch} (${sha})...`);
      try {
        await axios.post(`https://api.github.com/repos/${owner}/${name}/git/refs`, {
          ref: `refs/heads/${branch}`,
          sha
        }, { headers });
        console.log(`Successfully created ${branch}`);
      } catch (e: any) {
        if (e.response?.status === 422) {
          console.log(`Branch ${branch} already exists.`);
        } else {
          console.error(`Failed to create ${branch}:`, e.response?.data?.message || e.message);
        }
      }
    }

    console.log("Git bridge branching sequence complete.");
  } catch (err: any) {
    console.error("Setup failed:", err.response?.data?.message || err.message);
  }
}

setup();
