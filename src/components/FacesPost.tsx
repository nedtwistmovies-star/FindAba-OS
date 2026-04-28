import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageSquare, Send, ShoppingBag, MoreHorizontal, Star } from 'lucide-react';
import { Post } from '../types';
import { supabase } from '../lib/supabase';
import { toggleLike, createOrderFromAction } from '../services/facesService';
import { useToast } from '../providers/ToastProvider';

interface FacesPostProps {
  post: Post;
  onPostAction?: (post: Post) => void;
}

const FacesPost: React.FC<FacesPostProps> = ({ post, onPostAction }) => {
  const { addToast } = useToast();

  // ✅ NEW: Supabase user ID
  const [userId, setUserId] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isOrdering, setIsOrdering] = useState(false);

  // ✅ Get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // ❤️ LIKE
  const handleLike = async () => {
    if (!userId) {
      addToast("Please login to like posts.", "info");
      return;
    }

    try {
      const liked = await toggleLike(post.id, userId);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch (e) {
      console.error(e);
      addToast("Failed to like post.", "error");
    }
  };

  // 🛒 ORDER / BUY
  const handleCommerceAction = async () => {
    if (!userId) {
      addToast("Please login to place orders.", "info");
      return;
    }

    setIsOrdering(true);

    try {
      const orderId = await createOrderFromAction(post.id, userId);

      const paystack = (window as any).PaystackPop;

      if (paystack) {
        paystack.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: post.author?.email || 'customer@findaba.com.ng',
          amount: (post.price || 0) * 100,
          currency: 'NGN',
          metadata: {
            order_id: orderId,
            user_id: userId, // ✅ FIXED
            post_id: post.id
          },
          callback: (response: any) => {
            addToast(`Payment Authorized! Ref: ${response.reference}`, "success");
            onPostAction?.(post);
          },
          onClose: () => {
            addToast("Payment window closed.", "info");
          }
        }).openIframe();
      } else {
        addToast("Order created. Manual payment required.", "success");
      }

      onPostAction?.(post);

    } catch (e: any) {
      addToast(e.message || "Failed to create order.", "error");
    } finally {
      setIsOrdering(false);
    }
  };

  const isVerified =
    post.author?.role === 'verified_business' ||
    post.author?.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-8 group"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl p-0.5 bg-aba-gold/20 border border-aba-gold/10">
            <img
              src={post.author?.avatar_url || `https://picsum.photos/seed/${post.author_id}/100/100`}
              alt="Author"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight text-white">
                {post.author?.full_name || post.author?.username || 'FindAba Artisan'}
              </h4>
              {isVerified && <Star size={12} fill="var(--aba-gold)" className="text-aba-gold" />}
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="p-2 text-white/40 hover:text-white transition-standard">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-sm text-slate-200 leading-relaxed tracking-tight mb-4">
          {post.content}
        </p>

        {post.media_url && (
          <div className="rounded-2xl overflow-hidden bg-black/20 aspect-square relative shadow-inner border border-white/5">
            {post.media_type === 'video' ? (
              <video src={post.media_url} className="w-full h-full object-cover" controls />
            ) : (
              <img
                src={post.media_url}
                alt="Post Media"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Commerce */}
            {post.action_type !== 'none' && (
              <div className="absolute bottom-4 left-4 right-4">
                <button
                  onClick={handleCommerceAction}
                  disabled={isOrdering}
                  className="w-full h-14 bg-aba-gold/90 text-aba-deep rounded-2xl flex items-center justify-between px-6 font-bold"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} />
                    <span>{post.action_label || 'Buy Now'}</span>
                  </div>

                  {post.price && (
                    <span>{post.currency || '₦'}{post.price.toLocaleString()}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={isLiked ? 'text-red-500' : 'text-white/40'}>
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            {likesCount}
          </button>

          <button onClick={() => addToast("Comments coming soon", "info")}>
            <MessageSquare size={18} />
          </button>

          <button onClick={() => addToast("Link copied", "success")}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FacesPost;
