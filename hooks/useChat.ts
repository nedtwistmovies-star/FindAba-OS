
import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabase } from '../src/services/supabaseService';
import type { ChatMessage } from '../src/types';

export function useChat(conversationId: string | null, currentUserId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastLoadedAt = useRef<string | null>(null);

  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!conversationId) return;
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (loadMore && lastLoadedAt.current) {
        query = query.lt('created_at', lastLoadedAt.current);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formatted = data.map((m: any) => ({
          ...m,
          text: m.body || m.text,
          timestamp: m.created_at
        }));

        setMessages(prev => loadMore ? [...prev, ...formatted] : formatted.reverse());
        if (data.length > 0) lastLoadedAt.current = data[data.length - 1].created_at;
        setHasMore(data.length === 30);
      }
    } catch (e) {
      console.error("Fetch messages failed:", e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    const supabase = getSupabase();
    if (conversationId && supabase) {
      const channelId = `chat:${conversationId}-${Math.random().toString(36).substring(2, 9)}`;
      const subscription = supabase
        .channel(channelId)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${conversationId}` 
        }, (payload: any) => {
          const newMsg = payload.new as any;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, text: newMsg.body || newMsg.text, timestamp: newMsg.created_at }];
          });
        })
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = async (body?: string, files?: File[]) => {
    const supabase = getSupabase();
    if (!conversationId || !supabase) return { error: new Error("No conversation ID or Registry Link") };

    const attachments: any[] = [];
    if (files?.length) {
      for (const file of files) {
        // Use updated 'Find_ABA' bucket
        const path = `chat/${conversationId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        try {
          const { data, error } = await supabase.storage.from('findaba').upload(path, file);
          if (data) {
            const { data: urlData } = supabase.storage.from('findaba').getPublicUrl(data.path);
            attachments.push({ url: urlData.publicUrl, name: file.name, mime: file.type });
          } else if (error) {
             console.error("Chat File upload failed:", error.message);
          }
        } catch (e) {
          console.error("File upload failed:", e);
        }
      }
    }

    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
        attachments,
        status: 'sent'
      }).select().single();

      return { data, error };
    } catch (e) {
      return { error: e };
    }
  };

  return { messages, loading, hasMore, fetchMessages, sendMessage };
}
