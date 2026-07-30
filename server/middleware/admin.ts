import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";
import { env } from "../services/env";

/**
 * Verifies the caller is an admin: either the master admin email
 * or a profile row with role = 'admin'.
 */
export async function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn(`[Security] Admin access denied: missing Authorization header from ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized (missing token)" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn(`[Security] Admin access denied: invalid token (${error?.message || "user not found"})`);
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = data.user;

    if (user.email === env.MASTER_ADMIN_EMAIL) {
      (req as any).user = user;
      return next();
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      console.warn(`[Security] Unauthorized admin access attempt by ${user.email}`);
      return res.status(403).json({ error: "Administrative privileges required" });
    }

    (req as any).user = user;
    next();
  } catch (err) {
    console.error("[Security] Admin verification fault:", err);
    res.status(500).json({ error: "Internal security fault" });
  }
}
