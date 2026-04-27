import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { subscribeToOrders } from "../../lib/realtime";
import { notify } from "../../lib/notifications";

export default function SellerOrders({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();

    const channel = subscribeToOrders(user.id, (order: any) => {
      if (order.seller_id !== user.id) return;

      notify("New sale!");

      setOrders((prev) => {
        const exists = prev.find((o) => o.id === order.id);

        if (exists) {
          return prev.map((o) =>
            o.id === order.id ? order : o
          );
        }

        return [order, ...prev];
      });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
  };

  return (
    <div>
      {orders.map((o) => (
        <div key={o.id} className="border p-3 mb-2">
          <p>₦{o.amount}</p>
          <p>Status: {o.status}</p>
          <p>Delivery: {o.delivery_status}</p>
        </div>
      ))}
    </div>
  );
        }
