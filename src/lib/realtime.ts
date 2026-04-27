import { supabase } from "./supabase";
import { notify } from "./toast";

// =========================
// ORDERS REALTIME
// =========================
export function subscribeToOrders(userId: string) {
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

        // 🟢 Seller gets new order
        if (order.seller_id === userId) {
          notify("🛒 New order received!");
        }
      }
    )

    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const order = payload.new;

        // 🔵 Buyer gets updates
        if (order.buyer_id === userId) {
          notify(`📦 Order ${order.delivery_status}`);
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
