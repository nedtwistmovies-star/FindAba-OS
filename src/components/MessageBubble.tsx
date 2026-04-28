
import React from 'react';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, isOwn }) => {
  return (
    <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end ml-auto' : 'items-start mr-auto'} animate-fade-in`}>
      <div className={`p-5 rounded-[2.2rem] ${isOwn ? 'bg-aba-gold text-aba-dark rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none border border-white/5'} shadow-xl`}>
        {message.body && <p className="text-[13px] font-medium leading-relaxed">{message.body}</p>}
        {message.attachments?.length ? (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {message.attachments.map((a, idx) => (
              <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/10 rounded-2xl hover:bg-black/20 transition-all border border-black/5">
                <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center text-[10px] font-black">FILE</div>
                <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{a.name || 'View File'}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOwn && <span className="text-[8px] font-black text-aba-green uppercase tracking-widest">● {message.status || 'Sent'}</span>}
      </div>
    </div>
  );
};

export default MessageBubble;
