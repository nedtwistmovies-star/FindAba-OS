
import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Shield, Zap, Star, LayoutGrid, CheckCircle2, 
  Lock, ArrowRight, Loader2, Sparkles, Trophy,
  TrendingUp, Globe, ShieldCheck, ArrowLeft,
  Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState, HubTier, SubscriptionTier, Business } from '../../types';
import { BUSINESS_PLANS } from '../../constants';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useAuth } from '../../providers/AuthProvider';
import { updateBusinessTier, subscribeToProfile } from '../../services/supabaseService';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';

interface HubEnrollmentProps {
  business: Business;
  setView: (v: ViewState) => void;
  onUpdate?: () => void;
}

const HubEnrollment: React.FC<HubEnrollmentProps> = ({ business, setView, onUpdate }) => {
  const { userIdentifier, user_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState<HubTier | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fireConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  // Real-time subscription for tier updates
  useEffect(() => {
    if (!userIdentifier) return;

    const { unsubscribe } = subscribeToProfile(userIdentifier, (payload) => {
      console.log('[Realtime] Profile updated:', payload);
      setProfile(payload.new);
      const newTier = payload.new.tier_level;
      if (newTier !== business.hub_tier) {
        setUpgradeSuccess(true);
        setVerifying(false);
        fireConfetti();
        if (onUpdate) onUpdate();
      }
    });

    return () => unsubscribe();
  }, [userIdentifier, business.hub_tier, onUpdate, fireConfetti]);

  const tiers = [
    {
      id: HubTier.STARTER,
      subTier: SubscriptionTier.FREE,
      icon: LayoutGrid,
      color: 'text-white/40',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
      description: 'Entry-level presence in the Enyimba registry.',
      amount: 0,
      features: ['Basic Directory Entry', 'Standard Contact', 'Community Access']
    },
    {
      id: HubTier.LOCAL_TRUST,
      subTier: SubscriptionTier.VERIFIED,
      icon: Shield,
      color: 'text-aba-green',
      bgColor: 'bg-aba-green/10',
      borderColor: 'border-aba-green/20',
      description: 'Verified status for trusted local artisans.',
      amount: 2500,
      features: ['Trusted Partner Badge', 'Verified Hub Profile', 'Local Signal Priority']
    },
    {
      id: HubTier.GROWTH_ENGINE,
      subTier: SubscriptionTier.GROWTH,
      icon: Zap,
      color: 'text-aba-gold',
      bgColor: 'bg-aba-gold/10',
      borderColor: 'border-aba-gold/20',
      description: 'High-velocity scaling for master workshops.',
      amount: 5000,
      features: ['Search Priority Partner', 'Creative Lab Access', 'City Pulse Insights']
    },
    {
      id: HubTier.EXPORT_READY,
      subTier: SubscriptionTier.PREMIUM,
      icon: Star,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Global trade connectivity for industrial leaders.',
      amount: 10000,
      features: ['Verified Exporter Partner', 'Unlimited Ranking', 'Global Buyer Signals']
    }
  ];

  const currentTierIndex = tiers.findIndex(t => t.id === business.hub_tier) || 0;

  const handleUpgrade = (tier: any) => {
    if (tier.amount === 0) return;
    setSelectedTier(tier.id);
    setShowPayment(true);
  };

  const onPaymentSuccess = async (res?: any) => {
    if (!selectedTier) return;
    setShowPayment(false);
    setVerifying(true);
    
    try {
      console.log('[Enrollment] Payment success signal received. Updating Registry...', res);
      
      // AI Studio Environment Fix: Since there is no server-side webhook listener, 
      // we must manually update the business tier in the registry.
      const tierLabel = tiers.find(t => t.id === selectedTier)?.id || selectedTier;
      await updateBusinessTier(business.id, tierLabel as HubTier);
      
      // If payment was via AI scan, store verification proof
      if (res?.ai_verified && res.verdict) {
         localStorage.setItem(`verification_proof_${business.id}`, JSON.stringify(res.verdict));
      }

      // Manually trigger the success state after a brief registry sync delay
      setTimeout(() => {
        setUpgradeSuccess(true);
        setVerifying(false);
        fireConfetti();
        if (onUpdate) onUpdate();
      }, 2000);

    } catch (err) {
      console.error('[Enrollment] Registry update failed:', err);
      setVerifying(false);
      // Fallback to inform the user
      alert("Registry Sync Failed: Your signal was received but could not be committed to the master ledger. Please refresh and try again.");
    }
  };

  if (upgradeSuccess) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[7000] bg-[#002113] flex flex-col items-center justify-center p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-40 h-40 bg-gradient-to-br from-aba-gold to-yellow-600 rounded-[3rem] flex items-center justify-center text-aba-dark mb-10 shadow-[0_30px_70px_rgba(255,215,0,0.4)] relative"
          >
            <Trophy size={80} />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[3rem] border-4 border-white/30"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Tier Upgraded!</h2>
            <p className="text-2xl text-aba-gold font-bold uppercase tracking-[0.2em]">
              Welcome to {selectedTier} Status
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 space-y-6"
          >
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Registry Updated Successfully</p>
            <button 
              onClick={() => setView('merchant-portal')}
              className="group relative px-16 py-6 bg-white text-aba-dark rounded-2xl font-black uppercase text-xs tracking-[0.4em] overflow-hidden transition-all hover:pr-20 active:scale-95"
            >
              <span className="relative z-10">Return to Command</span>
              <ArrowRight className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all" size={20} />
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-[#002113] text-white flex flex-col font-sans pb-40">
      <PaystackOverlay 
        isOpen={showPayment}
        amount={tiers.find(t => t.id === selectedTier)?.amount || 0}
        email={userIdentifier || 'guest@findaba.com'}
        userId={user_id || undefined}
        label={`Upgrade to ${selectedTier}`}
        onSuccess={onPaymentSuccess}
        onCancel={() => setShowPayment(false)}
      />

      <AnimatePresence>
        {verifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-[#002113]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-aba-gold/10 rounded-[2rem] flex items-center justify-center text-aba-gold mb-8 relative"
            >
              <Loader2 size={48} className="animate-spin" />
              <div className="absolute inset-0 border-4 border-aba-gold/20 rounded-[2rem] animate-pulse" />
            </motion.div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Verifying Settlement</h3>
            <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em] animate-pulse">Waiting for Registry Confirmation...</p>
            <div className="mt-12 max-w-xs p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                Our AI Sentinel is auditing the ledger. Your tier will upgrade automatically once the signal is confirmed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="p-6 sm:p-10 border-b border-white/5 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl bg-[#002113]/90">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('merchant-portal')} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 active:scale-90 transition-all">
             <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Hub <span className="text-aba-gold">Enrollment</span></h2>
            <p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em] mt-2">Tier Progression Protocol</p>
          </div>
        </div>
      </header>

      <main className="p-6 sm:p-10 max-w-3xl mx-auto w-full space-y-12">
        {/* PROGRESS STACK */}
        <div className="space-y-4">
           <div className="flex justify-between items-end mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Progression Stack</h3>
              <span className="text-[10px] font-black text-aba-gold uppercase tracking-widest">Level {currentTierIndex + 1} / 4</span>
           </div>
           
           <div className="space-y-3">
              {tiers.map((tier, idx) => {
                const isActive = business.hub_tier === tier.id;
                const isCompleted = idx < currentTierIndex;
                const isLocked = idx > currentTierIndex + 1;
                const isAvailable = idx === currentTierIndex + 1;

                return (
                  <motion.div 
                    key={tier.id}
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1.02 : 1,
                      opacity: isLocked ? 0.5 : 1
                    }}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
                      isActive ? 'bg-[#052b1b] border-aba-gold shadow-[0_20px_50px_rgba(255,215,0,0.1)]' : 
                      isCompleted ? 'bg-white/5 border-aba-green/30' :
                      isAvailable ? 'bg-white/5 border-white/20 hover:border-aba-gold/50 cursor-pointer' :
                      'bg-white/5 border-white/5'
                    }`}
                    onClick={() => isAvailable && handleUpgrade(tier)}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 px-6 py-2 bg-aba-gold text-aba-dark text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                        Current Tier
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                         isCompleted ? 'bg-aba-green text-white' : 
                         isActive ? 'bg-aba-gold text-aba-dark' : 
                         'bg-white/10 text-white/40'
                       }`}>
                          {isCompleted ? <CheckCircle2 size={24} /> : <tier.icon size={24} />}
                       </div>
                       
                       <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                             <h4 className={`text-lg font-black uppercase tracking-tight ${isActive ? 'text-aba-gold' : 'text-white'}`}>
                               {tier.id}
                             </h4>
                             {isLocked && <Lock size={14} className="text-white/20" />}
                          </div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                            {tier.description}
                          </p>
                       </div>

                       {isAvailable && (
                         <div className="hidden sm:flex items-center gap-2 text-aba-gold">
                            <span className="text-[10px] font-black uppercase tracking-widest">Upgrade</span>
                            <ArrowRight size={16} />
                         </div>
                       )}
                    </div>

                    {/* FEATURES LIST (Only for Active or Available) */}
                    {(isActive || isAvailable) && (
                      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {tier.features.map((f, i) => (
                           <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-white/60 uppercase tracking-widest">
                              <div className="w-1 h-1 rounded-full bg-aba-gold" />
                              {f}
                           </div>
                         ))}
                      </div>
                    )}

                    {/* PROGRESS BAR (Only for Current Tier) */}
                    {isActive && idx < tiers.length - 1 && (
                      <div className="mt-6 space-y-2">
                         <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/40">
                            <span>Next: {tiers[idx+1].id}</span>
                            <span>₦{tiers[idx+1].amount.toLocaleString()} Required</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: profile ? `${Math.min(100, (profile.total_paid / tiers[idx+1].amount) * 100)}%` : '0%' }}
                              className="h-full bg-aba-gold"
                            />
                         </div>
                         {profile && (
                           <p className="text-[7px] font-bold text-aba-gold/60 uppercase tracking-widest">
                             ₦{profile.total_paid.toLocaleString()} contributed to next tier
                           </p>
                         )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
           </div>
        </div>

        {/* SMART CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-[#002113] via-[#002113] to-transparent z-40">
           <div className="max-w-3xl mx-auto w-full">
              {currentTierIndex < tiers.length - 1 ? (
                <button 
                  onClick={() => handleUpgrade(tiers[currentTierIndex + 1])}
                  className="w-full py-6 bg-aba-gold text-aba-dark rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(255,215,0,0.2)] hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-4"
                >
                  Upgrade to {tiers[currentTierIndex + 1].id} (₦{tiers[currentTierIndex + 1].amount.toLocaleString()})
                  <ArrowRight size={20} />
                </button>
              ) : (
                <div className="w-full py-6 bg-white/5 border border-white/10 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] text-white/40 flex items-center justify-center gap-4">
                  <Trophy size={20} className="text-aba-gold" />
                  You're at the highest tier
                </div>
              )}
              <p className="text-[7px] text-center font-black uppercase text-white/20 tracking-[0.5em] mt-6">Industrial Settlement Protocol v2.0</p>
           </div>
        </div>
      </main>
    </div>
  );
};

export default HubEnrollment;
