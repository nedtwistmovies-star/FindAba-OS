import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadPostMedia } from "../../lib/storage";

export default function PostCreator({ user }: any) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const createPost = async () => {
    try {
      // 1. Create post
      const { data: post } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: text,
        })
        .select()
        .single();

      // 2. Upload media
      let mediaUrl = null;

      if (file) {
        mediaUrl = await uploadPostMedia(user.id, post.id, file);

        await supabase
          .from("posts")
          .update({ media_url: mediaUrl })
          .eq("id", post.id);
      }

      alert("Post created");
      setText("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <textarea
        className="w-full border p-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something..."
      />

      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <button className="bg-black text-white p-2" onClick={createPost}>
        Post
      </button>
    </div>
  );
}
