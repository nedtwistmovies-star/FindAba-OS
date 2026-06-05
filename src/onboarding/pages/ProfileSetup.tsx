
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, ArrowRight, Loader2, Sparkles, Camera } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { onboardingService } from '../services/onboardingService';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';

export const ProfileSetup: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { user_id, userIdentifier } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    bio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_id) {
       addToast("Identity context missing.", "error");
       return;
    }
    setLoading(true);

    try {
      const sb = getSupabase();
      if (!sb) throw new Error("Registry server offline.");

      // Check username uniqueness
      const { data: existing } = await sb
        .from('profiles')
        .select('id')
        .eq('username', formData.username.toLowerCase().trim())
        .maybeSingle();

      if (existing && existing.id !== user_id) {
        throw new Error("Industrial ID already claimed.");
      }

      const { error } = await sb
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username.toLowerCase().trim(),
          phone: formData.phone,
          bio: formData.bio,
          onboarding_stage: 'completed'
        })
        .eq('id', user_id);

      if (error) throw error;

      addToast("Industrial Identity Synchronized.", "success");
      onSuccess();
    } catch (err: any) {
      addToast(err.message || "Profile Sync Fault.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-14 space-y-12 shadow-2xl relative overflow-hidden"
    >
      {/* Background decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-aba-gold/5 blur-3xl rounded-full" />
      
      <div className="text-center space-y-4 relative z-10">
        <div className="w-20 h-20 bg-aba-gold/10 border-2 border-aba-gold/30 rounded-3xl flex items-center justify-center text-aba-gold mx-auto transform rotate-12 mb-6">
          <User size={40} />
        </div>
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Identity Setup</h2>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">Complete Your Industrial Profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Full Name</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                required
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="Industrial Name"
                className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-bold italic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Unique ID (Username)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-aba-gold font-black italic">@</span>
              <input 
                required
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="aba_master"
                className="w-full p-6 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-bold italic"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Direct Signal (Phone)</label>
            <div className="relative">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+234..."
                className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-bold italic"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Brief Bio / Expertise</label>
          <textarea 
            rows={3}
            value={formData.bio}
            onChange={e => setFormData({...formData, bio: e.target.value})}
            placeholder="Tell the registry what you do..."
            className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-bold italic resize-none"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full py-8 bg-white text-aba-deep rounded-full font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group shadow-2xl"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              SYNCHRONIZE IDENTITY
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-center gap-3 opacity-30 relative z-10">
         <Sparkles size={14} className="text-aba-gold" />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Handshake Protocol Active</p>
      </div>
    </motion.div>
  );
};
