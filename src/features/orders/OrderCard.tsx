export default function OrderCard({ order, user }: any) {
  return (
    <div className="border p-3 rounded">
      <p>Status: {order.status}</p>
      <p>Delivery: {order.delivery_status}</p>

      {order.delivery_status === "shipped" && (
        <p className="text-blue-500">On the way 🚚</p>
      )}

      {order.delivery_status === "delivered" && (
        <p className="text-green-600">Delivered ✅</p>
      )}
    </div>
  );
}
