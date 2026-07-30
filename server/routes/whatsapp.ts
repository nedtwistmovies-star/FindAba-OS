import { Router } from "express";
import axios from "axios";
import { ensureAdmin } from "../middleware/admin";
import { env } from "../services/env";
import * as WhatsApp from "../../src/services/whatsappService";

export const whatsappRouter = Router();

/** Handshake helper for Make.com scenario setup — admin only. */
whatsappRouter.post("/test-webhook", ensureAdmin, async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ success: false, error: "Missing 'webhookUrl' parameter" });

  try {
    const response = await axios.post(webhookUrl, {
      source: "FindAba Hub Initialization Service",
      type: "whatsapp_intent",
      businessId: "test-business-abc-123",
      businessName: "Aba Integrated Tailors Collective",
      targetPhone: "+2348039998888",
      message: 'Pre-flight initialization signal. Tap "Save" in Make.com.',
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, status: response.status, data: response.data });
  } catch (err: any) {
    console.error("[Make.com Setup] Dispatch failed:", err.message);
    res.status(500).json({ success: false, error: err.message, status: err.response?.status });
  }
});

whatsappRouter.post("/inquiry", async (req, res) => {
  const { businessId, businessName, phone, message, userName, userEmail, makeWebhookUrlOverride } = req.body;
  const results: any = { whatsapp: { success: false }, make: { success: false } };

  const makeUrl = makeWebhookUrlOverride || env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    try {
      await axios.post(makeUrl, {
        source: "FindAba Contact Gateway",
        type: "whatsapp_intent",
        businessId,
        businessName,
        targetPhone: phone,
        message,
        userName,
        userEmail,
        timestamp: new Date().toISOString(),
      });
      results.make.success = true;
    } catch (err: any) {
      console.error("[Make.com] Sync failure:", err.message);
    }
  }

  results.whatsapp = await WhatsApp.sendBusinessInquiryMessage(phone, businessName, message, userName);
  res.json(results);
});

whatsappRouter.post("/otp", async (req, res) => {
  const { phone, code } = req.body;
  res.json(await WhatsApp.sendOTPMessage(phone, code));
});

whatsappRouter.post("/welcome", async (req, res) => {
  const { phone, userName } = req.body;
  res.json(await WhatsApp.sendWelcomeMessage(phone, userName));
});

whatsappRouter.post("/notify", async (req, res) => {
  const { phone, template, parameters } = req.body;
  res.json(await WhatsApp.sendTemplateMessage(phone, template, "en_US", parameters || []));
});

whatsappRouter.post("/hello", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: "Missing phone number" });
  res.json(await WhatsApp.sendHelloWorld(phone));
});

whatsappRouter.post("/test", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: "Missing phone number" });
  res.json(await WhatsApp.sendTextMessage(phone, "FindAba Meta WhatsApp Test Successful"));
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
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const contacts = value.contacts || [];
        for (const message of value.messages || []) {
          const from = message.from;
          const profileName = contacts.find((c: any) => c.wa_id === from)?.profile?.name || "Unknown";
          console.log(`[WhatsApp Incoming] Message from ${profileName} (${from}) of type "${message.type}"`);
        }
      }
    }
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error parsing payload:", err.message);
  }

  res.status(200).send("EVENT_RECEIVED");
});
