import { supabase } from '../lib/supabase';
import { Post, Comment, Story, Wallet, Transaction } from '../types';

/**
 * =========================
 * FEED & POSTS
 * =========================
 */
export const fetchPosts = async (limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[Faces] Fetch Posts Error:", error.message);
    throw error;
  }

  return data as Post[];
};

export const createPost = async (post: Partial<Post>, userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...post,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[Faces] Create Post Error:", error.message);
    throw error;
  }

  return data as Post;
};

/**
 * =========================
 * LIKES
 * =========================
 */
export const toggleLike = async (postId: string, userId: string) => {
  const { data: existing, error: checkError } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) {
    console.error("[Faces] Like Check Error:", checkError.message);
    throw checkError;
  }

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('likes')
    .insert({
      post_id: postId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;

  return true;
};

/**
 * =========================
 * COMMENTS
 * =========================
 */
export const fetchComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
};

export const addComment = async (
  postId: string,
  userId: string,
  content: string
) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    })
    .select(`
      *,
      author:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data as Comment;
};

/**
 * =========================
 * STORIES
 * =========================
 */
export const fetchStories = async () => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      author:profiles(*)
    `)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Story[];
};

export const createStory = async (story: Partial<Story>, userId: string) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('stories')
    .insert({
      ...story,
      user_id: userId,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Story;
};

/**
 * =========================
 * WALLET & TRANSACTIONS
 * =========================
 */
export const fetchWallet = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!data) {
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        owner_id: userId,
        balance: 0,
        currency: 'NGN',
      })
      .select()
      .single();

    if (createError) throw createError;
    return newWallet as Wallet;
  }

  if (error) throw error;
  return data as Wallet;
};

export const fetchTransactions = async (walletId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
};

/**
 * =========================
 * COMMERCE (RPC SAFE MODE)
 * =========================
 */
export const createOrderFromAction = async (
  postId: string,
  buyerId: string
) => {
  const { data, error } = await supabase.rpc('create_order', {
    p_post_id: postId,
    p_buyer_id: buyerId,
  });

  if (error) {
    console.error("[Commerce] create_order Error:", error.message);
    throw error;
  }

  return data;
};

export const completePayment = async (
  orderId: string,
  reference: string
) => {
  const { data, error } = await supabase.rpc(
    'complete_order_payment',
    {
      p_order_id: orderId,
      p_reference: reference,
    }
  );

  if (error) {
    console.error("[Commerce] complete_payment Error:", error.message);
    throw error;
  }

  return data;
};

/**
 * =========================
 * PROFILE
 * =========================
 */
export const updateProfile = async (
  userId: string,
  updates: any
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleFollow = async (
  followerId: string,
  followingId: string
) => {
  const { data: existing } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('followers')
      .delete()
      .eq('id', existing.id);
    return false;
  } else {
    await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });
    return true;
  }
};
