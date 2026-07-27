const API = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export async function sendOTP(phone: string) {
  const res = await fetch(`${API}/send-otp`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function verifyOTP(phone: string, code: string) {
  const res = await fetch(`${API}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  return res.json();
}

export async function loginWithPhone(phone: string, code: string) {
  const data = await verifyOTP(phone, code);

  if (!data.success) throw new Error("OTP failed");

  return data.profile;
}

export function logout() {
  // Local storage cleanup (legacy)
  localStorage.removeItem("user");
}
