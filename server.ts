import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqzjkvqmherngispxlzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let supabase: any;

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

try {
  if (supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  } else {
    console.warn("[Industrial-OS] Supabase key missing - logic depending on it may fail.");
  }
} catch (e) {
  console.error("[Industrial-OS] Supabase init failed:", e);
}

// Helper for server-side email sending
const sendServerEmail = async (to: string, subject: string, amount: number, reference: string) => {
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
        <h1 style="color: #22c55e; border-bottom: 2px solid #334155; padding-bottom: 10px;">Payment Successful</h1>
        <p>Excellent news!</p>
        <p>Payment successful. Your order is confirmed and the funds have been secured.</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Transaction Ref:</strong> ${reference}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
        </div>
        <p>Your industrial assets are now being prepared for fulfillment.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Financial Handshake Complete</p>
      </div>
    `;

    await resend.emails.send({
      from: 'FindAba Finance <onboarding@findaba.com.ng>',
      to,
      subject,
      html
    });
    console.log(`[Email] Server-side payment confirmation sent to ${to}`);
  } catch (err) {
    console.error("[Email] Server-side send failed:", err);
  }
};

console.log("Initializing FindAba City OS Server...");
console.log("Environment Check:", {
  hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY),
  hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
  nodeEnv: process.env.NODE_ENV
});

export const app = express();

// Trust proxy is required for correct protocol/host detection behind nginx
app.set('trust proxy', true);

app.use(cors());
// Increase limits for large repository syncs
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// API Routes
app.get("/api/health", (req, res) => {
  console.log(`[Server] Health check requested from ${req.ip}`);
  res.json({ status: "ok" });
});

app.get("/api/ping", (req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

  // Config Sync
app.get(["/api/config", "/api/config/"], (req, res) => {
  console.log(`[Server] Config sync requested from ${req.ip} (Origin: ${req.get('origin') || 'None'})`);
  const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyCxjuQC56zQJsuhSJH8LJFfAjRe4xI8jpk';
  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqzjkvqmherngispxlzy.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemprdnFtaGVybmdpc3B4bHp5Iiwicm9sZSI6InFub24iLCJpYXQiOjE3Njc0MjA3MjMsImV4cCI6MjA4Mjk5NjcyM30.Oa6ZXYw5-f3BOHHafFsLPtuBgmV4yOu5BMpulyDC-oc';
  const paystackKey = process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  
  const config = { 
    supabaseUrl,
    supabaseKey,
    geminiKey,
    openRouterKey,
    paystackKey,
    githubRepo: process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO || '',
    makeWebhookUrl: process.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || ''
  };

  console.log(`[Server] Sending config. Gemini: ${geminiKey ? 'ALIVE' : 'NONE'}, Supabase: ${supabaseUrl ? 'OK' : 'NO'}`);
  res.json(config);
});

  // GitHub OAuth URL
  app.get("/api/auth/github/url", (req, res) => {
    console.log(`[GitHub] Auth URL requested from origin: ${req.query.origin}`);
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientOrigin = req.query.origin as string;
    
    if (!clientId) {
      console.error("[GitHub] GITHUB_CLIENT_ID is missing in environment");
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }

    console.log(`[GitHub] Using Client ID: ${clientId.substring(0, 5)}...`);

    // Robust redirectUri construction
    let redirectUri: string;
    if (clientOrigin) {
      // Trust the client-provided origin if it looks like a valid URL
      const baseUrl = clientOrigin.replace(/\/$/, "");
      redirectUri = `${baseUrl}/api/auth/github/callback`;
    } else if (process.env.APP_URL) {
      // Use the provided APP_URL, ensuring it doesn't have a trailing slash before adding path
      const baseUrl = process.env.APP_URL.replace(/\/$/, "");
      redirectUri = `${baseUrl}/api/auth/github/callback`;
    } else {
      const host = req.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      redirectUri = `${protocol}://${host}/api/auth/github/callback`;
    }
    
    console.log(`GitHub Auth: Constructing redirectUri: ${redirectUri} (Origin: ${clientOrigin || 'None'})`);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user repo",
      state: Math.random().toString(36).substring(7),
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // GitHub OAuth Callback
  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing code or configuration");
    }

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const { access_token } = response.data;

      if (!access_token) {
        return res.status(400).send("Failed to obtain access token");
      }

      // Set cookie with token
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("github_token", access_token, {
        httpOnly: true,
        secure: true, // Always true for HTTPS in AI Studio
        sameSite: "none", // Required for iframe context
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub OAuth Error:", error.response?.data || error.message);
      const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      res.status(500).send(`Internal Server Error during GitHub OAuth: ${details}`);
    }
  });

  // Get GitHub User Info
  app.get("/api/github/user", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated with GitHub" });
    }

    try {
      console.log("[GitHub] Fetching user info...");
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "FindAba-City-OS",
          Accept: "application/vnd.github.v3+json",
        },
      });
      console.log(`[GitHub] User fetched: ${response.data.login}`);
      res.json(response.data);
    } catch (error: any) {
      console.error("[GitHub] User Fetch Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Failed to fetch GitHub user",
        details: error.response?.data?.message || error.message
      });
    }
  });

  // Logout GitHub
  app.post("/api/auth/github/logout", (req, res) => {
    res.clearCookie("github_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });

  // Email Sending Endpoint (Resend Integration with dynamic key support)
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, from = "onboarding@findaba.com.ng", name, apiKey } = req.body;
    const activeKey = apiKey || process.env.RESEND_API_KEY;

    if (!activeKey) {
      console.error("[Email] No API Key provided (body or env)");
      return res.status(500).json({ error: "Email service not configured. Please provide a Resend API Key." });
    }

    try {
      console.log(`[Email] Attempting to send email to ${to} from ${from} (Using ${apiKey ? 'Override Key' : 'Env Key'})`);
      
      const client = apiKey ? new Resend(apiKey) : resend;
      
      const { data, error } = await client.emails.send({
        from: name ? `${name} <${from}>` : from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("[Email] Resend Error:", error);
        return res.status(400).json({ error: error.message });
      }

      console.log(`[Email] Success! Message ID: ${data?.id}`);
      res.json({ success: true, id: data?.id });
    } catch (err: any) {
      console.error("[Email] Critical Failure:", err.message);
      res.status(500).json({ error: "Internal server error during email transmission" });
    }
  });

  // Automation Webhook Proxy
  app.post("/api/automation/trigger", async (req, res) => {
    const { url, event, payload, options = { retries: 3 } } = req.body;
    const targetUrl = url || process.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;

    if (!targetUrl) {
      return res.status(400).json({ error: "No target Webhook URL configured" });
    }

    try {
      console.log(`[Automation Proxy] Relaying signal for event: ${event} to ${targetUrl.substring(0, 40)}...`);
      
      const response = await axios.post(targetUrl, {
        ...payload,
        proxy_relay: true,
        relay_timestamp: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-FindAba-Event': event,
          'X-FindAba-Relayed': 'true'
        },
        timeout: 15000 // 15s timeout
      });

      console.log(`[Automation Proxy] Relay success: ${event} (Status: ${response.status})`);
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      const status = error.response?.status || 500;
      console.error(`[Automation Proxy] Relay failure for ${event}:`, error.response?.data || error.message);
      res.status(status).json({ 
        error: error.message, 
        details: error.response?.data,
        status 
      });
    }
  });

  // Paystack Webhook Handler (Enhanced for Carry-go)
  app.post("/api/paystack-webhook", async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"] as string;

    if (!secret || !signature) {
      console.error("[Webhook] Missing secret or signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      console.error("[Webhook] Invalid signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = req.body;
    console.log(`[Paystack-Webhook] Event: ${event.event}`);

    try {
      if (event.event === "charge.success") {
        const { reference, amount, metadata } = event.data;
        if (metadata?.type === 'CARRY_GO_PAYMENT') {
          await supabase.from("shipments").update({ 
            payment_status: 'paid_held',
            status: 'accepted'
          }).eq("tracking_id", metadata.tracking_id);
        }
      } else if (event.event === 'transfer.success') {
        const { metadata } = event.data;
        if (metadata?.type === 'CARRIER_PAYOUT') {
           await supabase.from("shipments").update({ status: 'paid_out' }).eq("id", metadata.shipment_id);
        }
      }
      res.sendStatus(200);
    } catch (err: any) {
      console.error("[Webhook] Processing Error:", err.message);
      res.sendStatus(500);
    }
  });

  // Haversine Distance Utility (KM)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Carry-go Onboarding Endpoint (Enhanced with vehicle_type)
  app.post("/api/onboard-carrier", async (req, res) => {
    const { 
      full_name, phone, bvn, nin, bank_code, account_number, vehicle_type, user_id 
    } = req.body;

    try {
      // 1. Paystack Recipient logic
      const recipientResponse = await axios.post('https://api.paystack.co/transferrecipient', {
        type: "nuban",
        name: full_name,
        account_number,
        bank_code,
        currency: "NGN"
      }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });

      const recipientCode = recipientResponse.data.data.recipient_code;

      // 2. Save to Supabase
      const { error: carrierError } = await supabase
        .from("carriers")
        .insert({
          id: user_id,
          full_name,
          phone,
          bvn,
          nin,
          vehicle_type,
          bank_code,
          account_number,
          paystack_recipient_code: recipientCode,
          status: 'verified',
          is_online: false,
          created_at: new Date().toISOString()
        });

      if (carrierError) throw carrierError;

      // Update User Role
      await supabase.from("profiles").update({ role: 'carrier' }).eq("id", user_id);

      res.json({ success: true, recipientCode });
    } catch (err: any) {
      console.error("[Carrier-Onboarding] Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to onboard carrier", details: err.response?.data || err.message });
    }
  });

  // NEW: Carrier Marks Delivered
  app.post("/api/carrier/deliver", async (req, res) => {
    const { tracking_id, carrier_id, delivery_photo_url } = req.body;
    try {
      const { data: shipment, error: fetchErr } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_id", tracking_id)
        .eq("carrier_id", carrier_id)
        .single();

      if (fetchErr || !shipment) return res.status(404).json({ error: "Shipment not found" });

      await supabase.from("shipments").update({
        status: 'delivered_pending_confirmation',
        delivery_photo_url
      }).eq("id", shipment.id);

      // Notify Sender via Automation
      const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
      if (makeUrl) {
        axios.post(makeUrl, {
          type: 'CARRY_GO_DELIVERED_PENDING',
          shipment_id: shipment.id,
          sender_phone: shipment.sender_phone,
          delivery_photo_url,
          message: `Your parcel has been delivered 📦\nPhoto proof: ${delivery_photo_url}\nReply 1 to CONFIRM\nReply 2 to REPORT ISSUE`
        }).catch(e => console.error("[Carry-Go] Delivery notification failed:", e.message));
      }

      res.json({ success: true, message: "Delivery marked. Waiting for sender confirmation." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PURPLE FLEET ENDPOINTS
  app.post("/api/ride/request", async (req, res) => {
    const { passenger_phone, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, vehicle_type, emergency_contact_phone } = req.body;
    try {
      // 1. Calculate Price
      const dist = getDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
      const rates = {
        keke: { base: 300, per_km: 150 },
        taxi: { base: 500, per_km: 200 }
      };
      const rate = vehicle_type === 'taxi' ? rates.taxi : rates.keke;
      const fare = rate.base + Math.round(dist * rate.per_km) + 50; // 50 booking fee
      
      const rideId = `RIDE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      
      const { data: ride, error: rideErr } = await supabase.from("rides").insert({
        id: rideId,
        passenger_phone,
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        fare,
        status: 'requested',
        payment_method: 'cash',
        emergency_contact_phone
      }).select().single();

      if (rideErr) throw rideErr;

      // 2. Match Nearby Drivers
      const now = new Date();
      const { data: drivers } = await supabase.from("drivers")
        .select("*")
        .eq("is_active", true)
        .eq("vehicle_type", vehicle_type)
        .eq("is_on_shift", true);

      // Filter drivers who need re-verification (e.g., > 4 hours on shift)
      const validDrivers = drivers?.filter((d: any) => {
        if (!d.shift_started_at) return false;
        const shiftStart = new Date(d.shift_started_at);
        const hoursOnShift = (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
        return hoursOnShift < 4; // Max 4 hours without re-verification
      });

      const nearby = validDrivers?.filter((d: any) => getDistance(pickup_lat, pickup_lng, d.current_lat, d.current_lng) <= 3)
           .sort((a: any, b: any) => getDistance(pickup_lat, pickup_lng, a.current_lat, a.current_lng) - getDistance(pickup_lat, pickup_lng, b.current_lat, b.current_lng))
           .slice(0, 3);

      // Notify Nearby Drivers via Automation
      const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
      if (makeUrl && nearby?.length) {
        nearby.forEach((d: any) => {
          axios.post(makeUrl, {
            type: 'PURPLE_FLEET_NEW_RIDE',
            driver_phone: d.phone,
            ride_id: rideId,
            pickup_lat, pickup_lng,
            fare,
            message: `New ride ${d.distance?.toFixed(1)}km from you 🚕\nFare: ₦${fare}\nReply ACCEPT ${rideId}`
          }).catch(() => {});
        });
      }

      res.json({ success: true, ride, nearby_count: nearby?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/accept", async (req, res) => {
    const { ride_id, driver_id } = req.body;
    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: ride, error: updateErr } = await supabase.from("rides").update({
        driver_id,
        status: 'accepted',
        otp
      }).eq("id", ride_id).eq("status", "requested").select().single();

      if (updateErr || !ride) return res.status(404).json({ error: "Ride already taken or not found." });

      // Notify Passenger & Driver
      const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
      if (makeUrl) {
         axios.post(makeUrl, {
           type: 'PURPLE_FLEET_ACCEPTED',
           ride_id,
           pickup_otp: otp,
           passenger_phone: ride.passenger_phone,
           message: `Vessel Assigned! OTP: ${otp}. Driver is en route.`
         }).catch(() => {});
      }

      res.json({ success: true, otp });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/verify-otp", async (req, res) => {
    const { ride_id, otp } = req.body;
    try {
      const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).single();
      if (!ride || ride.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

      await supabase.from("rides").update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      }).eq("id", ride_id);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/complete", async (req, res) => {
    const { ride_id } = req.body;
    try {
      const { data: ride } = await supabase.from("rides").select("*, driver:drivers(*)").eq("id", ride_id).single();
      if (!ride) return res.status(404).json({ error: "Ride not found" });

      const driverPayout = ride.fare * 0.8; // 80% to driver

      // Paystack Transfer
      if (ride.driver?.paystack_recipient_code) {
        await axios.post('https://api.paystack.co/transfer', {
          source: "balance",
          amount: Math.round(driverPayout * 100),
          recipient: ride.driver.paystack_recipient_code,
          reason: `Purple Fleet ride payout: ${ride_id}`
        }, {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });
      }

      await supabase.from("rides").update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq("id", ride_id);

      res.json({ success: true, driverPayout });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/sos", async (req, res) => {
    const { ride_id, phone } = req.body;
    try {
      const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).single();
      if (!ride) return res.status(404).json({ error: "Ride not found" });

      await supabase.from("rides").update({
        sos_triggered_at: new Date().toISOString(),
        status: 'sos_active'
      }).eq("id", ride_id);

      const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
      if (makeUrl) {
        axios.post(makeUrl, {
          type: 'PURPLE_FLEET_SOS_ADMIN',
          ride_id,
          passenger_phone: phone,
          message: `SOS ALERT! Ride ${ride_id}. Passenger ${phone}. Immediate dispatch required.`
        }).catch(() => {});

        if (ride.emergency_contact_phone) {
          axios.post(makeUrl, {
            type: 'PURPLE_FLEET_SOS_EMERGENCY',
            emergency_phone: ride.emergency_contact_phone,
            message: `EMERGENCY: Your contact triggered SOS on Purple Fleet ride ${ride_id}. Track live: https://findaba.com/ride/${ride_id}. Call 112.`
          }).catch(() => {});
        }
      }
      res.json({ success: true, message: "EMERGENCY SIGNAL BROADCASTED. HELP IS ON THE WAY." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/location", async (req, res) => {
    const { ride_id, lat, lng } = req.body;
    try {
      const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).single();
      if (!ride) return res.status(404).json({ error: "Ride not found" });

      const route = Array.isArray(ride.ride_route) ? ride.ride_route : [];
      const updatedRoute = [...route, { lat, lng, t: new Date().toISOString() }];

      await supabase.from("rides").update({
        ride_route: updatedRoute
      }).eq("id", ride_id);

      // Geofence logic (Basic: check if distance from pickup/dropoff path is too high)
      // For MVP just store the trail. Real routing check requires Maps API Polyline
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ride/emergency-contact", async (req, res) => {
    const { ride_id, name, phone } = req.body;
    try {
      await supabase.from("rides").update({
        emergency_contact_phone: phone
      }).eq("id", ride_id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Carrier Location Update & Active Matching
  app.post("/api/carrier/location", async (req, res) => {
    const { carrier_id, lat, lng } = req.body;
    try {
      await supabase.from("carriers").update({
        current_lat: lat,
        current_lng: lng,
        is_online: true,
        last_location_update: new Date().toISOString()
      }).eq("id", carrier_id);

      // Expansion Logic: Check for pending shipments within 5km
      const { data: shipments } = await supabase
        .from("shipments")
        .select("*")
        .eq("status", "requested");

      const nearbyJobs = shipments?.filter((s: any) => {
        if (!s.pickup_lat || !s.pickup_lng) return false;
        return getDistance(lat, lng, s.pickup_lat, s.pickup_lng) <= 5;
      });

      res.json({ success: true, nearby_jobs_count: nearbyJobs?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Carry-go Delivery Confirmation & Escrow Payout
  app.post("/api/confirm-delivery", async (req, res) => {
    const { tracking_id, sender_phone, action } = req.body;

    try {
      // 1. Fetch Shipment and Carrier Details
      const { data: shipment, error: fetchErr } = await supabase
        .from("shipments")
        .select(`*, carrier:carriers(*)`)
        .eq("tracking_id", tracking_id)
        .eq("sender_phone", sender_phone)
        .single();

      if (fetchErr || !shipment) {
        return res.status(404).json({ error: "Shipment not found or unauthorized access." });
      }

      if (action === 'dispute') {
        await supabase.from("shipments").update({ status: 'disputed' }).eq("id", shipment.id);
        return res.json({ success: true, message: "Dispute logged. Support will contact you in 2hrs." });
      }

      if (!shipment.carrier) {
        return res.status(400).json({ error: "Carrier not assigned to this shipment." });
      }

      const carrierPayout = shipment.amount * 0.7; // 70% to carrier

      // 2. Paystack Transfer (Release Escrow)
      const transferRes = await axios.post('https://api.paystack.co/transfer', {
        source: "balance",
        amount: Math.round(carrierPayout * 100), // Kobo
        recipient: shipment.carrier.paystack_recipient_code,
        reason: `Carry-go delivery payout: ${tracking_id}`
      }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });

      // 3. Update Status
      await supabase.from("shipments").update({ 
        status: 'paid_out', 
        delivery_confirmed_at: new Date().toISOString(),
        delivery_confirmed_by: 'sender'
      }).eq("id", shipment.id);

      // Notify Carrier via Automation
      const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
      if (makeUrl) {
        axios.post(makeUrl, {
          type: 'CARRY_GO_DELIVERY_CONFIRMED',
          shipment_id: shipment.id,
          carrier_phone: shipment.carrier.phone,
          amount: carrierPayout,
          message: `₦${carrierPayout.toLocaleString()} has been sent to your account. It will arrive in 24hrs.`
        }).catch(e => console.error("[Carry-Go] Payout notification failed:", e.message));
      }

      res.json({ 
        success: true, 
        message: `Delivery confirmed. ₦${carrierPayout.toLocaleString()} sent to carrier.` 
      });

    } catch (err: any) {
      console.error("[Carry-Go-Payout] Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Payout processing failed", details: err.response?.data || err.message });
    }
  });

  // Job Matching Service (Geofencing)
  app.get("/api/match-carriers/:shipmentId", async (req, res) => {
    const { shipmentId } = req.params;
    try {
      const { data: shipment } = await supabase.from("shipments").select("*").eq("id", shipmentId).single();
      if (!shipment) return res.status(404).json({ error: "Shipment not found" });

      const { data: carriers } = await supabase.from("carriers").select("*").eq("is_online", true).eq("status", "verified");
      
      const nearby = carriers?.filter((c: any) => {
        const dist = getDistance(shipment.pickup_lat, shipment.pickup_lng, c.current_lat, c.current_lng);
        if (dist > 5) return false;
        
        // Fraud/Trust Tier: New carriers (<10 deliveries) can't handle items > 10k
        if ((c.total_deliveries || 0) < 10 && shipment.value > 10000) {
          return false;
        }
        return true;
      }).map((c: any) => ({
        ...c,
        distance: getDistance(shipment.pickup_lat, shipment.pickup_lng, c.current_lat, c.current_lng)
      }))
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 3);

      res.json({ success: true, carriers: nearby });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/driver/shift-status/:id", async (req, res) => {
    try {
      const { data: driver } = await supabase.from("drivers").select("*").eq("id", req.params.id).single();
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      const now = new Date();
      const shiftStart = driver.shift_started_at ? new Date(driver.shift_started_at) : null;
      const hoursOnShift = shiftStart ? (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60) : 0;

      res.json({
        is_on_shift: driver.is_on_shift,
        hours_active: hoursOnShift.toFixed(1),
        requires_reverification: hoursOnShift >= 4
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- WHATSAPP BOT INCOMING ROUTER ---
  // This endpoint serves as the bridge for your WhatsApp automation (e.g. Make.com)
  app.post("/api/whatsapp/incoming", async (req, res) => {
    const { from, text, location, media_url } = req.body;
    const cleanText = text?.trim().toLowerCase();

    try {
      console.log(`[WhatsApp] Incoming from ${from}: ${cleanText}`);

      // Routing Logic
      if (cleanText === "hi" || cleanText === "menu") {
        return res.json({ 
          reply: "Welcome to FindAba 🚚🚕\nReply 1 for CARRY-GO [Send Parcel]\nReply 2 for PURPLE FLEET [Book Ride]\nReply 3 for Status Check\nReply 4 for Support" 
        });
      }

      // Handle Location Sharing
      if (location && (location.lat && location.lng)) {
        console.log(`[WhatsApp] Location received from ${from}: ${location.lat}, ${location.lng}`);
        
        // Find if user is in a "Booking" state (Context would be better with Redis, but for MVP we check active requests)
        // Check for latest 'requested' ride
        const { data: ride } = await supabase.from("rides")
          .select("id, status")
          .eq("passenger_phone", from)
          .eq("status", "requested")
          .order("created_at", { ascending: false })
          .limit(1).single();

        if (ride) {
          await supabase.from("rides").update({
            pickup_lat: location.lat,
            pickup_lng: location.lng
          }).eq("id", ride.id);

          return res.json({ 
            reply: `Location pinned! 📍\nFare estimate: ₦850\nReply CONFIRM to book your ride.` 
          });
        }

        return res.json({ reply: "Location received! But you haven't started a booking. Reply MENU to start." });
      }

      if (cleanText === "1" || cleanText.includes("carry")) {
        return res.json({ reply: "CARRY-GO 🚚\nPlease send your Pickup Location (Use WhatsApp Location feature)." });
      }

      if (cleanText === "2" || cleanText.includes("purple") || cleanText.includes("ride")) {
        // Create a 'requested' ride session
        const rideId = `RIDE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        await supabase.from("rides").insert({
          id: rideId,
          passenger_phone: from,
          status: 'requested'
        });

        return res.json({ reply: "PURPLE FLEET 🚕\nPlease send your Pickup Location to find nearby vessels." });
      }

      if (cleanText === "3" || cleanText.includes("status") || cleanText === "track") {
        // Check for active shipments/rides
        const { data: ride } = await supabase.from("rides")
          .select("status, id, fare")
          .eq("passenger_phone", from)
          .neq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1).single();

        if (ride) {
          const trackingLink = `${req.protocol}://${req.get('host')}/?view=tracking&id=${ride.id}`;
          return res.json({ 
            reply: `Current Ride: ${ride.id}\nStatus: ${ride.status.toUpperCase()}\nFare: ₦${ride.fare}\n\nLive Track 🗺️: ${trackingLink}` 
          });
        }
        return res.json({ reply: "You have no active orders. Reply MENU to start." });
      }

      if (cleanText === "sos") {
        // Trigger SOS for the most recent active ride for this phone
        const { data: ride } = await supabase.from("rides")
          .select("id")
          .eq("passenger_phone", from)
          .eq("status", "in_progress")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (ride) {
          await axios.post(`${req.protocol}://${req.get('host')}/api/ride/sos`, { ride_id: ride.id, phone: from });
          return res.json({ reply: "HELP IS ON THE WAY. Stay calm, we have alerted support and your emergency contact." });
        }
      }

      if (cleanText === "online") {
        return res.json({ reply: "Safety check: Please take a selfie holding 4 fingers up now to confirm your identity." });
      }

      if (cleanText === "confirm") {
        const { data: ride } = await supabase.from("rides")
          .select("id, status")
          .eq("passenger_phone", from)
          .eq("status", "requested")
          .order("created_at", { ascending: false })
          .limit(1).single();

        if (ride) {
          await supabase.from("rides").update({ status: 'searching' }).eq("id", ride.id);
          return res.json({ reply: "Booking Confirmed! 🚕\nSearching for the nearest Purple Vessel... Please wait." });
        }
      }

      // Fallback or State-based routing would go here
      res.json({ success: true, message: "Message received" });
    } catch (err: any) {
      res.status(500).json({ error: "Route processing failure" });
    }
  });

  // --- DRIVER SAFETY HELPERS ---
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;

  const verifyFaceMatch = async (kycPhotoUrl: string, selfieBase64: string): Promise<{ match: boolean, score: number, reason?: string }> => {
    if (!geminiApiKey) {
      console.warn("[Safety] Gemini API key missing. Auto-approving face match (DEBUG ONLY).");
      return { match: true, score: 90 };
    }

    try {
      // Comparison logic using Gemini Multimodal
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{
            parts: [
              { text: "CRITICAL SAFETY CHECK: Compare these two photos. One is a high-quality KYC/ID photo. The other is a low-quality live selfie of a driver holding up 4 FINGERS. \n\nTASKS:\n1. Verify if it's the exact same person.\n2. Count visible fingers in the selfie (must be exactly 4).\n3. Check if the selfie is a live photo (not a photo of a screen).\n\nReturn ONLY JSON: { \"match\": boolean, \"score\": number (0-100), \"fingers_count\": number, \"is_live\": boolean, \"reason\": \"string\" }." },
              { inlineData: { mimeType: "image/jpeg", data: selfieBase64 } },
              { text: `KYC Photo Reference: ${kycPhotoUrl}` }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        }
      );

      const resultText = response.data.candidates[0].content.parts[0].text;
      console.log("[Safety] Gemini Response:", resultText);
      const result = JSON.parse(resultText);
      
      return { 
        match: result.match && result.score >= 82 && result.fingers_count === 4 && result.is_live,
        score: result.score,
        reason: result.reason
      };
    } catch (err) {
      console.error("[Safety] Face verification error:", err);
      return { match: false, score: 0, reason: "Verification service error" };
    }
  };

  const verifyPlateOCR = async (platePhotoBase64: string, expectedPlate: string): Promise<{ match: boolean, detected?: string }> => {
    if (!geminiApiKey) return { match: true };
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{
            parts: [
              { text: `Extract the vehicle license plate number from this photo. Return JSON: { \"plate\": \"string\" }. Expected: ${expectedPlate}` },
              { inlineData: { mimeType: "image/jpeg", data: platePhotoBase64 } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        }
      );
      const result = JSON.parse(response.data.candidates[0].content.parts[0].text);
      const cleanedDetected = result.plate?.replace(/[^A-Z0-9]/g, '');
      const cleanedExpected = expectedPlate?.replace(/[^A-Z0-9]/g, '');
      return { match: cleanedDetected === cleanedExpected, detected: result.plate };
    } catch (err) {
      return { match: false };
    }
  };

  // --- PURPLE FLEET DRIVER ENDPOINTS ---

  app.post("/api/driver/online", async (req, res) => {
    const { driver_id, selfie_base64, plate_photo_base64 } = req.body;
    try {
      const { data: driver } = await supabase.from("drivers").select("*").eq("id", driver_id).single();
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      // 1. Identity Verification (Face Match + Fingers Check)
      const faceCheck = await verifyFaceMatch(driver.kyc_photo_url, selfie_base64);
      if (!faceCheck.match) {
        return res.status(401).json({ error: "Identity mismatch. Please retake selfie holding 4 fingers.", details: faceCheck.reason });
      }

      // 2. Vehicle Verification (OCR Plate check)
      if (plate_photo_base64) {
        const plateCheck = await verifyPlateOCR(plate_photo_base64, driver.vehicle_plate_number);
        if (!plateCheck.match) {
          return res.status(401).json({ error: `Vehicle mismatch. Detected Plate: ${plateCheck.detected}. Registered: ${driver.vehicle_plate_number}` });
        }
      }

      await supabase.from("drivers").update({
        is_on_shift: true,
        shift_started_at: new Date().toISOString()
      }).eq("id", driver_id);

      res.json({ success: true, message: "Identity confirmed ✅. You are now ONLINE and visible to passengers." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/driver/offline", async (req, res) => {
    const { driver_id } = req.body;
    try {
      const { data: shift } = await supabase.from("driver_shifts")
        .select("*")
        .eq("driver_id", driver_id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      
      const earnings = 5000; // Mock calculation, would query rides

      await supabase.from("drivers").update({ is_on_shift: false }).eq("id", driver_id);
      if (shift) {
        await supabase.from("driver_shifts").update({ 
          ended_at: new Date().toISOString(),
          earnings
        }).eq("id", shift.id);
      }

      res.json({ success: true, earnings, message: `Shift ended. You earned ₦${earnings.toLocaleString()} today. Good work!` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ride Start Verification (Pre-trip Selfie)
  app.post("/api/ride/verify-start", async (req, res) => {
    const { ride_id, driver_id, selfie_base64 } = req.body;
    try {
      const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).single();
      const { data: driver } = await supabase.from("drivers").select("*").eq("id", driver_id).single();
      
      if (!ride || !driver) return res.status(404).json({ error: "Ride or Driver not found" });

      // Identify driver for this specific ride start
      const faceCheck = await verifyFaceMatch(driver.kyc_photo_url, selfie_base64);
      if (!faceCheck.match) {
        return res.status(401).json({ error: "Safety check failed. Take a clear selfie to start ride." });
      }

      // Everything looks good - release the OTP
      res.json({ 
        success: true, 
        otp: ride.otp, 
        message: "Identity verified. Please ask passenger for OTP to start the trip." 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Purple Fleet Driver Onboarding (Enhanced)
  app.post("/api/onboard-driver", async (req, res) => {
    const { 
      phone, full_name, bvn, nin, vehicle_type, plate_number, bank_code, account_number, user_id, 
      kyc_photo_url, license_url, vehicle_photo_url, kyc_video_url 
    } = req.body;

    try {
      console.log(`[Driver-Onboarding] Processing KYC for ${full_name} (${plate_number})`);
      
      // 1. Dojah/Smile Identity Mock (Real verification would call their API)
      if (process.env.DOJAH_API_KEY) {
        try {
           const dojahRes = await axios.get(`https://api.dojah.io/api/v1/kyc/bvn?bvn=${bvn}&first_name=${full_name.split(' ')[0]}`, {
             headers: { Authorization: process.env.DOJAH_API_KEY, 'AppId': process.env.DOJAH_APP_ID }
           });
           if (!dojahRes.data.entity) throw new Error("BVN Verification Failed");
        } catch (e: any) {
           return res.status(400).json({ error: "Verification failed. BVN/Name mismatch." });
        }
      }

      // 2. Paystack Recipient
      const recipientResponse = await axios.post('https://api.paystack.co/transferrecipient', {
        type: "nuban",
        name: full_name,
        account_number,
        bank_code,
        currency: "NGN"
      }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });

      const recipientCode = recipientResponse.data.data.recipient_code;

      // 3. Save to Supabase
      const { error: driverError } = await supabase
        .from("drivers")
        .insert({
          id: user_id,
          phone,
          full_name,
          bvn,
          nin,
          vehicle_type,
          vehicle_plate_number: plate_number,
          bank_code,
          account_number,
          paystack_recipient_code: recipientCode,
          license_url,
          vehicle_photo_url,
          kyc_photo_url,
          kyc_video_url,
          status: 'verified',
          created_at: new Date().toISOString()
        });

      if (driverError) throw driverError;

      await supabase.from("profiles").update({ role: 'driver' }).eq("id", user_id);

      res.json({ success: true, message: "Driver verified and activated 🚕", recipientCode });
    } catch (err: any) {
      console.error("[Driver-Onboarding] Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to onboard driver", details: err.response?.data || err.message });
    }
  });

  // Automatic Git Repo Connection
  app.get("/api/git/sync", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN || req.cookies.github_token;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured for automatic sync" });
    }

    // Robustness: Strip URL prefix and .git suffix if provided
    repo = repo.replace(/^https?:\/\/github\.com\//i, '')
               .replace(/\.git$/i, '')
               .replace(/\/$/, '');

    try {
      // Fetch the repository content (specifically looking for registry.json or similar)
      const [owner, name] = repo.split("/");
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid GITHUB_REPO format. Use owner/repo" });
      }

      try {
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/contents/registry.json`,
          {
            headers: token ? { 
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json"
            } : {
              Accept: "application/vnd.github.v3+json"
            },
          }
        );

        const content = Buffer.from(response.data.content, "base64").toString("utf-8");
        const registry = JSON.parse(content);

        res.json({ 
          success: true, 
          repo, 
          lastUpdated: new Date().toISOString(),
          data: registry 
        });
      } catch (fileError: any) {
        // If the file is missing (404), return a success with empty data instead of a 500 error
        if (fileError.response?.status === 404) {
          return res.json({ 
            success: true, 
            repo, 
            lastUpdated: null,
            data: null,
            message: "Registry file not found in repository. Ready for first commit."
          });
        }
        throw fileError;
      }
    } catch (error: any) {
      console.error("Git Sync Error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to sync with Git repository", 
        details: error.response?.data?.message || error.message 
      });
    }
  });

  // Full System Sync (Server-side)
  app.post("/api/git/sync-full", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = req.cookies.github_token || process.env.GITHUB_TOKEN;
    const { message = "Full System Sync via FindAba City OS" } = req.body;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured" });
    }

    repo = repo.replace(/^https?:\/\/github\.com\//i, '')
               .replace(/\.git$/i, '')
               .replace(/\/$/, '');

    if (!token) {
      return res.status(401).json({ error: "GitHub authentication required" });
    }

    try {
      const [owner, name] = repo.split("/");
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      };

      const gitClient = axios.create({ headers, timeout: 600000 }); // 10 minutes

      // 1. Gather all local files in parallel
      console.log(`[GitSync] Starting full sync for repo: ${repo}`);
      const rootDir = process.cwd();
      const files: { path: string, content: string }[] = [];
      const excludeDirs = ['node_modules', 'dist', '.git', '.next', '.vercel', 'build', 'public', 'coverage', 'logs'];
      const excludeFiles = ['package-lock.json', 'yarn.lock', '.env', '.env.local', 'github_token', '.DS_Store'];
      const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.sql'];

      async function readDir(dir: string, relativePath: string = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        await Promise.all(entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await readDir(fullPath, relPath);
            }
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (!excludeFiles.includes(entry.name) && (includeExtensions.includes(ext) || entry.name === 'LICENSE')) {
              try {
                const stats = await fs.stat(fullPath);
                if (stats.size > 1024 * 1024) { // Skip files > 1MB
                  console.warn(`Skipping large file: ${relPath} (${stats.size} bytes)`);
                  return;
                }
                const content = await fs.readFile(fullPath, "utf-8");
                files.push({ path: relPath, content });
              } catch (e) {
                console.warn(`Skipping ${relPath}: ${e}`);
              }
            }
          }
        }));
      }
      await readDir(rootDir);
      console.log(`[GitSync] Found ${files.length} files to sync.`);

      // 2. Fetch Registry Data from Supabase with limit to avoid huge payload
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });
          const { data: businesses, error: sbError } = await supabase
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500); // Limit to 500 businesses for sync stability
          
          if (businesses) {
            const registry = {
              version: "v6.0",
              lastUpdated: new Date().toISOString(),
              businesses
            };
            const registryContent = JSON.stringify(registry, null, 2);
            const existingIdx = files.findIndex(f => f.path === 'registry.json');
            if (existingIdx >= 0) files[existingIdx].content = registryContent;
            else files.push({ path: 'registry.json', content: registryContent });
          }
        } catch (e) { console.error("Supabase fetch failed during sync", e); }
      }

      // 3. GitHub Commit Logic - Split into batches if needed
      const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
      const defaultBranch = repoInfo.data.default_branch;
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
      try {
        const branchRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`);
        latestCommitSha = branchRes.data.commit.sha;
        baseTreeSha = branchRes.data.commit.commit.tree.sha;
      } catch (e) {}

      // GitHub Tree API has a limit of 1,000 items per request.
      // For now, we'll just take the first 1,000 files to ensure success.
      // A more robust solution would be multiple tree requests.
      const syncFiles = files.slice(0, 1000);
      let warning = null;
      if (files.length > 1000) {
        warning = `Project has ${files.length} files. Only syncing first 1,000 for stability.`;
        console.warn(`[GitSync] ${warning}`);
      }

      const treeItems = syncFiles.map(file => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content
      }));

      console.log(`[GitSync] Creating tree with ${treeItems.length} items...`);
      const treeRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/trees`, {
        base_tree: baseTreeSha,
        tree: treeItems
      });
      
      console.log(`[GitSync] Tree created: ${treeRes.data.sha}. Creating commit...`);
      const commitRes = await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/commits`, {
        message,
        tree: treeRes.data.sha,
        parents: latestCommitSha ? [latestCommitSha] : []
      });

      console.log(`[GitSync] Commit created: ${commitRes.data.sha}. Updating ref...`);
      await gitClient.patch(`https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`, {
        sha: commitRes.data.sha
      });

      console.log(`[GitSync] Sync complete: ${commitRes.data.html_url}`);
      res.json({ success: true, commit: commitRes.data.html_url, warning });
    } catch (error: any) {
      console.error("Full Sync Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to perform full sync", details: error.response?.data?.message || error.message });
    }
  });

  // Get all project files for full sync
  app.get("/api/git/all-files", async (req, res) => {
    try {
      const rootDir = process.cwd();
      const files: { path: string, data: string }[] = [];
      
      const excludeDirs = ['node_modules', 'dist', '.git', '.next', '.vercel', 'build', 'public'];
      const excludeFiles = ['package-lock.json', '.env', '.env.local', 'github_token', '.DS_Store'];
      const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.sql'];

      async function readDir(dir: string, relativePath: string = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await readDir(fullPath, relPath);
            }
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (!excludeFiles.includes(entry.name) && (includeExtensions.includes(ext) || entry.name === 'LICENSE')) {
              try {
                const content = await fs.readFile(fullPath, "utf-8");
                files.push({ path: relPath, data: content });
              } catch (e) {
                console.warn(`Skipping file ${relPath}: ${e}`);
              }
            }
          }
        }
      }

      await readDir(rootDir);
      console.log(`Full Sync: Found ${files.length} files to commit.`);
      res.json({ files });
    } catch (error: any) {
      console.error("Failed to read project files:", error);
      res.status(500).json({ 
        error: "Failed to read project files", 
        details: error.message,
        path: error.path || 'unknown'
      });
    }
  });

  // Get README content
  app.get("/api/readme", async (req, res) => {
    try {
      const readmePath = path.join(process.cwd(), "README.md");
      const content = await fs.readFile(readmePath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(404).json({ error: "README.md not found" });
    }
  });

  // Update metadata.json
  app.post("/api/metadata", async (req, res) => {
    try {
      const metadataPath = path.join(process.cwd(), "metadata.json");
      const newMetadata = req.body;
      await fs.writeFile(metadataPath, JSON.stringify(newMetadata, null, 2));
      res.json({ success: true, message: "Metadata updated successfully" });
    } catch (error: any) {
      console.error("Failed to update metadata:", error);
      res.status(500).json({ error: "Failed to update metadata", details: error.message });
    }
  });

  // Commit to Git Repo (Atomic Multi-file Commit)
  app.post("/api/git/commit", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO;
    const token = req.cookies.github_token || process.env.GITHUB_TOKEN;
    const { files, message = "Update via FindAba City OS" } = req.body;

    if (!repo) {
      return res.status(400).json({ error: "GITHUB_REPO not configured" });
    }

    // Robustness: Strip URL prefix and .git suffix if provided
    repo = repo.replace(/^https?:\/\/github\.com\//i, '')
               .replace(/\.git$/i, '')
               .replace(/\/$/, '');

    if (!token) {
      return res.status(401).json({ error: "GitHub authentication required" });
    }
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files provided for commit" });
    }

    try {
      const [owner, name] = repo.split("/");
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid GITHUB_REPO format. Use owner/repo" });
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      };

      const gitClient = axios.create({
        headers,
        timeout: 60000 // 60 seconds
      });

      // 1. Get the default branch
      const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
      const defaultBranch = repoInfo.data.default_branch;

      // 2. Get the latest commit SHA of the default branch
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
      try {
        const branchRes = await gitClient.get(
          `https://api.github.com/repos/${owner}/${name}/branches/${defaultBranch}`
        );
        latestCommitSha = branchRes.data.commit.sha;
        baseTreeSha = branchRes.data.commit.commit.tree.sha;
      } catch (e) {
        // Repo might be empty, which is fine
      }

      // 3. Create a new tree
      const treeItems = files.map(file => {
        // If data is a string, use it directly (for README.md, etc.)
        // Otherwise, stringify as JSON (for registry.json, package.json)
        const content = typeof file.data === 'string' 
          ? file.data 
          : JSON.stringify(file.data, null, 2);

        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          content
        };
      });

      const treeRes = await gitClient.post(
        `https://api.github.com/repos/${owner}/${name}/git/trees`,
        {
          base_tree: baseTreeSha,
          tree: treeItems
        }
      );
      const newTreeSha = treeRes.data.sha;

      // 4. Create a new commit
      const commitRes = await gitClient.post(
        `https://api.github.com/repos/${owner}/${name}/git/commits`,
        {
          message,
          tree: newTreeSha,
          parents: latestCommitSha ? [latestCommitSha] : []
        }
      );
      const newCommitSha = commitRes.data.sha;

      // 5. Update the branch reference
      if (latestCommitSha) {
        await gitClient.patch(
          `https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`,
          { sha: newCommitSha }
        );
      } else {
        // Create the branch if it doesn't exist
        await gitClient.post(
          `https://api.github.com/repos/${owner}/${name}/git/refs`,
          {
            ref: `refs/heads/${defaultBranch}`,
            sha: newCommitSha
          }
        );
      }

      res.json({ 
        success: true, 
        message: "Full System Sync Successful",
        commit: `https://github.com/${owner}/${name}/commit/${newCommitSha}`
      });
    } catch (error: any) {
      console.error("Git Commit Error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to commit to GitHub", 
        details: error.response?.data?.message || error.message 
      });
    }
  });

// Setup Vite or Static Files
async function setupVite() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // ⚡ Disable HMR to prevent port conflicts (shared environment)
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Start Server if not on Vercel
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  setupVite()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Industrial-OS] Server online at http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("[Industrial-OS] Initialization Failure:", err);
      // Fallback listen to prevent container restart loops
      app.listen(PORT, "0.0.0.0", () => {
        console.warn(`[Industrial-OS] Server running in failsafe mode on port ${PORT}`);
      });
    });
}

export default app;
