import { useEffect, useState } from "react";
import {
  subscribeToPosts,
  subscribeToLikes,
  subscribeToComments,
} from "../lib/realtime";
import { supabase } from "../lib/supabase";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});

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

    // ✅ INIT LIKE COUNTS
    const likeCounts: Record<string, number> = {};
    (data || []).forEach((post: any) => {
      likeCounts[post.id] = post.likes_count || 0;
    });

    setLikesMap(likeCounts);
  };

  // ❤️ LIKE ACTION
  const handleLike = async (postId: string) => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return;

    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);

      setLikesMap((prev) => ({
        ...prev,
        [postId]: Math.max((prev[postId] || 1) - 1, 0),
      }));
    } else {
      await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      setLikesMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    }
  };

  // 🚀 INITIAL LOAD
  useEffect(() => {
    loadPosts();
  }, []);

  // ⚡ REALTIME (OPTIMIZED)
  useEffect(() => {
    let postChannel: any;
    let likeChannel: any;
    let commentChannel: any;

    const initRealtime = async () => {
      // POSTS → reload feed
      postChannel = subscribeToPosts(loadPosts);

      // LIKES → update count only (no reload)
      likeChannel = subscribeToLikes((payload: any) => {
        const postId =
          payload.new?.post_id || payload.old?.post_id;

        setLikesMap((prev) => ({
          ...prev,
          [postId]:
            (prev[postId] || 0) +
            (payload.eventType === "INSERT" ? 1 : -1),
        }));
      });

      // COMMENTS → optional reload
      commentChannel = subscribeToComments(loadPosts);
    };

    initRealtime();

    return () => {
      if (postChannel) supabase.removeChannel(postChannel);
      if (likeChannel) supabase.removeChannel(likeChannel);
      if (commentChannel) supabase.removeChannel(commentChannel);
    };
  }, []);

  // 🎨 UI
  return (
    <div className="max-w-md mx-auto">
      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b">

          {/* 👤 AUTHOR */}
          <div className="flex items-center gap-2">
            <img
              src={post.author?.avatar_url || "/default-avatar.png"}
              className="w-8 h-8 rounded-full"
            />

            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">
                {post.author?.full_name || post.author?.username}
              </span>

              {(post.author?.role === "verified_business" ||
                post.author?.role === "admin") && (
                <span className="text-blue-500 text-xs">✔</span>
              )}
            </div>

            {post.author?.business_name && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {post.author.business_name}
              </span>
            )}
          </div>

          {/* 📝 CONTENT */}
          <p className="mt-2">{post.content}</p>

          {/* 🖼 MEDIA */}
          {post.media_url && (
            <img
              src={post.media_url}
              className="mt-2 w-full rounded-lg"
            />
          )}

          {/* ❤️ LIKE */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleLike(post.id)}
              className="text-sm text-gray-600 hover:text-red-500"
            >
              ❤️ {likesMap[post.id] || 0}
            </button>
          </div>

        </div>
      ))}
    </div>
  );
  }
