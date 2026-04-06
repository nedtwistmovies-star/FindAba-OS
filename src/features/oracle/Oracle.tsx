
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, X, Globe, ChevronDown, ChevronUp, 
  Plus, Zap, Image as ImageIcon, Code, Play, PanelRight,
  Activity, Sparkles, Loader2, Search, Camera, Smartphone, Info, AlertTriangle, Settings,
  Menu, SquarePen, Share, MoreHorizontal, ArrowDown, Mic, AudioLines,
  Trash2, ArrowLeft, RefreshCcw, Paperclip, ArrowUp
} from 'lucide-react';
import { getOracleStream as askOracle, getSupportResponse, generateConversationTitle, syncGeminiConfig } from '../../services/geminiService';
import IndustrialButton from '../../components/IndustrialButton';
import { useToast } from '../../providers/ToastProvider';

interface OracleMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  thoughtProcess?: string;
  timestamp: string;
  grounding?: any[];
  imageData?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: OracleMessage[];
  lastUpdated: string;
}

interface VoiceSettings {
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  rate: number;
  pitch: number;
}

const STORAGE_KEY = 'findaba_oracle_conversations_v6';
const VOICE_STORAGE_KEY = 'findaba_oracle_voice_settings_v1';

const Oracle = ({ catalog, onBack, oracleAvatar, setView }: any) => {
  const { addToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { voiceName: 'Kore', rate: 1.0, pitch: 1.0 };
    } catch (e) { return { voiceName: 'Kore', rate: 1.0, pitch: 1.0 }; }
  });

  const [currentConvId, setCurrentConvId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch (e) { return null; }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [signalLocked, setSignalLocked] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const saveConversations = (newConvs: Conversation[]) => {
    setConversations(newConvs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConvs));
  };

  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Signal',
      messages: [],
      lastUpdated: new Date().toISOString()
    };
    saveConversations([newConv, ...conversations]);
    setCurrentConvId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter(c => c.id !== id);
    saveConversations(filtered);
    if (currentConvId === id) {
      setCurrentConvId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
    saveConversations(updated);
  };

  const switchToOpenRouter = () => {
    localStorage.setItem('findaba_primary_ai', 'openrouter');
    addToast("Primary Signal switched to OpenRouter Relay.", "info");
    setErrorNode(null);
    setIsQuotaError(false);
  };

  useEffect(() => {
    const checkSignal = async () => {
      const synced = await syncGeminiConfig();
      const { checkDatabaseHealth } = await import('../../services/supabaseService');
      const health = await checkDatabaseHealth();
      setSignalLocked(synced && health.status === 'healthy');
    };
    checkSignal();
    
    // Periodically check signal health
    const interval = setInterval(checkSignal, 15000);
    return () => clearInterval(interval);
  }, []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showThinkingId, setShowThinkingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [errorNode, setErrorNode] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showOracleSetup, setShowOracleSetup] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConvId);
  const messages = currentConversation?.messages || [];

  useEffect(() => {
    syncGeminiConfig().then(synced => {
      if (synced) setSignalLocked(true);
    });
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    if (!showScrollButton) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const startNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      lastUpdated: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConvId(newId);
    setIsSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    const newConvs = conversations.filter(c => c.id !== id);
    setConversations(newConvs);
    if (currentConvId === id) {
      setCurrentConvId(newConvs.length > 0 ? newConvs[0].id : null);
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRefine = async () => {
    if (!input.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refinedText = await getSupportResponse(
        `Rewrite this industrial trade query to be more professional, sophisticated, and technically clear for a master artisan context. Keep it concise. TEXT: "${input}"`,
        []
      );
      if (refinedText) setInput(refinedText.replace(/["']/g, '').trim());
    } catch (e) {
      console.warn("Refining signal lost.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleInsertMarketQuery = () => {
    const queries = [
      "What are the latest market prices and business news in Aba today?",
      "Query current import costs and trade news in Ariaria and beyond.",
      "Check the latest exchange rates impacting Aba businesses.",
      "Are there any new government policies affecting Enyimba entrepreneurs this week?",
      "Find the best schools and hospitals in Aba.",
      "Recommend professional legal or accounting services in Aba."
    ];
    const random = queries[Math.floor(Math.random() * queries.length)];
    setInput(random);
  };

  const handleSend = async (txt?: string, isRetry = false) => {
    const val = (txt || input).trim();
    if (!val && !pendingImage || (loading && !isRetry)) return;
    
    if (isRetry) setIsReconnecting(true);
    setErrorNode(null);
    setIsQuotaError(false);
    setLoading(true);

    if (isRetry) {
      // Artificial delay for better UX feedback during reconnection
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    let activeConvId = currentConvId;
    if (!activeConvId) {
      const newId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        title: val.slice(0, 30) || 'New Conversation',
        messages: [],
        lastUpdated: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConvId(newId);
      activeConvId = newId;
    }

    if (!isRetry) {
      const userMsg: OracleMessage = { 
        id: `u-${Date.now()}`, 
        role: 'user', 
        text: val || (pendingImage ? "Audit this hardware node spec." : ""), 
        imageData: pendingImage || undefined,
        timestamp: new Date().toISOString() 
      };
      
      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          const newMessages = [...c.messages, userMsg];
          return { 
            ...c, 
            messages: newMessages, 
            title: c.title === 'New Conversation' ? val.slice(0, 30) : c.title,
            lastUpdated: new Date().toISOString() 
          };
        }
        return c;
      }));
      setInput('');
    }

    const imgToSend = pendingImage;
    if (!isRetry) setPendingImage(null);
    
    try {
      const targetConv = conversations.find(c => c.id === activeConvId);
      const currentMessages = targetConv?.messages || [];
      
      const history = currentMessages.slice(-8).map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      }));

      const promptData = imgToSend 
        ? { data: imgToSend.split(',')[1], mimeType: 'image/jpeg' } 
        : val;

      const res = await askOracle(promptData, history, catalog);
      const modelMsg: OracleMessage = { 
        id: `m-${Date.now()}`, 
        role: 'model', 
        text: res.text, 
        thoughtProcess: res.thoughtProcess,
        timestamp: new Date().toISOString(),
        grounding: res.grounding 
      };
      
      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          return { ...c, messages: [...c.messages, modelMsg], lastUpdated: new Date().toISOString() };
        }
        return c;
      }));

      // Auto-titling for new conversations
      if (targetConv && targetConv.title === 'New Conversation') {
        generateConversationTitle(val).then(newTitle => {
          renameConversation(activeConvId!, newTitle);
        });
      }

      if (res.thoughtProcess) setShowThinkingId(modelMsg.id);
    } catch (e: any) {
      console.error("Oracle Fault:", e);
      const msg = e.message || "INSTITUTIONAL SIGNAL LOST. THE ORACLE IS RECALIBRATING.";
      const isQuota = msg.toLowerCase().includes("congestion") || msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("overloaded");
      
      setIsQuotaError(isQuota);
      setErrorNode(msg);
    } finally { 
      setLoading(false); 
      setIsReconnecting(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  const speakLastMessage = async () => {
    const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
    if (!lastModelMsg || isSpeaking) return;

    setIsSpeaking(true);
    try {
      const { generateHistoryAudio, decodeAudio } = await import('../../services/geminiService');
      const audioData = await generateHistoryAudio(lastModelMsg.text, 'English', voiceSettings.voiceName);
      if (audioData) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await decodeAudio(audioData, audioCtx);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = voiceSettings.rate;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(lastModelMsg.text);
        utterance.rate = voiceSettings.rate;
        utterance.pitch = voiceSettings.pitch;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("TTS Fault:", e);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0d0d0d] text-[#ececec] font-sans flex flex-col animate-fade-in overflow-hidden">
      
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aba-gold/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-aba-green/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-aba-gold/3 rounded-full blur-[100px]" />
      </div>

      {/* SIDEBAR FOR HISTORY */}
      {isSidebarOpen && (
        <div className="absolute inset-0 z-[100] flex">
          <div className="w-72 bg-[#171717]/80 backdrop-blur-2xl h-full flex flex-col border-r border-white/5 animate-slide-right">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h4 className="text-[12px] font-black uppercase tracking-widest text-white/40">Conversation Registry</h4>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <button 
                onClick={startNewChat}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all border border-white/5"
              >
                <Plus size={16} /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {conversations.map(c => (
                <div 
                  key={c.id}
                  onClick={() => { setCurrentConvId(c.id); setIsSidebarOpen(false); }}
                  className={`group p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${currentConvId === c.id ? 'bg-aba-gold/10 text-aba-gold border border-aba-gold/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="text-[13px] font-medium truncate flex-1">{c.title}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-aba-red transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* CHATGPT STYLE HEADER */}
      <header className="px-4 py-3 flex items-center justify-between bg-transparent backdrop-blur-md border-b border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/60 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10">
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 cursor-pointer group px-4 py-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${signalLocked ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`} />
              <span className="text-[15px] font-black uppercase tracking-widest text-white/90 flex items-center gap-3">
                FindAba AI (Kalu) v6.0 <ChevronDown size={14} className="opacity-40" />
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 opacity-40">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 relative">
          <button onClick={startNewChat} className="p-2 text-white/60 hover:text-white transition-colors">
            <SquarePen size={20} />
          </button>
          <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2 text-white/60 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>

          {showOptionsMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e1e1e]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-slide-up">
              <button 
                onClick={() => { setShowVoiceSettings(true); setShowOptionsMenu(false); }}
                className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-white/80 hover:bg-white/5 flex items-center gap-3 border-b border-white/5"
              >
                <AudioLines size={16} className="text-aba-gold" /> Voice Settings
              </button>
              <button 
                onClick={() => { 
                  if (currentConvId) {
                    setConversations(prev => prev.map(c => c.id === currentConvId ? { ...c, messages: [] } : c));
                  }
                  setShowOptionsMenu(false); 
                }}
                className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-white/80 hover:bg-white/5 flex items-center gap-3 border-b border-white/5"
              >
                <X size={16} className="text-aba-gold" /> Clear Chat
              </button>
              <button 
                onClick={() => { setConversations([]); setCurrentConvId(null); setShowOptionsMenu(false); }}
                className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 flex items-center gap-3 border-b border-white/5"
              >
                <Trash2 size={16} /> Purge History
              </button>
              <button 
                onClick={() => { onBack(); setShowOptionsMenu(false); }}
                className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-white/80 hover:bg-white/5 flex items-center gap-3"
              >
                <ArrowLeft size={16} /> Exit Oracle
              </button>
            </div>
          )}
        </div>
      </header>

      {/* VOICE SETTINGS MODAL */}
      {showVoiceSettings && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1e1e1e] rounded-[2.5rem] border border-white/10 p-8 space-y-8 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <AudioLines size={24} className="text-aba-gold" /> Voice Settings
              </h3>
              <button onClick={() => setShowVoiceSettings(false)} className="p-2 text-white/40 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Select Voice Node</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] as const).map(v => (
                    <button 
                      key={v}
                      onClick={() => setVoiceSettings({ ...voiceSettings, voiceName: v })}
                      className={`px-4 py-3 rounded-xl text-[12px] font-bold uppercase tracking-widest border transition-all ${voiceSettings.voiceName === v ? 'bg-aba-gold text-aba-dark border-aba-gold shadow-lg' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Speech Rate</label>
                  <span className="text-[10px] font-bold text-aba-gold">{voiceSettings.rate.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1"
                  value={voiceSettings.rate}
                  onChange={e => setVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aba-gold"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Vocal Pitch</label>
                  <span className="text-[10px] font-bold text-aba-gold">{voiceSettings.pitch.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1"
                  value={voiceSettings.pitch}
                  onChange={e => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aba-gold"
                />
              </div>
            </div>

            <button 
              onClick={() => setShowVoiceSettings(false)}
              className="w-full py-4 bg-white text-aba-deep rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all hover:bg-aba-gold"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* CHAT VIEWPORT */}
      <main 
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-0 py-4 space-y-8"
      >
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {messages.length === 0 && (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 select-none">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-aba-gold shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                <img src={oracleAvatar} className="w-full h-full object-cover" alt="FindAba AI" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">How can I help you today?</h2>
                <p className="text-sm text-white/40 font-medium">Query Kalu, the FindAba AI Assistant</p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex flex-col space-y-4 animate-slide-up">
              {m.role === 'user' && (
                <div className="flex justify-end">
                  <div className="flex flex-col items-end gap-2 max-w-[85%]">
                    {m.imageData && (
                      <div className="w-48 h-64 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={m.imageData} className="w-full h-full object-cover" alt="User upload" />
                      </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-xl text-white px-6 py-4 rounded-[2rem] rounded-tr-none text-[15px] font-medium leading-relaxed border border-white/10 shadow-xl">
                      {m.text}
                    </div>
                  </div>
                </div>
              )}

              {m.role === 'model' && (
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-aba-gold/30 shrink-0 mt-1 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <img src={oracleAvatar} className="w-full h-full object-cover" alt="FindAba AI" />
                  </div>
                  <div className="flex-1 space-y-4 overflow-hidden">
                    {m.thoughtProcess && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
                        <Activity size={10} className="text-aba-gold" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold/60">Registry Logic</span>
                        <button 
                          onClick={() => setShowThinkingId(showThinkingId === m.id ? null : m.id)}
                          className="ml-1 opacity-40 hover:opacity-100 transition-all"
                        >
                          {showThinkingId === m.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    )}
                    
                    {showThinkingId === m.id && m.thoughtProcess && (
                      <div className="text-[12px] text-white/40 italic font-medium border-l border-aba-gold/20 pl-4 py-2 bg-white/2 rounded-r-xl">
                        {m.thoughtProcess}
                      </div>
                    )}

                    <div className="text-[17px] leading-[1.6] text-white/90 font-serif whitespace-pre-wrap tracking-tight">
                      {m.text}
                    </div>
                    
                    {m.grounding && m.grounding.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {m.grounding.map((chunk, idx) => chunk.web && (
                          <a key={idx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-aba-gold/80 hover:bg-aba-gold hover:text-aba-dark transition-all">
                            <Globe size={12} /> {chunk.web.title || 'Source'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-aba-gold/30 shrink-0">
                <img src={oracleAvatar} className="w-full h-full object-cover opacity-50" alt="FindAba AI" />
              </div>
              <div className="flex items-center gap-3 text-aba-gold">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-aba-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-aba-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-aba-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Consulting the Registry...</span>
              </div>
            </div>
          )}

          {errorNode && (
            <div className={`p-8 rounded-[2rem] flex flex-col gap-6 border backdrop-blur-xl ${isQuotaError ? 'bg-aba-gold/5 border-aba-gold/20' : 'bg-aba-red/5 border-aba-red/20'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isQuotaError ? 'bg-aba-gold/20' : 'bg-aba-red/20'}`}>
                  <AlertTriangle className={isQuotaError ? 'text-aba-gold' : 'text-aba-red'} size={24} />
                </div>
                <div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest opacity-40 mb-1">Signal Interrupted</h4>
                  <p className="text-sm font-bold text-white/90">{errorNode}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <IndustrialButton 
                  variant={isQuotaError ? 'primary' : 'danger'} 
                  size="md" 
                  icon={isReconnecting ? Loader2 : RefreshCcw} 
                  loading={isReconnecting}
                  onClick={async () => {
                    setIsReconnecting(true);
                    await syncGeminiConfig();
                    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                    handleSend(lastUserMsg?.text || input, true);
                    setIsReconnecting(false);
                  }}
                  fullWidth
                >
                  {isReconnecting ? 'Reconnecting...' : 'Reconnect Signal'}
                </IndustrialButton>
                <IndustrialButton 
                  variant="secondary" 
                  size="md" 
                  icon={Zap} 
                  onClick={switchToOpenRouter}
                  fullWidth
                >
                  Switch to OpenRouter
                </IndustrialButton>
                <IndustrialButton 
                  variant="secondary" 
                  size="md" 
                  icon={Settings} 
                  onClick={() => setView('admin')}
                  fullWidth
                >
                  Admin Console
                </IndustrialButton>
                <IndustrialButton 
                  variant="secondary" 
                  size="md" 
                  icon={ArrowLeft} 
                  onClick={onBack}
                  fullWidth
                >
                  Return to Hub
                </IndustrialButton>
              </div>
            </div>
          )}
        </div>
        
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollButton && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-aba-gold shadow-2xl transition-all z-50 hover:scale-110 active:scale-95"
        >
          <ArrowDown size={24} />
        </button>
      )}

      {/* INPUT AREA */}
      <footer className="p-4 md:p-8 bg-transparent shrink-0 z-50">
        <div className="max-w-3xl mx-auto w-full relative">
          <div className="bg-[#1e1e1e]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl p-2 transition-all focus-within:border-aba-gold/30 focus-within:shadow-[0_0_50px_rgba(255,215,0,0.05)]">
            {pendingImage && (
              <div className="px-4 pt-4 pb-2">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 group">
                  <img src={pendingImage} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    onClick={() => setPendingImage(null)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1 pl-2 pb-2">
                <input 
                  type="file" ref={fileInputRef} hidden accept="image/*" 
                  onChange={handleImageSelect}
                />
                <label 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-white/40 hover:text-aba-gold hover:bg-white/5 rounded-2xl cursor-pointer transition-all"
                >
                  <Paperclip size={20} />
                </label>
              </div>

              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message Kalu..."
                className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-[15px] text-white placeholder:text-white/20 resize-none max-h-48 scrollbar-hide"
                rows={1}
                disabled={loading || isRefining}
              />

              <div className="flex items-center gap-2 pr-2 pb-2">
                <button 
                  onClick={toggleListening}
                  className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-aba-red text-white animate-pulse' : 'text-white/40 hover:text-aba-gold hover:bg-white/5'}`}
                >
                  <Mic size={20} />
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !pendingImage) || loading}
                  className={`p-3 rounded-2xl transition-all ${(!input.trim() && !pendingImage) || loading ? 'text-white/10' : 'bg-white text-aba-deep hover:bg-aba-gold shadow-lg active:scale-95'}`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center mt-4 text-white/20 font-black uppercase tracking-[0.2em]">
            Institutional Oracle Node • FindAba City OS v6.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Oracle;
