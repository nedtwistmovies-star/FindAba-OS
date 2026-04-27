import { supabase } from "./supabase";

export function subscribeToOrders(userId: string, onCount: (n: number) => void) {
  let count = 0;

  const channel = supabase
    .channel("orders-realtime")

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const order = payload.new;

        if (order.seller_id === userId) {
          count++;
          onCount(count);
        }
      }
    )

    .subscribe();

  return channel;
}


export function subscribeToMessages(userId: string, onCount: (n: number) => void) {
  let count = 0;

  const channel = supabase
    .channel("messages-realtime")

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;

        if (msg.receiver_id === userId) {
          count++;
          onCount(count);
        }
      }
    )

    .subscribe();

  return channel;
}


// =========================
// CHAT REALTIME
// =========================
export function subscribeToMessages(userId: string) {
  const channel = supabase
    .channel("messages-realtime")

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;

        if (msg.receiver_id === userId) {
          notify("💬 New message");
        }
      }
    )

    .subscribe();

  return channel;
}
