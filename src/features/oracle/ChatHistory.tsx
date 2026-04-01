import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Edit2, Check, X, Plus } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  timestamp: number;
}

interface ChatHistoryProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('findaba_chat_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat sessions", e);
      }
    }
  }, [currentSessionId]);

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/5 w-64">
      <div className="p-4 border-b border-white/5">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 bg-aba-gold text-aba-dark rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-aba-gold/20"
        >
          <Plus size={14} />
          New Signal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/20 space-y-2">
            <MessageSquare size={24} strokeWidth={1} />
            <span className="text-[8px] font-black uppercase tracking-widest">No Archives</span>
          </div>
        ) : (
          sessions.sort((a, b) => b.timestamp - a.timestamp).map(session => (
            <div 
              key={session.id}
              className={`group flex items-center gap-2 p-3 rounded-xl transition-all cursor-pointer ${currentSessionId === session.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare size={14} className="shrink-0" />
              
              {editingId === session.id ? (
                <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input 
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename(session.id)}
                  />
                  <button onClick={() => handleRename(session.id)} className="text-aba-green"><Check size={12} /></button>
                  <button onClick={() => setEditingId(null)} className="text-aba-red"><X size={12} /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-[10px] font-bold truncate tracking-tight">{session.title}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditTitle(session.title);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Edit2 size={10} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 hover:bg-aba-red/20 text-aba-red rounded"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
