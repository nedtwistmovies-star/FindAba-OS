
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Phone, ArrowRight, Loader2, Globe, Sparkles } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { onboardingService } from '../services/onboardingService';
import { useOnboarding } from '../hooks/useOnboarding';
import { ABA_AREAS, CATEGORIES } from '../../constants';
import { Category } from '../../types';

export const MerchantSetup: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { profile } = useOnboarding();
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0] as Category,
    area: ABA_AREAS[0],
    address: '',
    phone_whatsapp: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);

    try {
      await onboardingService.completeMerchantOnboarding(profile.id, {
        name: formData.name,
        email: profile.email,
        category: formData.category,
        area: formData.area,
        address: formData.address,
        phone_whatsapp: formData.phone_whatsapp,
        description: formData.description,
        status: 'pending',
        verification_status: 'New',
        verification_level: 'Visible'
      });

      addToast("Business profile created successfully.", "success");
      onSuccess();
    } catch (err: any) {
      addToast(err.message || "Failed to register business.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-10 shadow-2xl my-8">
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 bg-white/5 border border-aba-gold/30 rounded-2xl flex items-center justify-center text-aba-gold mx-auto mb-4">
             <Briefcase size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Business Profile</h2>
          <p className="text-white/40 text-sm italic">Tell us about your business or workshop</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
               label="Business Name" 
               icon={<Briefcase size={18} />} 
               value={formData.name} 
               onChange={(v: string) => setFormData({...formData, name: v})}
               placeholder="e.g. Aba Leather Works"
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Trade Category</label>
              <div className="relative">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full p-5 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-medium"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-aba-deep">{c}</option>)}
                </select>
              </div>
            </div>
            <InputField 
               label="WhatsApp Number" 
               icon={<Phone size={18} />} 
               value={formData.phone_whatsapp} 
               onChange={(v: string) => setFormData({...formData, phone_whatsapp: v})}
               placeholder="+234..."
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">Business Area</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <select 
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  className="w-full p-5 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-medium"
                >
                  {ABA_AREAS.map(a => <option key={a} value={a} className="bg-aba-deep">{a}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">About Your Business</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Briefly describe what you manufacture or sell..."
              className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-medium resize-none text-center"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-white text-aba-deep rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                SAVE PROFILE
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

const InputField = ({ label, icon, value, onChange, placeholder }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-aba-gold uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20">
        {icon}
      </div>
      <input 
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-5 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-medium"
      />
    </div>
  </div>
);
