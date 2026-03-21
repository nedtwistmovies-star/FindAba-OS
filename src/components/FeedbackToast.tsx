
import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Toast } from '../types';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const FeedbackToast: React.FC<Props> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-6 z-[6000] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    error: <AlertCircle className="text-red-500" size={18} />,
    success: <CheckCircle2 className="text-aba-green" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    error: 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-500/20',
    success: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-500/20',
    info: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-500/20',
  };

  return (
    <div className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-center gap-4 animate-slide-up backdrop-blur-xl ${bgColors[toast.type]}`}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white/90 leading-tight">
        {toast.message}
      </p>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default FeedbackToast;
