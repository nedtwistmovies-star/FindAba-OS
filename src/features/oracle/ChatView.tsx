
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Landmark, ShieldCheck, Zap, X } from 'lucide-react';
import { ChatMessage, Business } from '../../types';
import { sendMessageToSupabase, subscribeToMessages, fetchMessagesFromDB, getSupabase } from '../../services/supabaseService';
import PaystackOverlay from '../../components/PaystackOverlay';

interface ChatViewProps {
  currentUserEmail: string;
  targetBusiness: Business;
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUserEmail, targetBusiness, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMessagesFromDB(currentUserEmail, targetBusiness.id);
      setMessages(data as any);
    };
    load();

    const sub = subscribeToMessages((payload) => {
      const msg = payload.new;
      const isRelevant = (
        (msg.sender_id === currentUserEmail && msg.receiverId === targetBusiness.id) ||
        (msg.sender_id === targetBusiness.id && msg.receiverId === currentUserEmail)
      );
      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, text: msg.body || msg.text, timestamp: msg.created_at || new Date().toISOString() }];
        });
      }
    });

    return () => { if (sub) sub.unsubscribe(); };
  }, [currentUserEmail, targetBusiness.id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = input.trim();
    if (!val || loading || !getSupabase()) return;
    
    const msg: ChatMessage = { 
      id: `msg-${Date.now()}`,
      sender_id: currentUserEmail, 
      receiverId: targetBusiness.id, 
      text: val, 
      timestamp: new Date().toISOString(), 
      role: 'citizen',
      status: 'sent'
    };
    
    setInput('');
    setLoading(true);
    try { 
      await sendMessageToSupabase(msg); 
    } catch (err) { 
      alert("Signal failed."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleTradeCommit = () => {
    if (settlementAmount <= 0) {
      alert("Invalid Amount Signal.");
      return;
    }
    setShowSettlement(true);
  };

  const onSettlementSuccess = async (res: any) => {
    setShowSettlement(false);
    // Log commercial handshake in chat
    const msg: ChatMessage = { 
      id: `pay-${Date.now()}`,
      sender_id: currentUserEmail, 
      receiverId: targetBusiness.id, 
      text: `[COMMERCIAL SIGNAL]: Initialized Settlement of ₦${settlementAmount.toLocaleString()}. Reference: ${res.reference}. ESCROW ACTIVE.`, 
      timestamp: new Date().toISOString(), 
      role: 'system',
      status: 'delivered'
    };
    await sendMessageToSupabase(msg);
    setSettlementAmount(0);
    alert("Trade Signal Locked: Funds held by Registry.");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col animate-fade-in">
      <PaystackOverlay 
        isOpen={showSettlement} 
        amount={settlementAmount} 
        email={currentUserEmail} 
        label={`Trade Settlement: ${targetBusiness.name}`} 
        onSuccess={onSettlementSuccess} 
        onCancel={() => setShowSettlement(false)} 
      />

      <header className="bg-aba-dark p-6 flex items-center justify-between shadow-xl shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-xl text-white active:scale-90 transition-all"><ArrowLeft size={20}/></button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border-2 border-aba-gold overflow-hidden shadow-lg"><img src={targetBusiness.image_url} className="w-full h-full object-cover" /></div>
             <div>
                <h3 className="text-white text-[13px] font-black uppercase leading-none">{targetBusiness.name}</h3>
                <span className="text-[8px] font-black text-aba-gold uppercase tracking-[0.2em] mt-1 block">Verified Trade Hub</span>
             </div>
          </div>
        </div>
        <button 
          onClick={() => setSettlementAmount(1000)} // Open mini settlement node
          className="p-3 bg-aba-gold text-aba-dark rounded-xl shadow-lg active:scale-90 transition-all hover:bg-white"
        >
          <Landmark size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gray-50 dark:bg-slate-900/50">
        {messages.map((m, idx) => {
          const isSystem = m.role === 'system';
          return (
            <div key={m.id || idx} className={`flex ${m.sender_id === currentUserEmail ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-[13px] font-medium ${
                isSystem 
                  ? 'bg-aba-gold/10 border border-aba-gold/30 text-aba-gold text-center italic w-full' 
                  : m.sender_id === currentUserEmail 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-white dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-white/5 rounded-tl-none shadow-sm'
              }`}>
                {m.text}
                {!isSystem && <div className="text-[7px] mt-1 opacity-40 uppercase font-black">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 bg-white dark:bg-slate-950 border-t dark:border-white/5 space-y-4">
        {/* SETTLEMENT HANDSHAKE BAR */}
        <div className="flex gap-3 items-center">
           <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-aba-gold">₦</span>
              <input 
                type="number" 
                placeholder="Commit Price..." 
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 rounded-2xl py-3 pl-8 pr-4 text-xs font-black outline-none focus:border-aba-gold"
                value={settlementAmount || ''}
                onChange={e => setSettlementAmount(Number(e.target.value))}
              />
           </div>
           <button 
             onClick={handleTradeCommit}
             disabled={settlementAmount <= 0}
             className="px-6 py-3 bg-aba-dark text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-30 transition-all hover:bg-aba-gold hover:text-aba-dark"
           >
              <Zap size={14} fill="currentColor" /> Secure Trade
           </button>
        </div>

        <form onSubmit={handleSend} className="bg-gray-100 dark:bg-slate-900 rounded-[2.5rem] p-2 pl-6 flex items-center border shadow-inner dark:border-white/5">
          <input type="text" placeholder="Establish Link..." className="flex-1 bg-transparent py-4 text-[13px] font-black uppercase outline-none dark:text-white placeholder:text-slate-400" value={input} onChange={e => setInput(e.target.value)} />
          <button type="submit" disabled={!input.trim() || loading} className="w-14 h-14 bg-aba-dark text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 disabled:opacity-20 transition-all">{loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}</button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
