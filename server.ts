/**
 * server.ts
 * Main Express server entry point for FindAba City OS.
 * Manages middleware, API routes, and serves the Vite application.
 */
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./server/services/env";
import { loadSystemConfig } from "./server/services/configService";
import { adminRouter } from "./server/routes/admin";
import { oracleRouter } from "./server/routes/oracle";
import { authRouter } from "./server/routes/auth";
import { githubRouter } from "./server/routes/github";
import { whatsappRouter } from "./server/routes/whatsapp";
import { paymentRouter } from "./server/routes/payment";
import { emailRouter } from "./server/routes/email";
import { storiesRouter } from "./server/routes/stories";
import { searchRouter } from "./server/routes/search";
import { businessesRouter } from "./server/routes/businesses";
import { startStoryScraperService } from "./server/services/storyScraper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("[FindAba] Initializing City OS Backbone...");
console.log("[FindAba] Config Audit:", {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  hasGithub: !!env.GITHUB_TOKEN,
  hasAi: !!(env.OPENROUTER_API_KEY || env.GEMINI_API_KEY),
  hasSupabase: !!env.SUPABASE_URL
});

export const app = express();
app.set("trust proxy", 1);

/**
 * Validates required environment variables and logs actionable warnings.
 */
function validateEnvironment() {
  const required = [
    { key: "GITHUB_REPO", description: "GitHub repository (owner/repo)" },
    { key: "GITHUB_TOKEN", description: "GitHub Personal Access Token" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase Service Role Key" },
    { key: "WHATSAPP_ACCESS_TOKEN", description: "WhatsApp API Token" },
  ];
  const missing = required.filter(item => !process.env[item.key]);
  if (missing.length > 0) {
    console.warn("\n=== ⚠️  CONFIGURATION ALERT ===");
    console.warn("Missing environment variables in AI Studio Secrets:");
    missing.forEach(item => console.warn(`- ${item.key}: ${item.description}`));
    console.warn("ACTION: Go to AI Studio -> Settings -> Secrets to add these.");
    console.warn("================================\n");
  } else {
    console.log("[FindAba] ✅ Environment verified.");
  }
}

// Run validation
validateEnvironment();

// Asynchronously load persistent configuration from Supabase and cache
loadSystemConfig()
  .then((cfg) => {
    console.log(`[FindAba] Authoritative persistent config loaded: ${cfg.repository} (${cfg.branch}) - Connected: ${cfg.connected}`);
  })
  .catch((err) => {
    console.warn("[FindAba] Initial config load note:", err.message);
  });

// --- Core Middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(compression() as any);
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "X-GitHub-Token", "X-GitHub-Repo", "X-GitHub-Branch"],
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// --- Request Logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.url.startsWith("/api")) {
      const duration = Date.now() - start;
      console.log(`[Mesh] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// --- API Routes ---
app.get("/api/health", (req, res) => {
  const required = ["GITHUB_REPO", "GITHUB_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "WHATSAPP_ACCESS_TOKEN"];
  const envStatus = required.reduce((acc, key) => {
    acc[key] = !!process.env[key] ? "PRESENT" : "MISSING";
    return acc;
  }, {} as Record<string, string>);

  res.json({
    status: "ok",
    node: "FindAba-City-OS-V1",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    github: {
      repo: env.GITHUB_REPO,
      branch: env.GITHUB_BRANCH,
      hasToken: !!env.GITHUB_TOKEN,
      configured: !!(env.GITHUB_REPO && env.GITHUB_TOKEN)
    },
    database: {
      hasUrl: !!env.SUPABASE_URL,
      hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY
    },
    environment: envStatus
  });
});

app.use("/api", adminRouter);
app.use("/api", oracleRouter);
app.use("/api/auth", authRouter);
app.use("/api/github", githubRouter);
app.use("/api/git", githubRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api", paymentRouter);
app.use("/api", emailRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/search", searchRouter);
app.use("/api/businesses", businessesRouter);
app.use("/api/directory", businessesRouter);

// --- API 404 Handler ---
// This ensures that missing API routes return JSON instead of the SPA HTML catch-all.
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API Route Not Found",
    path: req.originalUrl || req.url,
    message: "The requested industrial signal is not recognized by the City OS backbone."
  });
});

// Launch background story scraper service on long-running node instances
if (!env.IS_VERCEL) {
  startStoryScraperService(15 * 60 * 1000);
}

// --- Vite / Static Assets ---
async function setupVite() {
  if (env.NODE_ENV !== "production" && !env.IS_VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// --- Bootstrap ---
if (!env.IS_VERCEL) {
  setupVite().then(() => {
    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`[City OS] Operational at http://0.0.0.0:${env.PORT}`);
    });
  }).catch(err => {
    console.error("[City OS] Bootstrap Failed:", err);
  });
}

export default app;
