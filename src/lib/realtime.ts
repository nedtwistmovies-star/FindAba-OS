import { supabase } from "./supabase";

/**
 * =========================
 * REALTIME: POSTS
 * =========================
 */
export const subscribeToPosts = (onChange: (payload: any) => void) => {
  const channel = supabase
    .channel("realtime:posts")
    .on(
      "postgres_changes",
      {
        event: "*", // INSERT | UPDATE | DELETE
        schema: "public",
        table: "posts",
      },
      (payload: any) => {
        console.log("[Realtime] Posts:", payload);
        onChange(payload);
      }
    )
    .subscribe();

  return channel;
};

/**
 * =========================
 * REALTIME: LIKES
 * =========================
 */
export const subscribeToLikes = (onChange: (payload: any) => void) => {
  const channel = supabase
    .channel("realtime:likes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "likes",
      },
      (payload: any) => {
        console.log("[Realtime] Likes:", payload);
        onChange(payload);
      }
    )
    .subscribe();

  return channel;
};

/**
 * =========================
 * REALTIME: COMMENTS
 * =========================
 */
export const subscribeToComments = (onChange: (payload: any) => void) => {
  const channel = supabase
    .channel("realtime:comments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
      },
      (payload: any) => {
        console.log("[Realtime] Comments:", payload);
        onChange(payload);
      }
    )
    .subscribe();

  return channel;
};

/**
 * =========================
 * REALTIME: ORDERS
 * =========================
 */
export const subscribeToOrders = (userId: string, onChange: (payload: any) => void) => {
  const channel = supabase
    .channel(`realtime:orders:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      (payload: any) => {
        console.log("[Realtime] Orders:", payload);
        onChange(payload.new || payload);
      }
    )
    .subscribe();

  return channel;
};
