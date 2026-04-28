import { useEffect, useState } from "react";
import {
  subscribeToPosts,
  subscribeToLikes,
  subscribeToComments,
} from "../lib/realtime";

import { supabase } from "../lib/supabase";
import { supabase } from "../lib/supabase";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(avatar_url, name)")
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  return (
    <div className="max-w-md mx-auto">
      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img
              src={post.profiles?.avatar_url}
              className="w-8 h-8 rounded-full"
            />
            <span>{post.profiles?.name}</span>
          </div>

          <p className="mt-2">{post.content}</p>

          {post.media_url && (
            <img src={post.media_url} className="mt-2 w-full rounded-lg" />
          )}
        </div>
      ))}
    </div>
  );
    }
