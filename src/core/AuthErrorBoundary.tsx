
import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AuthErrorBoundary] caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.toLowerCase().includes('auth') || 
                          this.state.error?.message.toLowerCase().includes('session') ||
                          this.state.error?.message.toLowerCase().includes('identity');

      return (
        <div className="min-h-screen bg-[#0b100e] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-14 space-y-8 text-center"
          >
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 ${isAuthError ? 'bg-aba-gold/10 text-aba-gold' : 'bg-red-500/10 text-red-500'}`}>
              {isAuthError ? <ShieldAlert size={40} /> : <AlertTriangle size={40} />}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {isAuthError ? 'Handshake Failure' : 'System Anomaly'}
              </h2>
              <p className="text-xs font-medium text-white/40 leading-relaxed">
                {isAuthError 
                  ? 'Authentication verification in progress or session has expired. Please re-authenticate to maintain industrial security.'
                  : 'A critical error occurred while synchronizing your identity with the FindAba registry.'}
              </p>
            </div>

            <div className="pt-8 space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-6 bg-white text-aba-deep rounded-full font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-aba-gold transition-all active:scale-95"
              >
                <RefreshCw size={18} />
                Refresh Registry
              </button>
              
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-aba-gold transition-colors"
              >
                Reset Connection State
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
