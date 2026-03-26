
import React, { useState } from 'react';
import { UploadCloud, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCcw, Sparkles } from 'lucide-react';
import { uploadImage } from '../services/supabaseService';
import { generateImageCaption } from '../services/geminiService';

interface ImageUploadProps {
  label: string;
  onUpload: (url: string, base64?: string) => void;
  currentImage?: string | null;
  bucket?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, onUpload, currentImage, bucket = 'findaba', className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'local'>('idle');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setStatus('idle');
    
    try {
      const base64 = await fileToBase64(file);
      
      try {
        const url = await uploadImage(file, bucket);
        if (url) {
          await onUpload(url, base64);
          setStatus('success');
          // AI background indexing
          generateImageCaption(base64, file.type).catch(() => {});
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          throw new Error("Registry Offline");
        }
      } catch (cloudErr) {
        console.warn("[Registry] Cloud sync failed, using local signal fallback:", cloudErr);
        // Fallback to local base64 so the user can proceed
        await onUpload(base64, base64);
        setStatus('local');
        // AI background indexing still works on local data
        generateImageCaption(base64, file.type).catch(() => {});
      }
    } catch (err) {
      console.error("[Registry] Critical upload fault:", err);
      setStatus('error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-end px-1">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        {status === 'success' && <span className="text-[8px] font-black text-aba-green uppercase flex items-center gap-1 animate-fade-in"><CheckCircle2 size={10} /> Cloud Synced</span>}
        {status === 'local' && <span className="text-[8px] font-black text-aba-gold uppercase flex items-center gap-1 animate-fade-in"><Sparkles size={10} /> Local Signal Active</span>}
        {status === 'error' && (
          <button 
            onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
            className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1 animate-fade-in hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            <RefreshCcw size={10} className="animate-spin-slow" /> Signal Error: Retry?
          </button>
        )}
      </div>
      
      <div className="relative group cursor-pointer h-44">
        <div className={`w-full h-full bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-500 relative z-0 ${status === 'error' ? 'border-red-500/50' : 'border-white/5 group-hover:border-aba-gold/50'}`}>
          {currentImage ? (
            <>
              <img src={currentImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Identity Node" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                 <div className="bg-white/20 p-4 rounded-full border border-white/20 backdrop-blur-xl">
                    <UploadCloud size={24} className="text-white" />
                 </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <ImageIcon size={32} className="text-white/20" />
              <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">Select Node Asset</span>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="animate-spin text-aba-gold" size={32} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Committing to cloud...</span>
            </div>
          )}
        </div>
        
        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleFile} accept="image/*" disabled={loading} title={`Upload ${label}`} />
      </div>
    </div>
  );
};

export const MultiImageUpload: React.FC<any> = ({ label, urls, onAdd, onRemove, bucket = 'findaba' }) => {
  const [loading, setLoading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    
    const fileList = Array.from(files) as File[];
    
    try {
      for (const file of fileList) {
        try {
          const url = await uploadImage(file, bucket);
          if (url) {
            await onAdd(url);
          } else {
            throw new Error("Registry Offline");
          }
        } catch (cloudErr) {
          console.warn("[Registry] Multi-upload cloud sync failed, using local signal:", cloudErr);
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
          await onAdd(base64);
        }
      }
    } catch (err) {
      console.error("[Registry] Multi-upload critical fault:", err);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        {urls.map((url: string, idx: number) => (
          <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-white/5 group shadow-sm bg-slate-900">
            <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Node asset" />
            <button type="button" onClick={() => onRemove(idx)} className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-lg hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"><ImageIcon size={12} /></button>
          </div>
        ))}
        {urls.length < 12 && (
          <div className="relative aspect-square rounded-[1.5rem] border-2 border-dashed border-white/5 flex items-center justify-center hover:border-aba-gold/50 transition-all cursor-pointer bg-slate-900/50">
            {loading ? <Loader2 className="animate-spin text-aba-gold" size={20} /> : <ImageIcon size={20} className="text-white/20" />}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFiles} accept="image/*" multiple disabled={loading} />
          </div>
        )}
      </div>
    </div>
  );
};
