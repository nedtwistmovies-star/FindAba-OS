
import React, { useRef, useState } from 'react';
import { Send, Paperclip, X, Activity } from 'lucide-react';
import { useChatContext } from '../providers/ChatProvider';

interface Props {
  conversationId: string;
  currentUserId: string;
  sendMessage: (body?: string, files?: File[]) => Promise<any>;
}

export const MessageInput: React.FC<Props> = ({ sendMessage }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { setTyping, presence, isTypingBy, currentUser } = useChatContext();

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && files.length === 0) return;
    
    await setTyping(false);
    await sendMessage(text, files);
    setText('');
    setFiles([]);
  };

  const handleTyping = (val: string) => {
    setText(val);
    setTyping(true);
  };

  // Accessible typing banner for industrial UX
  const typingUsers = presence
    .filter(p => isTypingBy[p.user_id] && p.user_id !== currentUser.id)
    .map(p => p.displayName || 'Artisan');

  const typingLine = (() => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} & ${typingUsers[1]} are typing...`;
    return `${typingUsers[0]} & ${typingUsers.length - 1} others typing...`;
  })();

  return (
    <div className="space-y-4">
      <div className="h-4 px-6">
        {typingLine && (
          <div className="flex items-center gap-2 text-aba-gold animate-pulse" role="status" aria-live="polite">
            <Activity size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">{typingLine}</span>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {files.map((f, i) => (
            <div key={i} className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 animate-fade-in shadow-xl">
              <span className="text-[9px] font-black text-aba-gold uppercase tracking-widest truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSend} className="bg-white/5 p-2.5 pl-6 rounded-[2.5rem] flex items-center gap-4 border border-white/10 focus-within:border-aba-gold/40 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <label className="p-3 text-aba-gold hover:bg-white/10 rounded-2xl cursor-pointer transition-all active:scale-90" title="Attach Files">
          <Paperclip size={22} />
          <input 
            ref={fileRef} 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} 
          />
        </label>
        
        <input 
          placeholder="Cast trade message..." 
          className="flex-1 bg-transparent py-4 text-sm font-medium text-white outline-none placeholder:text-white/20"
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onBlur={() => setTyping(false)}
        />
        
        <button 
          type="submit" 
          disabled={!text.trim() && files.length === 0} 
          className="w-14 h-14 bg-aba-gold text-aba-dark rounded-full flex items-center justify-center shadow-xl active:scale-90 disabled:opacity-20 transition-all group"
        >
          <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </form>
    </div>
  );
};
