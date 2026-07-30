import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendEmail } from "../services/resend";

export const emailRouter = Router();

const emailRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  from: z.string().optional(),
  name: z.string().optional(),
  apiKey: z.string().optional(),
});

emailRouter.post("/send-email", emailRateLimit, async (req, res) => {
  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }
  const { to, subject, html, from, name, apiKey } = parsed.data;

  try {
    const data = await sendEmail({ to, subject, html, from, name, apiKeyOverride: apiKey });
    res.json({ success: true, id: (data as any)?.id });
  } catch (err: any) {
    console.error("[Email] Send failure:", err.message);
    res.status(500).json({ error: err.message });
  }
});
