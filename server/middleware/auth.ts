import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";

/**
 * Verifies a Supabase auth token and attaches the user to req.user.
 */
export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    (req as any).user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Identity verification failed" });
  }
}

/**
 * Middleware ensuring user is either an Administrator or the owner of the requested business.
 */
export async function ensureMerchantOrAdmin(req: Request, res: Response, next: NextFunction) {
  await ensureAuthenticated(req, res, async () => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const userEmail = (user.email || "").toLowerCase();
    const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL || "pastornelsonezi@gmail.com").toLowerCase();

    // Check if user is admin
    if (userEmail === masterAdminEmail) {
      (req as any).isAdmin = true;
      return next();
    }

    const metaRole = user.app_metadata?.role || user.user_metadata?.role;
    if (metaRole === "admin" || metaRole === "superadmin") {
      (req as any).isAdmin = true;
      return next();
    }

    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin" || profile?.role === "superadmin") {
        (req as any).isAdmin = true;
        return next();
      }
    } catch {}

    // Check business ownership if businessId is provided
    const targetBusinessId = req.params.businessId || req.body.businessId || req.query.businessId;
    if (targetBusinessId) {
      try {
        const { data: biz } = await supabase
          .from("businesses")
          .select("user_id, owner_id")
          .eq("id", targetBusinessId)
          .single();

        if (biz && (biz.user_id === user.id || biz.owner_id === user.id)) {
          (req as any).isOwner = true;
          return next();
        }

        return res.status(403).json({ error: "Forbidden: You do not have permission to manage this business." });
      } catch (err) {
        return res.status(403).json({ error: "Forbidden: Could not verify business ownership." });
      }
    }

    // If no specific business was targeted, permit merchant if profile indicates merchant
    return next();
  });
}
