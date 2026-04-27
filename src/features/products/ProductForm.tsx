import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadProductImage } from "../../lib/storage";

export default function ProductForm({ user }: any) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const createProduct = async () => {
    try {
      // 1. Create product
      const { data: product } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name,
          price: Number(price),
        })
        .select()
        .single();

      // 2. Upload images
      const urls: string[] = [];

      for (const file of files) {
        const path = `products/${user.id}/${product.id}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from("findaba")
          .upload(path, file);

        if (error) throw error;

        const { data } = supabase.storage
          .from("findaba")
          .getPublicUrl(path);

        urls.push(data.publicUrl);
      }

      // 3. Save images
      await supabase
        .from("products")
        .update({ image_urls: urls })
        .eq("id", product.id);

      alert("Product created");
    } catch (err) {
      console.error(err);
      alert("Error creating product");
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <input
        placeholder="Product name"
        className="border p-2"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Price"
        type="number"
        className="border p-2"
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        type="file"
        multiple
        onChange={(e) =>
          setFiles(Array.from(e.target.files || []))
        }
      />

      <button onClick={createProduct} className="bg-black text-white p-2">
        Create Product
      </button>
    </div>
  );
}
