import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { subscribeToOrders } from "../lib/realtime";
import { notify } from "../lib/notifications";

export default function OrdersPage({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const channel = subscribeToOrders(user.id, (newOrder: any) => {

      // 🔔 NOTIFICATIONS
      notify("Order updated!");

      if (newOrder.delivery_status === "shipped") {
        notify("Your order is on the way 🚚");
      }

      if (newOrder.delivery_status === "delivered") {
        notify("Order delivered ✅");
      }

      // 🔄 UPDATE UI
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === newOrder.id);

        if (exists) {
          return prev.map((o) =>
            o.id === newOrder.id ? newOrder : o
          );
        }

        return [newOrder, ...prev];
      });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  return (
    <div className="p-4">
      <h2 className="font-bold text-lg">My Orders</h2>

      {orders.map((o) => (
        <div key={o.id} className="border p-3 mt-2">
          <p>Status: {o.status}</p>
          <p>Delivery: {o.delivery_status}</p>
        </div>
      ))}
    </div>
  );
}
