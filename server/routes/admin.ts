import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { supabase } from "../services/supabase";
import { ensureAdmin } from "../middleware/admin";
import { env, publicConfig } from "../services/env";

export const adminRouter = Router();

/**
 * GET /api/config
 * Consolidated handler: Auth header optional.
 * - public request -> returns publicConfig(false)
 * - authenticated admin -> returns publicConfig(true)
 */
adminRouter.get("/config", async (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const { data } = await supabase.auth.getUser(token);
      const user = data?.user;
      if (user) {
        if (user.email === env.MASTER_ADMIN_EMAIL) {
          isAdmin = true;
        } else {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          if (profile?.role === "admin") isAdmin = true;
        }
      }
    } catch {
      // Ignore token verification errors for public config endpoint
    }
  }

  res.json(publicConfig(isAdmin));
});


/** Basic network diagnostic (admin only). */
adminRouter.get("/debug/network", ensureAdmin, async (req, res) => {
  const results: any = { timestamp: new Date().toISOString(), connectivity: {} };
  const targets = [
    { name: "github", url: "https://api.github.com/zen" },
    { name: "supabase", url: env.SUPABASE_URL },
    { name: "google", url: "https://www.google.com" },
  ];

  for (const target of targets) {
    try {
      const start = Date.now();
      await axios.get(target.url, { timeout: 5000 });
      results.connectivity[target.name] = { status: "ok", latency: `${Date.now() - start}ms` };
    } catch (err: any) {
      results.connectivity[target.name] = { status: "error", message: err.message, code: err.code };
    }
  }

  res.json(results);
});

adminRouter.get("/readme", async (req, res) => {
  try {
    const readmePath = path.join(process.cwd(), "README.md");
    const content = await fs.readFile(readmePath, "utf-8");
    res.json({ content });
  } catch {
    res.status(404).json({ error: "README.md not found" });
  }
});

adminRouter.post("/metadata", ensureAdmin, async (req, res) => {
  try {
    const metadataPath = path.join(process.cwd(), "metadata.json");
    await fs.writeFile(metadataPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: "Metadata updated successfully" });
  } catch (error: any) {
    console.error("[Admin] Failed to update metadata:", error);
    res.status(500).json({ error: "Failed to update metadata", details: error.message });
  }
});
