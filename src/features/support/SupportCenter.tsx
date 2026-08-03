
import React, { useState } from 'react';
import { 
  X, Send, Search, MessageSquare, ChevronRight, 
  User, Globe, ShieldCheck, Sparkles, ArrowLeft,
  LifeBuoy, BookOpen, Clock, HelpCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../../types';
import { getSupportResponse } from '../../services/geminiService';
import { BackButton } from '../../components/BackButton';

interface SupportCenterProps {
  setView: (v: ViewState) => void;
  onBack?: () => void;
}

const SupportCenter: React.FC<SupportCenterProps> = ({ setView, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your FindAba support assistant. How can we help you today?", sender: 'support', time: '5:27 PM' }
  ]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userText = message;
    const newMessage = {
      id: messages.length + 1,
      text: userText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'support' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const aiResponse = await getSupportResponse(userText, history);
      
      const supportResponse = {
        id: Date.now(),
        text: aiResponse || "Thank you for your message. A support member will be with you shortly to assist with your query.",
        sender: 'support',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, supportResponse]);
    } catch (e) {
      const errorResponse = {
        id: Date.now(),
        text: "Connecting... A support member will be with you shortly to assist with your query.",
        sender: 'support',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const articles = [
    { id: 1, title: 'How to verify my business?', category: 'Verification' },
    { id: 2, title: 'Settlement cycles and payouts', category: 'Finance' },
    { id: 3, title: 'Optimizing your showroom for global buyers', category: 'Growth' },
    { id: 4, title: 'Using the Carry-Go Logistics network', category: 'Logistics' },
  ];

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeChat) {
    return (
      <div className="fixed inset-0 z-[6000] bg-white dark:bg-[#020617] flex flex-col animate-slide-up font-sans">
        <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#020617] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveChat(false)} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-aba-gold rounded-full flex items-center justify-center text-aba-dark font-black text-xs">SR</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-aba-green border-2 border-white dark:border-[#020617] rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">Customer Support</h3>
                <p className="text-[10px] font-bold text-aba-green uppercase tracking-widest">Online • Official Support</p>
              </div>
            </div>
          </div>
          <button onClick={() => { setActiveChat(false); if(onBack) onBack(); else setView('home'); }} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-black/20">
          <div className="flex justify-center py-10">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Conversation Started</p>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${msg.sender === 'support' ? 'bg-aba-gold text-aba-dark' : 'bg-aba-dark text-white'}`}>
                {msg.sender === 'support' ? 'SR' : 'AU'}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm border ${msg.sender === 'support' ? 'bg-white dark:bg-[#1e293b] rounded-tl-none border-slate-100 dark:border-white/5' : 'bg-aba-dark text-white rounded-tr-none border-aba-dark'}`}>
                <p className="text-sm leading-relaxed">
                  {msg.text}
                </p>
                <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest ${msg.sender === 'support' ? 'text-slate-400' : 'text-white/40'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%] animate-pulse">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 bg-aba-gold text-aba-dark">
                SR
              </div>
              <div className="p-4 rounded-2xl shadow-sm border bg-white dark:bg-[#1e293b] rounded-tl-none border-slate-100 dark:border-white/5 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-aba-gold" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typing...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-3 items-center bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-slate-100 dark:border-white/5"
          >
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium dark:text-white"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="p-4 bg-aba-dark text-white rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[6000] bg-aba-dark/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-8 animate-fade-in font-sans"
      onClick={() => { if(onBack) onBack(); else setView('home'); }}
    >
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#020617] sm:rounded-[3rem] rounded-t-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Section */}
        <div className="bg-aba-dark p-10 pb-16 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12"><LifeBuoy size={200} /></div>
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <BackButton variant="header" />
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-aba-dark overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/100?u=1" className="w-full h-full object-cover" alt="Support 1" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-aba-dark overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/100?u=2" className="w-full h-full object-cover" alt="Support 2" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-aba-dark overflow-hidden bg-aba-gold flex items-center justify-center text-aba-dark font-black text-[10px]">AU</div>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-aba-green animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-white tracking-widest">We're Online</span>
                </div>
              </div>
              </div>
              <button onClick={() => { if(onBack) onBack(); else setView('home'); }} className="p-3 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">Hello there!</h2>
              <p className="text-lg font-bold text-white/60 leading-tight">We are here to help — Start a new conversation below.</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 -mt-8 relative z-20 space-y-8 bg-white dark:bg-[#020617] rounded-t-[3rem] scrollbar-hide">
          {/* Recent Conversations */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recent conversations</h4>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase text-aba-gold tracking-widest">
                <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px]">1</span>
                See all
              </button>
            </div>

            <button 
              onClick={() => setActiveChat(true)}
              className="w-full p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-aba-gold to-yellow-600 rounded-2xl flex items-center justify-center text-aba-dark font-black shadow-lg">SR</div>
              <div className="flex-1 text-left">
                <h5 className="text-sm font-black uppercase tracking-tight dark:text-white">Hi, how can we be of help today?</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Customer Support • 9m ago</p>
              </div>
              <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </button>

            <button 
              onClick={() => setActiveChat(true)}
              className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all group"
            >
              New conversation <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>

          {/* Search Articles */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Find an answer quickly</h4>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-aba-gold transition-colors">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search articles..." 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 pl-16 rounded-[2rem] outline-none focus:border-aba-gold transition-all text-sm font-bold dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredArticles.map(article => (
                <button key={article.id} className="w-full p-5 bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between hover:border-aba-gold transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-aba-gold transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-tight dark:text-white">{article.title}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{article.category}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-aba-gold transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 flex flex-col items-center gap-6 opacity-30">
            <div className="flex items-center gap-8">
              <Globe size={16} />
              <ShieldCheck size={16} />
              <Sparkles size={16} />
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Customer Support</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportCenter;
