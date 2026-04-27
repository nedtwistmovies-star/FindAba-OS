import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ChatBox({ user, orderId, otherUser }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new;

          if (msg.order_id === orderId) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at");

    setMessages(data || []);
  };

  const sendMessage = async () => {
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: otherUser,
      order_id: orderId,
      message: text,
    });

    setText("");
  };

  return (
    <div className="p-3">
      <div className="h-64 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id}>
            <p>{m.message}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={sendMessage} className="bg-black text-white p-2">
          Send
        </button>
      </div>
    </div>
  );
        }
