
import React, { useState, useEffect } from 'react';
import { 
  Shield, Zap, Star, LayoutGrid, CheckCircle2, 
  Lock, ArrowRight, Loader2, Sparkles, Trophy,
  TrendingUp, Globe, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, HubTier, SubscriptionTier, Business } from '../../types';
import { BUSINESS_PLANS } from '../../constants';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useAuth } from '../../providers/AuthProvider';
import { updateBusinessTier } from '../../services/supabaseService';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';

interface HubEnrollmentProps {
  business: Business;
  setView: (v: ViewState) => void;
  onUpdate?: () => void;
}

const HubEnrollment: React.FC<HubEnrollmentProps> = ({ business, setView, onUpdate }) => {
  const { userIdentifier } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState<HubTier | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

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

  const onPaymentSuccess = async () => {
    if (!selectedTier) return;
    setLoading(true);
    try {
      await updateBusinessTier(business.id, selectedTier);
      setUpgradeSuccess(true);
      if (onUpdate) onUpdate();
      
      // Trigger Automation Webhook
      await triggerWebhook(WebhookEvent.PAYMENT_SUCCESS, { 
        business_id: business.id,
        new_tier: selectedTier,
      }, {
        user_id: userIdentifier || undefined,
        amount: tiers.find(t => t.id === selectedTier)?.amount || 0,
        tier_level: selectedTier
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowPayment(false);
    }
  };

  if (upgradeSuccess) {
    return (
      <div className="min-h-screen bg-[#002113] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-aba-gold rounded-[2.5rem] flex items-center justify-center text-aba-dark mb-8 shadow-[0_20px_50px_rgba(255,215,0,0.3)]"
        >
          <Trophy size={64} />
        </motion.div>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Level Up!</h2>
        <p className="text-xl text-aba-gold font-bold uppercase tracking-widest mb-12">
          You've been upgraded to {selectedTier} 🚀
        </p>
        <button 
          onClick={() => setView('merchant-portal')}
          className="px-12 py-5 bg-white text-aba-dark rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-aba-gold transition-all active:scale-95"
        >
          Return to Command
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002113] text-white flex flex-col font-sans pb-40">
      <PaystackOverlay 
        isOpen={showPayment}
        amount={tiers.find(t => t.id === selectedTier)?.amount || 0}
        email={userIdentifier || 'guest@findaba.com'}
        label={`Upgrade to ${selectedTier}`}
        onSuccess={onPaymentSuccess}
        onCancel={() => setShowPayment(false)}
      />

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
                              animate={{ width: '40%' }}
                              className="h-full bg-aba-gold"
                            />
                         </div>
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
