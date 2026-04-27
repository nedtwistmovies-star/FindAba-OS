import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      {products.map((p) => (
        <div key={p.id} className="border p-2 rounded">
          <img
            src={p.image_urls?.[0]}
            className="w-full h-32 object-cover rounded"
          />

          <h3 className="text-sm mt-2">{p.name}</h3>
          <p className="font-bold">₦{p.price}</p>
        </div>
      ))}
    </div>
  );
}
