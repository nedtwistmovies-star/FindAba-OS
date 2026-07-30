import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./services/env";
import { adminRouter } from "./routes/admin";
import { oracleRouter } from "./routes/oracle";
import { authRouter } from "./routes/auth";
import { githubRouter } from "./routes/github";
import { whatsappRouter } from "./routes/whatsapp";
import { paymentRouter } from "./routes/payment";
import { emailRouter } from "./routes/email";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Initializing FindAba City OS Server...");
console.log("Environment check:", {
  hasOpenRouterKey: !!env.OPENROUTER_API_KEY,
  hasGeminiKey: !!env.GEMINI_API_KEY,
  defaultAiProvider: env.DEFAULT_AI_PROVIDER,
  nodeEnv: env.NODE_ENV,
});

export const app = express();
app.set("trust proxy", true);

// --- Security & Performance middleware ---
// Disable CSP in helmet so Vite SPA script tags, fonts, & leaflet maps load without header restrictions in container/iframe.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// --- Request logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.url.startsWith("/api") || (res.statusCode >= 400 && res.statusCode !== 404)) {
      const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
      console.log(`[Mesh-Node] ${level} ${req.method} ${req.url} ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// --- Global process-level error handlers ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.get("/api/health", async (req, res) => {
  try {
    const { supabase } = await import("./services/supabase");
    const { error } = await supabase.from("platform_config").select("id").limit(1);
    if (error && error.code !== "42501" && error.code !== "42P01") throw error;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: {
        hasGithubToken: !!env.GITHUB_TOKEN,
        hasAiProvider: !!(env.OPENROUTER_API_KEY || env.GEMINI_API_KEY),
        hasSupabase: true,
      },
    });
  } catch (err: any) {
    console.warn("[Health] Core check degraded:", err.message);
    res.status(503).json({ status: "degraded", message: err.message });
  }
});

// --- Route mounting ---
app.use("/api", adminRouter);
app.use("/api", oracleRouter);
app.use("/api/auth", authRouter);
app.use("/api/git", githubRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api", paymentRouter);
app.use("/api", emailRouter);

// --- Catch-all for unhandled API routes ---
app.all("/api/*", (req, res) => {
  console.warn(`[Server] Unhandled API request: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Mesh route not found: ${req.url}` });
});

async function setupViteOrStatic() {
  if (env.NODE_ENV !== "production" && !env.IS_VERCEL) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// --- Global error handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Server] FATAL ROUTE ERROR:", err.stack || err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    success: false,
    error: "A critical server error occurred within the City OS mesh.",
    details: err.message,
  });
});

if (!env.IS_VERCEL) {
  setupViteOrStatic()
    .then(() => {
      app.listen(env.PORT, "0.0.0.0", () => {
        console.log(`[Industrial-OS] Server online at http://0.0.0.0:${env.PORT}`);
      });
    })
    .catch((err) => {
      console.error("[Industrial-OS] Initialization failure:", err);
      app.listen(env.PORT, "0.0.0.0", () => {
        console.warn(`[Industrial-OS] Server running in failsafe mode on port ${env.PORT}`);
      });
    });
}

export default app;
