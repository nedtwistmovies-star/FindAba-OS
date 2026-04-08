
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import IndustrialButton from './IndustrialButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#001a0f] flex items-center justify-center p-4 font-sans">
          <div className="max-w-2xl w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 text-center space-y-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="w-24 h-24 bg-aba-red/10 rounded-[2rem] flex items-center justify-center text-aba-red mx-auto animate-pulse">
              <AlertTriangle size={48} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                System <span className="text-aba-red">Fault</span> Detected
              </h1>
              <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest leading-relaxed">
                The industrial node encountered an unexpected signal interruption. 
                Consensus could not be reached on the current operation.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 rounded-2xl p-6 border border-white/5 text-left overflow-hidden">
                <p className="text-[10px] font-black text-aba-red uppercase tracking-widest mb-2">Error Log:</p>
                <code className="text-[11px] font-mono text-white/60 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <IndustrialButton 
                variant="secondary" 
                size="lg" 
                icon={RefreshCcw} 
                onClick={() => window.location.reload()}
                fullWidth
              >
                Retry Node
              </IndustrialButton>
              <IndustrialButton 
                variant="primary" 
                size="lg" 
                icon={Home} 
                onClick={this.handleReset}
                fullWidth
              >
                Return Home
              </IndustrialButton>
            </div>

            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              FindAba Industrial OS // Error Protocol 500
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
