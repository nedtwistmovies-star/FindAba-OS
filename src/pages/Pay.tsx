import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, Lock, Smartphone } from "lucide-react";
import PaystackOverlay from "../components/PaystackOverlay";
import { paymentService } from "../services/paymentService";
import { useToast } from "../providers/ToastProvider";

interface PayProps {
  orderId?: string;
  defaultAmount?: number;
}

export default function Pay({ orderId: propOrderId, defaultAmount = 5000 }: PayProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const urlOrderId = searchParams.get("orderId") || searchParams.get("order_id");
  const urlAmount = Number(searchParams.get("amount"));
  const urlEmail = searchParams.get("email");
  const urlLabel = searchParams.get("label");

  const orderId = propOrderId || urlOrderId || `ORD-${Date.now().toString().slice(-6)}`;
  const amount = !isNaN(urlAmount) && urlAmount > 0 ? urlAmount : defaultAmount;
  const email = urlEmail || localStorage.getItem("findaba_user_email") || "customer@findaba.com.ng";
  const label = urlLabel || `Order Settlement #${orderId}`;

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);

  useEffect(() => {
    paymentService.initPublicKey();
  }, []);

  const handleSuccess = async (res: any) => {
    setPaymentSuccess(res);
    setIsOverlayOpen(false);
    addToast("Payment settlement confirmed!", "success");

    // Verify with backend
    if (res?.reference) {
      await paymentService.verifyWithBackend(res.reference, { orderId, amount });
    }
  };

  return (
    <div className="min-h-screen bg-aba-deep text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 pt-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest p-2 bg-white/5 rounded-xl border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-aba-gold/10 border border-aba-gold/30 rounded-full text-aba-gold text-[9px] font-black uppercase tracking-widest">
            <Lock size={12} />
            <span>Paystack 256-bit SSL</span>
          </div>
        </div>

        {/* Payment Confirmation Card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-aba-gold via-emerald-400 to-amber-500" />

          {paymentSuccess ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-aba-green/20 rounded-full flex items-center justify-center text-aba-green mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Payment Confirmed</h3>
                <p className="text-xs text-slate-400">Reference: <span className="font-mono text-aba-gold">{paymentSuccess.reference}</span></p>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-4 bg-aba-gold text-aba-dark font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:bg-amber-400 transition-all active:scale-95"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Checkout</p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">₦{amount.toLocaleString()}</h2>
                <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-[9px] font-mono font-bold text-slate-300 border border-white/5">
                  ID: {orderId}
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Purpose:</span>
                  <span className="font-bold text-white text-right truncate max-w-[200px]">{label}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Customer:</span>
                  <span className="font-bold text-white text-right truncate max-w-[200px]">{email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Gateway:</span>
                  <span className="font-bold text-aba-gold flex items-center gap-1">
                    <ShieldCheck size={14} /> Paystack Secure
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsOverlayOpen(true)}
                  className="w-full py-5 bg-gradient-to-r from-aba-gold via-amber-400 to-amber-500 text-aba-dark font-black uppercase text-[11px] tracking-[0.25em] rounded-2xl shadow-xl shadow-aba-gold/20 flex items-center justify-center gap-3 hover:brightness-105 transition-all active:scale-95"
                >
                  <CreditCard size={18} />
                  <span>Choose Payment Method</span>
                </button>
                <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest">
                  Supports Card, Bank Transfer, USSD & QR
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        FindAba City Operating System • Commercial Settlement Protocol
      </div>

      {/* Paystack Modular Overlay */}
      <PaystackOverlay
        isOpen={isOverlayOpen}
        amount={amount}
        email={email}
        label={label}
        bookingId={orderId}
        onSuccess={handleSuccess}
        onCancel={() => setIsOverlayOpen(false)}
      />
    </div>
  );
}
