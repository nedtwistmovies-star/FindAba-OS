import { supabase } from "../../lib/supabase";

export default function ProductDetails({ product, user }: any) {
  const createOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .insert({
        post_id: product.id,
        buyer_id: user.id,
        seller_id: product.user_id,
        amount: product.price,
        status: "pending",
      })
      .select()
      .single();

    // redirect to payment page
    window.location.href = `/pay/${data.id}`;
  };

  return (
    <div className="p-4">
      <img src={product.image_urls?.[0]} className="w-full rounded" />

      <h2 className="text-lg font-bold mt-2">{product.name}</h2>
      <p>₦{product.price}</p>

      <button
        onClick={createOrder}
        className="bg-black text-white w-full p-3 mt-4"
      >
        Buy Now
      </button>
    </div>
  );
}
