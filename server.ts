import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
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

  // Config Sync
app.get(["/api/config", "/api/config/"], (req, res) => {
  console.log(`[Server] Config sync requested from ${req.ip}`);
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

  console.log(`[Server] Sending config. Gemini: ${geminiKey ? 'OK' : 'NO'}, OpenRouter: ${openRouterKey ? 'OK' : 'NO'}`);
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
    console.log(`[Webhook] Received event: ${event.event}`);

    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;
      const userId = metadata?.user_id;
      const shipmentId = metadata?.shipment_id;
      const orderId = metadata?.order_id;

      try {
        // 1. Log Payment
        await supabase.from("payments").upsert({
          user_id: userId,
          amount: amount / 100,
          reference,
          status: "success",
          provider: "paystack",
          metadata: event.data,
          created_at: new Date().toISOString()
        }, { onConflict: 'reference' });

        // 2. Carry-go Escrow Logic
        if (shipmentId) {
          console.log(`[Carry-Go] Payment success for shipment ${shipmentId}. Locking funds.`);
          const { error: shipmentError } = await supabase
            .from("shipments")
            .update({ 
               payment_status: 'paid_held', 
               status: 'accepted', // Advance to accepted if payment was the blocker
               paystack_reference: reference, 
               updated_at: new Date().toISOString() 
            })
            .eq("id", shipmentId);
          
          if (shipmentError) throw shipmentError;

          // Notify Sender via Automation (Make.com/WhatsApp)
          const makeUrl = process.env.MAKE_WEBHOOK_URL || process.env.VITE_MAKE_WEBHOOK_URL;
          if (makeUrl) {
            axios.post(makeUrl, {
              type: 'CARRY_GO_PAYMENT_CONFIRMED',
              shipment_id: shipmentId,
              amount: amount / 100,
              message: "Payment confirmed ✅ Your rider is on the way. You will get tracking link."
            }).catch(e => console.error("[Carry-Go] Notification failed:", e.message));
          }
        }

        // 3. Standard Order Logic
        if (orderId) {
          await supabase.from("orders").update({ status: 'paid' }).eq("id", orderId);
        }

      } catch (err: any) {
        console.error("[Webhook] Business logic failure:", err.message);
        return res.status(500).json({ error: "Internal processing error" });
      }
    }

    res.status(200).json({ status: "success" });
  });

  // Carry-go Onboarding Endpoint
  app.post("/api/onboard-carrier", async (req, res) => {
    const { phone, full_name, bvn, nin, bank_code, account_number, user_id } = req.body;

    try {
      console.log(`[Carrier-Onboarding] Processing KYC for ${full_name} (${phone})`);
      
      // 1. Verify BVN/NIN (Simulated Dojah/Smile call)
      // In production: const kyc = await axios.post('Dojah_URL', { bvn, nin }, { headers: ... });
      const kycValid = true; // Placeholder for actual ID verification

      if (!kycValid) {
        return res.status(400).json({ error: "Identity verification failed. Name/BVN/NIN mismatch." });
      }

      // 2. Create Paystack Recipient
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
      const { error: carrierError } = await supabase
        .from("carriers")
        .insert({
          user_id,
          phone,
          full_name,
          bvn,
          nin,
          bank_code,
          account_number,
          paystack_recipient_code: recipientCode,
          status: 'verified',
          created_at: new Date().toISOString()
        });

      if (carrierError) throw carrierError;

      res.json({ success: true, message: "Carrier verified and onboarded ✅", recipientCode });
    } catch (err: any) {
      console.error("[Carrier-Onboarding] Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to onboard carrier", details: err.response?.data || err.message });
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

      res.json({ 
        success: true, 
        message: `Delivery confirmed. ₦${carrierPayout.toLocaleString()} sent to carrier.` 
      });

    } catch (err: any) {
      console.error("[Carry-Go-Payout] Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Payout processing failed", details: err.response?.data || err.message });
    }
  });

  // Carrier Location Update for Geofencing
  app.post("/api/carrier/location", async (req, res) => {
    const { carrier_id, lat, lng } = req.body;
    try {
      await supabase.from("carriers").update({
        current_lat: lat,
        current_lng: lng,
        is_online: true,
        last_location_update: new Date().toISOString()
      }).eq("id", carrier_id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
