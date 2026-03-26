import type { VercelRequest, VercelResponse } from "@vercel/node";

type ConfigResponse = {
  appName: string;
  version: string;
  environment: string;
  region?: string;
  timestamp: string;

  // 🔹 REQUIRED FOR FRONTEND SYNC
  supabaseUrl?: string;
  supabaseKey?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow only GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response: ConfigResponse = {
      appName: "FindAba OS",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      region: process.env.VERCEL_REGION || "unknown",
      timestamp: new Date().toISOString(),

      // 🔹 CRITICAL: expose ONLY public-safe keys
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_ANON_KEY || "",
    };

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error?.message || "Unknown error",
    });
  }
}