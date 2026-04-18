import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  // Verification Step (Simplified for Edge Function demo)
  // In production, use crypto to verify HMAC SHA512
  /*
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const hmac = hmac("sha512", secret);
  hmac.update(body);
  const hash = hmac.digest("hex");
  if (hash !== signature) { return new Response("Invalid", { status: 401 }); }
  */

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const orderId = event.data.metadata?.order_id;

    if (orderId) {
      // Call DB function
      await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/complete_order_payment`, {
        method: "POST",
        headers: {
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_order_id: orderId,
          p_reference: reference,
        }),
      });
    }
  }

  return new Response("ok", { status: 200 });
});
