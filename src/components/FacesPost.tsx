
import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Send, ShoppingBag, MoreHorizontal, Star, Trash2, Loader2, SendHorizontal, Edit3, Flag, Share2, AlertCircle } from 'lucide-react';
import { Post, OrderStatus, Comment } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { toggleLike, createOrderFromAction, fetchComments, addComment, deletePost } from '../services/facesService';
import { useToast } from '../providers/ToastProvider';

interface FacesPostProps {
  post: Post;
  onPostAction?: (post: Post) => void;
}

const FacesPostComponent: React.FC<FacesPostProps> = ({ post, onPostAction }) => {
  const { user_id } = useAuth();
  const { addToast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentInputRef = React.useRef<HTMLInputElement>(null);

  // Initial like state check
  useEffect(() => {
    if (user_id) {
      import('../lib/supabaseClient').then(({ supabase }) => {
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user_id)
          .single()
          .then(({ data }: { data: any }) => setIsLiked(!!data));
      });
    }
  }, [post.id, user_id]);

  const handleLike = async () => {
    if (!user_id) {
      addToast("Please login to like posts.", "info");
      return;
    }
    
    // Optimistic Update
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);

    try {
      const liked = await toggleLike(post.id, user_id);
      // Synchronize with server response if needed (already optimistic above)
      if (liked !== !prevLiked) {
         setIsLiked(liked);
         setLikesCount(prev => liked ? prev + 1 : prev - 1);
      }
    } catch (e) {
      // Revert on error
      setIsLiked(prevLiked);
      setLikesCount(prev => prevLiked ? prev + 1 : prev - 1);
      addToast("Connection to social mesh lost.", "error");
    }
  };

  const handleFetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data);
    } catch (e) {
      addToast("Failed to fetch comments.", "error");
    } finally {
      setLoadingComments(false);
      if (!showComments) {
        setTimeout(() => commentInputRef.current?.focus(), 100);
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently remove this industrial record from the social mesh?")) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      addToast("Post decommissioned successfully.", "success");
      // Ideally trigger a refresh in parent, but for now we hide it optimistically
      onPostAction?.(post); // Reusing this to notify parent
    } catch (e) {
      addToast("Failed to delete post.", "error");
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user_id) return;
    setSubmittingComment(true);
    try {
      const comment = await addComment(post.id, user_id, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (e) {
      addToast("Failed to post comment.", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommerceAction = async () => {
    if (!user_id) {
      addToast("Please login to place orders.", "info");
      return;
    }
    
    setIsOrdering(true);
    try {
      const orderId = await createOrderFromAction(post.id, user_id);
      
      const paystack = (window as any).PaystackPop;
      if (paystack) {
        paystack.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: post.author?.email || 'customer@findaba.com.ng',
          amount: (post.price || 0) * 100,
          currency: 'NGN',
          metadata: {
            order_id: orderId,
            user_id: user_id,
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-8 group hover:shadow-aba-gold/5 transition-all duration-300"
      role="article"
      aria-label={`Post by ${post.author?.full_name || 'Artisan'}`}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl p-0.5 bg-aba-gold/20 border border-aba-gold/10">
            <img 
              src={post.author?.avatar_url || `https://picsum.photos/seed/${post.user_id}/100/100`} 
              alt=""
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight text-white">{post.author?.full_name || post.author?.username || 'FindAba Artisan'}</h4>
              {isVerified && <Star size={12} fill="var(--aba-gold)" className="text-aba-gold" aria-hidden="true" />}
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            aria-label="Post options"
            className={`p-2 rounded-xl transition-all ${showOptions ? 'bg-white/10 text-aba-gold' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <MoreHorizontal size={20} />
          </button>

          <AnimatePresence>
            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOptions(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-aba-deep border border-white/10 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden backdrop-blur-xl"
                >
                  {user_id === post.user_id ? (
                    <>
                      <button 
                        onClick={() => { addToast("Edit mode coming soon.", "info"); setShowOptions(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                      >
                        <Edit3 size={14} /> Edit Signal
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full px-4 py-3 flex items-center gap-3 text-xs font-bold text-aba-red hover:bg-aba-red/5 transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                        Delete Record
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { addToast("Signal reported to Oracle.", "success"); setShowOptions(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-xs font-bold text-white/60 hover:text-aba-red hover:bg-aba-red/5 transition-all uppercase tracking-widest"
                      >
                        <AlertCircle size={14} /> Report Node
                      </button>
                    </>
                  )}
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(window.location.origin + "/feed?post=" + post.id);
                      addToast("Link copied.", "success");
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                  >
                    <Share2 size={14} /> Copy Signal ID
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4">
        <p className="text-sm text-slate-200 leading-relaxed tracking-tight mb-4">
          {post.content}
        </p>
        
        {post.media_url && (
          <div className="rounded-2xl overflow-hidden bg-black/20 aspect-video relative shadow-inner border border-white/5">
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                className="w-full h-full object-cover"
                controls
                preload="none"
                poster={post.media_url + "?thumb=true"}
              />
            ) : (
              <img 
                src={post.media_url} 
                alt="Post Media"
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
            
            {/* Commerce Overlay */}
            {post.action_type !== 'none' && (
              <div className="absolute bottom-4 left-4 right-4">
                <button 
                  onClick={handleCommerceAction}
                  disabled={isOrdering}
                  className="w-full h-14 bg-aba-gold/90 backdrop-blur-md text-aba-deep rounded-2xl flex items-center justify-between px-6 font-bold uppercase text-[12px] tracking-[0.2em] shadow-2xl hover:bg-aba-gold transition-all active:scale-95 group/action disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} />
                    <span>{post.action_label || 'Buy Now'}</span>
                  </div>
                  {post.price && (
                    <div className="flex items-center gap-2 bg-aba-deep/10 px-3 py-1.5 rounded-xl border border-aba-deep/5">
                      <span className="text-[10px] opacity-60">₦</span>
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
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center justify-between border-t border-white/5 bg-white/[0.02] gap-y-4">
        <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide">
          <button 
            onClick={handleLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
            className={`group flex items-center gap-2 sm:gap-2.5 transition-all outline-none ${isLiked ? 'text-aba-red' : 'text-white/40 hover:text-aba-red'}`}
          >
            <motion.div whileTap={{ scale: 1.5 }}>
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className="sm:w-[20px] sm:h-[20px] transition-transform group-hover:scale-110" />
            </motion.div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{likesCount > 0 ? likesCount : 'Like'}</span>
          </button>
          
          <button 
            onClick={handleFetchComments}
            aria-label="View comments"
            className={`flex items-center gap-2 sm:gap-2.5 transition-all group outline-none ${showComments ? 'text-aba-gold' : 'text-white/40 hover:text-aba-gold'}`}
          >
            <MessageSquare size={18} className="sm:w-[20px] sm:h-[20px] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{post.comments_count || comments.length > 0 ? (post.comments_count || comments.length) : 'Comment'}</span>
          </button>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + "/feed?post=" + post.id);
              addToast("Signal link copied to clipboard.", "success");
            }}
            aria-label="Share post"
            className="flex items-center gap-2 text-white/40 hover:text-aba-green transition-all group outline-none"
          >
            <Send size={18} className="sm:w-[20px] sm:h-[20px] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Share</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex -space-x-1.5 sm:-space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-aba-deep bg-aba-deep overflow-hidden">
                 <img src={`https://picsum.photos/seed/face${i}/50/50`} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
          <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Viewed by community</span>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div 
                role="log" 
                aria-live="polite"
                className="max-h-64 overflow-y-auto space-y-4 pr-2 scrollbar-hide"
              >
                {loadingComments ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-aba-gold" /></div>
                ) : comments.length > 0 ? (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 animate-slide-right">
                      <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden shrink-0">
                        <img src={c.author?.avatar_url || `https://picsum.photos/seed/${c.user_id}/100/100`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl p-3 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-aba-gold">{c.author?.full_name || 'Artisan'}</span>
                          <span className="text-[8px] opacity-30">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/80 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[10px] uppercase font-black tracking-widest opacity-20 py-8">No signals recorded yet.</p>
                )}
              </div>

              {user_id && (
                <div className="flex gap-2 sm:gap-3 pt-2">
                  <input 
                    ref={commentInputRef}
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !submittingComment && handleSubmitComment()}
                    placeholder="Enter signal response..."
                    disabled={submittingComment}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs text-white outline-none focus:border-aba-gold/50 transition-all placeholder:text-white/20"
                  />
                  <button 
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="p-3 sm:p-4 bg-aba-gold text-aba-deep rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 hover:bg-white"
                  >
                    {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={18} className="sm:w-5 sm:h-5 text-aba-deep" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FacesPost = memo(FacesPostComponent);
