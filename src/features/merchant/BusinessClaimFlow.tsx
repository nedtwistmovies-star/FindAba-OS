
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Key, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { IndustrialButton } from '../../components';
import { createBusinessClaim, verifyBusinessClaim } from '../../services/supabaseService';
import { useAuth } from '../../providers/AuthProvider';
import { toast } from 'sonner';

interface BusinessClaimFlowProps {
  businessId: string;
  businessName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type ClaimStep = 'init' | 'otp' | 'success';

export const BusinessClaimFlow: React.FC<BusinessClaimFlowProps> = ({ 
  businessId, 
  businessName, 
  onSuccess, 
  onCancel 
}) => {
  const { userIdentifier } = useAuth();
  const [step, setStep] = useState<ClaimStep>('init');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!userIdentifier) return;
    setLoading(true);
    setError(null);
    try {
      await createBusinessClaim(businessId, userIdentifier);
      toast.success("Verification code sent to your email.");
      setStep('otp');
    } catch (err: any) {
      setError(err.message || "Failed to initialize claim.");
      toast.error(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyBusinessClaim(businessId, otp);
      setStep('success');
      toast.success("Business verified successfully!");
    } catch (err: any) {
      setError(err.message || "Verification failed.");
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-aba-deep/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl max-w-xl w-full mx-auto relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-aba-gold/5 blur-[80px] rounded-full" />
      
      <AnimatePresence mode="wait">
        {step === 'init' && (
          <motion.div 
            key="init"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-aba-gold/10 rounded-2xl">
                <ShieldCheck className="text-aba-gold" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Secure Claim</h3>
                <p className="text-[10px] font-black text-aba-gold uppercase tracking-widest">Ownership Verification</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-white/60 text-sm leading-relaxed">
                You are about to claim <span className="text-white font-bold">{businessName}</span>. 
                To ensure security, we will send a verification code to your registered email:
              </p>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <Mail className="text-white/40" size={20} />
                <span className="text-white font-bold">{userIdentifier}</span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={18} />
                <p className="text-red-500 text-xs font-bold">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <IndustrialButton 
                variant="secondary" 
                size="md" 
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </IndustrialButton>
              <IndustrialButton 
                variant="primary" 
                size="md" 
                className="flex-1"
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send Code"}
              </IndustrialButton>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div 
            key="otp"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setStep('init')}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-aba-gold transition-colors"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to initiation
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Enter Signal</h3>
              <p className="text-white/60 text-sm">We've sent a 6-digit verification code to your email.</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-aba-gold" size={24} />
                <input 
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-3xl font-black tracking-[0.5em] text-white outline-none focus:border-aba-gold focus:ring-4 focus:ring-aba-gold/10 transition-all text-center"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={18} />
                  <p className="text-red-500 text-xs font-bold">{error}</p>
                </div>
              )}

              <IndustrialButton 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify Ownership"}
              </IndustrialButton>

              <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Code expires in 5 minutes
              </p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-aba-green/20 rounded-full flex items-center justify-center mx-auto border border-aba-green/30">
              <CheckCircle className="text-aba-green" size={48} />
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Verified!</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Platform ownership successfully established. You now have full administrative control over <span className="text-aba-gold font-bold">{businessName}</span>.
              </p>
            </div>

            <IndustrialButton 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={onSuccess}
            >
              Enter Merchant Terminal
            </IndustrialButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
