import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { supabase } from "../services/supabase";
import { ensureAdmin } from "../middleware/admin";
import { env, publicConfig } from "../services/env";
import {
  loadSystemConfig,
  saveSystemConfig,
  getSanitizedConfig,
  testSystemConnections,
} from "../services/configService";

export const adminRouter = Router();

/**
 * GET /api/admin/config
 * Authoritative administrator endpoint to retrieve full persistent system configuration.
 * Returns sanitized configuration (no raw secrets/tokens).
 * Gated strictly by ensureAdmin.
 */
adminRouter.get("/admin/config", ensureAdmin, async (_req, res) => {
  try {
    const config = await getSanitizedConfig();
    res.json(config);
  } catch (error: any) {
    console.error("[AdminConfig] Error fetching system configuration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load persistent system configuration",
      details: error.message,
    });
  }
});

/**
 * POST /api/admin/config
 * Authoritative administrator endpoint to update persistent system configuration.
 * Persists to Supabase `system_git_config`, local durable cache, and runtime environment.
 * Gated strictly by ensureAdmin.
 */
adminRouter.post("/admin/config", ensureAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      repository,
      repo,
      branch,
      githubToken,
      token,
      connected,
      active,
      deployment,
    } = body;

    // Validate branch if provided
    if (branch !== undefined && (typeof branch !== "string" || !branch.trim())) {
      return res.status(400).json({
        success: false,
        error: "Branch must be a non-empty string",
      });
    }

    const updated = await saveSystemConfig({
      repository: repository || repo,
      branch: branch ? branch.trim() : undefined,
      githubToken: githubToken || token,
      connected: typeof connected === "boolean" ? connected : undefined,
      active: typeof active === "boolean" ? active : undefined,
      deployment: deployment && typeof deployment === "object" ? deployment : undefined,
    });

    res.json({
      message: "System configuration saved and persisted reliably to Supabase and environment",
      ...updated,
    });
  } catch (error: any) {
    console.error("[AdminConfig] Error saving system configuration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to persist system configuration",
      details: error.message,
    });
  }
});

/**
 * POST /api/admin/config/test
 * Test all external service connections (GitHub, Supabase, etc.) and update persistent connection status.
 * Gated strictly by ensureAdmin.
 */
adminRouter.post("/admin/config/test", ensureAdmin, async (_req, res) => {
  try {
    const results = await testSystemConnections();
    const config = await getSanitizedConfig();
    res.json({
      success: true,
      results,
      config,
    });
  } catch (error: any) {
    console.error("[AdminConfig] Error testing system connections:", error);
    res.status(500).json({
      success: false,
      error: "Connection testing failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/config
 * Consolidated handler: Auth header optional.
 * - public request -> returns publicConfig(false)
 * - authenticated admin -> returns publicConfig(true)
 */
adminRouter.get("/config", async (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;

  // First ensure persistent config is loaded into env
  await loadSystemConfig().catch(() => {});

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

/**
 * POST /api/admin/businesses/:id/verify
 * Authoritatively verify a business in the registry.
 */
adminRouter.post("/admin/businesses/:id/verify", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { level } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: "Missing business ID" });

    const updates = {
      verification_status: "Verified",
      status: "approved",
      verification_level: level || "Document Verified",
      is_verified: true,
      integrity_grade: "B",
    };

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Business ${data.name || id} verified successfully`,
      business: data,
    });
  } catch (error: any) {
    console.error("[AdminBusinesses] Verify error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to verify business" });
  }
});

/**
 * POST /api/admin/businesses/:id/unverify
 * Authoritatively unverify a business in the registry.
 */
adminRouter.post("/admin/businesses/:id/unverify", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Missing business ID" });

    const updates = {
      verification_status: "Unverified",
      verification_level: "Listed",
      is_verified: false,
      status: "pending",
      premium_features_enabled: false,
    };

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Business ${data.name || id} unverified successfully`,
      business: data,
    });
  } catch (error: any) {
    console.error("[AdminBusinesses] Unverify error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to unverify business" });
  }
});

/**
 * POST /api/admin/businesses/:id/delist
 * Delist or relist a business in the registry.
 * Body: { delist: boolean } (default true)
 */
adminRouter.post("/admin/businesses/:id/delist", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const shouldDelist = req.body.delist !== false;
    if (!id) return res.status(400).json({ success: false, error: "Missing business ID" });

    const updates = shouldDelist
      ? {
          status: "delisted",
          verification_status: "Delisted",
          is_verified: false,
        }
      : {
          status: "approved",
          verification_status: "Unverified",
          is_verified: false,
        };

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Business ${data.name || id} ${shouldDelist ? "delisted" : "relisted"} successfully`,
      business: data,
    });
  } catch (error: any) {
    console.error("[AdminBusinesses] Delist error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update business delist status" });
  }
});

/**
 * DELETE /api/admin/businesses/:id
 * Permanently delete a business and clean up references.
 */
adminRouter.delete("/admin/businesses/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Missing business ID" });

    // Clean up any referencing rows if necessary
    try {
      await supabase.from("products").delete().eq("business_id", id);
    } catch {}
    try {
      await supabase.from("favorites").delete().eq("business_id", id);
    } catch {}
    try {
      await supabase.from("reviews").delete().eq("business_id", id);
    } catch {}

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: `Business ${id} permanently deleted`,
      id,
    });
  } catch (error: any) {
    console.error("[AdminBusinesses] Delete error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete business" });
  }
});
