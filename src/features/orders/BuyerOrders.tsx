import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BuyerActions from "./BuyerActions";

export default function BuyerOrders({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
  };

  return (
    <div className="p-4">
      <h2>My Orders</h2>

      {orders.map((order) => (
        <div key={order.id} className="border p-3 mt-3">
          <p>₦{order.amount}</p>
          <p>{order.delivery_status}</p>

          <BuyerActions order={order} />
        </div>
      ))}
    </div>
  );
}
