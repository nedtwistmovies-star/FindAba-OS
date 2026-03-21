import React, { useEffect, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useChatContext } from '../../providers';
import { useChat } from '../../../hooks/useChat';
import MessageBubble from '../../components/MessageBubble';
import { MessageInput } from '../../components/ChatInput';
import ChatHeader from '../../components/ChatHeader';
import { ViewState } from '../../types';

const ChatRoute: React.FC<{ conversationId: string; setView: (v: ViewState) => void }> = ({ conversationId, setView }) => {
  const { currentUser, setCurrentConversationId } = useChatContext();
  const { messages, loading, sendMessage } = useChat(conversationId, currentUser.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentConversationId(conversationId);
    return () => setCurrentConversationId(null);
  }, [conversationId, setCurrentConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col animate-fade-in overflow-hidden">
      <ChatHeader 
        title="Industrial Hub" 
        onBack={() => setView('home')} 
      />

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-gradient-to-b from-transparent to-slate-900/40">
        <div className="flex flex-col items-center py-10 opacity-20 text-center">
           <Sparkles size={40} className="text-aba-gold mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] max-w-[200px]">End-to-End Encrypted Enyimba Protocol</p>
        </div>
        
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-aba-gold" />
          </div>
        )}

        {messages.map((m: any, i: number) => (
          <MessageBubble key={m.id || i} message={m} isOwn={m.sender_id === currentUser.id} />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Industrial Input */}
      <div className="p-8 bg-aba-dark border-t border-white/5 shrink-0">
        <div className="max-w-4xl mx-auto">
          <MessageInput 
            conversationId={conversationId} 
            currentUserId={currentUser.id} 
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoute;