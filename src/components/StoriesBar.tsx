
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Story } from '../types';

interface StoriesBarProps {
  stories: Story[];
  onAddStory: () => void;
  onViewStory: (story: Story) => void;
}

const StoriesBar: React.FC<StoriesBarProps> = ({ stories, onAddStory, onViewStory }) => {
  // Simple grouping by author for display
  const authors = Array.from(new Set(stories.map(s => s.user_id)));
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button 
          onClick={onAddStory}
          className="w-16 h-16 rounded-full border-2 border-aba-gold border-dashed flex items-center justify-center text-aba-gold hover:bg-aba-gold/10 transition-standard bg-white/5 shadow-inner"
        >
          <Plus size={24} />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add Story</span>
      </div>

      {stories.map((story) => (
        <motion.div 
          key={story.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewStory(story)}
          className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-aba-gold to-aba-green shadow-lg ring-2 ring-white/5 ring-offset-2 ring-offset-aba-deep group-hover:scale-105 transition-standard">
            <div className="w-full h-full rounded-full border-2 border-aba-deep overflow-hidden">
              <img 
                src={story.author?.avatar_url || `https://picsum.photos/seed/${story.user_id}/100/100`} 
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-standard">
            {story.author?.username || 'Artisan'}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default StoriesBar;
