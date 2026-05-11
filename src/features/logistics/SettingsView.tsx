import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Smartphone, ArrowLeft, Save, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';

const SettingsView: React.FC = () => {
  const { user_id } = useAuth();
  const supabase = getSupabase()!;
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_new_job: true,
    notify_driver_nearby: true,
    notify_delivery_confirmed: true
  });

  useEffect(() => {
    if (user_id) fetchSettings();
  }, [user_id]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('notify_new_job, notify_driver_nearby, notify_delivery_confirmed')
      .eq('id', user_id)
      .single();

    if (data) {
      setSettings({
        notify_new_job: data.notify_new_job ?? true,
        notify_driver_nearby: data.notify_driver_nearby ?? true,
        notify_delivery_confirmed: data.notify_delivery_confirmed ?? true
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', user_id);

      if (error) throw error;
      addToast("Settings updated successfully", "success");
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCcw className="animate-spin text-aba-gold" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-aba-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-aba-gold/20">
          <Smartphone size={24} className="text-aba-gold" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">System Node Config</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Global Preferences</p>
      </div>

      <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center group">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold flex items-center gap-2">
                <Bell size={12} /> New Jobs
              </h3>
              <p className="text-[10px] text-white/40 font-bold uppercase">Notify me when payload units appear nearby</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_new_job: !settings.notify_new_job})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.notify_new_job ? 'bg-aba-gold' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${settings.notify_new_job ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold flex items-center gap-2">
                <Smartphone size={12} /> Proximity
              </h3>
              <p className="text-[10px] text-white/40 font-bold uppercase">Alert when carrier is within 1km radius</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_driver_nearby: !settings.notify_driver_nearby})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.notify_driver_nearby ? 'bg-aba-gold' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${settings.notify_driver_nearby ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold flex items-center gap-2">
                <Shield size={12} /> Confirmations
              </h3>
              <p className="text-[10px] text-white/40 font-bold uppercase">Receive alerts for delivery completions</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_delivery_confirmed: !settings.notify_delivery_confirmed})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.notify_delivery_confirmed ? 'bg-aba-gold' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${settings.notify_delivery_confirmed ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-aba-gold text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
        >
          {saving ? <RefreshCcw size={16} className="animate-spin" /> : <><Save size={16} /> Update Local Node</>}
        </button>
      </div>

      <div className="bg-aba-gold/5 p-6 rounded-[2rem] border border-aba-gold/10">
        <p className="text-[10px] font-medium leading-relaxed text-white/60">
          Settings are synced across the Carry-Go industrial network. Push notifications use the system browser API.
        </p>
      </div>
    </motion.div>
  );
};

export default SettingsView;
