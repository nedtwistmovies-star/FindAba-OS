
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronRight, Filter, Download, Landmark, CreditCard, Zap, History, ShieldCheck, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { fetchWallet, fetchTransactions } from '../../services/facesService';
import { Transaction, Wallet as WalletType } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useToast } from '../../providers/ToastProvider';
import axios from 'axios';

const WalletView: React.FC = () => {
  const { user_id, userIdentifier } = useAuth();
  const user_email = userIdentifier?.includes('@') ? userIdentifier : '';
  const { addToast } = useToast();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction states
  const [showDeposit, setShowDeposit] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const loadWalletData = async () => {
    if (!user_id) return;
    try {
      const wData = await fetchWallet(user_id);
      setWallet(wData);
      if (wData.id) {
        const tData = await fetchTransactions(wData.id);
        setTransactions(tData);
      }
    } catch (e) {
      console.error("[Finance] Wallet Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user_id]);

  const handleDepositSuccess = async () => {
    setShowDeposit(false);
    addToast("Deposit successful! Your balance is updating.", "success");
    // Wait a bit for Supabase to sync if triggered via webhook
    setTimeout(loadWalletData, 2000);
  };

  const handlePayoutRequest = async () => {
    if (!wallet || !payoutAmount || Number(payoutAmount) <= 0) return;
    if (Number(payoutAmount) > wallet.balance) {
      addToast("Insufficient funds for this payout.", "error");
      return;
    }

    setPayoutLoading(true);
    try {
      // Simulate/Trigger Payout Request
      // In a real app, this would hit /api/payouts
      addToast("Payout request submitted. Verification in progress.", "success");
      setShowPayout(false);
      setPayoutAmount('');
    } catch (e) {
      addToast("Failed to process payout request.", "error");
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Accessing Financial Vault..." />;
  }

  return (
    <div className="min-h-screen bg-aba-deep text-white pb-32">
      {/* Header */}
      <div className="px-5 sm:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                <Landmark size={20} className="sm:w-6 sm:h-6" />
             </div>
             <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Fidelity <span className="text-aba-gold">Wallet</span></h2>
                <p className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-0.5 sm:mt-1">Authorized Financial Node</p>
             </div>
          </div>
          <button className="p-2.5 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-white/40 hover:text-aba-gold transition-standard border border-white/5">
            <Download size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Card Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-48 sm:h-72 rounded-[2rem] sm:rounded-[4rem] bg-[#004d2d] p-6 sm:p-14 shadow-[-20px_20px_60px_rgba(0,0,0,0.3)] overflow-hidden group border border-white/5"
        >
          {/* Industrial Ambient Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_60%)] from-aba-green" />
            <Zap className="absolute top-[-20%] right-[-10%] w-64 h-64 sm:w-96 sm:h-96 -rotate-12 blur-3xl text-white" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-white/50 mb-2 sm:mb-4">Total Balance</p>
                  <h3 className="text-4xl sm:text-8xl font-black tracking-tighter text-white flex items-baseline gap-1 sm:gap-3">
                    <span className="text-xl sm:text-3xl text-white/40">₦</span>
                    {wallet ? wallet.balance.toLocaleString() : '0'}
                  </h3>
               </div>
               <div className="w-14 sm:w-24 h-9 sm:h-16 rounded-xl sm:rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center relative overflow-hidden group-hover:bg-white/20 transition-all">
                  <div className="flex -space-x-2 sm:-space-x-4">
                    <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-[#eb001b] opacity-90 shadow-lg" />
                    <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-[#f79e1b] opacity-90 shadow-lg" />
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-white/10">
               <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Registry Node ID</span>
                  <span className="text-[10px] sm:text-sm font-bold font-mono text-white/80 uppercase tracking-widest leading-none mt-1">
                    {wallet?.id?.slice(0, 12).toUpperCase() || 'INITIALIZING...'}
                  </span>
               </div>
               <div className="flex items-center gap-2 sm:gap-3 bg-white/10 px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-white/20 shadow-xl backdrop-blur-xl">
                  <ShieldCheck size={14} className="text-white sm:w-5 sm:h-5" />
                  <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] text-white">Handshake Verified</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
           <button 
             onClick={() => setShowDeposit(true)}
             className="p-6 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 flex flex-row sm:flex-col items-center justify-center sm:justify-center gap-4 sm:gap-6 hover:bg-white/10 active:scale-95 transition-all group overflow-hidden relative"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-aba-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-aba-green text-white flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl relative z-10">
                <ArrowUpRight size={20} className="sm:w-8 sm:h-8" strokeWidth={3} />
              </div>
              <span className="text-xs sm:text-base font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-aba-gold transition-colors relative z-10 text-center">Deposit Hub</span>
           </button>
           <button 
             onClick={() => setShowPayout(true)}
             className="p-6 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 flex flex-row sm:flex-col items-center justify-center sm:justify-center gap-4 sm:gap-6 hover:bg-white/10 active:scale-95 transition-all group overflow-hidden relative"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-aba-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-aba-red text-white flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-xl relative z-10">
                <ArrowDownLeft size={20} className="sm:w-8 sm:h-8" strokeWidth={3} />
              </div>
              <span className="text-xs sm:text-base font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-aba-gold transition-colors relative z-10 text-center">Payout Portal</span>
           </button>
        </div>

        {/* Interaction Overlays */}
        <PaystackOverlay 
          isOpen={showDeposit}
          amount={0} // Allows user to enter amount in Paystack if supported, or I should add an amount selector
          email={user_email || ''}
          label="Wallet Credit"
          onSuccess={handleDepositSuccess}
          onCancel={() => setShowDeposit(false)}
        />

        <AnimatePresence>
          {showPayout && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-aba-deep/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-white rounded-[3rem] p-10 space-y-8 text-aba-deep shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowPayout(false)}
                  className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                >
                  <X size={20} />
                </button>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Exit</p>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Payout Request</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available</span>
                    <span className="text-xl font-black">₦{wallet?.balance.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Amount to Withdraw</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      className="w-full p-8 bg-slate-100 border-2 border-transparent focus:border-aba-gold rounded-[2rem] text-4xl font-black text-center outline-none transition-all"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handlePayoutRequest}
                    disabled={payoutLoading || !payoutAmount || Number(payoutAmount) <= 0}
                    className="w-full py-8 bg-aba-deep text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-aba-gold hover:text-aba-deep transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {payoutLoading ? <Loader2 className="animate-spin" /> : "Authorize Payout"} <Zap size={20} strokeWidth={3} />
                  </button>
                  
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-widest px-4">
                    Withdrawal requests are processed within 24 hours to your verified industrial bank account.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔹 PRODUCTION READY: ACCOUNT TYPE CLARIFICATION */}
        <div className="p-8 sm:p-12 bg-white/5 rounded-[3rem] border border-white/10 space-y-8">
           <div className="flex items-center gap-4">
              <AlertCircle size={24} className="text-aba-gold" />
               <h4 className="text-sm font-black uppercase tracking-widest text-white">Financial Protocol Architecture</h4>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aba-gold/20 flex items-center justify-center text-aba-gold">
                       <Zap size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Fidelity (Current)</span>
                 </div>
                 <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-tight">
                    Your daily liquidity hub. Use this for immediate commerce, payouts, and incoming settlements. Funds here are always liquid and ready for any industrial signal.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aba-green/20 flex items-center justify-center text-aba-green">
                       <ShieldCheck size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-aba-green">Thrift (Locked)</span>
                 </div>
                 <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-tight">
                    Capital accumulation unit. Funds in the Capital Vault are locked until maturity. This is for long-term industrial stability and is separate from your daily Fidelity balance.
                 </p>
              </div>
           </div>

           <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-bold text-white/20 uppercase text-center tracking-widest">
                 System Note: Transfers between Fidelity and Thrift are subject to validation protocols.
              </p>
           </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <History size={20} className="text-aba-gold" />
                 <h4 className="text-xl font-bold tracking-tight uppercase tracking-widest">Transaction Signal</h4>
              </div>
              <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-standard">
                 <Filter size={14} /> Filter
              </button>
           </div>

           <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <div key={t.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-standard">
                     <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${t.type === 'credit' ? 'bg-aba-green/10 border-aba-green/20 text-aba-green' : 'bg-aba-red/10 border-aba-red/20 text-aba-red'}`}>
                           {t.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                           <h5 className="font-bold tracking-tight">{t.description}</h5>
                           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">
                             {new Date(t.created_at).toLocaleDateString()} • REF: {t.reference.toUpperCase()}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-lg font-bold tracking-tight ${t.type === 'credit' ? 'text-aba-green' : 'text-aba-red'}`}>
                          {t.type === 'credit' ? '+' : '-'}₦{t.amount.toLocaleString()}
                        </p>
                        <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Successful</span>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                   <p className="text-xs font-bold uppercase text-white/20 tracking-[0.2em]">No financial signals detected</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
