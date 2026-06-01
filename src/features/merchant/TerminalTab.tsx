
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, ArrowRight, DollarSign, FileText, 
  Copy, Check, Share2, Info, User, 
  Smartphone, CreditCard, ShieldCheck, Zap
} from 'lucide-react';
import { Business } from '../../types';
import { useToast } from '../../providers/ToastProvider';

interface TerminalTabProps {
  business: Business;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ business }) => {
  const { addToast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [label, setLabel] = useState<string>('Industrial Sale');
  const [customerName, setCustomerName] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const reference = `TERM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const paymentLink = `${window.location.origin}/?view=terminal-pay&biz=${business.id}&amt=${amount}&label=${encodeURIComponent(label)}&ref=${reference}&bizName=${encodeURIComponent(business.name)}`;

  const handleGenerate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      addToast("Please enter a valid settlement amount.", "error");
      return;
    }
    setShowQR(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    addToast("Payment connection string copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment for ${business.name}`,
          text: `Please use this link to complete your payment of ₦${parseFloat(amount).toLocaleString()}`,
          url: paymentLink,
        });
      } catch (err) {
        console.error("Sharing failed", err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="animate-slide-up space-y-8 md:space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Terminal Input */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl border border-slate-100 dark:border-white/10 space-y-8 md:space-y-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-aba-gold/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
              <Zap size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h4 className="text-xl md:text-3xl font-bold uppercase tracking-tight">Point of Sale</h4>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1">In-Person Settlement Terminal</p>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Settlement Amount (₦)</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                  <DollarSign size={24} />
                </div>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setShowQR(false);
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 py-6 md:py-8 pl-14 pr-8 rounded-2xl md:rounded-[2.5rem] outline-none focus:border-aba-gold transition-all text-2xl md:text-4xl font-black tracking-tighter text-aba-deep dark:text-white" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Sale Label / Catalog Item</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={20} />
                </div>
                <input 
                  type="text" 
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Industrial Sale"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 py-5 md:py-6 pl-14 pr-8 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-sm font-black uppercase text-aba-deep dark:text-white" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Customer Designation (Optional)</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter Customer Name"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 py-5 md:py-6 pl-14 pr-8 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-sm font-black uppercase text-aba-deep dark:text-white" 
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              className="w-full py-5 md:py-8 bg-aba-gold text-aba-deep rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-xs tracking-[0.34em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <QrCode size={20} /> Generate QR Signal
            </button>
          </div>
        </div>

        {/* QR Display */}
        <div className="bg-aba-deep p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12"><QrCode size={400} /></div>
          
          <AnimatePresence mode="wait">
            {!showQR ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 relative z-10"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto text-white/10">
                  <QrCode size={48} className="md:w-16 md:h-16" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-white/40 text-lg font-black uppercase tracking-tight">Vault Awaiting Signal</h4>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Enter an amount to activate the Point of Sale settlement QR.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="qr-active"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full space-y-8 md:space-y-12 relative z-10"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-aba-gold/10 rounded-full border border-aba-gold/20 text-aba-gold text-[8px] font-black uppercase tracking-[0.3em]">
                    Active Settlement Hub
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter">₦{parseFloat(amount).toLocaleString()}</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
                </div>

                <div className="relative inline-block">
                  {/* Decorative corners */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-aba-gold rounded-tl-2xl" />
                  <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-aba-gold rounded-tr-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-aba-gold rounded-bl-2xl" />
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-aba-gold rounded-br-2xl" />
                  
                  <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative">
                    <QRCodeSVG 
                      value={paymentLink}
                      size={window.innerWidth < 768 ? 200 : 280}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center border-2 border-aba-gold">
                       <ShieldCheck className="text-aba-gold" size={24} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
                   <button 
                     onClick={handleCopyLink}
                     className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white/60 hover:text-white transition-all group"
                   >
                     {copied ? <Check size={16} className="text-aba-green" /> : <Copy size={16} />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Link Copied' : 'Copy Link'}</span>
                   </button>
                   <button 
                     onClick={handleShare}
                     className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white/60 hover:text-white transition-all"
                   >
                     <Share2 size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Digital Share</span>
                   </button>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-center gap-4 text-white/20">
                     <div className="flex items-center gap-2">
                       <Smartphone size={14} />
                       <span className="text-[8px] font-bold uppercase tracking-widest">Scan with Device</span>
                     </div>
                     <div className="h-4 w-px bg-white/5" />
                     <div className="flex items-center gap-2">
                       <CreditCard size={14} />
                       <span className="text-[8px] font-bold uppercase tracking-widest">Pay via Paystack</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Industrial Protocol Footer */}
      <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] flex flex-col md:flex-row gap-8 items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-aba-gold/10 rounded-2xl text-aba-gold">
               <Info size={24} />
            </div>
            <div className="space-y-1">
               <h5 className="text-white font-black uppercase tracking-tight text-lg">In-Person Settlement Protocol</h5>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-xl">
                 This terminal generates a high-fidelity payment handshake. Ask customers to scan the QR code to proceed to a secure settlement gateway verified by the Enyimba Industrial Registry.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TerminalTab;
