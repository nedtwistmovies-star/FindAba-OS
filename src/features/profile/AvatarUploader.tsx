import { useState } from "react";
import { uploadAvatar } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

export default function AvatarUploader({ user }: any) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      const url = await uploadAvatar(user.id, file);

      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);

      alert("Avatar updated");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <input type="file" onChange={handleUpload} />
      {loading && <p>Uploading...</p>}
    </div>
  );
}
