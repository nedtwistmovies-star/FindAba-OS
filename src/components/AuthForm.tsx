import { useState } from "react";
import { signInWithEmail } from "../lib/auth";
import { notify } from "../lib/toast";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) return notify("Enter your email");

    setLoading(true);

    try {
      await signInWithEmail(email);
      notify("📩 Check your email for login link");
    } catch (err: any) {
      notify(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-3">Login</h2>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full p-2 border rounded mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="w-full bg-black text-white p-2 rounded"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Login Link"}
      </button>
    </div>
  );
}
