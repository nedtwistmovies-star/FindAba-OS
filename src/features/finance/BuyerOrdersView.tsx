
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Package, Truck, CheckCircle2, Clock, 
  AlertCircle, ArrowRight, ShieldCheck, Landmark, MessageSquare, Loader2
} from 'lucide-react';
import { Order, OrderStatus, ViewState } from '../../types';
import { useAuth, useToast } from '../../providers';
import { fetchOrdersForBuyer, releaseOrderEscrow, updateOrderStatus } from '../../services/supabaseService';
import LoadingScreen from '../../components/LoadingScreen';

interface Props {
  setView: (v: ViewState) => void;
}

const BuyerOrdersView: React.FC<Props> = ({ setView }) => {
  const { user_id } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user_id) {
      loadOrders();
    }
  }, [user_id]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrdersForBuyer(user_id!);
      setOrders(data);
    } catch (e) {
      addToast("Failed to sync order signals.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!confirm("Confirm delivery? This will release the escrow funds to the merchant.")) return;
    setSyncing(true);
    try {
      await releaseOrderEscrow(orderId);
      addToast("Escrow Released. Trade Signal Completed.", "success");
      loadOrders();
    } catch (e) {
      addToast("Settlement Fault. Check connectivity.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock size={16} className="text-slate-400" />;
      case OrderStatus.PAID: return <ShieldCheck size={16} className="text-aba-gold" />;
      case OrderStatus.SHIPPED: return <Truck size={16} className="text-blue-500" />;
      case OrderStatus.DELIVERED: return <Package size={16} className="text-aba-green" />;
      case OrderStatus.RELEASED: 
      case OrderStatus.COMPLETED: return <CheckCircle2 size={16} className="text-aba-green" />;
      case OrderStatus.DISPUTED: return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return "Awaiting Payment";
      case OrderStatus.PAID: return "In Escrow";
      case OrderStatus.SHIPPED: return "In Transit";
      case OrderStatus.DELIVERED: return "Delivered";
      case OrderStatus.RELEASED: 
      case OrderStatus.COMPLETED: return "Completed";
      case OrderStatus.DISPUTED: return "Under Review";
      default: return status.toUpperCase();
    }
  };

  if (loading) return <LoadingScreen message="Querying Order Registry..." />;

  return (
    <div className="flex-1 bg-aba-white dark:bg-aba-deep min-h-screen pb-32">
      <div className="bg-aba-deep p-8 md:p-16 pt-20 rounded-b-[3rem] md:rounded-b-[5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
          <ShoppingBag size={400} />
        </div>
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <button 
            onClick={() => setView('home')} 
            className="p-3 bg-white/10 rounded-xl text-white border border-white/10 active:scale-90 transition-all"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">My <span className="text-aba-gold">Orders</span></h2>
            <p className="text-[10px] md:text-xs font-bold text-aba-gold/50 uppercase tracking-[0.3em]">Institutional Procurement Hub</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 space-y-6 relative z-20">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-20 rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/10 text-center space-y-6 opacity-30 italic">
            <ShoppingBag size={64} className="mx-auto" />
            <p className="text-sm font-medium uppercase tracking-widest leading-loose">No trade signals detected.<br/>Explore the marketplace to initiate procurement.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((o) => (
              <motion.div 
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:border-aba-gold/30 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-black/20 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                    <Package size={32} className="text-slate-300 group-hover:text-aba-gold transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base md:text-lg font-black uppercase tracking-tight italic">Order #{o.id.slice(-8)}</h4>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-black/20 rounded-full border dark:border-white/5">
                        {getStatusIcon(o.status)}
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{getStatusLabel(o.status)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Landmark size={12} /> {(o as any).merchant?.name || 'Local Artisan'}
                    </p>
                  </div>
                </div>

                <div className="flex w-full md:w-auto items-center justify-between md:flex-col md:items-end gap-2 pr-2">
                    <p className="text-2xl md:text-3xl font-black text-aba-dark dark:text-white tracking-tighter italic">₦{o.amount.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>

                <div className="w-full md:w-auto flex gap-3">
                   {o.status === OrderStatus.DELIVERED && (
                      <button 
                        onClick={() => handleConfirmDelivery(o.id)}
                        disabled={syncing}
                        className="flex-1 md:flex-none px-8 py-4 bg-aba-green text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         {syncing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm Delivery
                      </button>
                   )}
                   <button 
                     onClick={() => addToast("Initializing secure messages...", "info")}
                     className="p-4 bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-2xl text-slate-400 hover:text-aba-gold transition-all"
                   >
                      <MessageSquare size={18} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerOrdersView;
