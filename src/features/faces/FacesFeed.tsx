
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Plus, ShoppingBag, Search, Bell, History } from 'lucide-react';
import { Post, Story } from '../../types';
import { fetchPosts, fetchStories } from '../../services/facesService';
import StoriesBar from '../../components/StoriesBar';
import FacesPost from '../../components/FacesPost';
import { useAuth } from '../../providers/AuthProvider';
import LoadingScreen from '../../components/LoadingScreen';

const FacesFeed: React.FC = () => {
  const { userUuid } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (e) {
      console.error("[Faces] Load Error:", e);
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-aba-deep/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold border border-aba-gold/20">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Faces <span className="text-aba-gold opacity-50">& Feed</span></h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-white/40 hover:text-white transition-standard">
            <Search size={22} />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-standard relative">
            <Bell size={22} />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-aba-red rounded-full" />
          </button>
        </div>
      </div>

      <div className="container-responsive py-8 max-w-2xl mx-auto space-y-8">
        {/* Stories */}
        <StoriesBar 
          stories={stories} 
          onAddStory={() => {}} 
          onViewStory={() => {}} 
        />

        {/* Create Post Button (Floating-ish inside feed) */}
        <div className="px-4">
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-4 flex items-center gap-4 shadow-xl mb-8">
            <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 overflow-hidden shrink-0 border border-aba-gold/20 shadow-inner">
               <img src={`https://picsum.photos/seed/${userUuid}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              className="flex-1 text-left px-6 py-3 bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-standard border border-white/5"
              onClick={() => {}}
            >
              What's happening in your workshop?
            </button>
            <button className="p-4 bg-aba-gold text-aba-deep rounded-2xl hover:scale-105 transition-standard active:scale-95 shadow-lg">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="px-4 space-y-8">
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
        className="fixed bottom-32 right-8 w-16 h-16 bg-aba-gold text-aba-deep rounded-[2rem] shadow-2xl flex items-center justify-center z-50 border-4 border-aba-deep/50 backdrop-blur-md"
      >
        <Plus size={32} />
      </motion.button>
    </div>
  );
};

export default FacesFeed;
