import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  X, Copy, Check, Download, Share2, MessageSquare, 
  ExternalLink, ShieldCheck, MapPin, Award 
} from 'lucide-react';
import { Business } from '../types';
import { useToast } from '../providers/ToastProvider';

interface BusinessQRCodeProps {
  business: Business;
  size?: number;
  includeMargin?: boolean;
}

/**
 * Standalone QR Code Generator for Business Profile
 */
export const BusinessQRCode: React.FC<BusinessQRCodeProps> = ({
  business,
  size = 200,
  includeMargin = true
}) => {
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?business=${encodeURIComponent(business.id)}`
    : `https://www.findaba.com.ng/?business=${encodeURIComponent(business.id)}`;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
      <QRCodeSVG
        value={profileUrl}
        size={size}
        level="H"
        includeMargin={includeMargin}
        bgColor="#FFFFFF"
        fgColor="#020617"
      />
      <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-slate-500">
        Scan to view on FindAba
      </p>
    </div>
  );
};

interface BusinessQRCodeModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessQRCodeModal: React.FC<BusinessQRCodeModalProps> = ({
  business,
  isOpen,
  onClose
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !business) return null;

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?business=${encodeURIComponent(business.id)}`
    : `https://www.findaba.com.ng/?business=${encodeURIComponent(business.id)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        addToast("Business profile link copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2500);
      } else {
        const input = document.createElement('input');
        input.value = profileUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        addToast("Business link copied!", "success");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Copy failed:", err);
      addToast("Failed to copy link.", "error");
    }
  };

  const handleDownload = () => {
    try {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (!canvas) {
        addToast("Could not generate image file.", "error");
        return;
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const slug = business.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      downloadLink.href = pngUrl;
      downloadLink.download = `findaba-${slug}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      addToast("QR Code image downloaded!", "success");
    } catch (err) {
      console.error("Download error:", err);
      addToast("Failed to download QR code.", "error");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business.name} on FindAba`,
          text: `Check out ${business.name} on FindAba — The Official Enyimba Commercial Directory:`,
          url: profileUrl,
        });
        addToast("Shared successfully!", "success");
      } catch (err) {
        // Ignored if user dismissed share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out *${business.name}* (${business.category}) on FindAba — The Official Aba Commercial Registry:\n${profileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div 
      id="business-qr-modal"
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-aba-dark border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold">
              <Award size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Business QR Pass
              </h3>
              <p className="text-[10px] text-aba-gold/80 font-bold uppercase tracking-wider">
                FindAba Digital Identity
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Business Info snippet */}
          <div className="space-y-1">
            <h4 className="text-lg font-black text-white tracking-tight">
              {business.name}
            </h4>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-aba-gold font-bold uppercase text-[10px] tracking-widest">
                {business.category}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-white/60 font-medium text-[10px] uppercase flex items-center gap-1">
                <MapPin size={10} className="text-aba-red" /> {business.area}
              </span>
            </div>
          </div>

          {/* QR Code Canvas (High Res for downloading & display) */}
          <div 
            ref={canvasRef}
            className="p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,215,0,0.15)] border-4 border-aba-gold/20 flex flex-col items-center"
          >
            <QRCodeCanvas
              value={profileUrl}
              size={220}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#020617"
            />
            <div className="mt-1 flex items-center gap-1.5 text-slate-800 font-bold text-[9px] uppercase tracking-widest">
              <span>FindAba Verified Profile</span>
            </div>
          </div>

          <p className="text-white/40 text-[10px] font-medium leading-relaxed max-w-xs">
            Traders and customers can scan this QR code with any smartphone camera to view products, verified contact, and place orders.
          </p>

          {/* Action Buttons Grid */}
          <div className="w-full grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95 border ${
                copied 
                  ? 'bg-aba-green text-white border-aba-green shadow-md' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95 bg-aba-gold text-aba-deep hover:brightness-110 shadow-md border border-aba-gold/50"
            >
              <Download size={14} />
              <span>Save Image</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95 bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              <Share2 size={14} />
              <span>Share Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessQRCodeModal;
