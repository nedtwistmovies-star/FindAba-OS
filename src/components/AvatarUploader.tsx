
import React, { useState, useRef } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ 
  userId, 
  currentAvatarUrl, 
  onUploadComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // Local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload
      const result = await storageService.uploadAvatar(userId, file);
      
      // Update profile in DB
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: result.url })
        .eq('id', userId);

      if (dbError) throw dbError;

      onUploadComplete(result.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(currentAvatarUrl || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative group">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/5 border-2 border-aba-gold/20 shadow-2xl transition-standard group-hover:border-aba-gold/50">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-aba-gold/20">
              <Camera size={40} />
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="text-aba-gold animate-spin" size={24} />
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 p-2 bg-aba-gold text-aba-deep rounded-full shadow-lg hover:scale-110 active:scale-95 transition-standard disabled:opacity-50 disabled:grayscale"
        >
          <Camera size={18} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-aba-red text-[10px] font-bold uppercase tracking-widest bg-aba-red/10 px-3 py-2 rounded-lg border border-aba-red/20 animate-shake">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      
      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center max-w-[200px]">
        JPG, PNG or GIF. Max 5MB.
      </p>
    </div>
  );
};
