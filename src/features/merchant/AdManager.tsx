
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, TrendingUp, BarChart3, Plus, ArrowLeft, 
  CheckCircle2, Clock, Eye, MousePointer2, ShieldCheck, Loader2, Sparkles, X, LayoutGrid, Zap, AlertCircle, Info, Scale
} from 'lucide-react';
import { AdCampaign, AdType, Business, ViewState } from '../../types';
import { AD_TIERS, LEGAL_POLICIES } from '../../constants';
import { fetchMerchantAds, saveAdCampaign } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';

interface Props {
  business: Business;
  onBack: () => void;
  setView: (v: ViewState) => void;
}

const AdManager: React.FC<Props> = ({ business, onBack, setView }) => {
  const { addToast } = useToast();
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  
  const [newAd, setNewAd] = useState<Partial<AdCampaign>>({
    type: 'featured_listing',
    title: `${business.name} Spotlight`,
    description: business.description,
    image_url: business.image_url,
    business_id: business.id,
    price_paid: 3000,
    category: business.category
  });

  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);

  useEffect(() => {
    fetchMerchantAds(business.id)
      .then(data => {
        setAds(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("[AdManager] fetchMerchantAds error:", err);
        setLoading(false);
      });
  }, [business.id]);

  const currentTier = AD_TIERS[newAd.type as AdType];
  const currentPriceObj = currentTier?.prices[selectedPriceIdx] || { price: 0, duration: 30, label: '30 Days' };
  const scarcityPrice = newAd.type === 'banner' ? Math.round(currentPriceObj.price * 1.2) : currentPriceObj.price;

  const handlePaymentSuccess = async (res: any) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + (currentPriceObj.duration || 30));
    
    const finalAd = {
      ...newAd,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      price_paid: scarcityPrice,
      status: 'active' as const
    };

    try {
      await saveAdCampaign(finalAd);
      const updated = await fetchMerchantAds(business.id);
      setAds(updated);
      setCreating(false);
      setShowCheckout(false);
      addToast("Ad Signal Locked: Synced with Paystack Registry.", "success");
    } catch (e) {
      addToast("Industrial Sync Failure. Please retry the signal.", "error");
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-aba-gold" size={48} /></div>;

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col animate-fade-in scrollbar-hide pb-40">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={scarcityPrice}
        email={localStorage.getItem('findaba_user_email') || 'ads@findaba.com'}
        label={`Registry Ad: ${newAd.type}`}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      <header className="p-8 bg-aba-dark border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 transition-all"><ArrowLeft size={20} /></button>
          <div><h2 className="text-xl font-black uppercase tracking-tighter">Visibility Hub</h2><p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em]">Paystack Ad Protocol</p></div>
        </div>
      </header>

      {creating ? (
        <div className="p-6 animate-slide-up max-w-2xl mx-auto w-full">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={100} /></div>
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Plus size={24} className="text-aba-gold"/> New Campaign</h3>
                    <button onClick={() => setCreating(false)} className="text-white/20 hover:text-white"><X size={24} /></button>
                 </div>
                 <ImageUpload label="Master Visual" currentImage={newAd.image_url} onUpload={(url) => setNewAd({...newAd, image_url: url})} />
                 <input type="text" className="w-full p-5 bg-black/30 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} placeholder="Ad Headline" />
              </div>
              <button onClick={() => setShowCheckout(true)} className="w-full bg-aba-gold text-aba-dark py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all">Initialize Paystack Sync - ₦{scarcityPrice.toLocaleString()}</button>
           </div>
        </div>
      ) : (
        <div className="p-8 space-y-12 max-w-5xl mx-auto w-full">
           <div className="bg-gradient-to-br from-aba-dark to-slate-900 p-12 rounded-[4rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">Sync Your<br/><span className="text-aba-gold">Industrial Pulse</span></h3>
              <button onClick={() => setCreating(true)} className="px-10 py-8 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-white transition-all"><Plus size={20} /> Create Campaign</button>
           </div>
        </div>
      )}
    </div>
  );
};
export default AdManager;
