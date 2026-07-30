import { Router } from "express";
import crypto from "crypto";
import axios from "axios";
import { env } from "../services/env";
import { supabase } from "../services/supabase";
import { sendPaymentSuccessEmail } from "../../src/services/emailService";

export const paymentRouter = Router();

paymentRouter.post("/paystack-webhook", async (req, res) => {
  const secret = env.PAYSTACK_SECRET_KEY;
  const signature = req.headers["x-paystack-signature"] as string;

  if (!secret || !signature) {
    console.error("[Paystack Webhook] Missing secret or signature");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");
  if (hash !== signature) {
    console.error("[Paystack Webhook] Invalid signature");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;
    const userId = metadata?.user_id;
    const bookingId = metadata?.booking_id;
    const orderId = metadata?.order_id;

    if (!userId && !orderId) {
      return res.status(400).json({ error: "Missing user/order identification" });
    }

    try {
      const paymentData: any = {
        user_id: userId,
        amount: amount / 100,
        reference,
        status: "success",
        provider: "paystack",
        metadata: event.data,
        created_at: new Date().toISOString(),
      };
      if (bookingId) paymentData.booking_id = bookingId;
      if (orderId) paymentData.order_id = orderId;

      const { error: paymentError } = await supabase.from("payments").upsert(paymentData, { onConflict: "reference" });
      if (paymentError) throw paymentError;

      if (orderId) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId);
        if (orderError) console.error("[Paystack Webhook] Order update failed:", orderError.message);
      }

      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("tier_level, email, full_name")
          .eq("id", userId)
          .single();

        if (!profileError && profile?.email) {
          sendPaymentSuccessEmail(profile.email, reference, amount / 100).catch((err) =>
            console.error("[Email] Payment success email failed:", err.message)
          );
        }

        if (env.MAKE_WEBHOOK_URL) {
          axios
            .post(env.MAKE_WEBHOOK_URL, { user_id: userId, order_id: orderId, amount: amount / 100, reference, timestamp: new Date().toISOString() })
            .catch((err) => console.error("[Paystack Webhook] Make.com trigger failed:", err.message));
        }
      }
    } catch (err: any) {
      console.error("[Paystack Webhook] Processing error:", err.message);
      return res.status(500).json({ error: "Internal processing error" });
    }
  }

  res.status(200).json({ status: "success" });
});
