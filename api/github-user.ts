import axios from "axios";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "GitHub fetch failed" });
  }
      }
