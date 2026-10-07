
import axios from "axios";
import fs from "fs/promises";

async function testPush() {
  try {
    const configRaw = await fs.readFile("server-persistent-config.json", "utf-8");
    const config = JSON.parse(configRaw);
    const token = config.githubToken;
    const repo = config.repository;

    console.log(`Testing push for ${repo} using token: ${token.substring(0, 7)}...`);

    const [owner, name] = repo.split("/");

    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    console.log("GitHub API Success:", response.data.full_name);
    console.log("Permissions:", response.data.permissions);

    if (response.data.permissions.push) {
      console.log("✅ Token has push permissions.");
    } else {
      console.error("❌ Token does NOT have push permissions.");
    }
  } catch (error: any) {
    console.error("GitHub API Error:", error.response?.status, error.response?.data || error.message);
  }
}

testPush();
