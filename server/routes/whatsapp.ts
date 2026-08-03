import { Router, Response } from "express";
import axios from "axios";
import { z } from "zod";
import { ensureAdmin } from "../middleware/admin";
import { env } from "../services/env";
import * as WhatsApp from "../../src/services/whatsappService";

export const whatsappRouter = Router();

export interface WhatsAppWebhookEvent {
  id: string;
  timestamp: string;
  sender: string;
  senderPhone: string;
  senderName: string;
  status: "received" | "processed" | "delivered" | "read" | "sent" | "failed";
  eventType: "message" | "status_update" | "location" | "image" | "interactive" | "test_simulation";
  summary: string;
  payload: any;
}

// In-memory ring buffer holding up to 50 items (newest first)
let eventsRingBuffer: WhatsAppWebhookEvent[] = [
  {
    id: "evt_sample_01",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    sender: "Chidi Nwachukwu (+2348039998888)",
    senderPhone: "+2348039998888",
    senderName: "Chidi Nwachukwu",
    status: "received",
    eventType: "message",
    summary: "Inquiry regarding Aba Integrated Tailors wholesale catalog",
    payload: {
      object: "whatsapp_business_account",
      entry: [{
        id: "2394019284",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "+2348039998888", phone_number_id: "100695092955513" },
            contacts: [{ profile: { name: "Chidi Nwachukwu" }, wa_id: "2348039998888" }],
            messages: [{
              from: "2348039998888",
              id: "wamid.HBgLMTU1NTAyNTc5ODQVAgARGBIwRDg5QzBDNjdFOEYxMjNCNjAA",
              timestamp: Math.floor((Date.now() - 2 * 60 * 1000) / 1000).toString(),
              type: "text",
              text: { body: "Hello! Please send me the price catalog for Aba leather footwear." }
            }]
          }
        }]
      }]
    }
  },
  {
    id: "evt_sample_02",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    sender: "+2348145550199",
    senderPhone: "+2348145550199",
    senderName: "Aba Commercial Hub",
    status: "delivered",
    eventType: "status_update",
    summary: "Delivery confirmation for message wamid.HBgLMTU1NTA...",
    payload: {
      object: "whatsapp_business_account",
      entry: [{
        id: "2394019284",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            statuses: [{
              id: "wamid.HBgLMTU1NTAyNTc5ODQVAgARGBIwRDg5QzBDNjdFOEYxMjNCNjAA",
              status: "delivered",
              timestamp: Math.floor((Date.now() - 15 * 60 * 1000) / 1000).toString(),
              recipient_id: "2348145550199"
            }]
          }
        }]
      }]
    }
  },
  {
    id: "evt_sample_03",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    sender: "Make.com Automation Gateway",
    senderPhone: "Gateway-01",
    senderName: "Make.com Webhook",
    status: "processed",
    eventType: "test_simulation",
    summary: "Pre-flight initialization signal from Make.com scenario",
    payload: {
      source: "FindAba Hub Initialization Service",
      type: "whatsapp_intent",
      businessId: "test-business-abc-123",
      businessName: "Aba Integrated Tailors Collective",
      targetPhone: "+2348039998888",
      message: "Pre-flight initialization signal. Tap Save in Make.com.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  }
];

const sseClients = new Set<Response>();

export function addWebhookEvent(eventData: Partial<WhatsAppWebhookEvent> & { payload: any }): WhatsAppWebhookEvent {
  const event: WhatsAppWebhookEvent = {
    id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: eventData.timestamp || new Date().toISOString(),
    sender: eventData.sender || eventData.senderName || eventData.senderPhone || "Unknown Sender",
    senderPhone: eventData.senderPhone || "Unknown",
    senderName: eventData.senderName || "Unknown",
    status: eventData.status || "received",
    eventType: eventData.eventType || "message",
    summary: eventData.summary || "Incoming WhatsApp Webhook Event",
    payload: eventData.payload || {},
  };

  eventsRingBuffer.unshift(event);
  if (eventsRingBuffer.length > 50) {
    eventsRingBuffer = eventsRingBuffer.slice(0, 50);
  }

  // Broadcast to all active SSE streaming clients
  const messageStr = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(messageStr);
    } catch {
      sseClients.delete(client);
    }
  });

  return event;
}

// Keepalive ping for SSE connections
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.write(`: keepalive\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}, 20000);

const testWebhookSchema = z.object({
  webhookUrl: z.string().url(),
});

const inquirySchema = z.object({
  businessId: z.string().optional(),
  businessName: z.string().optional().default("Business"),
  phone: z.string().min(1),
  message: z.string().optional().default("Inquiry from FindAba"),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  makeWebhookUrlOverride: z.string().optional(),
});

const otpSchema = z.object({
  phone: z.string().min(1),
  code: z.string().min(1),
});

const welcomeSchema = z.object({
  phone: z.string().min(1),
  userName: z.string().optional(),
});

const notifySchema = z.object({
  phone: z.string().min(1),
  template: z.string().min(1),
  parameters: z.array(z.any()).optional().default([]),
});

const phoneOnlySchema = z.object({
  phone: z.string().min(1),
});

/** GET /api/whatsapp/events - Retrieve last 50 webhook events */
whatsappRouter.get("/events", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
  const search = (req.query.search as string || "").toLowerCase();
  const statusFilter = req.query.status as string;

  let filtered = [...eventsRingBuffer];
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter(e => e.status === statusFilter);
  }
  if (search) {
    filtered = filtered.filter(e => 
      e.sender.toLowerCase().includes(search) ||
      e.senderPhone.toLowerCase().includes(search) ||
      e.summary.toLowerCase().includes(search) ||
      e.id.toLowerCase().includes(search) ||
      JSON.stringify(e.payload).toLowerCase().includes(search)
    );
  }

  res.json({
    success: true,
    count: filtered.slice(0, limit).length,
    total: eventsRingBuffer.length,
    events: filtered.slice(0, limit),
  });
});

/** GET /api/whatsapp/events/stream - Real-time Server-Sent Events (SSE) stream */
whatsappRouter.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  res.write(`: sse connected\n\n`);
  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

/** POST /api/whatsapp/events/simulate - Trigger a simulated incoming WhatsApp webhook event */
whatsappRouter.post("/events/simulate", (req, res) => {
  const { senderName, senderPhone, messageText, status, eventType } = req.body || {};
  
  const phone = senderPhone || `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
  const name = senderName || "Aba Merchant Guest";
  const bodyText = messageText || "Hello! Can I get modern wholesale pricing for leather shoes?";
  const currentStatus = status || "received";
  const type = eventType || "message";

  const simulatedPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: `entry_${Date.now()}`,
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: phone,
                phone_number_id: "100695092955513"
              },
              contacts: [
                {
                  profile: { name: name },
                  wa_id: phone.replace(/\D/g, "")
                }
              ],
              messages: [
                {
                  from: phone.replace(/\D/g, ""),
                  id: `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: type,
                  text: { body: bodyText }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const newEvent = addWebhookEvent({
    sender: `${name} (${phone})`,
    senderName: name,
    senderPhone: phone,
    status: currentStatus as any,
    eventType: type as any,
    summary: `[Simulated] ${bodyText}`,
    payload: simulatedPayload,
  });

  res.json({ success: true, event: newEvent });
});

/** DELETE /api/whatsapp/events - Clear logged webhook events */
whatsappRouter.delete("/events", (req, res) => {
  eventsRingBuffer = [];
  res.json({ success: true, message: "Webhook events cleared", count: 0 });
});

/** Handshake helper for Make.com scenario setup — admin only. */
whatsappRouter.post("/test-webhook", ensureAdmin, async (req, res) => {
  const parsed = testWebhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid request body", details: parsed.error.flatten() });
  const { webhookUrl } = parsed.data;

  try {
    const payload = {
      source: "FindAba Hub Initialization Service",
      type: "whatsapp_intent",
      businessId: "test-business-abc-123",
      businessName: "Aba Integrated Tailors Collective",
      targetPhone: "+2348039998888",
      message: 'Pre-flight initialization signal. Tap "Save" in Make.com.',
      timestamp: new Date().toISOString(),
    };
    const response = await axios.post(webhookUrl, payload);
    
    addWebhookEvent({
      sender: "Make.com Webhook Test",
      senderName: "Make.com Test",
      senderPhone: "+2348039998888",
      status: "processed",
      eventType: "test_simulation",
      summary: "Outbound test webhook handshake to Make.com",
      payload,
    });

    res.json({ success: true, status: response.status, data: response.data });
  } catch (err: any) {
    console.error("[Make.com Setup] Dispatch failed:", err.message);
    res.status(500).json({ success: false, error: err.message, status: err.response?.status });
  }
});

whatsappRouter.post("/inquiry", async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid request body", details: parsed.error.flatten() });
  const { businessId, businessName, phone, message, userName, userEmail, makeWebhookUrlOverride } = parsed.data;
  const results: any = { whatsapp: { success: false }, make: { success: false } };

  const makeUrl = makeWebhookUrlOverride || env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    try {
      const payload = {
        source: "FindAba Contact Gateway",
        type: "whatsapp_intent",
        businessId,
        businessName,
        targetPhone: phone,
        message,
        userName,
        userEmail,
        timestamp: new Date().toISOString(),
      };
      await axios.post(makeUrl, payload);
      results.make.success = true;

      addWebhookEvent({
        sender: `${userName || 'User'} (${phone})`,
        senderName: userName || "Inquirer",
        senderPhone: phone,
        status: "processed",
        eventType: "message",
        summary: `Inquiry sent for ${businessName}: "${message}"`,
        payload,
      });
    } catch (err: any) {
      console.error("[Make.com] Sync failure:", err.message);
    }
  }

  results.whatsapp = await WhatsApp.sendBusinessInquiryMessage(phone, businessName, message, userName || "User");
  res.json(results);
});

whatsappRouter.post("/otp", async (req, res) => {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid request body", details: parsed.error.flatten() });
  const { phone, code } = parsed.data;
  res.json(await WhatsApp.sendOTPMessage(phone, code));
});

whatsappRouter.post("/welcome", async (req, res) => {
  const parsed = welcomeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid request body", details: parsed.error.flatten() });
  const { phone, userName } = parsed.data;
  res.json(await WhatsApp.sendWelcomeMessage(phone, userName || "User"));
});

whatsappRouter.post("/notify", async (req, res) => {
  const parsed = notifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid request body", details: parsed.error.flatten() });
  const { phone, template, parameters } = parsed.data;
  res.json(await WhatsApp.sendTemplateMessage(phone, template, "en_US", parameters || []));
});

whatsappRouter.post("/hello", async (req, res) => {
  const parsed = phoneOnlySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Missing phone number" });
  res.json(await WhatsApp.sendHelloWorld(parsed.data.phone));
});

whatsappRouter.post("/test", async (req, res) => {
  const parsed = phoneOnlySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Missing phone number" });
  res.json(await WhatsApp.sendTextMessage(parsed.data.phone, "FindAba Meta WhatsApp Test Successful"));
});


/** Meta webhook verification handshake. */
whatsappRouter.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN not configured.");
    return res.sendStatus(500);
  }

  if (mode === "subscribe" && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/** Meta webhook event receiver. */
whatsappRouter.post("/webhook", (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") {
    // Record non-standard webhook object as well
    addWebhookEvent({
      sender: "External Webhook Request",
      senderName: "Unknown Source",
      senderPhone: "N/A",
      status: "received",
      eventType: "message",
      summary: "Incoming raw non-meta webhook object",
      payload: body,
    });
    return res.status(200).send("EVENT_RECEIVED");
  }

  try {
    let parsedCount = 0;
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const contacts = value.contacts || [];

        // Incoming messages
        for (const message of value.messages || []) {
          const from = message.from || "Unknown";
          const profileName = contacts.find((c: any) => c.wa_id === from)?.profile?.name || `User (${from})`;
          const bodyText = message.text?.body || message.caption || `[${message.type} attachment]`;

          addWebhookEvent({
            sender: `${profileName} (+${from})`,
            senderName: profileName,
            senderPhone: `+${from}`,
            status: "received",
            eventType: message.type || "message",
            summary: bodyText,
            payload: body,
          });
          parsedCount++;
        }

        // Status updates (sent, delivered, read, failed)
        for (const statusObj of value.statuses || []) {
          const recipientId = statusObj.recipient_id || "Unknown";
          const statusName = statusObj.status || "processed";

          addWebhookEvent({
            sender: `Recipient (+${recipientId})`,
            senderName: `Status Update`,
            senderPhone: `+${recipientId}`,
            status: statusName as any,
            eventType: "status_update",
            summary: `WhatsApp delivery status: ${statusName.toUpperCase()} for msg ${statusObj.id || ''}`,
            payload: body,
          });
          parsedCount++;
        }
      }
    }

    if (parsedCount === 0) {
      addWebhookEvent({
        sender: "Meta Webhook Event",
        senderName: "Meta Cloud API",
        senderPhone: "Meta API",
        status: "received",
        eventType: "message",
        summary: "Meta webhook entry received",
        payload: body,
      });
    }
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error parsing payload:", err.message);
    addWebhookEvent({
      sender: "Meta Webhook Fault",
      senderName: "Meta Error",
      senderPhone: "N/A",
      status: "failed",
      eventType: "message",
      summary: `Failed to parse payload: ${err.message}`,
      payload: body,
    });
  }

  res.status(200).send("EVENT_RECEIVED");
});
