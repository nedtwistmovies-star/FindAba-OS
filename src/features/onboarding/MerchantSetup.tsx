
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Phone, MessageSquare, Camera, ArrowRight, Loader2, Globe } from 'lucide-react';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';
import { ABA_AREAS, CATEGORIES } from '../../constants';
import { Category } from '../../types';

interface MerchantSetupProps {
  onComplete: () => void;
}

export const MerchantSetup: React.FC<MerchantSetupProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
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
    setLoading(true);
    const supabase = getSupabase();

    if (!supabase) {
      addToast("Registry Offline.", "error");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Authentication Lost.");

      const { error } = await supabase.from('businesses').insert({
        user_id: session.user.id,
        name: formData.name,
        email: session.user.email,
        category: formData.category,
        area: formData.area,
        address: formData.address,
        phone_whatsapp: formData.phone_whatsapp,
        description: formData.description,
        status: 'pending',
        verification_status: 'Unverified',
        verification_level: 'Listed'
      });

      if (error) throw error;
      
      addToast("Hub successfully committed to registry!", "success");
      onComplete();
    } catch (err: any) {
      addToast(err.message || "Registration Fault.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#00120b] text-white flex items-center justify-center p-4 md:p-8 overflow-y-auto font-sans">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10 py-12"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 space-y-12 shadow-2xl">
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-aba-gold/10 border border-aba-gold/30 rounded-3xl flex items-center justify-center text-aba-gold mx-auto transform rotate-6">
               <Briefcase size={40} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Hub Specifications</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Industrial Enrollment Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Workshop Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Aba Leather Works"
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Industrial Category</label>
                <div className="relative">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-aba-deep">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">WhatsApp Signal</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                  <input 
                    required
                    value={formData.phone_whatsapp}
                    onChange={e => setFormData({...formData, phone_whatsapp: e.target.value})}
                    placeholder="+234..."
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Industrial Area</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                  <select 
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:border-aba-gold/50 transition-all outline-none text-sm font-bold uppercase tracking-tight"
                  >
                    {ABA_AREAS.map(a => <option key={a} value={a} className="bg-aba-deep">{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Capability Statement (Description)</label>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your manufacturing capacity..."
                className="w-full p-8 bg-white/5 border border-white/10 rounded-[2rem] text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold"
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
        </div>
      </motion.div>
    </div>
  );
};
