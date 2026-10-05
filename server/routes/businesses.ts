import { Router } from "express";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { env } from "../services/env";

export const businessesRouter = Router();

// Lazy Supabase client initialization
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient && env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
    supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || "",
      {
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );
  }
  return supabaseClient;
}

/**
 * Load local businesses snapshot from disk as persistent fallback.
 */
function getDiskBusinesses(): any[] {
  try {
    const candidates = [
      path.join(process.cwd(), "supabase", "businesses.json"),
      path.join(process.cwd(), "registry.json")
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.businesses) ? parsed.businesses : []);
        if (list.length > 0) {
          return list;
        }
      }
    }
  } catch (err: any) {
    console.warn("[Businesses API] Failed reading disk fallback:", err.message);
  }
  return [];
}

/**
 * GET /api/businesses
 * Critical business directory endpoint optimized for Service Worker caching.
 * Provides comprehensive listings, category filters, and contact details
 * with aggressive HTTP caching and offline resilience.
 */
businessesRouter.get("/", async (req, res) => {
  let source = "cache_disk";
  let businesses: any[] = [];

  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .neq("status", "delisted")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        businesses = data;
        source = "supabase_cloud";
      }
    }
  } catch (err: any) {
    console.warn("[Businesses API] Supabase fetch error, falling back to disk:", err.message);
  }

  // Fallback to disk snapshot if cloud was empty or unreachable
  if (businesses.length === 0) {
    businesses = getDiskBusinesses().filter((b: any) => b && b.status !== "delisted");
    source = "local_disk_snapshot";
  }

  // Optional category / area query filtering
  const categoryFilter = req.query.category as string;
  const areaFilter = req.query.area as string;
  const searchQuery = (req.query.q as string || "").toLowerCase().trim();

  let filtered = businesses;
  if (categoryFilter && categoryFilter !== "All" && categoryFilter !== "All Categories") {
    filtered = filtered.filter(b => b.category === categoryFilter);
  }
  if (areaFilter && areaFilter !== "All" && areaFilter !== "All Areas") {
    filtered = filtered.filter(b => b.area === areaFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter(b => {
      const name = (b.name || "").toLowerCase();
      const cat = (b.category || "").toLowerCase();
      const prod = (b.primary_product_or_service || "").toLowerCase();
      const area = (b.area || "").toLowerCase();
      return name.includes(searchQuery) || cat.includes(searchQuery) || prod.includes(searchQuery) || area.includes(searchQuery);
    });
  }

  // Sanitized critical contact & directory payload
  const resultData = filtered.map(b => ({
    id: b.id,
    name: b.name,
    category: b.category || "General Trade",
    primary_product_or_service: b.primary_product_or_service || "",
    area: b.area || "Aba Township",
    address: b.address || "",
    phone_whatsapp: b.phone_whatsapp || b.phone || "",
    phone: b.phone || b.phone_whatsapp || "",
    email: b.email || "",
    image_url: b.image_url || "",
    rating: typeof b.rating === "number" ? b.rating : 0,
    review_count: typeof b.review_count === "number" ? b.review_count : 0,
    verification_status: b.verification_status || (b.is_verified ? "Verified" : "Unverified"),
    verification_level: b.verification_level || "Listed",
    description: b.description || "",
    products: Array.isArray(b.products) ? b.products : [],
    skills: Array.isArray(b.skills) ? b.skills : [],
    latitude: typeof b.latitude === "number" ? b.latitude : null,
    longitude: typeof b.longitude === "number" ? b.longitude : null,
    status: b.status || "active",
    updated_at: b.updated_at || b.created_at || new Date().toISOString()
  }));

  // Aggressive caching headers for Service Worker and mobile browsers
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  res.setHeader("X-Directory-Source", source);
  res.setHeader("X-Directory-Count", String(resultData.length));

  // Return both array and structured object response compatibility
  res.json(resultData);
});

/**
 * GET /api/businesses/:id
 * Fetches a single business record with complete contact information.
 */
businessesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  let business: any = null;

  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        business = data;
      }
    }
  } catch (err: any) {
    console.warn(`[Businesses API] Single fetch error for ${id}:`, err.message);
  }

  if (!business) {
    const diskList = getDiskBusinesses();
    business = diskList.find((b: any) => b && b.id === id);
  }

  if (!business || business.status === "delisted") {
    return res.status(404).json({ error: "Business not found or has been delisted." });
  }

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  res.json(business);
});
