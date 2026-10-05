import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, suppress the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-aba-gold/15 text-aba-gold border border-aba-gold/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-aba-gold hover:text-aba-deep active:scale-95 transition-all shadow-sm ${className}`}
        title="Install FindAba for Offline Use"
      >
        <Download size={13} className="shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/80 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all ${className}`}
          title="Install FindAba on iOS"
        >
          <Smartphone size={13} className="shrink-0 text-aba-gold" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#0b100e] border border-white/15 p-6 shadow-2xl text-white space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-aba-gold" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Install on iPhone / iPad</h3>
                </div>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Add FindAba to your home screen for quick offline directory access in Aba markets:
              </p>
              <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-white/80">
                <p>1. Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.</p>
                <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                <p>3. Tap <strong>Add</strong> in the top-right corner.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-aba-gold text-aba-deep rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
