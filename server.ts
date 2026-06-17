import express, { Request, Response, NextFunction } from "express";
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
import { sendPaymentSuccessEmail } from './src/services/emailService';
import * as WhatsApp from './src/services/whatsappService';

import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqzjkvqmherngispxlzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let supabase: any;

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

const resendKey = process.env.RESEND_API_KEY || 're_placeholder';
const resend = new Resend(resendKey);

const getAI = (customKey?: string) => {
  const key = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("ORACLE AUTHENTICATION FAILED: PLEASE CHECK YOUR GEMINI_API_KEY IN THE SYSTEM CONSOLE (ADMIN).");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

const getOpenRouterAI = async (prompt: string, history: any[], catalog: BusinessContextItem[], model: string = "google/gemini-2.0-flash-001") => {
  const key = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY_MISSING: The OpenRouter key is not configured on the server.");
  }

  const sys = `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. 
               RULES: Prioritize Aba. Do NOT say 'God's Own State'. Use the registry: ${JSON.stringify(catalog)}`;

  const messages = [
    { role: "system", content: sys },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: typeof h.parts?.[0]?.text === 'string' ? h.parts[0].text : (h.parts?.[0] ? JSON.stringify(h.parts[0]) : '')
    })),
    { role: "user", content: prompt }
  ];

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: model,
      messages: messages,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );

  const content = response.data.choices[0].message.content;
  const result = JSON.parse(content);
  return {
    text: result.wisdom || result.text || "Signal lost.",
    thoughtProcess: result.thought_process || result.thoughtProcess
  };
};

interface BusinessContextItem {
  name: string;
  category: string;
  product: string;
  area: string;
  address: string;
  phone: string;
}

const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing identity signal (Auth Header)" });
  
  const token = authHeader.replace('Bearer ', '');
  if (!supabase) return res.status(503).json({ error: "Identity core offline (Missing configuration)" });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: "Invalid identity signal" });
  }
  
  (req as any).user = user;
  next();
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

app.use(cors({
  origin: true,
  credentials: true
}));

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
});
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
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[Server] Config sync requested from ${ip} at ${new Date().toISOString()}`);
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqzjkvqmherngispxlzy.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemprdnFtaGVybmdpc3B4bHp5Iiwicm9sZSI6InFub24iLCJpYXQiOjE3Njc0MjA3MjMsImV4cCI6MjA4Mjk5NjcyM30.Oa6ZXYw5-f3BOHHafFsLPtuBgmV4yOu5BMpulyDC-oc';
  const paystackKey = process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  
  const config = { 
    supabaseUrl,
    supabaseKey,
    paystackKey,
    githubRepo: process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS',
    githubBranch: process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || 'main',
    makeWebhookUrl: process.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || ''
  };

  res.json(config);
});

// Gemini Proxy
app.post("/api/oracle", async (req, res) => {
  try {
    const { prompt, history = [], catalog = [], type = 'search', provider = 'gemini' } = req.body;
    
    const businessContext = catalog.slice(0, 50).map((b: any) => ({
      name: b.name,
      category: b.category,
      product: b.primary_product_or_service,
      area: b.area,
      address: b.address,
      phone: b.phone_whatsapp
    }));

    if (provider === 'openrouter' && type === 'search' && typeof prompt === 'string') {
      try {
        const result = await getOpenRouterAI(prompt, history, businessContext);
        return res.json(result);
      } catch (orErr: any) {
        console.warn("[Server] OpenRouter failed, falling back to Gemini:", orErr.message);
      }
    }

    const customKey = req.headers['x-gemini-key'] as string;
    const ai = getAI(customKey);
    
    if (type === 'search') {
      const sys = `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. 
                   RULES: Prioritize Aba. Do NOT say 'God's Own State'. Use the registry: ${JSON.stringify(businessContext)}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
        config: { 
          systemInstruction: sys,
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      return res.json({ 
        text: response.text, 
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
      });
    }

    if (type === 'flyer') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { 
          parts: [
            { inlineData: { data: prompt.base64.split(',')[1] || prompt.base64, mimeType: prompt.mimeType || 'image/jpeg' } }, 
            { text: "Analyze this industrial flyer. Extract JSON: { businessName, category, area, phone, description, confidence_score }" }
          ] 
        },
        config: { responseMimeType: "application/json" }
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    res.status(400).json({ error: "Invalid oracle type" });
  } catch (err: any) {
    console.error("[Server] Oracle Fault:", err);
    
    // 🔹 Handle Quota/Billing errors specifically
    if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({ 
        error: "Oracle energy depleted. The industrial signal requires a credit injection (AI Studio Billing).",
        details: "429: Resource Exhausted"
      });
    }

    res.status(500).json({ error: err.message });
  }
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
      console.log("[GitHub] User info requested but no token found in cookies");
      return res.status(401).json({ error: "Not authenticated with GitHub" });
    }

    try {
      console.log("[GitHub] Fetching user info for token starting with:", token.substring(0, 5));
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "FindAba-City-OS",
          Accept: "application/vnd.github.v3+json",
        },
        timeout: 10000 // 10s timeout
      });
      console.log(`[GitHub] User fetched: ${response.data.login}`);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      console.error("[GitHub] User Fetch Error:", { status, message });
      
      // If it's a 401/403, our token is likely stale or invalid
      if (status === 401 || status === 403) {
        res.clearCookie("github_token");
      }

      res.status(status).json({ 
        error: "Failed to fetch GitHub user",
        details: message
      });
    }
  });

  // Network Diagnostic Route
  app.get("/api/debug/network", async (req, res) => {
    const results: any = {
      timestamp: new Date().toISOString(),
      connectivity: {}
    };

    const targets = [
      { name: 'github', url: 'https://api.github.com/zen' },
      { name: 'supabase', url: supabaseUrl },
      { name: 'google', url: 'https://www.google.com' }
    ];

    for (const target of targets) {
      try {
        const start = Date.now();
        await axios.get(target.url, { timeout: 5000 });
        results.connectivity[target.name] = { 
          status: 'ok', 
          latency: `${Date.now() - start}ms` 
        };
      } catch (err: any) {
        results.connectivity[target.name] = { 
          status: 'error', 
          message: err.message,
          code: err.code
        };
      }
    }

    res.json(results);
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

  // Meta WhatsApp API Service Hub
  // -----------------------------

  // Custom Test Handshake for Make.com auto-schema detection
  app.post("/api/whatsapp/test-webhook", async (req, res) => {
    const { webhookUrl } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: "Missing 'webhookUrl' parameter" });
    }

    console.log(`[Make.com Setup] Dispatching schema initialization handshake to: ${webhookUrl}`);
    try {
      const response = await axios.post(webhookUrl, {
        source: 'FindAba Hub Initialization Service',
        type: 'whatsapp_intent',
        businessId: 'test-business-abc-123',
        businessName: 'Aba Integrated Tailors Collective',
        targetPhone: '+2348039998888',
        message: 'Pre-flight Initialization signal. Tap "Save" in Make.com. The data structure has been populated successfully.',
        userName: 'Pastor Nelson (Platform Administrator)',
        userEmail: 'pastornelsonezi@gmail.com',
        timestamp: new Date().toISOString()
      });
      res.json({ success: true, status: response.status, data: response.data });
    } catch (err: any) {
      console.error("[Make.com Setup] Dispatch failed:", err.message);
      res.status(500).json({ success: false, error: err.message, status: err.response?.status });
    }
  });

  // 1. Business Inquiry (Integrated with Make.com sync + support for client-side configuration overrides)
  app.post("/api/whatsapp/inquiry", async (req, res) => {
    const { businessId, businessName, phone, message, userName, userEmail, makeWebhookUrlOverride } = req.body;
    
    console.log(`[WhatsApp] Processing inquiry for ${businessName} (${phone})`);

    const results: any = { whatsapp: { success: false }, make: { success: false } };

    // Capture in Make.com
    const makeUrl = makeWebhookUrlOverride || process.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;
    if (makeUrl) {
      try {
        await axios.post(makeUrl, {
          source: 'FindAba Contact Gateway',
          type: 'whatsapp_intent',
          businessId,
          businessName,
          targetPhone: phone,
          message,
          userName,
          userEmail,
          timestamp: new Date().toISOString()
        });
        results.make.success = true;
      } catch (err: any) {
        console.error("[Make.com] Sync failure:", err.message);
      }
    }

    // Trigger Meta Cloud API
    const whatsappResult = await WhatsApp.sendBusinessInquiryMessage(phone, businessName, message, userName);
    results.whatsapp = whatsappResult;

    res.json(results);
  });

  // 2. Auth: OTP Transmission
  app.post("/api/whatsapp/otp", async (req, res) => {
    const { phone, code } = req.body;
    console.log(`[WhatsApp] Transmitting OTP for ${phone}`);
    const result = await WhatsApp.sendOTPMessage(phone, code);
    res.json(result);
  });

  // 3. Auth: Welcome/Onboarding
  app.post("/api/whatsapp/welcome", async (req, res) => {
    const { phone, userName } = req.body;
    console.log(`[WhatsApp] Transmitting Welcome Message for ${userName}`);
    const result = await WhatsApp.sendWelcomeMessage(phone, userName);
    res.json(result);
  });

  // 4. Notifications: Generic Order/Alert
  app.post("/api/whatsapp/notify", async (req, res) => {
    const { phone, template, parameters } = req.body;
    console.log(`[WhatsApp] Transmitting Template [${template}] to ${phone}`);
    const result = await WhatsApp.sendTemplateMessage(phone, template, 'en_US', parameters || []);
    res.json(result);
  });

  // 5. Developer Test: Raw Text Message
  app.post("/api/whatsapp/test", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: "Missing phone number" });
    
    console.log(`[WhatsApp] Dispatching DEV TEST MESSAGE to ${phone}`);
    const result = await WhatsApp.sendTextMessage(phone, "FindAba Meta WhatsApp Test Successful");
    res.json(result);
  });

  // Paystack Webhook Handler
  app.post("/api/paystack-webhook", async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"] as string;

    if (!secret || !signature) {
      console.error("[Webhook] Missing secret or signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      console.error("[Webhook] Invalid signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = req.body;
    console.log(`[Webhook] Received Paystack event: ${event.event}`);

    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;
      const userId = metadata?.user_id;
      const bookingId = metadata?.booking_id;
      const orderId = metadata?.order_id;

      if (!userId && !orderId) {
        console.error("[Webhook] Missing user identification in metadata");
        return res.status(400).json({ error: "Missing user/order identification" });
      }

      try {
        // 1. Insert payment record
        const paymentData: any = {
          user_id: userId,
          amount: amount / 100, // Convert kobo to NGN
          reference,
          status: "success",
          provider: "paystack",
          metadata: event.data,
          created_at: new Date().toISOString()
        };

        if (bookingId) paymentData.booking_id = bookingId;
        if (orderId) paymentData.order_id = orderId;

        const { error: paymentError } = await supabase
          .from("payments")
          .upsert(paymentData, { onConflict: 'reference' });

        if (paymentError) throw paymentError;

        // 2. If it's an order payment, update order status
        if (orderId) {
          console.log(`[Webhook] Updating order ${orderId} status to 'paid'`);
          const { error: orderError } = await supabase
            .from("orders")
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq("id", orderId);
          
          if (orderError) console.error("[Webhook] Order update failed:", orderError.message);
        }

        // 3. Fetch updated profile for notifications
        if (userId) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("tier_level, email, full_name")
            .eq("id", userId)
            .single();

          if (!profileError && profile.email) {
            sendPaymentSuccessEmail(profile.email, reference, amount / 100).catch(err => 
              console.error("[Email] Payment success email failed:", err.message)
            );
          }

          // 4. Trigger Make.com Automation
          const makeUrl = process.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;
          if (makeUrl) {
            axios.post(makeUrl, {
              user_id: userId,
              order_id: orderId,
              amount: amount / 100,
              reference,
              timestamp: new Date().toISOString()
            }).catch(err => console.error("[Webhook] Make.com trigger failed:", err.message));
          }
        }

        console.log(`[Webhook] Payment processed successfully for reference ${reference}`);
      } catch (err: any) {
        console.error("[Webhook] Processing error:", err.message);
        return res.status(500).json({ error: "Internal processing error" });
      }
    }

    res.status(200).json({ status: "success" });
  });

  // Automatic Git Repo Connection
  app.get("/api/git/sync", async (req, res) => {
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS';
    const branch = (req.query.branch as string) || process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || 'main';
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
        const url = `https://api.github.com/repos/${owner}/${name}/contents/registry.json?ref=${branch}`;
        const response = await axios.get(
          url,
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
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS';
    const branch = (req.query.branch as string) || process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || ''; // If empty, will fetch default branch
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
      const targetBranch = branch || repoInfo.data.default_branch;
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
      try {
        const branchRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/branches/${targetBranch}`);
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
      await gitClient.patch(`https://api.github.com/repos/${owner}/${name}/git/refs/heads/${targetBranch}`, {
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
    let repo = (req.query.repo as string) || process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS';
    const branch = (req.query.branch as string) || process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || '';
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

      // 1. Get the target branch
      const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
      const targetBranch = branch || repoInfo.data.default_branch;

      // 2. Get the latest commit SHA of the default branch
      let latestCommitSha: string | null = null;
      let baseTreeSha: string | null = null;
      
      try {
        const branchRes = await gitClient.get(
          `https://api.github.com/repos/${owner}/${name}/branches/${targetBranch}`
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
          `https://api.github.com/repos/${owner}/${name}/git/refs/heads/${targetBranch}`,
          { sha: newCommitSha }
        );
      } else {
        // Create the branch if it doesn't exist
        await gitClient.post(
          `https://api.github.com/repos/${owner}/${name}/git/refs`,
          {
            ref: `refs/heads/${targetBranch}`,
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

  // Create GitHub Branch
  app.post("/api/git/branch", async (req, res) => {
    const { branch, from, repo: bodyRepo } = req.body;
    let repo = (req.query.repo as string) || bodyRepo || process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || 'nedtwistmovies-star/FindAba-OS';
    const token = req.cookies.github_token || process.env.GITHUB_TOKEN;

    if (!repo || !token || !branch) {
      return res.status(400).json({ error: "Missing parameters for branch creation" });
    }

    repo = repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');

    try {
      const [owner, name] = repo.split("/");
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      };
      const gitClient = axios.create({ headers });

      // 1. Get 'from' branch SHA (defaults to default branch)
      let sourceBranch = from;
      if (!sourceBranch) {
        const repoInfo = await gitClient.get(`https://api.github.com/repos/${owner}/${name}`);
        sourceBranch = repoInfo.data.default_branch;
      }

      console.log(`[GitBranch] Creating ${branch} from ${sourceBranch}`);
      const branchRes = await gitClient.get(`https://api.github.com/repos/${owner}/${name}/branches/${sourceBranch}`);
      const sha = branchRes.data.commit.sha;

      // 2. Create the new ref
      await gitClient.post(`https://api.github.com/repos/${owner}/${name}/git/refs`, {
        ref: `refs/heads/${branch}`,
        sha
      });

      res.json({ success: true, message: `Branch ${branch} created from ${sourceBranch}` });
    } catch (error: any) {
      console.error("Branch Creation Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create branch", details: error.response?.data?.message || error.message });
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
