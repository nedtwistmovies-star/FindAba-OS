import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageSquare } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, title }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#0f1414] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm space-y-6 relative"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
            <X size={20} />
          </button>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter">{title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Rate your experience</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-95"
              >
                <Star 
                  size={32} 
                  className={`transition-colors ${
                    (hoveredRating || rating) >= star ? 'text-aba-gold fill-aba-gold' : 'text-white/10'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">
              <MessageSquare size={10} />
              <span>Optional Comment</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the service?"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none h-24 resize-none"
            />
          </div>

          <button
            disabled={rating === 0}
            onClick={() => onSubmit(rating, comment)}
            className="w-full py-5 bg-aba-gold text-black rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            Submit Review
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RatingModal;
