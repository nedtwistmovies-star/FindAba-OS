
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, FileX } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught project error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#111827] flex flex-col items-center justify-center p-8 text-left font-sans overflow-auto">
          <div className="max-w-2xl w-full space-y-8 animate-fade-in">
            <FileX size={80} className="text-white/20" />
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Node Interruption</h1>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                The FindAba OS node encountered a runtime exception. This can happen due to network connectivity issues or temporary service interruptions.
              </p>
              
              {this.state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-black">Error Details</p>
                  <p className="text-xs font-mono text-red-200/80 break-all">{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-[9px] font-mono text-red-400/60 cursor-pointer hover:text-red-400 transition-colors uppercase tracking-widest">View Stack Trace</summary>
                      <pre className="mt-2 p-3 bg-black/40 rounded-lg text-[8px] font-mono text-red-200/40 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <span className="text-[10px] font-mono opacity-40 uppercase mt-4 block">RUNTIME_NODE_EXCEPTION</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16} /> Reboot Node
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-5 bg-white/5 text-white rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
