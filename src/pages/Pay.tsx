export default function Pay({ orderId }: any) {
  const pay = () => {
    const handler = (window as any).PaystackPop.setup({
      key: "YOUR_PUBLIC_KEY",
      email: "user@email.com",
      amount: 5000 * 100,
      ref: Date.now().toString(),
      metadata: {
        order_id: orderId,
      },
      callback: function () {
        alert("Payment processing...");
      },
    });

    handler.openIframe();
  };

  return (
    <div className="p-4">
      <button onClick={pay} className="bg-green-600 text-white p-3 w-full">
        Pay Now
      </button>
    </div>
  );
}
