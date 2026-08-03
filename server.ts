/**
 * server.ts
 * Main Express server entry point for FindAba City OS.
 * Manages middleware, API routes, and serves the Vite application.
 */
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import { env, missingRequiredEnv } from "./server/services/env";
import { adminRouter } from "./server/routes/admin";
import { oracleRouter } from "./server/routes/oracle";
import { authRouter } from "./server/routes/auth";
import { githubRouter } from "./server/routes/github";
import { whatsappRouter } from "./server/routes/whatsapp";
import { paymentRouter } from "./server/routes/payment";
import { emailRouter } from "./server/routes/email";

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

// --- Core Middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
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

// --- Fail fast, but with JSON, not a blank body ---
// If required config (e.g. Supabase) is missing, every /api/* call would
// otherwise 500 with an empty body and the frontend would see
// "Unexpected end of JSON input". This turns that into a diagnosable error.
if (missingRequiredEnv.length > 0) {
  console.error(`[FindAba] Server misconfigured -- missing: ${missingRequiredEnv.join(", ")}`);
  app.use("/api", (req, res) => {
    res.status(503).json({
      success: false,
      error: "Server misconfigured",
      details: `Missing required environment variable(s): ${missingRequiredEnv.join(", ")}. Set these in your deployment's environment settings and redeploy.`,
    });
  });
}

// --- API Routes ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    node: "FindAba-City-OS-V1",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/api", adminRouter);
app.use("/api", oracleRouter);
app.use("/api/auth", authRouter);
app.use("/api/git", githubRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api", paymentRouter);
app.use("/api", emailRouter);

// --- Vite / Static Assets ---
async function setupVite() {
  if (env.NODE_ENV !== "production" && !env.IS_VERCEL) {
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
