
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<TodoItem[]>([
    { id: '1', text: 'Register workshop with Enyimba Registry', completed: true },
    { id: '2', text: 'Complete artisan biometric verification', completed: false },
    { id: '3', text: 'Upload inventory for export audit', completed: false },
  ]);
  const [newText, setNewText] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const addTask = useCallback(() => {
    if (!newText.trim()) return;
    const newTask: TodoItem = {
      id: crypto.randomUUID(),
      text: newText,
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setNewText('');
    inputRef.current?.focus();
  }, [newText]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTask(id);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.ctrlKey || e.metaKey) {
        removeTask(id);
      }
    } else if (e.key === 'ArrowDown') {
      const nextIndex = Math.min(index + 1, tasks.length - 1);
      (listRef.current?.children[nextIndex] as HTMLElement)?.focus();
    } else if (e.key === 'ArrowUp') {
      const prevIndex = Math.max(index - 1, 0);
      (listRef.current?.children[prevIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 max-w-lg w-full">
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

      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="New task signal..."
          aria-label="New task input"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-aba-gold transition-all"
        />
        <button
          onClick={addTask}
          aria-label="Add task"
          className="p-4 bg-aba-gold text-aba-deep rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div 
        ref={listRef}
        role="list" 
        className="space-y-3"
        aria-label="Compliance task list"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task, index) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="group"
            >
              <div
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, index, task.id)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                aria-checked={task.completed}
                className={`
                  flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer outline-none relative overflow-hidden
                  ${task.completed 
                    ? 'bg-aba-green/5 border-aba-green/20' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'}
                  ${focusedIndex === index ? 'ring-2 ring-aba-gold ring-offset-4 ring-offset-aba-deep border-aba-gold/50' : ''}
                `}
              >
                <button
                  aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  onClick={() => toggleTask(task.id)}
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center transition-all border
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
                </div>

                <button
                  aria-label="Delete task"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTask(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all focus:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center opacity-20 italic space-y-2"
          >
            <Check size={40} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest">All signals resolved</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
