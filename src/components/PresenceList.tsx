
import React from 'react';
import { useChatContext } from '../providers/ChatProvider';
import { User, Activity } from 'lucide-react';

export default function PresenceList() {
  const { presence, isTypingBy } = useChatContext();

  if (!presence || presence.length === 0) {
    return (
      <div className="flex items-center gap-2 text-slate-500 bg-black/20 px-4 py-2 rounded-xl">
        <User className="w-4 h-4 opacity-30" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Registry Idle</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {presence.map(p => (
        <div key={p.key} className="flex items-center gap-2 group cursor-help" title={p.role || 'Registry Partner'}>
          <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 shadow-lg relative">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-[10px] font-black text-aba-gold">{(p.displayName || '?').slice(0, 2).toUpperCase()}</div>
            )}
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${isTypingBy[p.user_id] ? 'bg-aba-gold animate-pulse' : 'bg-aba-green'}`} />
          </div>
          <div className="hidden sm:block">
            <div className="text-[11px] font-black text-slate-100 uppercase tracking-tight leading-none">{p.displayName ?? 'Artisan'}</div>
            <div className="text-[8px] font-black uppercase tracking-widest mt-0.5 leading-none">
              {isTypingBy[p.user_id] ? (
                <span className="flex items-center gap-1 text-aba-gold animate-pulse">
                  typing...
                </span>
              ) : (
                <span className="text-slate-500">{p.role ?? 'Verified'}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
