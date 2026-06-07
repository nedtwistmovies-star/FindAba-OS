
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
      if (!sb) throw new Error("Connection lost.");

      // Check username uniqueness
      const { data: existing } = await sb
        .from('profiles')
        .select('id')
        .eq('username', formData.username.toLowerCase().trim())
        .maybeSingle();

      if (existing && existing.id !== user_id) {
        throw new Error("Username already taken.");
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

      addToast("Profile updated successfully.", "success");
      onSuccess();
    } catch (err: any) {
      addToast(err.message || "Failed to update profile.", "error");
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
      <div className="text-center space-y-4 relative z-10">
        <div className="w-16 h-16 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold mx-auto mb-6">
          <User size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Complete Your Profile</h2>
        <p className="text-white/40 text-sm italic font-medium">One last step to join the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                required
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="Full Name"
                className="w-full p-5 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-aba-gold font-bold">@</span>
              <input 
                required
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="username"
                className="w-full p-5 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+234..."
                className="w-full p-5 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Bio / Expertise</label>
          <textarea 
            rows={3}
            value={formData.bio}
            onChange={e => setFormData({...formData, bio: e.target.value})}
            placeholder="Tell us a bit about what you do..."
            className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 outline-none transition-all text-sm font-medium resize-none text-center"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full py-5 bg-white text-aba-deep rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group shadow-xl"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              SAVE AND CONTINUE
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
