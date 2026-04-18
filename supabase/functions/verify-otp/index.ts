import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { phone, code } = await req.json();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify OTP via DB function (RPC)
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/rpc/verify_otp`, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_phone: phone,
      p_code: code,
    }),
  });

  const isValid = await verifyRes.json();

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid OTP" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Get or create profile
  let profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?phone=eq.${phone}`, {
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
  });

  let profiles = await profileRes.json();

  let profile;

  if (!profiles || profiles.length === 0) {
    const createRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ 
        id: crypto.randomUUID(), // Note: In a real scenario, you'd use Supabase Auth to link them if needed. 
        phone,
        full_name: `Citizen ${phone.slice(-4)}`,
        email: `user_${Date.now()}@findaba.com.ng` // Placeholder to avoid null email if requested
      }),
    });

    const createdProfiles = await createRes.json();
    profile = Array.isArray(createdProfiles) ? createdProfiles[0] : createdProfiles;
  } else {
    profile = profiles[0];
  }

  return new Response(JSON.stringify({ success: true, profile }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
