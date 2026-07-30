import { Router } from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { env } from "../services/env";

export const authRouter = Router();

/** Rate limit authentication endpoints. */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

authRouter.get("/github/url", loginRateLimit, (req, res) => {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientOrigin = req.query.origin as string;

  if (!clientId) {
    return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
  }

  let redirectUri: string;
  if (clientOrigin) {
    redirectUri = `${clientOrigin.replace(/\/$/, "")}/api/auth/github/callback`;
  } else if (env.APP_URL) {
    redirectUri = `${env.APP_URL.replace(/\/$/, "")}/api/auth/github/callback`;
  } else {
    const host = req.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    redirectUri = `${protocol}://${host}/api/auth/github/callback`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user repo",
    state: crypto.randomUUID(),
  });

  res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
});

authRouter.get("/github/callback", loginRateLimit, async (req, res) => {
  const { code } = req.query;
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return res.status(400).send("Missing code or GitHub OAuth configuration");
  }

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: clientId, client_secret: clientSecret, code },
      { headers: { Accept: "application/json" } }
    );

    const { access_token } = response.data;
    if (!access_token) return res.status(400).send("Failed to obtain access token");

    res.cookie("github_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.send(`
      <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
            window.close();
          } else { window.location.href = '/'; }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body></html>
    `);
  } catch (error: any) {
    console.error("[Auth] GitHub OAuth error:", error.response?.data || error.message);
    res.status(500).send("Internal Server Error during GitHub OAuth");
  }
});

authRouter.post("/github/logout", (req, res) => {
  res.clearCookie("github_token", { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ success: true });
});

authRouter.get("/github/user", async (req, res) => {
  const token = req.cookies.github_token;
  if (!token) return res.status(401).json({ error: "Not authenticated with GitHub" });

  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "FindAba-City-OS", Accept: "application/vnd.github.v3+json" },
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    if (status === 401 || status === 403) res.clearCookie("github_token");
    res.status(status).json({ error: "Failed to fetch GitHub user", details: error.response?.data?.message || error.message });
  }
});
