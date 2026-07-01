
import React, { useState, useEffect } from "react";
import { CheckSquare, Square, Trash2, Plus, Clock, User, Filter, Search, Loader2, AlertCircle } from "lucide-react";
import IndustrialButton from "../../../components/IndustrialButton";
import { useToast } from "../../../providers/ToastProvider";
import { fetchTasks, updateTaskItem, deleteTaskItem } from "../../../services/supabaseService";
import { Task } from "../../../types";

export const TasksManager: React.FC = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data || []);
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [addToast]);

  const toggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTaskItem(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteTaskItem(id);
      setTasks(tasks.filter(t => t.id !== id));
      addToast("Industrial Directive Revoked", "success");
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Mesh Directives..."
              className="bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-aba-gold/50 transition-all text-xs w-64"
            />
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            {['all', 'pending', 'completed'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-aba-gold text-aba-dark' : 'text-white/40 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <IndustrialButton variant="primary" size="sm" icon={Plus}>New Directive</IndustrialButton>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-aba-gold" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center gap-4 text-white/20">
          <AlertCircle size={40} />
          <p className="text-xs font-black uppercase tracking-widest">No matching directives found in registry</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`p-6 rounded-3xl border transition-all flex items-center justify-between group ${
                task.status === 'completed' ? 'bg-aba-green/5 border-aba-green/20' : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => toggleTask(task)}
                  className={`transition-colors ${task.status === 'completed' ? 'text-aba-green' : 'text-white/20 hover:text-aba-gold'}`}
                >
                  {task.status === 'completed' ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
                <div className="space-y-1">
                  <h5 className={`text-sm font-black uppercase tracking-tight ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white'}`}>
                    {task.title}
                  </h5>
                  <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(task.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><User size={12} /> {task.assigned_to || 'System'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="p-3 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksManager;
