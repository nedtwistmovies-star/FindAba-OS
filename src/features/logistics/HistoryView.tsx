import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Package, MapPin, CheckCircle2, RefreshCcw, Star, ExternalLink } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';
import RatingModal from './components/RatingModal';

const HistoryView: React.FC = () => {
  const { user_id } = useAuth();
  const supabase = getSupabase()!;
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [shipmentToRate, setShipmentToRate] = useState<any>(null);

  useEffect(() => {
    if (user_id) fetchShipments();
  }, [user_id]);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('sender_id', user_id)
      .order('created_at', { ascending: false });

    if (data) setShipments(data);
    setLoading(false);
  };

  const confirmReceipt = async (id: string, shipment: any) => {
    try {
      setLoading(true);
      // Trigger Payout via Server
      const userId = localStorage.getItem('findaba_user_id');
      const response = await axios.post('/api/confirm-delivery', {
        tracking_id: shipment.tracking_id,
        sender_phone: shipment.sender_phone,
        action: 'confirm'
      });

      if (response.data.success) {
        addToast(response.data.message || "Delivery confirmed. Funds released to carrier.", "success");
        setShipmentToRate(shipment);
        setShowRatingModal(true);
        fetchShipments();
      }
    } catch (err: any) {
      addToast(err.response?.data?.error || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating: number, comment: string) => {
    if (!shipmentToRate) return;
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          shipment_id: shipmentToRate.id,
          reviewer_id: user_id,
          reviewee_id: shipmentToRate.carrier_id,
          rating,
          comment
        });
      if (error) throw error;
      addToast("Review submitted!", "success");
      setShowRatingModal(false);
      setShipmentToRate(null);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCcw className="animate-spin text-aba-gold" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Cargo History</h2>
        <span className="text-[10px] font-bold text-white/40">{shipments.length} UNITS</span>
      </div>

      <div className="space-y-4">
        {shipments.map((s) => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Package className="text-aba-gold" size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{s.tracking_id}</p>
                  <p className="text-xs font-black uppercase tracking-tight">{s.parcel_size} Unit</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                s.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 
                s.status === 'delivered_pending' ? 'bg-aba-gold/20 text-aba-gold animate-pulse' :
                'bg-white/10 text-white/40'
              }`}>
                {s.status.replace('_', ' ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase text-white/20">Destination</p>
                <p className="text-[10px] font-bold truncate">{s.dropoff_landmark}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] font-black uppercase text-white/20">Value Paid</p>
                <p className="text-[10px] font-bold tracking-tighter">₦{s.amount.toLocaleString()}</p>
              </div>
            </div>

            {s.status === 'delivered_pending' && (
              <button 
                onClick={() => confirmReceipt(s.id, s)}
                className="w-full py-4 bg-green-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Confirm Receipt & Release Funds
              </button>
            )}

            {s.status === 'delivered' && (
               <div className="flex items-center gap-2 justify-center py-2 opacity-40">
                  <Star size={10} className="fill-aba-gold text-aba-gold" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Transaction Finalized</span>
               </div>
            )}
          </motion.div>
        ))}

        {shipments.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <Package size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No cargo records found</p>
          </div>
        )}
      </div>

      <RatingModal 
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={submitRating}
        title="Rate the Carrier"
      />
    </div>
  );
};

export default HistoryView;
