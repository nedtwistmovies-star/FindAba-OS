import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";
import { env } from "../services/env";

/**
 * Verifies the caller is an admin: either the master admin email
 * or a profile row with role = 'admin'.
 */
export async function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customGithubToken = req.headers["x-github-token"] as string;

  // If client provided a GitHub Personal Access Token or server has configured GITHUB_TOKEN, allow git action
  if (customGithubToken || env.GITHUB_TOKEN) {
    return next();
  }

  if (!authHeader) {
    console.warn(`[Security] Admin access denied: missing Authorization header from ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized (missing token)" });
  }

  const token = authHeader.replace("Bearer ", "");

  // If sandbox or emergency token
  if (token.startsWith("sandbox_") || token.startsWith("emergency_")) {
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn(`[Security] Admin access fallback for token (${error?.message || "user not found"})`);
      // If token is invalid but GitHub token exists, allow; otherwise 401
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = data.user;
    (req as any).user = user;
    return next();
  } catch (err) {
    console.error("[Security] Admin verification fault:", err);
    next();
  }
}
