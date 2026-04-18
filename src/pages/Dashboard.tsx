
import React, { useEffect, useState } from "react";
import { getSupabase } from "../services/supabaseService";
import { motion } from "motion/react";
import { User, Phone, Shield, CreditCard, ShoppingBag } from "lucide-react";
import SectionHeader from "../components/SectionHeader";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
         sb.from('profiles').select('*').eq('id', data.user.id).single()
         .then(({ data: p }) => {
            setProfile(p);
            setLoading(false);
         });
      } else {
         setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin text-aba-gold"><Shield size={40} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-fade-in">
      <SectionHeader 
        title="Industrial Hub" 
        subtitle="Your City Dashboard" 
        icon={Shield} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Profile Node */}
        <motion.div 
           whileHover={{ y: -5 }}
           className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold shadow-glow">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-white">{profile?.full_name || 'Verified Citizen'}</h3>
              <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.2em]">{profile?.role || 'Registered'}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                <span>Core ID</span>
                <span className="text-white font-mono">{user?.id?.substring(0, 12)}...</span>
             </div>
             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                <span>Signal (Phone)</span>
                <span className="text-white">{user?.phone || 'Not Linked'}</span>
             </div>
          </div>
        </motion.div>

        {/* Financial Ledger */}
        <motion.div 
           whileHover={{ y: -5 }}
           className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-aba-green/10 border border-aba-green/30 flex items-center justify-center text-aba-green">
                <CreditCard size={20} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Registry Wallet</h4>
            </div>
            <span className="text-[10px] font-bold text-aba-green uppercase tracking-widest">Active</span>
          </div>

          <div className="pt-6">
             <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-2">Current Balance</p>
             <h2 className="text-4xl font-black text-white">₦{profile?.total_paid || 0}.00</h2>
          </div>
        </motion.div>

        {/* Activity Node */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <ShoppingBag size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Recent Orders</h4>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
             <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">No Recent Transactions</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
