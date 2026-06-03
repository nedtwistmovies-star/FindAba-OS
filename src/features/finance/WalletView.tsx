
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronRight, Filter, Download, Landmark, CreditCard, Zap, History, ShieldCheck, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { fetchWallet, fetchTransactions } from '../../services/facesService';
import { Transaction, Wallet as WalletType } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';

const WalletView: React.FC = () => {
  const { user_id } = useAuth();
  const { addToast } = useToast();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user_id) {
      const loadWalletData = async () => {
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
      loadWalletData();
    }
  }, [user_id]);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      addToast("Please enter a valid amount.", "error");
      return;
    }
    setProcessing(true);
    try {
      // Simulate financial handshake
      await new Promise(r => setTimeout(r, 2000));
      addToast(`Deposit of ₦${Number(amount).toLocaleString()} initiated. Proceed to secure gateway.`, "success");
      setAmount('');
      setShowDeposit(false);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayout = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      addToast("Please enter a valid amount.", "error");
      return;
    }
    if (wallet && Number(amount) > wallet.balance) {
      addToast("Insufficient liquidity in node.", "error");
      return;
    }
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 2500));
      addToast(`Payout request for ₦${Number(amount).toLocaleString()} submitted to audit.`, "success");
      setAmount('');
      setShowPayout(false);
    } finally {
      setProcessing(false);
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
          className="relative h-48 sm:h-64 rounded-[2rem] sm:rounded-[3.5rem] bg-gradient-to-br from-aba-gold via-aba-green to-aba-deep p-6 sm:p-12 shadow-2xl overflow-hidden group"
        >
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-10">
            <Zap size={80} className="sm:w-[120px] sm:h-[120px]" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1 sm:mb-2 text-shadow-sm">Total Balance</p>
                  <h3 className="text-3xl sm:text-6xl font-bold tracking-tighter truncate max-w-[200px] sm:max-w-none">
                    <span className="text-lg sm:text-2xl mr-1 sm:mr-2">₦</span>
                    {wallet ? wallet.balance.toLocaleString() : '0'}
                  </h3>
               </div>
               <div className="w-12 h-8 sm:w-16 sm:h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <div className="flex -space-x-1.5 sm:-space-x-2">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-500/80" />
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-yellow-500/80" />
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-end">
               <div>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
                    ID: {wallet?.id?.slice(0, 8).toUpperCase() || 'FIN-PRO-001'}
                  </p>
               </div>
               <div className="flex items-center gap-2 sm:gap-3 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20">
                  <ShieldCheck size={12} className="text-white sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Handshake Verified</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
           <button 
             onClick={() => setShowDeposit(true)}
             className="p-5 sm:p-8 bg-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-3 sm:gap-4 hover:bg-white/10 transition-standard group"
           >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-aba-green/10 flex items-center justify-center text-aba-green border border-aba-green/20 group-hover:scale-110 transition-standard">
                <ArrowUpRight size={20} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest">Deposit Hub</span>
           </button>
           <button 
             onClick={() => setShowPayout(true)}
             className="p-5 sm:p-8 bg-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-3 sm:gap-4 hover:bg-white/10 transition-standard group"
           >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-aba-red/10 flex items-center justify-center text-aba-red border border-aba-red/20 group-hover:scale-110 transition-standard">
                <ArrowDownLeft size={20} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest">Payout Portal</span>
           </button>
        </div>

        {/* Action Modals */}
        <AnimatePresence>
          {(showDeposit || showPayout) && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowDeposit(false); setShowPayout(false); setAmount(''); }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-aba-deep border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${showDeposit ? 'bg-aba-green/10 text-aba-green border-aba-green/20' : 'bg-aba-red/10 text-aba-red border-aba-red/20'}`}>
                      {showDeposit ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">{showDeposit ? 'Deposit' : 'Payout'} Hub</h3>
                  </div>
                  <button onClick={() => { setShowDeposit(false); setShowPayout(false); setAmount(''); }} className="p-2 text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest ml-4">Settlement Amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-white/20">₦</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-6 pl-12 rounded-2xl text-2xl font-bold text-white outline-none focus:border-aba-gold transition-standard"
                    />
                  </div>
                </div>

                <button 
                  onClick={showDeposit ? handleDeposit : handlePayout}
                  disabled={processing || !amount}
                  className={`w-full py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${processing ? 'opacity-50' : showDeposit ? 'bg-aba-green text-white' : 'bg-aba-red text-white'}`}
                >
                  {processing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
                  {showDeposit ? 'Authorize Deposit' : 'Request Payout'}
                </button>
                
                <p className="text-[8px] font-bold text-center text-white/20 uppercase tracking-[0.2em]">Authorized Handshake Encrypted • 256-bit Financial SSL</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
