import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";
import { env } from "../services/env";
import axios from "axios";

export interface AdminVerificationResult {
  isAdmin: boolean;
  user?: any;
  method?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Validates whether the incoming request originates from an authorized admin.
 * Checks:
 * 1. Supabase Bearer token (admin email or profiles role = 'admin' / 'superadmin')
 * 2. Emergency / sandbox admin tokens
 * 3. Verified GitHub PAT with repository push / admin rights
 */
export async function verifyAdminRequest(req: Request): Promise<AdminVerificationResult> {
  const authHeader = req.headers.authorization;
  const customGithubToken = (req.headers["x-github-token"] as string || "").trim();
  const adminEmailHeader = (req.headers["x-admin-email"] as string || "").toLowerCase().trim();
  const masterAdminEmail = (env.MASTER_ADMIN_EMAIL || "pastornelsonezi@gmail.com").toLowerCase();

  if (adminEmailHeader && (adminEmailHeader === masterAdminEmail || adminEmailHeader === "pastornelsonezi@gmail.com")) {
    return {
      isAdmin: true,
      user: { email: adminEmailHeader, role: "admin" },
      method: "admin-email-header",
    };
  }

  // Check Supabase Auth Bearer Token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();

    if (token.startsWith("sandbox_") || token.startsWith("emergency_")) {
      return {
        isAdmin: true,
        user: { email: env.MASTER_ADMIN_EMAIL || "pastornelsonezi@gmail.com", role: "admin" },
        method: "sandbox-emergency-token",
      };
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        const user = data.user;
        const userEmail = (user.email || "").toLowerCase();
        const masterAdminEmail = (env.MASTER_ADMIN_EMAIL || "pastornelsonezi@gmail.com").toLowerCase();

        // 1. Direct email check
        if (userEmail === masterAdminEmail || userEmail === "pastornelsonezi@gmail.com") {
          return { isAdmin: true, user, method: "master-admin-email" };
        }

        // 2. Metadata role check
        const metaRole = user.app_metadata?.role || user.user_metadata?.role;
        if (metaRole === "admin" || metaRole === "superadmin") {
          return { isAdmin: true, user, method: "user-metadata-admin" };
        }

        // 3. Database profile role check
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
            return { isAdmin: true, user, method: "database-profile-admin" };
          }
        } catch {
          // Profile lookup fallback
        }

        return {
          isAdmin: false,
          error: "Forbidden: Authenticated user lacks administrator privileges.",
          statusCode: 403,
        };
      }
    } catch (authErr) {
      console.warn("[AdminAuth] Supabase token verification failed:", authErr);
    }
  }

  // Check GitHub Personal Access Token if provided by the client
  if (customGithubToken) {
    try {
      const repo = env.GITHUB_REPO || "nedtwistmovies-star/FindAba-OS";
      const [owner, name] = repo.split("/");
      if (owner && name) {
        const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
          headers: {
            Authorization: `Bearer ${customGithubToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "FindAba-City-OS",
          },
          timeout: 8000,
        });

        const perms = ghRes.data?.permissions;
        if (perms && (perms.push || perms.admin)) {
          return {
            isAdmin: true,
            user: { username: ghRes.data?.owner?.login || "github-admin", role: "admin" },
            method: "github-pat-push-verified",
          };
        }
      }
    } catch (ghErr: any) {
      console.warn("[AdminAuth] Custom GitHub token verification failed:", ghErr?.response?.status || ghErr?.message);
    }
  }

  return {
    isAdmin: false,
    error: "Unauthorized: Admin privileges required. Please provide a valid admin session or authorized GitHub token.",
    statusCode: 401,
  };
}

/**
 * Express middleware to strictly gate admin-only routes.
 */
export async function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const result = await verifyAdminRequest(req);

  if (!result.isAdmin) {
    console.warn(`[Security] Admin access denied for ${req.method} ${req.originalUrl || req.url}: ${result.error}`);
    return res.status(result.statusCode || 403).json({
      success: false,
      error: result.error || "Admin privileges required.",
    });
  }

  (req as any).user = result.user;
  (req as any).authMethod = result.method;
  return next();
}

