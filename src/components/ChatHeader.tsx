
import React from 'react';
import { useChatContext } from '../providers/ChatProvider';
import { User, Activity, ArrowLeft } from 'lucide-react';
import PresenceList from './PresenceList';

type Props = {
  title?: string;
  onBack?: () => void;
};

export default function ChatHeader({ title, onBack }: Props) {
  const { presence, isTypingBy, currentUser } = useChatContext();

  const typingUsers = presence
    .filter(p => isTypingBy[p.user_id] && p.user_id !== currentUser.id)
    .map(p => p.displayName || 'Artisan');

  const onlineCount = presence.length;

  const renderStatus = () => {
    if (typingUsers.length === 0) {
      return `${onlineCount} Artisan${onlineCount !== 1 ? 's' : ''} Online`;
    }
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} & ${typingUsers[1]} are typing...`;
    return `${typingUsers[0]} & ${typingUsers.length - 1} others typing...`;
  };

  return (
    <div className="px-6 py-4 bg-aba-deep border-b border-white/5 flex items-center justify-between shadow-2xl relative z-[200]">
      <div className="flex items-center gap-5">
        {onBack && (
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-90 border border-white/5">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {presence.slice(0, 3).map((p) => (
              <div key={p.key} className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-aba-deep flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-aba-gold/10">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-aba-gold font-black text-[10px]">{(p.displayName || '?').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            ))}
            {presence.length > 3 && (
              <div className="w-10 h-10 rounded-2xl bg-aba-gold text-aba-deep border-2 border-aba-deep flex items-center justify-center text-[10px] font-black shadow-xl">
                +{presence.length - 3}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-white text-base font-black uppercase tracking-tighter leading-none">{title ?? 'Hub Connection'}</h3>
            <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2 ${typingUsers.length > 0 ? 'text-aba-gold animate-pulse' : 'text-slate-500'}`}>
              {typingUsers.length > 0 ? <Activity size={10} /> : <User size={10} />}
              {renderStatus()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block">
        <PresenceList />
      </div>
    </div>
  );
}
