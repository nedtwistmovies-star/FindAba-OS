
import React, { useState } from 'react';
import { 
  ArrowLeft, Car, ShieldCheck, User, 
  Smartphone, Loader2, CheckCircle2, Landmark, 
  ChevronRight, Star, Settings, AlertOctagon, Shield,
  Image as ImageIcon, UploadCloud
} from 'lucide-react';
import { ViewState, VehicleCategory, ComplianceLevel } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';

const DriverRegistry: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState<'requirements' | 'form' | 'docs' | 'revenue' | 'tier' | 'success'>('requirements');
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [formData, setFormData] = useState({
    driver_name: '',
    driver_phone: '',
    driver_nin: '',
    plate_number: '',
    vin: '',
    vehicle_model: '',
    vehicle_year: '',
    category: VehicleCategory.STANDARD,
    status: 'Approved' as 'Approved' | 'Active' | 'Suspended',
    avatar_url: '',
    license_url: '',
    ownership_url: '',
    insurance_url: '',
    vehicle_image_url: '',
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  const handleNext = () => {
    if (step === 'form') {
      if (!formData.vehicle_image_url) {
        addToast("CRITICAL: Vessel visual identification (photo) is required.", "error");
        return;
      }
      setStep('docs');
    }
    else if (step === 'docs') setStep('revenue');
    else if (step === 'revenue') {
      if (!formData.account_number || !formData.bank_name) {
        addToast("CRITICAL: Revenue Matrix requires valid settlement coordinates.", "error");
        return;
      }
      setShowCheckout(true);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[6000] bg-[#002113] flex flex-col items-center justify-center p-8 text-center animate-fade-in font-sans">
        <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-aba-green shadow-2xl mb-12">
          <Loader2 size={64} className="animate-spin text-aba-gold" />
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter text-balance">Registry Signal <br/><span className="text-aba-gold">Pending Audit.</span></h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mt-6 leading-loose">
           Your node artifacts have been committed. <br/>
           Sentinel Core is auditing your NIN & Vessel Fingerprint. <br/>
           Status: PENDING INDUSTRIAL CLEARANCE.
        </p>
        <button onClick={() => setView('home')} className="mt-16 w-full max-w-xs py-7 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Return Home Portal</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-aba-dark animate-fade-in pb-40">
      <PaystackOverlay isOpen={showCheckout} amount={15000} email={localStorage.getItem('findaba_user_email') || ''} label="Fleet Enrollment" onSuccess={() => setStep('success')} onCancel={() => setShowCheckout(false)} />

      <header className="bg-white p-8 flex items-center justify-between border-b border-slate-100 sticky top-0 z-[500]">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('profile')} className="p-3 bg-slate-50 rounded-xl text-slate-400 active:scale-90 transition-all"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-black uppercase tracking-tight">Fleet Registry</h2>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-aba-gold uppercase tracking-widest">Protocol v4.5</span>
            <ShieldCheck className="text-aba-gold" size={28} />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 py-12">
        {step === 'requirements' && (
          <div className="space-y-12 animate-slide-up">
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-aba-dark">Registry <br/><span className="text-aba-gold italic">Requirements.</span></h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   To operate within the Purple Fleet, all nodes must undergo physical and digital verification.
                </p>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                {[
                  { id: 'identity', label: "DRIVER IDENTITY", detail: "NIN + DRIVER'S LICENSE VERIFICATION.", icon: <User size={24}/>, target: 'docs' },
                  { id: 'vehicle', label: "VEHICLE FINGERPRINT", detail: "ENGINE + PLATE NUMBER SYNCHRONIZATION.", icon: <Smartphone size={24}/>, target: 'form' },
                  { id: 'revenue', label: "REVENUE MATRIX", detail: "AUTOMATED 80% DRIVER SHARE SETTLEMENT.", icon: <Landmark size={24}/>, target: 'revenue' }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setStep(item.target as any)}
                    className="p-10 bg-white border border-slate-200 rounded-[3rem] flex items-center gap-10 shadow-sm transition-all hover:border-aba-gold hover:shadow-xl active:scale-[0.98] text-left group"
                  >
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-aba-dark shrink-0 border border-slate-100 shadow-inner group-hover:bg-aba-gold/10 group-hover:text-aba-gold transition-colors">
                        {item.icon}
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-[18px] font-black uppercase text-aba-dark tracking-tight leading-none group-hover:text-aba-gold transition-colors">{item.label}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">{item.detail}</p>
                     </div>
                  </button>
                ))}
             </div>

             <button onClick={() => setStep('tier')} className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                Select Vehicle Tier <ChevronRight size={18} />
             </button>
          </div>
        )}

        {step === 'tier' && (
          <div className="space-y-12 animate-slide-up">
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-aba-dark">Vessel <br/><span className="text-aba-gold italic">Classification.</span></h3>
             </div>
             
             <div className="space-y-6">
                {[
                  { tier: "LEVEL 1: VERIFIED", class: "CLASS: STANDARD", detail: "NIN/BVN & LICENSE AUTHENTICATED. STANDARD CITY MOBILITY.", icon: <Star size={24} fill="currentColor"/>, cat: VehicleCategory.STANDARD },
                  { tier: "LEVEL 2: ELITE", class: "CLASS: EXECUTIVE", detail: "ADVANCED VESSEL SPECS. HIGH-YIELD EXECUTIVE DISPATCH ACCESS.", icon: <Shield size={24} fill="currentColor"/>, cat: VehicleCategory.EXECUTIVE },
                  { tier: "LEVEL 3: SHIELD", class: "CLASS: GUARDIAN", detail: "VANGUARD SECURITY PROTOCOL. PRIORITY INDUSTRIAL ESCORTS.", icon: <AlertOctagon size={24} fill="currentColor"/>, cat: VehicleCategory.SHIELD }
                ].map((item, i) => (
                  <div key={i} className="p-10 bg-white border border-slate-100 rounded-[4rem] flex items-center gap-10 shadow-xl transition-all hover:border-aba-gold cursor-pointer group" onClick={() => { setFormData({...formData, category: item.cat}); setStep('form'); }}>
                     <div className="w-20 h-20 bg-aba-gold rounded-full flex items-center justify-center text-aba-dark shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        {item.icon}
                     </div>
                     <div className="space-y-2 text-left">
                        <h4 className="text-[18px] font-black uppercase text-aba-dark tracking-tight leading-none">{item.tier}</h4>
                        <p className="text-[11px] font-black text-aba-gold uppercase tracking-widest">{item.class}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2">{item.detail}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-10 animate-slide-up">
             <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Vessel Data</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provide technical specifications for the registry node.</p>
             </div>

             <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-xl space-y-12">
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Legal Operator Name</label>
                         <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-aba-gold transition-colors" size={20} />
                            <input required type="text" placeholder="Full Legal Name" className="w-full pl-14 pr-8 py-7 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black uppercase outline-none focus:border-aba-gold focus:ring-4 focus:ring-aba-gold/10 transition-all shadow-inner" value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Plate Signal</label>
                         <div className="relative group">
                            <div className="absolute inset-0 bg-aba-gold/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <input required type="text" placeholder="ABA-000-XX" className="relative w-full p-7 bg-white border-2 border-slate-200 rounded-[2rem] text-lg font-black uppercase outline-none focus:border-aba-gold transition-all shadow-sm placeholder:text-slate-200" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value})} />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-3 ml-2">
                         <ImageIcon size={18} className="text-aba-gold" />
                         <label className="text-[11px] font-black uppercase text-aba-dark tracking-widest">Vessel Visual Identification</label>
                      </div>
                      <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 shadow-inner space-y-8">
                         <ImageUpload 
                           label="Upload Vessel Photo" 
                           currentImage={formData.vehicle_image_url} 
                           onUpload={(url) => setFormData({...formData, vehicle_image_url: url})}
                           className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm"
                         />
                         <div className="flex items-center justify-center gap-3 opacity-40">
                            <ShieldCheck size={14} className="text-aba-green" />
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Sentinel Visual Audit Active</p>
                         </div>
                      </div>
                   </div>
                </div>

                <button onClick={handleNext} className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-95">
                   Sync Signal Data <ChevronRight size={18} />
                </button>
             </div>
          </div>
        )}

        {step === 'docs' && (
          <div className="space-y-12 animate-slide-up">
             <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight text-aba-dark">Registry Artifacts</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                   Synchronize visual proof of identity and vessel ownership with the Enyimba Master Signal.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUpload label="Node Master Visual (Selfie)" currentImage={formData.avatar_url} onUpload={(url) => setFormData({...formData, avatar_url: url})} />
                <ImageUpload label="Ownership Documentation" currentImage={formData.ownership_url} onUpload={(url) => setFormData({...formData, ownership_url: url})} />
                <ImageUpload label="Registry License" currentImage={formData.license_url} onUpload={(url) => setFormData({...formData, license_url: url})} />
                <ImageUpload label="Insurance Registry" currentImage={formData.insurance_url} onUpload={(url) => setFormData({...formData, insurance_url: url})} />
             </div>

             <button onClick={() => setStep('revenue')} className="w-full py-8 bg-aba-dark text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-95">
                Configure Revenue Matrix <Landmark size={20} />
             </button>
          </div>
        )}

        {step === 'revenue' && (
          <div className="space-y-12 animate-slide-up">
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-aba-dark">Revenue <br/><span className="text-aba-gold italic">Matrix.</span></h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Establish your automated settlement coordinates. The 80% driver share is disbursed instantly upon ride completion.
                </p>
             </div>

             <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-xl space-y-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-300 ml-1 tracking-widest">Settlement Bank</label>
                      <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold shadow-inner" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}>
                         <option value="">Select Financial Institution</option>
                         <option value="Paystack">Paystack Settlement</option>
                         <option value="Zenith">Zenith Bank</option>
                         <option value="GTBank">GTBank</option>
                         <option value="Access">Access Bank</option>
                         <option value="UBA">UBA</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-300 ml-1 tracking-widest">Account Number</label>
                      <input type="text" placeholder="10 Digits" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold shadow-inner" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} maxLength={10} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-300 ml-1 tracking-widest">Account Holder Name</label>
                      <input type="text" placeholder="Verified Name" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold shadow-inner" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} />
                   </div>
                </div>

                <button onClick={() => setShowCheckout(true)} className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-95">
                   Commit Handshake <ShieldCheck size={20} />
                </button>
             </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 flex flex-col items-center gap-6 opacity-10 select-none grayscale shrink-0">
         <span className="text-[14px] font-black uppercase tracking-[1.2em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest">FLEET OPERATING SYSTEM v4.5</p>
      </footer>
    </div>
  );
};

export default DriverRegistry;
