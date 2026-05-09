import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, MapPin, CheckCircle2, Camera, 
  RefreshCcw, Wallet, Landmark, Phone, ArrowUpRight,
  AlertTriangle, Star
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';
import RatingModal from './components/RatingModal';

const CarrierDashboard: React.FC = () => {
  const { user_id } = useAuth();
  const supabase = getSupabase()!;
  const { addToast } = useToast();
  
  const [carrier, setCarrier] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [jobToRate, setJobToRate] = useState<any>(null);

  useEffect(() => {
    if (user_id) {
        fetchCarrierProfile();
        fetchJobs();
    }
  }, [user_id]);

  const fetchCarrierProfile = async () => {
    const { data } = await supabase
        .from('carriers')
        .select('*')
        .eq('user_id', user_id)
        .single();
    setCarrier(data);
  };

  const fetchJobs = async () => {
    const { data } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'requested')
        .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const acceptJob = async (id: string) => {
    if (!carrier) return;
    try {
        const { error } = await supabase
            .from('shipments')
            .update({ 
                status: 'accepted', 
                carrier_id: carrier.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        addToast("Job accepted! Head to pickup point.", "success");
        fetchJobs();
    } catch (err: any) {
        addToast(err.message, "error");
    }
  };

  const markPickedUp = async (id: string) => {
    const { error } = await supabase
        .from('shipments')
        .update({ status: 'picked_up' })
        .eq('id', id);
    if (!error) {
        addToast("Parcel picked up. Head to destination.", "success");
        fetchJobs();
    }
  };

  const markDelivered = async (id: string, shipment: any) => {
    const { error } = await supabase
        .from('shipments')
        .update({ status: 'delivered_pending' })
        .eq('id', id);
    if (!error) {
        addToast("Delivery pending sender confirmation.", "success");
        setJobToRate(shipment);
        setShowRatingModal(true);
        fetchJobs();
    }
  };

  const escalateJob = async (shipmentId: string) => {
    const reason = prompt("Describe the issue (e.g., Sender unresponsive, problem at pickup):");
    if (!reason) return;

    try {
        const { error } = await supabase
            .from('escalations')
            .insert({
                shipment_id: shipmentId,
                reported_by: user_id,
                reason
            });

        if (error) throw error;
        addToast("Job escalated to support. We will contact you shortly.", "info");
    } catch (err: any) {
        addToast(err.message, "error");
    }
  };

  const submitRating = async (rating: number, comment: string) => {
    if (!jobToRate) return;
    try {
        const { error } = await supabase
            .from('ratings')
            .insert({
                shipment_id: jobToRate.id,
                reviewer_id: user_id,
                reviewee_id: jobToRate.sender_id,
                rating,
                comment
            });
        if (error) throw error;
        addToast("Review submitted!", "success");
        setShowRatingModal(false);
        setJobToRate(null);
    } catch (err: any) {
        addToast(err.message, "error");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCcw className="animate-spin text-aba-gold" /></div>;

  return (
    <div className="min-h-screen bg-[#050a0a] text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-aba-gold/20 to-transparent p-6 rounded-[2.5rem] border border-aba-gold/10">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{carrier?.full_name || 'Rider'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Verified Logistics Lead</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <Wallet className="text-aba-gold" size={20} />
                </div>
            </div>
            
            <div className="mt-6 p-4 bg-black/40 rounded-2xl flex justify-between items-center">
                <div>
                    <p className="text-[8px] font-black uppercase text-white/20">Pending Payout</p>
                    <p className="text-xl font-black">₦24,500</p>
                </div>
                <button className="p-2 bg-aba-gold text-black rounded-lg">
                    <ArrowUpRight size={16} />
                </button>
            </div>
        </div>

        {/* Available Jobs */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold">Nearby Units</h3>
                <span className="text-[10px] font-bold text-white/40">{jobs.length} FOUND</span>
            </div>

            <div className="space-y-3">
                {jobs.map(job => (
                    <motion.div 
                        key={job.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4"
                    >
                        <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-aba-gold/10 rounded-lg"><Package size={14} className="text-aba-gold" /></div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-bold uppercase">{job.parcel_size} Parcel</p>
                                    <p className="text-[8px] font-black uppercase text-aba-gold/60">{job.urgency} • {job.preferred_window}</p>
                                </div>
                            </div>
                            <p className="text-lg font-black tracking-tighter">₦{(job.amount * 0.7).toLocaleString()}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                <p className="text-[10px] font-bold text-white/60 truncate">{job.pickup_landmark}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <p className="text-[10px] font-bold text-white/60 truncate">{job.dropoff_landmark}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => acceptJob(job.id)}
                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest"
                        >
                            Accept & Start
                        </button>
                    </motion.div>
                ))}

                {jobs.length === 0 && (
                    <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                        <Package className="mx-auto text-white/10 mb-3" size={32} />
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No jobs in your area</p>
                    </div>
                )}
            </div>
        </div>

        {/* Active Job Overlay (Simple for MVP) */}
        {jobs.filter(j => j.status === 'accepted').map(j => (
            <div key={j.id} className="fixed inset-x-4 bottom-24 bg-aba-gold p-6 rounded-[2.5rem] shadow-2xl text-black space-y-4 z-50">
                <div className="flex justify-between items-center">
                    <h4 className="font-black uppercase text-xs">Active Delivery</h4>
                    <span className="bg-black/10 px-3 py-1 rounded-full text-[8px] font-black">{j.tracking_id}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-4 bg-black/5 rounded-2xl"><Phone size={20} /></button>
                    <div className="flex-1">
                        <p className="text-[10px] font-black flex items-center gap-1 opacity-60"><MapPin size={8} /> PICKUP</p>
                        <p className="text-xs font-black truncate">{j.pickup_landmark}</p>
                    </div>
                    <button 
                        onClick={() => escalateJob(j.id)}
                        className="p-4 bg-red-500/20 text-red-500 rounded-2xl"
                        title="Escalate Job"
                    >
                        <AlertTriangle size={20} />
                    </button>
                </div>
                <button 
                    onClick={() => j.status === 'accepted' ? markPickedUp(j.id) : markDelivered(j.id, j)}
                    className="w-full py-4 bg-black text-aba-gold rounded-2xl font-black uppercase text-xs"
                >
                    {j.status === 'accepted' ? 'Confirm Pickup' : 'Confirm Delivery'}
                </button>
            </div>
        ))}

        <RatingModal 
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            onSubmit={submitRating}
            title="Rate the Sender"
        />
      </div>
    </div>
  );
};

export default CarrierDashboard;
