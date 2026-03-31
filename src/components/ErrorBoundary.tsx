
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, FileX } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#111827] flex flex-col items-center justify-center p-8 text-left font-sans">
          <div className="max-w-sm space-y-8 animate-fade-in">
            <FileX size={80} className="text-white/20" />
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">This node can't be reached</h1>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Check if there is a typo in findaba.com.ng. <br/>
                <span className="text-[10px] font-mono opacity-40 uppercase mt-4 block">REGISTRY_PROBE_FINISHED_NXDOMAIN</span>
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              Reload Registry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
