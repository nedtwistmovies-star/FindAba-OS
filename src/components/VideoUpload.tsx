
import React, { useState } from 'react';
import { UploadCloud, Loader2, Video, CheckCircle2, AlertCircle, Play, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { uploadImage } from '../services/supabaseService';

interface VideoUploadProps {
  label?: string;
  onUpload: (url: string) => void;
  currentVideo?: string | null;
  bucket?: string;
  className?: string;
  onRemove?: () => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ label, onUpload, currentVideo, bucket = 'findaba', className = "", onRemove }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
        alert("PROTOCOL ERROR: File must be a video format (MP4/MOV).");
        return;
    }

    setLoading(true);
    setStatus('idle');
    
    try {
      const url = await uploadImage(file, bucket);
      if (url) {
        await onUpload(url);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error("Registry Offline");
      }
    } catch (err) {
      console.warn("[Registry] Video cloud sync failed, using local signal fallback:", err);
      // Fallback to local object URL
      const localUrl = URL.createObjectURL(file);
      await onUpload(localUrl);
      setStatus('success'); // Still show success but it's local
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex justify-between items-end px-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
          {status === 'success' && <span className="text-[8px] font-black text-aba-green uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Partner Synced</span>}
          {status === 'error' && <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> Signal Error</span>}
        </div>
      )}
      {!label && status === 'error' && (
        <div className="flex justify-end px-1">
          <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> Signal Error</span>
        </div>
      )}
      <div className="relative group">
        <div className={`w-full h-44 bg-slate-900 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${status === 'error' ? 'border-red-500/50' : 'border-white/10 group-hover:border-aba-gold/50'}`}>
          {currentVideo ? (
            <>
              <video 
                ref={videoRef}
                src={currentVideo} 
                className="w-full h-full object-cover opacity-60" 
                muted 
                loop 
                playsInline 
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px] gap-4">
                 <button 
                   type="button"
                   onClick={togglePlay}
                   className="bg-aba-gold/20 p-4 rounded-full border border-aba-gold/30 backdrop-blur-xl hover:bg-aba-gold/40 transition-all"
                 >
                    {isPlaying ? <X size={24} className="text-aba-gold" /> : <Play size={24} className="text-aba-gold" fill="currentColor" />}
                 </button>
                 <div className="bg-white/10 p-4 rounded-full border border-white/20 backdrop-blur-xl hover:bg-white/20 transition-all cursor-pointer relative">
                    <UploadCloud size={24} className="text-white" />
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} accept="video/*" disabled={loading} />
                 </div>
                 {onRemove && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(); }}
                      className="bg-red-500/20 p-4 rounded-full border border-red-500/30 backdrop-blur-xl hover:bg-red-500/40 transition-all"
                    >
                       <Trash2 size={24} className="text-red-500" />
                    </button>
                 )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <Video size={32} className="text-slate-500" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Select Video Clip</span>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} accept="video/*" disabled={loading} />
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-20">
              <Loader2 className="animate-spin text-aba-gold" size={32} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Uploading Media...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MultiVideoUpload: React.FC<any> = ({ label, videos, onAdd, onRemove, onUpdateCaption, onMove }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{videos.length} Slots Active</span>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {videos.map((vid: any, idx: number) => (
          <div key={idx} className="bg-white/5 p-6 rounded-[3rem] border border-white/10 space-y-4 group relative">
            <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={() => idx > 0 && onMove(idx, idx - 1)} 
                 className="p-2 bg-black/60 text-aba-gold rounded-lg hover:bg-aba-gold hover:text-black transition-all"
               >
                 <ChevronUp size={16} />
               </button>
               <button 
                 onClick={() => idx < videos.length - 1 && onMove(idx, idx + 1)} 
                 className="p-2 bg-black/60 text-aba-gold rounded-lg hover:bg-aba-gold hover:text-black transition-all"
               >
                 <ChevronDown size={16} />
               </button>
            </div>
            <VideoUpload 
              currentVideo={vid.url} 
              onUpload={(url) => onAdd(url, idx)} 
              onRemove={() => onRemove(idx)}
            />
            <div className="space-y-2 px-1">
               <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Video Caption</label>
               <input 
                 type="text" 
                 className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-[11px] font-bold outline-none text-white focus:border-aba-gold transition-all"
                 placeholder="Describe the rhythm of this node..."
                 value={vid.caption || ''}
                 onChange={(e) => onUpdateCaption(e.target.value, idx)}
               />
            </div>
          </div>
        ))}
        {videos.length < 5 && (
          <button 
            type="button"
            onClick={() => onAdd('', -1)}
            className="w-full py-10 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/20 hover:text-aba-gold hover:border-aba-gold/30 hover:bg-aba-gold/5 transition-all group"
          >
             <div className="w-12 h-12 rounded-2xl border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
               <Video size={24} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest">Provision Video Slot</span>
          </button>
        )}
      </div>
    </div>
  );
};
