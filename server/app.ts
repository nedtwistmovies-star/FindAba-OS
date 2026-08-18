import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { env } from "./services/env";
import { adminRouter } from "./routes/admin";
import { oracleRouter } from "./routes/oracle";
import { authRouter } from "./routes/auth";
import { githubRouter } from "./routes/github";
import { whatsappRouter } from "./routes/whatsapp";
import { paymentRouter } from "./routes/payment";
import { emailRouter } from "./routes/email";

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

// --- Environment Validation ---

function validateEnvironment() {
  const required = [
    { key: "GITHUB_REPO", description: "GitHub repository (owner/repo)" },
    { key: "GITHUB_TOKEN", description: "GitHub Personal Access Token" },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      description: "Supabase Service Role Key"
    },
    {
      key: "WHATSAPP_ACCESS_TOKEN",
      description: "WhatsApp API Token"
    }
  ];

  const missing = required.filter(item => !process.env[item.key]);

  if (missing.length > 0) {
    console.warn("\n=== ⚠️ CONFIGURATION ALERT ===");

    missing.forEach(item => {
      console.warn(`- ${item.key}: ${item.description}`);
    });

    console.warn("================================\n");
  } else {
    console.log("[FindAba] ✅ Environment verified.");
  }
}

validateEnvironment();

// --- Core Middleware ---

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "X-GitHub-Token",
      "X-GitHub-Repo",
      "X-GitHub-Branch"
    ]
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

      console.log(
        `[Mesh] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
      );
    }
  });

  next();
});

// --- API Health ---

app.get("/api/health", (req, res) => {
  const required = [
    "GITHUB_REPO",
    "GITHUB_TOKEN",
    "SUPABASE_SERVICE_ROLE_KEY",
    "WHATSAPP_ACCESS_TOKEN"
  ];

  const envStatus = required.reduce((acc, key) => {
    acc[key] = process.env[key] ? "PRESENT" : "MISSING";
    return acc;
  }, {} as Record<string, string>);

  res.json({
    status: "ok",
    node: "FindAba-City-OS-V1",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: envStatus
  });
});

// --- API Routes ---

console.log("[DEBUG] adminRouter");
app.use("/api", adminRouter);

console.log("[DEBUG] oracleRouter");
app.use("/api", oracleRouter);

console.log("[DEBUG] authRouter");
app.use("/api/auth", authRouter);

console.log("[DEBUG] githubRouter");
app.use("/api/git", githubRouter);

console.log("[DEBUG] whatsappRouter");
app.use("/api/whatsapp", whatsappRouter);

console.log("[DEBUG] paymentRouter");
app.use("/api", paymentRouter);

console.log("[DEBUG] emailRouter");
app.use("/api", emailRouter);

export default app;
