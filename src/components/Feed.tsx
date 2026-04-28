import { useEffect, useState } from "react";
import {
  subscribeToPosts,
  subscribeToLikes,
  subscribeToComments,
} from "../lib/realtime";
import { supabase } from "../lib/supabase";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);

  // 🔄 LOAD POSTS
  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, author:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPosts(data || []);
  };

  // 🚀 INITIAL LOAD
  useEffect(() => {
    loadPosts();
  }, []);

  // ⚡ REALTIME SUBSCRIPTIONS
  useEffect(() => {
    let postChannel: any;
    let likeChannel: any;
    let commentChannel: any;

    const initRealtime = async () => {
      postChannel = subscribeToPosts(loadPosts);
      likeChannel = subscribeToLikes(loadPosts);
      commentChannel = subscribeToComments(loadPosts);
    };

    initRealtime();

    return () => {
      if (postChannel) supabase.removeChannel(postChannel);
      if (likeChannel) supabase.removeChannel(likeChannel);
      if (commentChannel) supabase.removeChannel(commentChannel);
    };
  }, []);

  // 🎨 UI (FIXED)
  return (
    <div className="max-w-md mx-auto">
      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b">

          {/* 👇 AUTHOR */}
          <div className="flex items-center gap-2">
            <img
              src={post.author?.avatar_url || "/default-avatar.png"}
              className="w-8 h-8 rounded-full"
            />
            <span>
              {post.author?.full_name ||
                post.author?.username ||
                "User"}
            </span>
          </div>

          {/* 👇 CONTENT */}
          <p className="mt-2">{post.content}</p>

          {/* 👇 MEDIA */}
          {post.media_url && (
            <img
              src={post.media_url}
              className="mt-2 w-full rounded-lg"
            />
          )}
        </div>
      ))}
    </div>
  );
}
