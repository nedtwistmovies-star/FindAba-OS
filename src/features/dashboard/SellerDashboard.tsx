import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import SellerDeliveryControl from "../orders/SellerDeliveryControl";

export default function SellerDashboard({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Seller Dashboard</h2>

      {orders.map((order) => (
        <div key={order.id} className="border p-3 mt-3">
          <p>Amount: ₦{order.amount}</p>
          <p>Status: {order.status}</p>
          <p>Delivery: {order.delivery_status}</p>

          <SellerDeliveryControl order={order} />
        </div>
      ))}
    </div>
  );
             }
