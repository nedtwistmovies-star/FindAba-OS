
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
        verification_status: 'Unverified',
        verification_level: 'Listed'
      });

      addToast("Industrial Node Established: Registry Updated.", "success");
      onSuccess();
    } catch (err: any) {
      addToast(err.message || "Registration Fault.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 space-y-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] my-12">
        <div className="space-y-4 text-center">
          <div className="relative inline-block">
             <motion.div
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute inset-0 bg-aba-gold blur-2xl rounded-full"
             />
             <div className="w-20 h-20 bg-aba-deep border-2 border-aba-gold/30 rounded-3xl flex items-center justify-center text-aba-gold relative z-10 transform rotate-6">
                <Briefcase size={40} />
             </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Hub Specifications</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">Industrial Enrollment Protocol v2.4</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField 
               label="Workshop Name" 
               icon={<Briefcase size={20} />} 
               value={formData.name} 
               onChange={(v: string) => setFormData({...formData, name: v})}
               placeholder="e.g. Aba Leather Works"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Industrial Category</label>
              <div className="relative">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight italic"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-aba-deep">{c}</option>)}
                </select>
              </div>
            </div>
            <InputField 
               label="WhatsApp Signal" 
               icon={<Phone size={20} />} 
               value={formData.phone_whatsapp} 
               onChange={(v: string) => setFormData({...formData, phone_whatsapp: v})}
               placeholder="+234..."
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Industrial Area</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <select 
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight italic"
                >
                  {ABA_AREAS.map(a => <option key={a} value={a} className="bg-aba-deep">{a}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Capability Statement (Description)</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your manufacturing capacity..."
              className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold italic"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-8 bg-white text-aba-deep rounded-full font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group shadow-2xl"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                COMMIT HUB TO REGISTRY
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-3 opacity-30">
           <Sparkles size={14} className="text-aba-gold" />
           <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Elder Kalu AI: Validating Input Matrix...</p>
        </div>
      </div>
    </motion.div>
  );
};

const InputField = ({ label, icon, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20">
        {icon}
      </div>
      <input 
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight italic"
      />
    </div>
  </div>
);
