
import { supabase } from '../lib/supabaseClient';
import { Post, Comment, Like, Story, Wallet, Transaction, PostActionType } from '../types';

/**
 * FEED & POSTS
 */
export const fetchPosts = async (limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_user_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[Faces] Fetch Posts Error:", error.message);
    throw error;
  }
  return data as Post[];
};

export const createPost = async (post: Partial<Post>) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error("[Faces] Create Post Error:", error.message);
    throw error;
  }
  return data as Post;
};

/**
 * LIKES
 */
export const toggleLike = async (postId: string, userId: string) => {
  // Check if like exists
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existingLike) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);
    if (error) throw error;
    return false; // Unliked
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    return true; // Liked
  }
};

/**
 * COMMENTS
 */
export const fetchComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_user_id_fkey(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      *,
      author:profiles!comments_user_id_fkey(*)
    `)
    .single();

  if (error) throw error;
  return data as Comment;
};

/**
 * STORIES
 */
export const fetchStories = async () => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      author:profiles!stories_user_id_fkey(*)
    `)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Story[];
};

export const createStory = async (story: Partial<Story>) => {
  // Stories expire in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('stories')
    .insert({ ...story, expires_at: expiresAt })
    .select()
    .single();

  if (error) throw error;
  return data as Story;
};

/**
 * WALLET & COMMERCE
 */
export const fetchWallet = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Wallet doesn't exist, create one
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0, currency: 'NGN' })
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
 * ACTIONABLE SYSTEM: RPC CALLS
 */
export const createOrderFromAction = async (postId: string, buyerId: string) => {
  const { data, error } = await supabase.rpc('create_order', {
    p_post_id: postId,
    p_buyer_id: buyerId
  });

  if (error) {
    console.error("[Commerce] RPC create_order Error:", error.message);
    throw error;
  }
  return data; // Returns order_id
};

export const completePayment = async (orderId: string, reference: string) => {
  const { data, error } = await supabase.rpc('complete_order_payment', {
    p_order_id: orderId,
    p_reference: reference
  });

  if (error) {
    console.error("[Commerce] RPC complete_order_payment Error:", error.message);
    throw error;
  }
  return data;
};

/**
 * PROFILE
 */
export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const releaseEscrow = async (orderId: string) => {
  const { data, error } = await supabase.rpc('release_escrow', {
    p_order_id: orderId
  });

  if (error) {
    console.error("[Commerce] RPC release_escrow Error:", error.message);
    throw error;
  }
  return data;
};

export const toggleFollow = async (followerId: string, followingId: string) => {
  const { data: existing } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    await supabase.from('followers').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId });
    return true;
  }
};
