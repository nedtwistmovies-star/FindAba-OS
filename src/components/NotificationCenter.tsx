
import React from 'react';
import { AppNotification } from '../types';
import { X, Bell, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
  onClear: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<Props> = ({ notifications, onClose, onClear, onMarkRead }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-start justify-center p-6 pt-24 animate-fade-in">
      <div className="w-full max-w-sm bg-aba-dark border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-slide-up">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Bell className="text-aba-gold" size={20} />
             <h3 className="text-white text-sm font-black uppercase tracking-widest">Hub Terminal</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="p-2 text-white/30 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <Bell size={48} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Active Logs</p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => onMarkRead(n.id)}
                className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${n.read ? 'bg-white/5 border-white/5' : 'bg-aba-gold/5 border-aba-gold/20 shadow-lg'}`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 ${n.type === 'success' ? 'text-aba-green' : n.type === 'alert' ? 'text-aba-red' : 'text-aba-gold'}`}>
                    {n.type === 'success' ? <CheckCircle size={16} /> : n.type === 'alert' ? <AlertTriangle size={16} /> : <Info size={16} />}
                  </div>
                  <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${n.read ? 'text-white/40' : 'text-white'}`}>{n.title}</h4>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">{n.message}</p>
                    <p className="text-[8px] font-mono text-white/20 mt-3 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 bg-white/5 text-center">
           <p className="text-[7px] font-mono font-black uppercase text-white/10 tracking-[0.4em]">Industrial Sync Layer 7 Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
