
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Image, Video, X, Loader2, AlertCircle, Send, UploadCloud, CheckCircle2 } from 'lucide-react';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

interface PostUploaderProps {
  userId: string;
  onPostCreated: () => void;
}

export const PostUploader: React.FC<PostUploaderProps> = ({ userId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video'; path: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [content]);

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Validation
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError("File exceeds 20MB limit.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const tempId = `temp_${Date.now()}`;
      const result = await storageService.uploadPostMedia(userId, tempId, file);
      
      setMedia({ url: result.url, type, path: result.path });
    } catch (err: any) {
      setError(err.message || 'Media upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleCreatePost = async () => {
    if (!content.trim() && !media) return;

    try {
      setSubmitting(true);
      setError(null);

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content.trim(),
          media_url: media?.url || null,
          media_type: media?.type || null
        });

      if (postError) throw postError;

      setIsSuccess(true);
      setTimeout(() => {
        setContent('');
        setMedia(null);
        setIsSuccess(false);
        onPostCreated();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const discardMedia = async () => {
    if (media) {
      try {
        await storageService.deleteFile(media.path);
      } catch (e) {
        console.error("Cleanup failed", e);
      }
    }
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className={`bg-white/5 backdrop-blur-xl border-2 rounded-[2rem] p-4 sm:p-6 shadow-2xl space-y-4 transition-all duration-300 ${isDragging ? 'border-aba-gold bg-aba-gold/5 scale-[0.98]' : 'border-white/5'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-aba-gold/10 overflow-hidden shrink-0 border border-aba-gold/20">
          <img src={`https://picsum.photos/seed/${userId}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's the industrial pulse?"
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none py-2 text-sm sm:text-lg font-medium min-h-[60px] overflow-y-auto custom-scrollbar"
        />
      </div>

      {media ? (
        <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5 aspect-video group">
          {media.type === 'image' ? (
            <img src={media.url} className="w-full h-full object-contain" alt="Preview" />
          ) : (
            <video src={media.url} className="w-full h-full object-contain" controls />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
          <button
            onClick={discardMedia}
            aria-label="Discard media"
            className="absolute top-3 right-3 p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white/40 hover:text-aba-red transition-standard shadow-xl"
          >
            <X size={18} />
          </button>
        </div>
      ) : isDragging && (
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-white/20 animate-pulse">
           <UploadCloud size={40} />
           <p className="text-[10px] font-black uppercase tracking-widest">Release to capture signal</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            disabled={uploading || !!media}
            onClick={() => { fileInputRef.current?.click(); }}
            aria-label="Attach media"
            className="p-3 text-white/40 hover:text-aba-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-30 flex items-center gap-2"
          >
            <Image size={24} />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Media</span>
          </button>
        </div>

        <button
          onClick={handleCreatePost}
          disabled={submitting || uploading || (!content.trim() && !media)}
          className={`
            px-8 py-3 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-50 disabled:grayscale
            ${isSuccess ? 'bg-aba-green text-aba-deep' : 'bg-aba-gold text-aba-deep hover:bg-white'}
          `}
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={18} />
              Sent
            </>
          ) : (
            <>
              <Send size={18} />
              Signal
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMediaUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-aba-red text-[10px] font-black uppercase tracking-widest bg-aba-red/10 px-4 py-3 rounded-xl border border-aba-red/20 shadow-inner"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {uploading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 animate-pulse">
           <Loader2 size={16} className="animate-spin text-aba-gold" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Uploading asset to vault...</span>
        </div>
      )}
    </div>
  );
};
