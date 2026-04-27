import { supabase } from "../../lib/supabase";

export default function SellerDeliveryControl({ order }: any) {
  const markShipped = async () => {
    await supabase
      .from("orders")
      .update({ delivery_status: "shipped" })
      .eq("id", order.id);

    alert("Marked as shipped");
  };

  const markDelivered = async () => {
    await supabase
      .from("orders")
      .update({
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    alert("Marked as delivered");
  };

  return (
    <div className="flex gap-2 mt-3">
      <button onClick={markShipped} className="bg-blue-500 text-white p-2">
        Mark Shipped
      </button>

      <button onClick={markDelivered} className="bg-green-600 text-white p-2">
        Mark Delivered
      </button>
    </div>
  );
}
