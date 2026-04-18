import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { phone } = await req.json();

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date(Date.now() + 5 * 60 * 1000);

  // Save to DB
  await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/otp_logs`, {
    method: "POST",
    headers: {
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone,
      code,
      expires_at: expires.toISOString(),
    }),
  });

  // Send via Termii
  await fetch("https://api.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: phone,
      from: Deno.env.get("TERMII_SENDER_ID") || "FindAba",
      sms: `Your FindAba OTP is ${code}`,
      type: "plain",
      channel: "generic",
      api_key: Deno.env.get("TERMII_API_KEY"),
    }),
  });

  return new Response(JSON.stringify({ success: true }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
