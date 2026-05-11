import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Landmark, Phone, Camera, 
  Video, CheckCircle2, ChevronRight, Fingerprint, RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import axios from 'axios';

const CarrierOnboarding: React.FC = () => {
  const { user_id } = useAuth();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bvn: '',
    nin: '',
    bank_name: 'Access',
    bank_code: '044',
    account_number: '',
    vehicle_type: 'bike'
  });

  const BANKS = [
    { name: 'Access Bank', code: '044' },
    { name: 'GTBank', code: '058' },
    { name: 'First Bank', code: '011' },
    { name: 'UBA', code: '033' },
    { name: 'Zenith Bank', code: '057' },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const response = await axios.post('/api/onboard-carrier', {
            ...formData,
            user_id: user_id
        });

        if (response.data.success) {
            setStep(3);
            addToast("Onboarding complete! You are now a verified carrier.", "success");
        }
    } catch (err: any) {
        addToast(err.response?.data?.error || "Onboarding failed", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a0a] text-white p-6">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-aba-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-aba-gold/20">
            <Shield className="text-aba-gold" size={24} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Become a Carrier</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1 italic">Industrial Logistics Program</p>
        </div>

        {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Basic Credentials</h2>
                    <div className="space-y-3">
                        <select 
                            className="w-full bg-black/40 rounded-xl border border-white/5 p-3 text-[10px] font-bold outline-none appearance-none"
                            value={formData.vehicle_type}
                            onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                        >
                            <option value="bike">Motorbike</option>
                            <option value="keke">Keke Napep</option>
                            <option value="mini-van">Mini-Van / Cargo</option>
                        </select>
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-3">
                            <User className="text-white/20 mr-3" size={16} />
                            <input 
                                type="text" 
                                placeholder="FULL NAME (AS ON BANK)" 
                                className="bg-transparent flex-1 outline-none text-[10px] font-bold"
                                value={formData.full_name}
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-3">
                            <Phone className="text-white/20 mr-3" size={16} />
                            <input 
                                type="text" 
                                placeholder="WHATSAPP PHONE NUMBER" 
                                className="bg-transparent flex-1 outline-none text-[10px] font-bold"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Identity Verification</h2>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-3">
                            <Fingerprint className="text-white/20 mr-2" size={14} />
                            <input 
                                type="text" 
                                placeholder="BVN" 
                                className="bg-transparent flex-1 outline-none text-[10px] font-bold"
                                value={formData.bvn}
                                onChange={e => setFormData({...formData, bvn: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-3">
                            <Shield className="text-white/20 mr-2" size={14} />
                            <input 
                                type="text" 
                                placeholder="NIN" 
                                className="bg-transparent flex-1 outline-none text-[10px] font-bold"
                                value={formData.nin}
                                onChange={e => setFormData({...formData, nin: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setStep(2)}
                    className="w-full py-5 bg-aba-gold text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 group"
                >
                    Next Logic Step <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        )}

        {step === 2 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Settlement Details</h2>
                    <div className="space-y-3">
                        <select 
                            className="w-full bg-black/40 rounded-xl border border-white/5 p-3 text-[10px] font-bold outline-none appearance-none"
                            value={formData.bank_code}
                            onChange={e => setFormData({...formData, bank_code: e.target.value})}
                        >
                            {BANKS.map(b => (
                                <option key={b.code} value={b.code}>{b.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-3">
                            <Landmark className="text-white/20 mr-3" size={16} />
                            <input 
                                type="text" 
                                placeholder="ACCOUNT NUMBER" 
                                className="bg-transparent flex-1 outline-none text-[10px] font-bold"
                                value={formData.account_number}
                                onChange={e => setFormData({...formData, account_number: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/40">
                        <span>Digital Proof</span>
                        <span className="text-aba-gold">REQUIRED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-black/40 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/60 transition-all">
                            <Camera size={20} className="text-white/20" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Vehicle Photo</span>
                        </div>
                        <div className="aspect-square bg-black/40 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/60 transition-all">
                            <Video size={20} className="text-aba-gold" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-aba-gold">Video KYC</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-5 bg-aba-gold text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                    {loading ? <RefreshCcw size={14} className="animate-spin" /> : "Commit Identity"}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-[8px] font-black uppercase text-white/20">Back to Step 1</button>
             </motion.div>
        )}

        {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-aba-green/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} className="text-aba-green" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Verified ✅</h2>
                    <p className="text-white/40 text-[10px] font-bold max-w-[200px] mx-auto leading-relaxed">
                        Your rider credential has been anchored to the blockchain. You can now accept deliveries.
                    </p>
                </div>
                <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Enter Carrier Dashboard
                </button>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default CarrierOnboarding;
