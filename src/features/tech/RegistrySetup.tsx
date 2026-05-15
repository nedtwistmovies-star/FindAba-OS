
import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Loader2, 
  ArrowLeft, ArrowRight, Lock, Landmark, 
  AlertCircle, Building2, UploadCloud, Info
} from 'lucide-react';
import { ViewState, Business, VerificationStatus } from '../../types';
import { updateBusinessInDB } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';

interface Props {
  business: Business;
  onBack: () => void;
  setView: (v: ViewState) => void;
}

const VerificationFlow: React.FC<Props> = ({ business, onBack, setView }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState<'benefits' | 'documents' | 'payment' | 'completion'>('benefits');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    cac_number: '',
    tax_id: '',
    identity_url: '',
    workshop_proof_url: ''
  });

  const VERIFICATION_FEE = 12500; // Institutional Audit Fee

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cac_number || !formData.identity_url) {
      addToast("Required: CAC Number and Identity Proof are mandatory for audit.", "error");
      return;
    }
    setStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      // Mark as pending and save details
      await updateBusinessInDB(business.id, {
        verification_status: VerificationStatus.PENDING,
        // In a real app we'd store these specific docs in a related table
        description: `${business.description}\n\n[AUDIT LOG]: CAC: ${formData.cac_number} | TaxID: ${formData.tax_id}`
      });
      setStep('completion');
      addToast("Registry signal received. Documents held for audit.", "success");
    } catch (err) {
      addToast("Registry Sync Error. Payout recorded, but status update failed. Please contact registrar support.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-aba-dark animate-fade-in pb-20">
      <PaystackOverlay 
        isOpen={showPayment}
        amount={VERIFICATION_FEE}
        email={business.email}
        label="Institutional Verification Audit"
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPayment(false)}
      />

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <h1 className="text-sm font-black uppercase tracking-widest">Partner Verification Flow</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 py-12">
        
        {/* PROGRESS INDICATOR */}
        <div className="flex gap-2 mb-12">
          {['benefits', 'documents', 'payment', 'completion'].map((s, idx) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                step === s ? 'bg-blue-600' : 
                (['benefits', 'documents', 'payment', 'completion'].indexOf(step) > idx) ? 'bg-aba-green' : 'bg-slate-200'
              }`} 
            />
          ))}
        </div>

        {step === 'benefits' && (
          <div className="space-y-10 animate-slide-up">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">The Institutional <br/>Handshake.</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Verification is not just a badge for visibility. It is a thorough check that signals your business readiness to global partners.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { title: "Industrial Trust", desc: "Confirm your legal identity to SANDALSroyalle Registry.", icon: <Lock className="text-blue-600" /> },
                { title: "Buyer Confidence", desc: "Signals to international buyers that your capacity is audited.", icon: <CheckCircle2 className="text-aba-green" /> },
                { title: "Export Clearance", desc: "Prerequisite for high-volume trade signals via the Buyer Portal.", icon: <Building2 className="text-aba-gold" /> }
              ].map((b, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 flex gap-5 items-start">
                  <div className="p-3 bg-slate-50 rounded-2xl">{b.icon}</div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">{b.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setStep('documents')}
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Continue to Documentation <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'documents' && (
          <form onSubmit={handleDocumentSubmit} className="space-y-10 animate-slide-up">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Audit Credentials</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Stage 2 of 4: Legal & Operational Proof</p>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CAC Registration Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="RC-XXXXXX"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500"
                  value={formData.cac_number}
                  onChange={e => setFormData({...formData, cac_number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">FIRS Tax ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="TIN-XXXXXX"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500"
                  value={formData.tax_id}
                  onChange={e => setFormData({...formData, tax_id: e.target.value})}
                />
              </div>

              <ImageUpload 
                label="Director Identity Proof (NIN/Passport)" 
                onUpload={(url) => setFormData({...formData, identity_url: url})} 
                currentImage={formData.identity_url}
              />

              <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <Info size={16} className="text-blue-600 shrink-0" />
                <p className="text-[9px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                  Your documents are processed through our secure gateway. Only verified auditors see this data.
                </p>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Verify Documentation <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-10 animate-slide-up text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] mx-auto flex items-center justify-center text-blue-600 mb-6 shadow-inner">
               <Landmark size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Audit Settlement</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
                Physical verification and capacity audit requires a one-time institutional processing fee.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Audit Category</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Capacity Level 1</span>
               </div>
               <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                  <span className="text-sm font-black uppercase text-slate-900">Total Settlement</span>
                  <span className="text-2xl font-black text-aba-green">₦{VERIFICATION_FEE.toLocaleString()}</span>
               </div>
            </div>

            <button 
              onClick={() => setShowPayment(true)}
              className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <Lock size={20} /> Initialize Paystack Sync
            </button>

            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              Processing by Paystack Financial Mesh
            </p>
          </div>
        )}

        {step === 'completion' && (
          <div className="space-y-12 animate-slide-up text-center py-10">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-aba-green/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-aba-green text-white rounded-[3rem] flex items-center justify-center shadow-2xl">
                 <ShieldCheck size={56} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Signal Logged.</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                Your verification packet has been submitted to the <span className="text-aba-dark font-black">Enyimba Hub Registry</span>. 
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-left space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-aba-gold rounded-full animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Status: Under Review</p>
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                 Review typically completes within <span className="text-aba-dark font-bold">48 working hours</span>. A verification officer may contact you via your registered WhatsApp for a physical business visit.
               </p>
            </div>

            <button 
              onClick={() => setView('merchant-portal')}
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
            >
              Return to Portal
            </button>
          </div>
        )}
      </main>

      {/* FOOTER WATERMARK */}
      <footer className="mt-auto py-10 flex flex-col items-center gap-4 opacity-10 select-none">
         <span className="text-[14px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest">Registry Protocol Partner v9.5</p>
      </footer>
    </div>
  );
};

export default VerificationFlow;
