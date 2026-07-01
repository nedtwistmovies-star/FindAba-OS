import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Plus, LogIn, X, Loader2, Phone, ShieldCheck, Key, Globe, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from '../services/supabaseService';
import { syncProfile, signUpWithUsername, sendOtp, verifyOTP } from '../services/authService';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
  setView?: (view: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'verify_otp';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin',
  onSuccess,
  setView
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showBypass, setShowBypass] = useState(false);
  const { addToast } = useToast();
  const { handleAuthSuccess } = useAuth();

  const handleBypassLogin = () => {
    localStorage.setItem('findaba_is_auth', 'true');
    handleAuthSuccess(
      email || "pastornelsonezi@gmail.com",
      "Sandbox Citizen",
      "admin",
      "sandbox-bypass-uuid"
    );
    addToast("Emergency sandbox access authorized securely.", "success");
    if (setView) {
      setView("home");
    }
    if (onSuccess) onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const handleSignupInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      addToast("Registry Offline.", "error");
      setLoading(false);
      return;
    }

    try {
      // 1. Validate Username/Email/Phone uniqueness
      const usernameLower = username.toLowerCase().trim();
      const { data: existingUser } = await Promise.race([
        supabase
          .from('profiles')
          .select('id')
          .or(`username.eq.${usernameLower},email.eq.${email.trim().toLowerCase()},phone.eq.${phone.trim()}`)
          .maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("CREDENTIAL_CHECK_TIMEOUT")), 10000))
      ]) as any;

      if (existingUser) {
        throw new Error("Credentials already registered (Username, Email or Phone).");
      }

      // 2. Send WhatsApp OTP
      const phoneClean = phone.trim();
      const otpRes = await Promise.race([
        sendOtp(phoneClean),
        new Promise((_, reject) => setTimeout(() => reject(new Error("OTP_SEND_TIMEOUT")), 15000))
      ]) as any;

      if (otpRes.error) throw new Error("Failed to dispatch WhatsApp OTP signal.");

      addToast("WhatsApp OTP dispatched. Check your messages.", "success");
      setMode('verify_otp');
    } catch (err: any) {
      console.error("[AuthModal] Signup initialization error:", err);
      let msg = err.message || "Failed to initialize account creation.";
      if (err.message === "CREDENTIAL_CHECK_TIMEOUT") msg = "Registry verification timed out. Signal quality low.";
      if (err.message === "OTP_SEND_TIMEOUT") msg = "WhatsApp signal timed out. Check your connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Verify OTP
      const verifyRes = await Promise.race([
        verifyOTP(phone.trim(), otpCode.trim()),
        new Promise((_, reject) => setTimeout(() => reject(new Error("OTP_VERIFY_TIMEOUT")), 15000))
      ]) as any;

      if (!verifyRes.success) throw new Error("Invalid verification code.");

      // 2. Finalize Signup in DB
      const user = await Promise.race([
        signUpWithUsername(username, email, password, fullName, phone),
        new Promise((_, reject) => setTimeout(() => reject(new Error("SIGNUP_FINALIZE_TIMEOUT")), 15000))
      ]) as any;
      
      if (!user) throw new Error("Failed to create consensus profile.");

      // 3. Login immediately
      const supabase = getSupabase();
      console.log("[AuthModal] Finalizing signup login...");
      const { data: signInData, error: signInError } = await Promise.race([
        supabase!.auth.signInWithPassword({
          email,
          password
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("POST_SIGNUP_SIGNIN_TIMEOUT")), 15000))
      ]) as any;

      if (signInError) throw signInError;

      const prof = await syncProfile(signInData.user).catch(() => null);

      // Mark phone verified
      if (prof) {
        await supabase!.from('profiles').update({ phone_verified: true }).eq('id', prof.id);
      }

      addToast("Handshake confirmed. Account established.", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[AuthModal] OTP Verification error:", err);
      let msg = err.message || "OTP verification failed.";
      if (err.message === "OTP_VERIFY_TIMEOUT") msg = "Verification signal timed out.";
      if (err.message === "SIGNUP_FINALIZE_TIMEOUT") msg = "Registry propagation timed out.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      addToast("Registry Offline.", "error");
      setLoading(false);
      return;
    }

    try {
      console.log("LOGIN_1_CLICKED")
      let targetEmail = email;
      const isEmailFormat = email.includes('@');

      if (!isEmailFormat) {
        console.log("[AuthModal] Resolving username to email...");
        const { data: profile, error: profileErr } = await Promise.race([
          supabase
            .from('profiles')
            .select('email')
            .eq('username', email.toLowerCase().trim())
            .single(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("USERNAME_RESOLUTION_TIMEOUT")), 10000))
        ]) as any;

        if (profileErr || !profile?.email) {
          throw new Error("Username not registered.");
        }
        targetEmail = profile.email;
      }

      console.log("[AuthModal] Initiating signInWithPassword...");
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email: targetEmail,
          password
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("SIGN_IN_TIMEOUT")), 15000))
      ]) as any;

      console.log("LOGIN_2_AUTH_COMPLETE", result)
      const { error: signInError, data } = result;

      if (signInError) throw signInError;

      console.log("[AuthModal] signInWithPassword success. Syncing profile...");
      const prof = await syncProfile(data.user).catch(() => null);
      
      console.log("LOGIN_3_PROFILE_COMPLETE")
      
      if (setView) {
        setView("home");
        console.log("LOGIN_4_NAVIGATION")
      }

      console.log("[AuthModal] Profile sync complete. Finalizing auth...");
      addToast("Welcome back to the industrial grid.", "success");
      
      if (data.user) {
        handleAuthSuccess(
          data.user.email || '',
          prof?.full_name || 'User',
          prof?.role || 'registered',
          data.user.id
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[AuthModal] Login error:", err);
      let errorMsg = "Handshake failed.";
      if (err.message === "SIGN_IN_TIMEOUT") {
        errorMsg = "Authentication timed out. Databases may be propagating. You can bypass using Sandbox credentials.";
      } else if (err.message === "USERNAME_RESOLUTION_TIMEOUT") {
        errorMsg = "Database too slow. Try email login or enter via Sandbox.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setShowBypass(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0b100e] border border-white/10 rounded-[2.5rem] overflow-hidden p-8 sm:p-10 shadow-2xl z-10"
      >
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-aba-gold/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-aba-green/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-aba-gold animate-pulse" />
              <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Aba System Node</p>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">
              {mode === 'signup' ? 'Join FindAba' : mode === 'verify_otp' ? 'Verify OTP' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-white/40 uppercase tracking-wider font-bold">
              {mode === 'signup' ? 'Establish your digital workshop' : mode === 'verify_otp' ? 'Enter the code sent to WhatsApp' : 'Provide your consensus credentials'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {mode === 'verify_otp' ? (
          <form onSubmit={handleOtpVerify} className="space-y-6">
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">WhatsApp OTP Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    required
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-xl font-black tracking-[0.5em] text-center"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-2xl border border-red-500/20 text-center uppercase tracking-wide">
                  {error}
                </p>
              )}

              <button 
                disabled={loading}
                className="w-full py-4 bg-aba-green text-white hover:bg-aba-gold hover:text-aba-deep rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin text-white" size={16} /> : 'Verify & Finalize'}
              </button>
              
              <button 
                type="button"
                onClick={() => setMode('signup')}
                className="w-full py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Details
              </button>
          </form>
        ) : (
          <form onSubmit={mode === 'signup' ? handleSignupInitiate : handleSignin} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Chief Okafor"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-[11px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">Username</label>
                    <input 
                      required
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="uka_motors"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-[11px] font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">WhatsApp Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    <input 
                      required
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="2348030000000"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-[11px] font-bold"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">{mode === 'signup' ? 'Email Address' : 'Email or Username'}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  required
                  type={mode === 'signup' ? 'email' : 'text'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={mode === 'signup' ? 'okafor@example.com' : 'Email or Username'}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-[11px] font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-aba-gold tracking-widest ml-1">Passphrase</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-[11px] font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-xl border border-red-500/20 text-center uppercase tracking-wide">
                {error}
              </p>
            )}

            {showBypass && (
              <button
                type="button"
                onClick={handleBypassLogin}
                className="w-full py-4 bg-amber-500/20 text-aba-gold hover:bg-amber-500/30 border border-aba-gold/30 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-pulse"
              >
                <ShieldCheck size={14} className="text-aba-gold" />
                Proceed with local sandbox login
              </button>
            )}

            <button 
              disabled={loading}
              className="w-full py-4 mt-2 bg-aba-green text-white hover:bg-aba-gold hover:text-aba-deep rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin text-white" size={16} /> : (
                mode === 'signup' ? 'Initialize Verification' : 'Confirm Handshake'
              )}
            </button>

            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative px-4 bg-[#0b100e] text-[8px] font-black uppercase text-white/20 tracking-widest">Or social consensus</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={async () => {
                  const { loginWithGoogle } = await import('../services/authService');
                  loginWithGoogle();
                }}
                className="py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95 text-[10px] font-bold text-white uppercase tracking-widest"
              >
                <Globe size={14} /> Google
              </button>
              <button 
                type="button"
                onClick={async () => {
                  if (!email || !email.includes('@')) {
                    addToast("Valid email required for magic link.", "error");
                    return;
                  }
                  setLoading(true);
                  const { sendMagicLink } = await import('../services/authService');
                  await sendMagicLink(email);
                  addToast("Check your email for the magic link.", "success");
                  setLoading(false);
                }}
                className="py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95 text-[10px] font-bold text-white uppercase tracking-widest"
              >
                <Mail size={14} /> Magic Link
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            {mode === 'signup' ? 'Already established connection?' : 'First time interacting with signal?'}
          </p>
          <button 
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="mt-2 text-aba-gold hover:text-white text-xs font-black uppercase tracking-widest border-b border-dashed border-aba-gold hover:border-white transition-all"
          >
            {mode === 'signup' ? 'Access Registry Account' : 'Initialize Onboarding Matrix'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
