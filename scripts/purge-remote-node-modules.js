import axios from 'axios';

async function run() {
  let repoUrl = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || 'nedtwistmovies-star/findaba.os';
  const token = process.env.GITHUB_TOKEN;

  if (!repoUrl) {
    console.error("❌ GITHUB_REPO not configured in environment");
    process.exit(1);
  }
  if (!token) {
    console.error("❌ GITHUB_TOKEN not configured in environment");
    process.exit(1);
  }

  // Clean the repo URL
  const cleanedRepo = repoUrl.replace(/^https?:\/\/github\.com\//i, '')
                            .replace(/\.git$/i, '')
                            .replace(/\/$/, '');

  const [owner, name] = cleanedRepo.split("/");
  if (!owner || !name) {
    console.error(`❌ Invalid GITHUB_REPO format: ${repoUrl}`);
    process.exit(1);
  }

  console.log(`🚀 Starting node_modules purge for remote repo: ${owner}/${name}`);

  const gitClient = axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    }
  });

  try {
    // 1. Get default branch & latest commit sha
    console.log(`📡 Fetching repository details...`);
    const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
    const defaultBranch = repoInfo.data.default_branch;
    console.log(`👉 Default branch identified as: ${defaultBranch}`);

    const branchRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`);
    const latestCommitSha = branchRes.data.commit.sha;
    const baseTreeSha = branchRes.data.commit.commit.tree.sha;
    console.log(`🔑 Latest Commit SHA: ${latestCommitSha}`);
    console.log(`🔑 Base Tree SHA: ${baseTreeSha}`);

    // 2. Get recursive tree
    console.log(`📡 Fetching full recursive Git tree...`);
    const treeRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/git/trees/${baseTreeSha}?recursive=true`);
    const allItems = treeRes.data.tree || [];
    console.log(`📊 Found ${allItems.length} total files/directories in tree`);

    // 3. Filter out node_modules
    const matchedNodeModules = allItems.filter(item => 
      item.path.startsWith('node_modules/') || item.path.includes('/node_modules/')
    );

    if (matchedNodeModules.length === 0) {
      console.log(`✅ No node_modules files found in the remote repository. Your repository is already clean!`);
      process.exit(0);
    }

    console.log(`⚠️  Found ${matchedNodeModules.length} committed files inside node_modules/. Purging them...`);

    // Keep only blob items that are NOT inside node_modules
    const cleanTreeItems = allItems
      .filter(item => 
        item.type === 'blob' && 
        !item.path.startsWith('node_modules/') && 
        !item.path.includes('/node_modules/')
      )
      .map(item => ({
        path: item.path,
        mode: item.mode,
        type: item.type,
        sha: item.sha
      }));

    console.log(`🧱 Re-creating a clean remote file tree with ${cleanTreeItems.length} files...`);
    const newTreeRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/trees`, {
      tree: cleanTreeItems
    });
    const newTreeSha = newTreeRes.data.sha;
    console.log(`✅ Created clean Tree SHA: ${newTreeSha}`);

    // 4. Create new commit
    console.log(`✍️  Creating commit...`);
    const commitRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/commits`, {
      message: "Purge committed node_modules from repository",
      tree: newTreeSha,
      parents: [latestCommitSha]
    });
    const newCommitSha = commitRes.data.sha;
    console.log(`✅ Created commit SHA: ${newCommitSha}`);

    // 5. Update branch reference
    console.log(`🔄 Updating branch HEAD reference [heads/${defaultBranch}] to point to new commit...`);
    await gitClient.patch(`https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`, {
      sha: newCommitSha
    });

    console.log(`🎉 SUCCESS! Successfully purged node_modules from your remote GitHub repository!`);
    console.log(`🔗 Commit URL: ${commitRes.data.html_url}`);
  } catch (err) {
    console.error("❌ Purge Failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

run();
