
import React, { useState } from 'react';
import { ImagePlus, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { storageService } from '../lib/storage';

interface ProductImageUploaderProps {
  userId: string;
  productId: string;
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  userId,
  productId,
  onImagesChange,
  initialImages = []
}) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed per product');
      return;
    }

    setError(null);
    const newImages = [...images];

    for (const file of files) {
      try {
        setUploading(file.name);
        const result = await storageService.uploadProductImage(userId, productId, file);
        newImages.push(result.url);
        setImages([...newImages]);
      } catch (err: any) {
        setError(`Failed for ${file.name}: ${err.message}`);
      } finally {
        setUploading(null);
      }
    }

    onImagesChange(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">
          Product Images ({images.length}/5)
        </label>
        {images.length === 5 && (
          <span className="text-[8px] font-bold text-aba-gold uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 size={12} /> Limit Reached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((url, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
            <img src={url} alt={`Product ${i}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-aba-red transition-standard"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < 5 && (
          <label className="aspect-square rounded-2xl bg-white/5 border border-2 border-dashed border-white/10 hover:border-aba-gold/30 hover:bg-white/10 transition-standard flex flex-col items-center justify-center gap-2 cursor-pointer group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!!uploading}
            />
            {uploading ? (
              <Loader2 size={24} className="text-aba-gold animate-spin" />
            ) : (
              <ImagePlus size={24} className="text-white/20 group-hover:text-aba-gold transition-colors" />
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">
              {uploading ? 'Signal Transfer...' : 'Add Image'}
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-aba-red text-[10px] font-bold uppercase tracking-widest bg-aba-red/10 px-3 py-2 rounded-lg border border-aba-red/20">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
        Optimize for industrial display. JPG, PNG. Max 5MB.
      </p>
    </div>
  );
};
