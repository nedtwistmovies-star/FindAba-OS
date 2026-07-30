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

  const token = authHeader.replace("Bearer ", "");

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
