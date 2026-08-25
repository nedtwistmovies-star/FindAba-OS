
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
  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 text-amber-500" size={40} />
          <h1 className="text-lg font-black uppercase tracking-tight text-aba-dark">
            Business Profile Required
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            We couldn't load the business profile required to start verification.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-3 rounded-full bg-aba-dark text-white text-xs font-black uppercase tracking-widest"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  const { addToast } = useToast();

  // Registry Setup requires a business record.
  // Guard against an empty selection instead of crashing on business.email/id.
  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-aba-dark">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-amber-500" size={42} />
          <h1 className="text-xl font-black uppercase tracking-wide mb-3">
            Business Required
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Please select or register a business before starting the
            institutional verification audit.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-aba-dark text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
          >
            Return
          </button>
        </div>
      </div>
    );
  }
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

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 text-amber-500" size={40} />
          <h1 className="text-lg font-black uppercase tracking-tight text-aba-dark">
            Business Profile Required
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            We couldn't load the business profile required to start verification.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-3 rounded-full bg-aba-dark text-white text-xs font-black uppercase tracking-widest"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
        description: `${business.description}\n\n[LOG]: CAC: ${formData.cac_number} | TaxID: ${formData.tax_id}`
      });
      setStep('completion');
      addToast("We've received your information. Documents are being reviewed.", "success");
    } catch (err) {
      addToast("An error occurred. Please contact support.", "error");
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
            <h1 className="text-sm font-black uppercase tracking-widest">Business Verification</h1>
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
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Get <br/>Verified.</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Verification helps customers know you are a real and trusted business. It opens up more opportunities for you to grow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { title: "Build Trust", desc: "Show customers you are a legitimate business.", icon: <Lock className="text-blue-600" /> },
                { title: "More Sales", desc: "Gain confidence from buyers looking for trusted partners.", icon: <CheckCircle2 className="text-aba-green" /> },
                { title: "Sell Anywhere", desc: "Reach customers outside of Aba with a verified profile.", icon: <Building2 className="text-aba-gold" /> }
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
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'documents' && (
          <form onSubmit={handleDocumentSubmit} className="space-y-10 animate-slide-up">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Upload Documents</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Step 2 of 4: Business Information</p>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CAC Number</label>
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tax ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="TIN-XXXXXX"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500"
                  value={formData.tax_id}
                  onChange={e => setFormData({...formData, tax_id: e.target.value})}
                />
              </div>

              <ImageUpload 
                label="Director's ID (NIN or Passport)" 
                onUpload={(url) => setFormData({...formData, identity_url: url})} 
                currentImage={formData.identity_url}
              />

              <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <Info size={16} className="text-blue-600 shrink-0" />
                <p className="text-[9px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                  Your information is safe. Only verified reviewers will see your documents.
                </p>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Verify Information <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-10 animate-slide-up text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] mx-auto flex items-center justify-center text-blue-600 mb-6 shadow-inner">
               <Landmark size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Verification Fee</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
                There is a one-time fee for our team to check and verify your business.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Category</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Business Level 1</span>
               </div>
               <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                  <span className="text-sm font-black uppercase text-slate-900">Total Amount</span>
                  <span className="text-2xl font-black text-aba-green">₦{VERIFICATION_FEE.toLocaleString()}</span>
               </div>
            </div>

            <button 
              onClick={() => setShowPayment(true)}
              className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <Lock size={20} /> Pay with Paystack
            </button>

            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              Securely processed by Paystack
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
              <h2 className="text-3xl font-black uppercase tracking-tighter">Request Received.</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                Your application has been submitted to the <span className="text-aba-dark font-black">FindAba Team</span>. 
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-left space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-aba-gold rounded-full animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Status: Under Review</p>
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                 We usually check applications within <span className="text-aba-dark font-bold">48 hours</span>. A member of our team may contact you on WhatsApp to confirm your location.
               </p>
            </div>

            <button 
              onClick={() => setView('merchant-portal')}
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
            >
              Go to Dashboard
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
