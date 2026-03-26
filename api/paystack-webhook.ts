import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Step 1: Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("[PAYSTACK] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;

    // ✅ Step 2: Handle successful payment
    if (event.event === "charge.success") {
      const data = event.data;

      const reference = data.reference;
      const amount = data.amount / 100; // convert kobo → naira
      const email = data.customer?.email;

      console.log("[PAYSTACK] Payment verified:", reference);

      // 🧠 TODO: CONNECT TO YOUR SYSTEM
      // Example:
      // await logTransaction(...)
      // await activatePlanFeatures(...)

      return res.status(200).json({ status: "success" });
    }

    // Ignore other events safely
    return res.status(200).json({ status: "ignored" });

  } catch (err: any) {
    console.error("[PAYSTACK] Webhook error:", err);
    return res.status(500).json({
      error: "Webhook failure",
      message: err.message,
    });
  }
}
