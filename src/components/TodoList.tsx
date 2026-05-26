
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Plus, Trash2, Check, X, GripVertical, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: number;
}

export const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('findaba_merchant_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', text: 'Register workshop with Enyimba Registry', completed: true, priority: 0 },
      { id: '2', text: 'Complete artisan biometric verification', completed: false, priority: 1 },
      { id: '3', text: 'Upload inventory for export audit', completed: false, priority: 2 },
    ];
  });

  const [newText, setNewText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('findaba_merchant_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback(() => {
    if (!newText.trim()) return;
    const newTask: TodoItem = {
      id: crypto.randomUUID(),
      text: newText,
      completed: false,
      dueDate: newDueDate || undefined,
      priority: tasks.length
    };
    setTasks(prev => [newTask, ...prev]);
    setNewText('');
    setNewDueDate('');
    inputRef.current?.focus();
  }, [newText, newDueDate, tasks.length]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTask = (id: string, direction: 'up' | 'down') => {
    const index = tasks.findIndex(t => t.id === id);
    if (index < 0) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tasks.length) return;

    const newTasks = [...tasks];
    const [removed] = newTasks.splice(index, 1);
    newTasks.splice(newIndex, 0, removed);
    setTasks(newTasks);
  };

  return (
    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8 max-w-lg w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tighter text-white">Registry Tasks</h3>
          <p className="text-[10px] font-black text-aba-gold uppercase tracking-widest mt-1">Industrial Compliance Queue</p>
        </div>
        <div 
          aria-live="polite" 
          className="px-3 py-1 bg-aba-gold/10 border border-aba-gold/20 rounded-full text-[10px] font-black text-aba-gold uppercase"
        >
          {tasks.filter(t => t.completed).length}/{tasks.length} Done
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="New task signal..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-aba-gold transition-all"
          />
          <button
            onClick={addTask}
            className="p-4 bg-aba-gold text-aba-deep rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-xl border border-white/5">
           <Calendar size={14} className="text-white/40" />
           <input 
             type="date"
             value={newDueDate}
             onChange={e => setNewDueDate(e.target.value)}
             className="bg-transparent border-none text-[10px] font-bold text-white/60 outline-none w-full uppercase"
           />
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={tasks} 
        onReorder={setTasks}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <Reorder.Item
              key={task.id}
              value={task}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className={`
                flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-grab active:cursor-grabbing outline-none
                ${task.completed 
                  ? 'bg-aba-green/5 border-aba-green/20 opacity-60' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'}
              `}
            >
              <div className="text-white/20">
                <GripVertical size={16} />
              </div>

              <button
                onClick={() => toggleTask(task.id)}
                className={`
                  w-6 h-6 rounded-lg flex items-center justify-center transition-all border shrink-0
                  ${task.completed 
                    ? 'bg-aba-green border-aba-green text-aba-deep' 
                    : 'bg-transparent border-white/20 text-transparent hover:border-aba-gold'}
                `}
              >
                <Check size={14} className={task.completed ? 'opacity-100' : 'opacity-0'} />
              </button>

              <div className="flex-1 min-w-0">
                <span className={`
                  text-sm font-bold transition-all block truncate
                  ${task.completed ? 'text-white/40 line-through decoration-aba-gold' : 'text-white'}
                `}>
                  {task.text}
                </span>
                {task.dueDate && (
                  <p className="text-[8px] font-black text-aba-gold uppercase tracking-widest mt-0.5">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                  className="p-2 text-white/20 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center opacity-20 italic space-y-2"
          >
            <Check size={40} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white">All signals resolved</p>
          </motion.div>
        )}
      </Reorder.Group>
    </div>
  );
};
