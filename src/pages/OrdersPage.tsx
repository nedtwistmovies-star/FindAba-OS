import { useState } from "react";
import BuyerOrders from "../features/orders/BuyerOrders";
import SellerOrders from "../features/orders/SellerOrders";

export default function OrdersPage({ user }: any) {
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");

  return (
    <div className="p-3">
      {/* TABS */}
      <div className="flex mb-4">
        <button
          onClick={() => setTab("buyer")}
          className={`flex-1 p-2 ${
            tab === "buyer" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          My Orders
        </button>

        <button
          onClick={() => setTab("seller")}
          className={`flex-1 p-2 ${
            tab === "seller" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Sales
        </button>
      </div>

      {/* CONTENT */}
      {tab === "buyer" && <BuyerOrders user={user} />}
      {tab === "seller" && <SellerOrders user={user} />}
    </div>
  );
}
