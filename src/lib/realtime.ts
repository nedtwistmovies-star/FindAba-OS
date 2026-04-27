import { supabase } from "./supabase";

export function subscribeToOrders(userId: string, callback: any) {
  return supabase
    .channel("orders-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const order = payload.new;

        if (
          order?.buyer_id === userId ||
          order?.seller_id === userId
        ) {
          callback(order);
        }
      }
    )
    .subscribe();
}
