
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { verifyOTP, sendOTP } from '../../services/authService';

interface OTPVerificationProps {
  identifier: string; // phone or email
  type: 'phone' | 'email';
  onSuccess: () => void;
  onBack: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ identifier, type, onSuccess, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const { addToast } = useToast();

  useEffect(() => {
    const t = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verify = async () => {
    const otp = code.join('');
    if (otp.length < 6) return;
    
    setLoading(true);
    try {
      await verifyOTP(identifier, otp);
      addToast("Industrial Identity Validated.", "success");
      onSuccess();
    } catch (err: any) {
      addToast(err.message || "Invalid Validation Token.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      await sendOTP(identifier);
      setTimer(60);
      addToast("New validation token dispatched.", "success");
    } catch (err: any) {
      addToast("Resend protocol failed.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-14 space-y-12 shadow-2xl"
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-aba-gold/10 border border-aba-gold/30 rounded-2xl flex items-center justify-center text-aba-gold mx-auto shadow-glow">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Security Node</h2>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic leading-relaxed">
          Validation Token sent to <br />
          <span className="text-aba-gold">{identifier}</span>
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between gap-3">
          {code.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl text-center text-xl font-black text-white focus:border-aba-gold/50 outline-none transition-all shadow-inner"
            />
          ))}
        </div>

        <button 
          onClick={verify}
          disabled={loading || code.join('').length < 6}
          className="w-full py-6 bg-aba-gold text-aba-deep rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>AUTHORIZE PROTOCOL <ArrowRight size={18} /></>
          )}
        </button>

        <div className="flex flex-col items-center gap-6 pt-4 border-t border-white/5">
          <button 
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors disabled:opacity-20"
          >
            {resending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            Resend Token {timer > 0 && `(Wait ${timer}s)`}
          </button>
          
          <button 
            onClick={onBack}
            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-aba-gold transition-colors"
          >
            Switch Identity / Login
          </button>
        </div>
      </div>
    </motion.div>
  );
};
