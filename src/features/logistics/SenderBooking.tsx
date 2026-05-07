import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, MapPin, Scale, Shield, 
  ArrowRight, Truck, Info, CheckCircle2, RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';

interface Quote {
    distance: number;
    amount: number;
    platformFee: number;
    carrierPayout: number;
}

const SenderBooking: React.FC = () => {
  const { user_id, profile } = useAuth();
  const supabase = getSupabase()!;
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_landmark: '',
    dropoff_address: '',
    dropoff_landmark: '',
    parcel_size: 'small',
    weight_kg: 1,
    declared_value: 0,
    urgency: 'standard',
    preferred_window: 'morning'
  });

  const calculateQuote = () => {
    // Simulated Distance Logic for Aba -> Port Harcourt (approx 65km)
    // distance_km * 200 + weight_kg * 150 + 500 urgency fee
    const distance_km = 65; 
    const baseRate = distance_km * 200;
    const weightRate = formData.weight_kg * 150;
    const urgencyFee = formData.urgency === 'express' ? 500 : 0;
    
    const amount = baseRate + weightRate + urgencyFee;
    const platformFee = amount * 0.3;
    const carrierPayout = amount * 0.7;

    setQuote({
        distance: distance_km,
        amount,
        platformFee,
        carrierPayout
    });
    setStep(2);
  };

  const handlePaystackPayment = async () => {
    if (!user_id || !quote) return;
    setLoading(true);

    try {
        // 1. Create Shipment Record in Supabase
        const { data: shipment, error: sErr } = await supabase
            .from('shipments')
            .insert({
                sender_id: user_id,
                sender_phone: profile?.phone || profile?.email || 'N/A',
                pickup_address: formData.pickup_address,
                pickup_landmark: formData.pickup_landmark,
                dropoff_address: formData.dropoff_address,
                dropoff_landmark: formData.dropoff_landmark,
                parcel_size: formData.parcel_size,
                weight_kg: formData.weight_kg,
                declared_value: formData.declared_value,
                urgency: formData.urgency,
                preferred_window: formData.preferred_window,
                amount: quote.amount,
                platform_fee: quote.platformFee,
                carrier_payout: quote.carrierPayout,
                status: 'requested',
                payment_status: 'unpaid'
            })
            .select()
            .single();

        if (sErr) throw sErr;

        // 2. Initialize Paystack
        const handler = (window as any).PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: profile?.email || 'customer@findaba.com',
            amount: quote.amount * 100, // Kobo
            metadata: {
                user_id: user_id,
                shipment_id: shipment.id,
                tracking_id: shipment.tracking_id
            },
            callback: (response: any) => {
                addToast("Payment secured in escrow. Finding carrier...", "success");
                setStep(3);
            },
            onClose: () => {
                setLoading(false);
            }
        });
        handler.openIframe();

    } catch (err: any) {
        addToast(err.message, "error");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a0a] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-aba-gold/10 rounded-2xl border border-aba-gold/20">
            <Truck className="text-aba-gold" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Carry-Go</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">Aba Logistics Hub</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
                <div 
                    key={s} 
                    className={`h-1 flex-1 rounded-full bg-white/${step >= s ? '100' : '10'}`} 
                />
            ))}
        </div>

        {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Pickup Point</h2>
                    <div className="space-y-2">
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-4">
                            <MapPin className="text-white/20 mr-3" size={18} />
                            <input 
                                type="text" 
                                placeholder="PICKUP LANDMARK (e.g. Ariaria Gate 3)" 
                                className="bg-transparent flex-1 outline-none text-xs font-bold"
                                value={formData.pickup_landmark}
                                onChange={e => setFormData({...formData, pickup_landmark: e.target.value})}
                            />
                        </div>
                        <input 
                            type="text" 
                            placeholder="FULL ADDRESS" 
                            className="w-full bg-black/40 rounded-xl border border-white/5 p-4 text-xs font-bold outline-none"
                            value={formData.pickup_address}
                            onChange={e => setFormData({...formData, pickup_address: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Destination</h2>
                    <div className="space-y-2">
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-4">
                            <ArrowRight className="text-white/20 mr-3" size={18} />
                            <input 
                                type="text" 
                                placeholder="DROP-OFF LANDMARK" 
                                className="bg-transparent flex-1 outline-none text-xs font-bold"
                                value={formData.dropoff_landmark}
                                onChange={e => setFormData({...formData, dropoff_landmark: e.target.value})}
                            />
                        </div>
                        <input 
                            type="text" 
                            placeholder="FULL ADDRESS" 
                            className="w-full bg-black/40 rounded-xl border border-white/5 p-4 text-xs font-bold outline-none"
                            value={formData.dropoff_address}
                            onChange={e => setFormData({...formData, dropoff_address: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-aba-gold">Parcel Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-black text-white/40">Size</p>
                            <select 
                                className="w-full bg-black/40 rounded-xl border border-white/5 p-4 text-xs font-bold outline-none appearance-none"
                                value={formData.parcel_size}
                                onChange={e => setFormData({...formData, parcel_size: e.target.value})}
                            >
                                <option value="small">Small (Envelope/Pack)</option>
                                <option value="medium">Medium (Box/Bag)</option>
                                <option value="large">Large (Sack/Crate)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-black text-white/40">Est. Weight (kg)</p>
                            <input 
                                type="number" 
                                className="w-full bg-black/40 rounded-xl border border-white/5 p-4 text-xs font-bold outline-none"
                                value={formData.weight_kg}
                                onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black text-white/40">Preferred Delivery Window</p>
                        <select 
                            className="w-full bg-black/40 rounded-xl border border-white/5 p-4 text-xs font-bold outline-none appearance-none"
                            value={formData.preferred_window}
                            onChange={e => setFormData({...formData, preferred_window: e.target.value})}
                        >
                            <option value="morning">Morning (8AM - 12PM)</option>
                            <option value="afternoon">Afternoon (12PM - 4PM)</option>
                            <option value="evening">Evening (4PM - 8PM)</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={calculateQuote}
                    disabled={!formData.pickup_address || !formData.dropoff_address}
                    className="w-full py-6 bg-aba-gold text-black rounded-[2rem] font-black uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-all"
                >
                    Generate Quote
                </button>
            </motion.div>
        )}

        {step === 2 && quote && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="bg-gradient-to-br from-aba-gold/20 to-transparent p-8 rounded-[3rem] border border-aba-gold/10 text-center space-y-6">
                    <div className="flex justify-center">
                        <Shield className="text-aba-gold" size={48} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter">₦{quote.amount.toLocaleString()}</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">{quote.distance}KM • ESCROW PROTECTED</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-black/40 p-4 rounded-2xl">
                            <p className="text-[8px] font-black uppercase text-white/20">Insurance</p>
                            <p className="text-xs font-bold">Comprehensive</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl">
                            <p className="text-[8px] font-black uppercase text-white/20">Est. Delivery</p>
                            <p className="text-xs font-bold">2-4 Hours</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-start gap-4">
                    <Info size={20} className="text-aba-gold mt-1 shrink-0" />
                    <p className="text-[10px] font-medium leading-relaxed text-white/60">
                        Money is held in escrow. Carriers only get paid after you confirm receipt.
                    </p>
                </div>

                <button 
                    onClick={handlePaystackPayment}
                    className="w-full py-6 bg-green-500 text-black rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <RefreshCcw className="animate-spin" size={20} /> : "Secure Booking Now"}
                </button>

                <button 
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-white/40 font-black uppercase tracking-widest text-[8px]"
                >
                    Edit Details
                </button>
            </motion.div>
        )}

        {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-12">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={48} className="text-green-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Shipment Active!</h2>
                    <p className="text-white/60 text-sm font-medium max-w-xs mx-auto">
                        Your payment is secured. A rider from the nearest node will contact you via WhatsApp shortly.
                    </p>
                </div>

                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 max-w-xs mx-auto">
                    <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">TRACKING ID</p>
                    <p className="text-xl font-black font-mono mt-1">CG-A82F92X</p>
                </div>

                <button 
                    onClick={() => window.location.reload()}
                    className="w-full max-w-xs py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                    Track Status
                </button>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default SenderBooking;
