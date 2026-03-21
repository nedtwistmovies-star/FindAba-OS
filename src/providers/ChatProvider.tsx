
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSupabase } from '../services/supabaseService';
import type { PresenceUser, Role } from '../types';

type CurrentUser = {
  id: string;
  displayName?: string;
  role?: Role;
  avatarUrl?: string;
};

type ChatContextValue = {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  presence: PresenceUser[];
  setTyping: (isTyping: boolean) => Promise<void>;
  isTypingBy: Record<string, boolean>;
  currentUser: CurrentUser;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode; currentUser: CurrentUser }> = ({ children, currentUser }) => {
  const [currentConversationId, setCurrentConversationIdState] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [isTypingBy, setIsTypingBy] = useState<Record<string, boolean>>({});
  const channelRef = useRef<any | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const cleanupChannel = useCallback(async () => {
    if (channelRef.current) {
      try {
        await channelRef.current.untrack();
        channelRef.current.unsubscribe();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
      channelRef.current = null;
    }
    setPresence([]);
    setIsTypingBy({});
  }, []);

  const joinPresence = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    await cleanupChannel();

    // Fixed: Safeguard against disconnected registry by checking supabase existence via getSupabase()
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Registry connection required for Presence features.");
      return;
    }

    const topic = `presence:conversation:${conversationId}`;
    const channel = supabase.channel(topic, { config: { presence: { key: currentUser.id } } });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: PresenceUser[] = [];
      const typingMap: Record<string, boolean> = {};

      for (const key in state) {
        const metas = state[key] as any[];
        const meta = metas[metas.length - 1] ?? {};
        const userData = {
          key,
          user_id: meta.user_id || 'unknown',
          displayName: meta.displayName || '',
          role: meta.role,
          avatarUrl: meta.avatarUrl,
          typing: !!meta.typing,
          online_at: meta.online_at
        };
        users.push(userData);
        typingMap[userData.user_id] = userData.typing;
      }
      setPresence(users);
      setIsTypingBy(typingMap);
    });

    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            user_id: currentUser.id,
            displayName: currentUser.displayName,
            role: currentUser.role,
            avatarUrl: currentUser.avatarUrl,
            typing: false,
            online_at: new Date().toISOString()
          });
        } catch (e) {
          console.error("Presence track error:", e);
        }
      }
    });

    channelRef.current = channel;
  }, [cleanupChannel, currentUser]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current) return;
    
    try {
      await channelRef.current.track({
        user_id: currentUser.id,
        displayName: currentUser.displayName,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl,
        typing: !!isTyping,
        online_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Typing track error:", e);
    }

    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(async () => {
        await setTyping(false);
      }, 3000);
    }
  }, [currentUser]);

  const setCurrentConversationId = useCallback((id: string | null) => {
    setCurrentConversationIdState(id);
    if (id) {
      joinPresence(id);
    } else {
      cleanupChannel();
    }
  }, [joinPresence, cleanupChannel]);

  return (
    <ChatContext.Provider value={{ currentConversationId, setCurrentConversationId, presence, setTyping, isTypingBy, currentUser }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};
