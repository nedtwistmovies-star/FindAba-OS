
import React, { useEffect, useState } from "react";
import { getSupabase, fetchOrdersForBuyer, updateOrderStatus } from "../services/supabaseService";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, CreditCard, ShoppingBag, Clock, MapPin, Package, CheckCircle2, ChevronRight, X, AlertCircle } from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import { Order, OrderStatus } from "../types";
import { useToast } from "../providers/ToastProvider";

export default function Dashboard() {
  const { addToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
         Promise.all([
           sb.from('profiles').select('*').eq('id', data.user.id).single(),
           fetchOrdersForBuyer(data.user.id)
         ]).then(([{ data: p }, ordersData]) => {
            setProfile(p);
            setOrders(ordersData);
            setLoading(false);
         });
      } else {
         setLoading(false);
      }
    });
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID: return 'text-aba-gold border-aba-gold/20 bg-aba-gold/5';
      case OrderStatus.PROCESSING: return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
      case OrderStatus.SHIPPED: return 'text-purple-500 border-purple-500/20 bg-purple-500/5';
      case OrderStatus.DELIVERED: return 'text-aba-green border-aba-green/20 bg-aba-green/5';
      case OrderStatus.RELEASED: return 'text-aba-green border-aba-green/20 bg-aba-green/5';
      case OrderStatus.CANCELLED: return 'text-red-500 border-red-500/20 bg-red-500/5';
      case OrderStatus.DISPUTED: return 'text-red-500 border-red-500/20 bg-red-500/5 animate-pulse-red';
      default: return 'text-slate-400 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin text-aba-gold"><Shield size={40} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-48 animate-fade-in relative">
      <SectionHeader 
        title="Member Dashboard" 
        subtitle="Your City Overview" 
        icon={Shield} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-12">
        {/* Profile Overview */}
        <motion.div 
           whileHover={{ y: -5 }}
           className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold shadow-glow">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-white">{profile?.full_name || 'Verified Member'}</h3>
              <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.2em]">{profile?.role || 'Member'}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                <span>Account ID</span>
                <span className="text-white font-mono">{user?.id?.substring(0, 12)}...</span>
             </div>
             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                <span>Phone Number</span>
                <span className="text-white">{user?.phone || 'Not Linked'}</span>
             </div>
          </div>
        </motion.div>

        {/* Financial Overview */}
        <motion.div 
           whileHover={{ y: -5 }}
           className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-aba-green/10 border border-aba-green/30 flex items-center justify-center text-aba-green">
                <CreditCard size={20} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">My Wallet</h4>
            </div>
            <span className="text-[10px] font-bold text-aba-green uppercase tracking-widest">Active</span>
          </div>

          <div className="pt-6">
             <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-2">Current Balance</p>
             <h2 className="text-4xl font-black text-white">₦{profile?.total_paid || 0}.00</h2>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <ShoppingBag size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Active Orders</h4>
          </div>
          <div className="pt-2">
             <h2 className="text-4xl font-black text-white">{orders.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RELEASED).length}</h2>
             <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-2">Active Deliveries</p>
          </div>
        </motion.div>
      </div>

      {/* Order History Section */}
      <section className="px-4 md:px-12">
        <div className="bg-white/5 rounded-[4rem] border border-white/5 p-8 md:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold border border-aba-gold/20">
                  <Clock size={24} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Order History</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Transaction Log</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.length > 0 ? (
              orders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-aba-gold transition-colors">
                       <Package size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">#{order.id.slice(-8)}</h4>
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">
                        ₦{order.amount.toLocaleString()} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${getStatusColor(order.status)}`}>
                       {order.status === OrderStatus.RELEASED && <CheckCircle2 size={12} className="text-aba-green animate-check-reveal" />}
                       {order.status}
                    </span>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-aba-gold transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-6 opacity-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <ShoppingBag size={48} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.4em]">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-aba-deep/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-aba-deep border border-white/10 rounded-[4rem] shadow-2xl overflow-hidden p-10 md:p-16 space-y-10"
            >
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-8 right-8 p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all"
              >
                <X size={24} />
              </button>

              <div className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-aba-gold/10 rounded-3xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-glow">
                    <Package size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Order Detail</h3>
                    <p className="text-[10px] font-bold text-aba-gold uppercase tracking-[0.4em]">Reference #{selectedOrder.id.slice(-8)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Merchant Partner</p>
                    <p className="text-lg font-bold text-white uppercase tracking-tight">{(selectedOrder as any).merchant?.name || 'Aba Merchant Hub'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Amount</p>
                    <p className="text-lg font-bold text-aba-green uppercase tracking-tight">₦{selectedOrder.amount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Trust Badge</p>
                    <div className="pt-1">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-xl ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Order Date</p>
                    <p className="text-lg font-bold text-white uppercase tracking-tight">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedOrder.status === OrderStatus.DELIVERED && (
                  <div className="bg-aba-green/10 border border-aba-green/20 p-8 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center gap-4 text-aba-green">
                        <Shield size={24} />
                        <h4 className="text-sm font-black uppercase tracking-widest">Release Payment</h4>
                     </div>
                     <p className="text-xs font-medium text-white/60 leading-relaxed uppercase tracking-wider">
                        The merchant has confirmed delivery. By releasing funds, you authorize the transfer of the payment from escrow to the partner's wallet.
                     </p>
                     <button 
                       onClick={async () => {
                          addToast("Processing payment...", "info");
                          try {
                            const { releaseEscrow } = await import('../services/facesService');
                            const success = await releaseEscrow(selectedOrder.id);
                            if (success) {
                              setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: OrderStatus.RELEASED } : o));
                              setSelectedOrder({ ...selectedOrder, status: OrderStatus.RELEASED });
                              addToast("Payment released successfully.", "success");
                            }
                          } catch (e) {
                            addToast("Connection error. Please try again.", "error");
                          }
                       }}
                       className="w-full py-6 bg-aba-green text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-aba-green/90 transition-all active:scale-95"
                     >
                       Authorize Fund Release
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
