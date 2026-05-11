
import React, { useState, useRef, useEffect } from 'react';
import { Mail, User, Send, HelpCircle, ChevronDown, CheckCircle, ArrowLeft, ShieldCheck, MessageSquare, Info, Loader2, Cpu, Sparkles } from 'lucide-react';
// Fixed: Removed TRANSLATIONS as it's not in types.ts
import { Language, ViewState, SupportMessage } from '../../types';
import { getSupportResponse } from '../../services/geminiService';
import { sendSupportMessage } from '../../services/supabaseService';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';

const FAQ_DATA = [
  { q: "How do I verify my industrial workshop?", a: "To get the Blue Verified badge, submit your CAC documents or Business Permit in your Merchant Portal. Verification typically takes 24-48 hours of review by our verification team." },
  { q: "Is FindAba free for artisans?", a: "Yes, exploring businesses is free. Artisan registration has a free 'Starter' tier. Verified and Premium tiers offer advanced export visibility." },
  { q: "How does Carry-Go logistics work?", a: "We act as a hub-to-hub intermediary. Once you book a shipment, a rider is dispatched to your workshop or specified hub, and goods are moved through our secure trade routes." },
  { q: "Can I sell globally via FindAba?", a: "Absolutely. Our 'Export Gold' tier is specifically designed to facilitate global discovery and logistics for master artisans." }
];

interface ContactProps {
  language: Language;
  setView: (v: ViewState) => void;
}

const Contact: React.FC<ContactProps> = ({ language, setView }) => {
  const { userIdentifier, userName: authUserName } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'contact' | 'faq' | 'live'>('contact');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: authUserName || '',
    email: userIdentifier || '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (userIdentifier || authUserName) {
      setFormData(prev => ({
        ...prev,
        email: userIdentifier || prev.email,
        name: authUserName || prev.name
      }));
    }
  }, [userIdentifier, authUserName]);

  // Live Support State
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'model', text: 'FindAba Hub Controller online. How can I assist with your industrial operations or directory queries today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'live') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isBotTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await sendSupportMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'unread'
      });
      
      if (error) throw error;
      
      setSubmitted(true);
      addToast("Support Signal Dispatched", "success");
    } catch (err) {
      console.error("[Contact] Dispatch error:", err);
      addToast("Failed to send message. Check registry connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLiveChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = chatInput.trim();
    if (!val || isBotTyping) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: val }]);
    setIsBotTyping(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await getSupportResponse(val, history);
      setChatMessages(prev => [...prev, { role: 'model', text: response || "Hub signal interrupted. Please repeat your query." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Error in technical link. The Hub is temporarily unreachable.' }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col animate-fade-in scrollbar-hide pb-40 font-sans relative">
      {/* Header */}
      <div className="p-8 md:px-12 bg-aba-dark border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
        <div className="flex items-center gap-5">
          <button onClick={() => setView('profile')} className="p-3 bg-white/5 rounded-2xl text-white hover:bg-aba-gold/10 hover:text-aba-gold active:scale-90 transition-all border border-white/10">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Support Hub</h2>
            <p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em]">City Communication v5.5</p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold">
          {activeTab === 'live' ? <Cpu size={24} className="animate-pulse" /> : <HelpCircle size={24} />}
        </div>
      </div>

      <div className="p-8 md:px-12 bg-gradient-to-b from-aba-dark to-transparent max-w-4xl mx-auto w-full">
        <div className="flex bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-1.5 shadow-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('contact')} 
            className={`flex-1 py-5 rounded-[2rem] text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'contact' ? 'bg-aba-gold text-aba-dark shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Dispatch
          </button>
          <button 
            onClick={() => setActiveTab('live')} 
            className={`flex-1 py-5 rounded-[2rem] text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Live Chat
          </button>
          <button 
            onClick={() => setActiveTab('faq')} 
            className={`flex-1 py-5 rounded-[2rem] text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'faq' ? 'bg-aba-gold text-aba-dark shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
          >
            FAQ
          </button>
        </div>
      </div>

      {/* Main Content Responsive Layout */}
      <div className="flex-1 px-8 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Main Focused Column */}
          <div className="order-2 lg:order-1">
            {activeTab === 'contact' && (
              <div className="animate-slide-up space-y-8">
                {submitted ? (
                  <div className="text-center p-12 bg-white/5 rounded-[4rem] border border-aba-green/20 shadow-2xl animate-fade-in h-full flex flex-col items-center justify-center min-h-[400px]">
                     <div className="w-24 h-24 bg-aba-green/10 rounded-full flex items-center justify-center mb-8 border border-aba-green/20">
                        <CheckCircle size={48} className="text-aba-green" />
                     </div>
                     <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Message Dispatched</h2>
                     <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                       Your signal has been received by the Enyimba Support Hub. We will respond via your registered registry email.
                     </p>
                     <button 
                      onClick={() => setSubmitted(false)} 
                      className="mt-12 text-[10px] font-black text-aba-gold underline uppercase tracking-widest hover:text-white transition-colors"
                     >
                       Send New Signal
                     </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-white/10 shadow-inner">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-4">Send Requirement</h3>
                    <div className="space-y-4">
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Artisan Name / ID" 
                          className="w-full pl-16 pr-6 py-6 bg-white/5 border-2 border-transparent rounded-[2.2rem] outline-none focus:border-aba-gold/50 text-sm font-black uppercase transition-all" 
                        />
                      </div>
                      <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-colors" size={18} />
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Registry Email" 
                          autoCapitalize="none"
                          className="w-full pl-16 pr-6 py-6 bg-white/5 border-2 border-transparent rounded-[2.2rem] outline-none focus:border-aba-gold/50 text-sm font-black transition-all" 
                        />
                      </div>
                      <div className="relative group">
                        <Info className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={formData.subject}
                          onChange={e => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Subject" 
                          className="w-full pl-16 pr-6 py-6 bg-white/5 border-2 border-transparent rounded-[2.2rem] outline-none focus:border-aba-gold/50 text-sm font-black uppercase transition-all" 
                        />
                      </div>
                      <div className="relative group">
                        <MessageSquare className="absolute left-6 top-8 text-white/20 group-focus-within:text-aba-gold transition-colors" size={18} />
                        <textarea 
                          rows={6} 
                          required
                          value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Describe your requirement..." 
                          className="w-full pl-16 pr-6 py-8 bg-white/5 border-2 border-transparent rounded-[2.5rem] outline-none focus:border-aba-gold/50 text-sm font-medium leading-relaxed transition-all resize-none" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-aba-gold text-aba-dark py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_rgba(255,215,0,0.2)] flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-white"
                    >
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={20} />}
                      {loading ? "Transmitting..." : "Send Dispatch"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'live' && (
              <div className="animate-slide-up bg-white/5 rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[550px]">
                <div className="p-6 bg-blue-600/10 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu size={20} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Hub Controller</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-aba-green animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-aba-green">Online</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-[12px] font-medium leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                          : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isBotTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white/5 p-4 rounded-[1.8rem] rounded-tl-none border border-white/10 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500/50">Computing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleLiveChatSend} className="p-4 bg-aba-dark border-t border-white/5 flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Describe issue..." 
                    className="flex-1 bg-white/5 rounded-full py-4 px-6 text-xs font-bold outline-none border border-transparent focus:border-blue-500 transition-all"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isBotTyping}
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4 animate-slide-up">
                <h4 className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em] mb-6 px-2">Knowledge Base</h4>
                {FAQ_DATA.map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden transition-all hover:bg-white/[0.08]">
                     <button 
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)} 
                      className="w-full px-8 py-6 flex justify-between items-center text-left"
                     >
                       <span className="text-xs md:text-sm font-black uppercase tracking-tight pr-4 leading-tight">{item.q}</span>
                       <ChevronDown size={20} className={`text-aba-gold transition-transform duration-500 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                     </button>
                     {openFaqIndex === index && (
                       <div className="px-8 pb-8 animate-fade-in">
                         <div className="h-[1px] w-full bg-white/10 mb-6" />
                         <p className="text-[12px] md:text-sm text-white/50 leading-relaxed font-medium">
                           {item.a}
                         </p>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Information Column - Only visible or well-integrated on Large screens */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="p-8 md:p-12 bg-white/5 rounded-[4rem] border border-white/10 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-aba-gold/5 blur-[80px] rounded-full" />
               <Info size={48} className="text-aba-gold" />
               <h5 className="text-xl md:text-2xl font-black uppercase tracking-tight">Enyimba Protocol</h5>
               <p className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                 Our industrial support hub is manned by real experts. {activeTab === 'live' ? 'You are currently interfaced with the Hub Controller AI.' : 'Direct Dispatch connects you to the Enyimba Hub Registry.'}
               </p>
               <div className="w-full h-[1px] bg-white/10 my-2" />
               <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-white leading-none">4h</span>
                    <span className="text-[8px] font-black uppercase text-aba-gold tracking-widest mt-1">Response</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10 mx-2" />
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-white leading-none">24/7</span>
                    <span className="text-[8px] font-black uppercase text-aba-gold tracking-widest mt-1">Registry</span>
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-aba-gold/5 rounded-[3rem] border border-aba-gold/20 flex gap-6 items-center">
               <ShieldCheck className="text-aba-gold shrink-0" size={32} />
               <div>
                 <h6 className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Secure Communications</h6>
                 <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed tracking-tight mt-1">
                   All signals are encrypted. Your data is protected by SANDALSroyalle Registry Protocols.
                 </p>
               </div>
            </div>

            {activeTab !== 'live' && (
              <button 
                onClick={() => setActiveTab('live')}
                className="w-full p-8 bg-blue-600/10 rounded-[3rem] border border-blue-600/20 flex gap-6 items-center group transition-all hover:bg-blue-600/20"
              >
                 <Sparkles className="text-blue-500 shrink-0" size={32} />
                 <div className="text-left">
                   <h6 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Need Instant Help?</h6>
                   <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed tracking-tight mt-1">
                     Open the Live Support interface for immediate industrial assistance.
                   </p>
                 </div>
              </button>
            )}
          </div>

        </div>
      </div>

      <footer className="mt-20 mb-20 px-10 text-center">
         <div className="h-[1px] w-full bg-white/5 mb-10 max-w-5xl mx-auto" />
         <div className="flex flex-col items-center gap-4 opacity-30 group hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
               <ShieldCheck size={18} className="text-aba-gold" />
               <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white">Registry Excellence</span>
            </div>
            <span className="text-[14px] md:text-lg font-black uppercase tracking-[1.2em] text-aba-gold">SANDALSroyalle</span>
         </div>
      </footer>
    </div>
  );
};

export default Contact;
