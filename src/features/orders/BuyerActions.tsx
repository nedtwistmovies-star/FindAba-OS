import { supabase } from "../../lib/supabase";

export default function BuyerActions({ order }: any) {
  const confirmDelivery = async () => {
    await supabase.rpc("release_escrow", {
      p_order_id: order.id,
    });

    alert("Order completed, seller paid");
  };

  const raiseDispute = async () => {
    await supabase.rpc("create_dispute", {
      p_order_id: order.id,
      p_reason: "Item not as described",
    });

    alert("Dispute raised");
  };

  return (
    <div className="flex flex-col gap-2 mt-3">
      <button
        onClick={confirmDelivery}
        className="bg-black text-white p-2"
      >
        Confirm Delivery
      </button>

      <button
        onClick={raiseDispute}
        className="bg-red-600 text-white p-2"
      >
        Raise Dispute
      </button>
    </div>
  );
      }
