
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Send, ShoppingBag, MoreHorizontal, UserCheck, UserPlus, Star } from 'lucide-react';
import { Post, OrderStatus } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { toggleLike, createOrderFromAction } from '../services/facesService';
import { useToast } from '../providers/ToastProvider';

interface FacesPostProps {
  post: Post;
  onPostAction?: (post: Post) => void;
}

const FacesPost: React.FC<FacesPostProps> = ({ post, onPostAction }) => {
  const { userUuid } = useAuth();
  const { addToast } = useToast();
  const [isLiked, setIsLiked] = useState(false); // Should be initial state from DB
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isOrdering, setIsOrdering] = useState(false);

  const handleLike = async () => {
    if (!userUuid) {
      addToast("Please login to like posts.", "info");
      return;
    }
    try {
      const liked = await toggleLike(post.id, userUuid);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommerceAction = async () => {
    if (!userUuid) {
      addToast("Please login to place orders.", "info");
      return;
    }
    
    setIsOrdering(true);
    try {
      const orderId = await createOrderFromAction(post.id, userUuid);
      
      // Paystack Flow
      const paystack = (window as any).PaystackPop;
      if (paystack) {
        paystack.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: post.author?.email || 'customer@findaba.com.ng',
          amount: (post.price || 0) * 100, // Paystack uses kobo
          currency: 'NGN',
          metadata: {
            order_id: orderId,
            user_id: userUuid,
            post_id: post.id
          },
          callback: (response: any) => {
            addToast(`Payment Authorized! Ref: ${response.reference}. System syncing...`, "success");
            onPostAction?.(post);
          },
          onClose: () => {
            addToast("Payment window closed.", "info");
          }
        }).openIframe();
      } else {
        addToast(`Order generated: ${post.action_label}. Manual payment required.`, "success");
      }
      
      onPostAction?.(post);
    } catch (e: any) {
      addToast(e.message || "Failed to create order.", "error");
    } finally {
      setIsOrdering(false);
    }
  };

  const isVerified = post.author?.role === 'verified_business' || post.author?.role === 'admin';

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
              <h4 className="text-sm font-bold tracking-tight text-white">{post.author?.full_name || post.author?.username || 'FindAba Artisan'}</h4>
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

      {/* Main Content */}
      <div className="px-4 pb-4">
        <p className="text-sm text-slate-200 leading-relaxed tracking-tight mb-4">
          {post.content}
        </p>
        
        {post.media_url && (
          <div className="rounded-2xl overflow-hidden bg-black/20 aspect-square relative shadow-inner border border-white/5">
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img 
                src={post.media_url} 
                alt="Post Media"
                className="w-full h-full object-cover transition-standard group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* Commerce Overlay */}
            {post.action_type !== 'none' && (
              <div className="absolute bottom-4 left-4 right-4">
                <button 
                  onClick={handleCommerceAction}
                  disabled={isOrdering}
                  className="w-full h-14 bg-aba-gold/90 backdrop-blur-md text-aba-deep rounded-2xl flex items-center justify-between px-6 font-bold uppercase text-[12px] tracking-[0.2em] shadow-2xl hover:bg-aba-gold transition-all active:scale-95 group/action"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} />
                    <span>{post.action_label || 'Buy Now'}</span>
                  </div>
                  {post.price && (
                    <div className="flex items-center gap-2 bg-aba-deep/10 px-3 py-1.5 rounded-xl border border-aba-deep/5">
                      <span className="text-[10px] opacity-60">{post.currency || '₦'}</span>
                      <span>{post.price.toLocaleString()}</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-white/5 bg-slate-400/5">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 sm:gap-2 transition-standard hover:scale-110 ${isLiked ? 'text-aba-red' : 'text-white/40 hover:text-aba-red'}`}
          >
            <Heart size={18} className="sm:w-5 sm:h-5" fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-[10px] sm:text-xs font-bold">{likesCount}</span>
          </button>
          
          <button className="flex items-center gap-1.5 sm:gap-2 text-white/40 hover:text-aba-gold transition-standard hover:scale-110">
            <MessageSquare size={18} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-bold">{post.comments_count}</span>
          </button>

          <button className="text-white/40 hover:text-aba-green transition-standard hover:scale-110">
            <Send size={20} />
          </button>
        </div>

        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-aba-deep bg-aba-deep overflow-hidden">
               <img src={`https://picsum.photos/seed/face${i}/50/50`} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="w-6 h-6 rounded-full border-2 border-aba-deep bg-aba-gold/20 flex items-center justify-center text-[10px] font-bold text-aba-gold">
            +5
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FacesPost;
