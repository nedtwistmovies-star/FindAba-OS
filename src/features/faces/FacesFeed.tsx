
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Plus, ShoppingBag, Search, Bell, History, X } from 'lucide-react';
import { Post, Story } from '../../types';
import { fetchPosts, fetchStories } from '../../services/facesService';
import StoriesBar from '../../components/StoriesBar';
import FacesPost from '../../components/FacesPost';
import { 
  SectionHeader, 
  NotificationCenter, 
  LoadingScreen 
} from '../../components';
import { PostUploader } from '../../components/PostUploader';
import { useAuth } from '../../providers/AuthProvider';
import { useOracle } from '../../providers/OracleProvider';
import { useToast } from '../../providers/ToastProvider';

const FacesFeed: React.FC = () => {
  const { userUuid } = useAuth();
  const { setIsOracleOpen } = useOracle();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostUploader, setShowPostUploader] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = async () => {
    if (!userUuid) return;
    try {
      const { fetchNotifications } = await import('../../services/supabaseService');
      const data = await fetchNotifications(userUuid);
      setNotifications(data);
    } catch (e) {
      console.warn("Notification fetch failed");
    }
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [postsData, storiesData] = await Promise.all([
        fetchPosts(),
        fetchStories()
      ]);
      setPosts(postsData);
      setStories(storiesData);
      fetchNotifs();
    } catch (e: any) {
      console.error("[Faces] Load Error:", e);
      addToast(e.message || "Signal synchronization failed.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !refreshing) {
    return <LoadingScreen message="Synchronizing Social Mesh..." />;
  }

  return (
    <div className="min-h-screen bg-aba-deep text-white pb-32">
      <div className="container-responsive py-4 sm:py-8 max-w-2xl mx-auto space-y-4 sm:space-y-8">
        {/* View Header */}
        <div className="px-2 sm:px-4">
          <SectionHeader 
            title="Faces" 
            subtitle="& Feed" 
            icon={Sparkles}
            className="mb-8 sm:mb-12"
            action={
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setShowNotificationCenter(true)}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-aba-gold hover:border-aba-gold transition-all relative"
                >
                  <Bell size={20} />
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-aba-red rounded-full" />
                </button>
                <button 
                  onClick={() => setIsOracleOpen(true)}
                  className="px-6 py-3 bg-aba-gold text-aba-deep rounded-2xl flex items-center gap-3 font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all"
                >
                  <Search size={18} />
                  <span>Oracle Search</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Stories */}
        <StoriesBar 
          stories={stories} 
          onAddStory={() => setShowPostUploader(true)} 
          onViewStory={(story) => addToast(`Initiating story node for ${story.author?.username || 'Artisan'}...`, "info")} 
        />

        {/* Create Post Button (Floating-ish inside feed) */}
        <div className="px-2 sm:px-4">
          <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-xl mb-4 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-aba-gold/10 overflow-hidden shrink-0 border border-aba-gold/20 shadow-inner">
               <img src={`https://picsum.photos/seed/${userUuid}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              className="flex-1 text-left px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-bold text-slate-400 hover:text-white transition-standard border border-white/5"
              onClick={() => setShowPostUploader(true)}
            >
              Workshop signal?
            </button>
            <button 
              className="p-3 sm:p-4 bg-aba-gold text-aba-deep rounded-xl sm:rounded-2xl hover:scale-105 transition-standard active:scale-95 shadow-lg"
              onClick={() => setShowPostUploader(true)}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="px-2 sm:px-4 space-y-6 sm:space-y-8">
          {posts.length > 0 ? (
            posts.map(post => (
              <FacesPost key={post.id} post={post} />
            ))
          ) : (
            <div className="py-32 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <History size={40} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">No Records Found</h4>
                <p className="text-sm text-slate-400">The social matrix is currently clear.</p>
              </div>
              <button 
                onClick={() => loadData(true)}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-standard"
              >
                Refresh Signal
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPostUploader(true)}
        className="fixed bottom-24 sm:bottom-32 right-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-aba-gold text-aba-deep rounded-2xl sm:rounded-[2rem] shadow-2xl flex items-center justify-center z-[100] border-4 border-aba-deep/50 backdrop-blur-md"
      >
        <Plus size={28} className="sm:w-8 sm:h-8" />
      </motion.button>

      {/* Post Uploader Modal */}
      <AnimatePresence>
        {showPostUploader && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostUploader(false)}
              className="absolute inset-0 bg-aba-deep/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg"
            >
              <div className="absolute -top-3 -right-3 z-10">
                <button 
                  onClick={() => setShowPostUploader(false)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white/60 hover:text-white border border-white/10 shadow-2xl transition-standard"
                >
                  <X size={20} />
                </button>
              </div>
              <PostUploader 
                userId={userUuid || ''} 
                onPostCreated={() => {
                  setShowPostUploader(false);
                  loadData(true);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Notification Center Overlay */}
      {showNotificationCenter && (
        <NotificationCenter 
          notifications={notifications} 
          onClose={() => setShowNotificationCenter(false)}
          onClear={() => {
            setNotifications([]);
            // Could add a service call to clear in DB if desired
          }}
          onMarkRead={async (id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            try {
              const { markNotificationAsRead } = await import('../../services/supabaseService');
              await markNotificationAsRead(id);
            } catch (e) {
              console.warn("Mark read failed");
            }
          }}
        />
      )}
    </div>
  );
};

export default FacesFeed;
