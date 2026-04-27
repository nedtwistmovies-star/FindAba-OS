
import React, { useState, useRef } from 'react';
import { Image, Video, X, Loader2, AlertCircle, Send } from 'lucide-react';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      // We need a temporary ID for the folder if we don't have a post yet, 
      // but usually we upload after creating or use a temporary "trash" ID.
      // For simplicity, we use a random temp suffix as path component.
      const tempId = `temp_${Date.now()}`;
      const result = await storageService.uploadPostMedia(userId, tempId, file);
      
      setMedia({ url: result.url, type, path: result.path });
    } catch (err: any) {
      setError(err.message || 'Media upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !media) return;

    try {
      setSubmitting(true);
      setError(null);

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: userId,
          content: content.trim(),
          media_url: media?.url || null,
          media_type: media?.type || null
        })
        .select()
        .single();

      if (postError) throw postError;

      // Reset state
      setContent('');
      setMedia(null);
      onPostCreated();
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
    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 sm:p-6 shadow-2xl space-y-4">
      <div className="flex gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-aba-gold/10 overflow-hidden shrink-0 border border-aba-gold/20">
          <img src={`https://picsum.photos/seed/${userId}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's the industrial pulse?"
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none py-2 text-sm sm:text-base min-h-[80px]"
        />
      </div>

      {media && (
        <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5 aspect-video sm:aspect-auto sm:max-h-[300px]">
          {media.type === 'image' ? (
            <img src={media.url} className="w-full h-full object-contain" alt="Preview" />
          ) : (
            <video src={media.url} className="w-full h-full object-contain" controls />
          )}
          <button
            onClick={discardMedia}
            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white/40 hover:text-aba-red transition-standard"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <button
            disabled={uploading || !!media}
            onClick={() => { fileInputRef.current?.click(); }}
            className="p-3 text-white/40 hover:text-aba-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-30"
          >
            <Image size={20} />
          </button>
          <button
            disabled={uploading || !!media}
            onClick={() => { fileInputRef.current?.click(); }}
            className="p-3 text-white/40 hover:text-aba-green hover:bg-white/5 rounded-xl transition-all disabled:opacity-30"
          >
            <Video size={20} />
          </button>
        </div>

        <button
          onClick={handleCreatePost}
          disabled={submitting || uploading || (!content.trim() && !media)}
          className="px-6 py-3 bg-aba-gold text-aba-deep rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-standard disabled:opacity-50 disabled:grayscale shadow-lg shadow-aba-gold/20"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Send size={16} />
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
        <div className="flex items-center gap-2 text-aba-red text-[10px] font-bold uppercase tracking-widest bg-aba-red/10 px-3 py-2 rounded-lg border border-aba-red/20">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};
