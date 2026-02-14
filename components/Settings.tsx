import React, { useState } from 'react';
import { Category, Habit } from '../types';
import { Trash2, Plus, Palette, Edit2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  habits: Habit[];
  onDeleteHabit: (id: string) => void;
  onEditHabit: (id: string) => void;
}

const COZY_PALETTE = [
  '#94A3B8', // slate
  '#38BDF8', // cerulean
  '#A5B4FC', // dusty purple
  '#6366F1', // indigo
  '#475569', // dark slate
  '#F472B6', // pink
  '#FB923C', // orange
  '#4ADE80', // emerald
  '#2DD4BF', // teal
];

const Settings: React.FC<Props> = ({ categories, setCategories, habits, onDeleteHabit, onEditHabit }) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  const addCategory = () => {
    if (!newCatName) return;
    const randomColor = COZY_PALETTE[Math.floor(Math.random() * COZY_PALETTE.length)];

    setCategories(prev => [...prev, {
      id: `cat-${Date.now()}`,
      name: newCatName,
      color: randomColor
    }]);
    setNewCatName('');
  };

  const updateColor = (id: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, color } : c));
  };

  const updateName = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 pb-24 text-cozy-text">
      <h2 className="text-2xl font-black tracking-tight">Settings</h2>

      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-cozy-text/40 uppercase tracking-widest px-2">Categories</h3>
        <div className="bg-white rounded-block p-5 shadow-block border-4 border-indigo-50/20 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="New category..."
              className="flex-1 bg-white px-5 py-3 rounded-block text-sm outline-none border-4 border-indigo-50/10 focus:border-cozy-indigo/30 font-black"
            />
            <button
              onClick={addCategory}
              className="bg-cozy-indigo text-white px-5 py-3 rounded-block active:scale-95 transition-transform shadow-header border-b-4 border-indigo-700"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="rounded-block bg-indigo-50/30 border-2 border-indigo-50/50 overflow-hidden transition-all duration-300">
                <div className="p-3 flex items-center gap-3">
                  <button
                    onClick={() => setEditingColorId(editingColorId === cat.id ? null : cat.id)}
                    className="relative w-10 h-10 rounded-block overflow-hidden shadow-md shrink-0 border-4 border-white transition-transform active:scale-90"
                    style={{ backgroundColor: cat.color }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                      <Palette size={14} className="text-white" />
                    </div>
                  </button>

                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => updateName(cat.id, e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-black text-sm min-w-0"
                  />

                  <div className="flex items-center">
                    <button
                      onClick={() => setEditingColorId(editingColorId === cat.id ? null : cat.id)}
                      className={`p-2 transition-colors rounded-full ${editingColorId === cat.id ? 'text-cozy-indigo bg-white/50 shadow-inner' : 'text-slate-300 hover:text-cozy-indigo'}`}
                    >
                      <Palette size={20} />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-slate-300 hover:text-rose-400 p-2 transition-colors active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {editingColorId === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "circOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-indigo-50/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Custom Palette</p>
                        <div className="flex flex-wrap gap-2">
                          {COZY_PALETTE.map(color => (
                            <button
                              key={color}
                              onClick={() => updateColor(cat.id, color)}
                              className={`w-7 h-7 rounded-block border-2 transition-all ${cat.color === color ? 'border-white scale-125 shadow-lg ring-2 ring-cozy-indigo/20' : 'border-transparent scale-100 hover:scale-110'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <div className="w-7 h-7 rounded-block border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 relative hover:border-cozy-indigo hover:text-cozy-indigo transition-colors">
                            <Plus size={14} />
                            <input
                              type="color"
                              value={cat.color}
                              onChange={e => updateColor(cat.id, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-cozy-text/40 uppercase tracking-widest px-2">Active Habits ({habits.length})</h3>
        <div className="space-y-2">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white p-4 rounded-block shadow-block flex items-center justify-between border-4 border-indigo-50/20 group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-block flex items-center justify-center text-white shrink-0 shadow-block"
                  style={{ backgroundColor: categories.find(c => c.id === habit.categoryId)?.color || '#cbd5e1' }}
                >
                  <Palette size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-base text-cozy-text leading-tight truncate">{habit.name}</h4>
                  <p className="text-[10px] text-cozy-text/50 uppercase tracking-widest font-black mt-0.5">{habit.timeOfDay}</p>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => onEditHabit(habit.id)}
                  className="p-2.5 text-indigo-400 hover:bg-indigo-50 rounded-block transition-all active:scale-90"
                >
                  <Edit2 size={18} strokeWidth={3} />
                </button>
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-2.5 text-rose-300 hover:text-rose-50 rounded-block transition-all active:scale-90"
                >
                  <Trash2 size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-100 p-6 rounded-block border-4 border-white shadow-header flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-block flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
          <Sparkles size={24} />
        </div>
        <div>
          <h4 className="font-black text-cozy-text text-sm mb-1 uppercase tracking-tight">Cozy Tip</h4>
          <p className="text-xs text-cozy-text leading-relaxed font-bold italic">
            "Organizing habits by category helps your brain switch between different types of tasks more efficiently! ✨"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
