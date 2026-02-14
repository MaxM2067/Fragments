
import React, { useState, useEffect } from 'react';
import { Habit, Category, TimeOfDay } from '../types';
import { ICONS, getIconById } from '../constants';
import { ChevronLeft, Check, Save, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  habits: Habit[];
  categories: Category[];
  onSave: (habit: Habit) => void;
  onCancel: () => void;
  initialHabit?: Habit;
}

const HabitForm: React.FC<Props> = ({ habits, categories, onSave, onCancel, initialHabit }) => {
  const [name, setName] = useState(initialHabit?.name || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [categoryId, setCategoryId] = useState(initialHabit?.categoryId || categories[0]?.id || '');
  const [icon, setIcon] = useState(initialHabit?.icon || ICONS[0].id);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialHabit?.timeOfDay || 'anytime');
  const [goal, setGoal] = useState<number | ''>(initialHabit?.goal || '');
  const [oneTimeValue, setOneTimeValue] = useState<number | ''>(initialHabit?.oneTimeValue || '');
  const [rewardValue, setRewardValue] = useState<number>(initialHabit?.rewardValue || 1);
  const [isMain, setIsMain] = useState<boolean>(initialHabit?.isMain || false);

  const mainHabitsCount = habits.filter(h => h.isMain && h.id !== initialHabit?.id).length;
  const isMainDisabled = mainHabitsCount >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const habitData: Habit = {
      id: initialHabit?.id || Math.random().toString(36).substr(2, 9),
      name,
      description,
      categoryId,
      icon,
      repetition: 'daily',
      timeOfDay,
      goal: goal === '' ? undefined : Number(goal),
      oneTimeValue: oneTimeValue === '' ? undefined : Number(oneTimeValue),
      rewardValue: Number(rewardValue),
      isMain,
      createdAt: initialHabit?.createdAt || Date.now(),
    };

    onSave(habitData);
  };

  const isEditing = !!initialHabit;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} type="button" className="p-3 bg-white rounded-bubble shadow-sm active:scale-90 transition-transform border-4 border-indigo-50/50">
          <ChevronLeft size={24} className="text-cozy-text" />
        </button>
        <h2 className="text-2xl font-black text-cozy-text tracking-tight">{isEditing ? 'Edit Habit' : 'New Habit'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Habit Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Daily Meditation"
            className="w-full bg-white p-5 rounded-bubble shadow-md shadow-indigo-50/30 border-4 border-indigo-50/20 outline-none focus:border-cozy-indigo/30 transition-all font-black text-lg text-cozy-text"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`px-5 py-3 rounded-bubble text-sm font-black transition-all border-4 ${categoryId === cat.id
                  ? 'shadow-lg translate-y-[-1px]'
                  : 'bg-white text-slate-400 border-indigo-50/30 shadow-none'}`}
                style={categoryId === cat.id ? { backgroundColor: `${cat.color}30`, borderColor: cat.color, color: '#1E293B' } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Icon</label>
          <div className="grid grid-cols-5 gap-3 bg-white p-5 rounded-cozy shadow-md shadow-indigo-50/30 border-4 border-indigo-50/20 max-h-[280px] overflow-y-auto">
            {ICONS.map(i => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIcon(i.id)}
                className={`p-3.5 rounded-bubble flex items-center justify-center transition-all ${icon === i.id
                  ? 'bg-indigo-100 text-cozy-indigo shadow-inner'
                  : 'bg-white text-slate-300 hover:bg-indigo-50/50'}`}
              >
                {React.cloneElement(i.component as React.ReactElement, { size: 24 })}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Time of Day</label>
            <div className="relative">
              <select
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
                className="w-full bg-white p-5 rounded-bubble shadow-md shadow-indigo-50/30 border-4 border-indigo-50/20 outline-none font-black capitalize text-cozy-text appearance-none"
              >
                <option value="anytime">Anytime</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Goal (min)</label>
            <input
              type="number"
              value={goal}
              onChange={e => setGoal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Optional"
              className="w-full bg-white p-5 rounded-bubble shadow-md shadow-indigo-50/30 border-4 border-indigo-50/20 outline-none font-black text-cozy-text"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2">Frag Value</label>
          <input
            type="number"
            value={rewardValue === 0 ? '' : rewardValue}
            onChange={e => setRewardValue(e.target.value === '' ? 0 : Math.max(1, Number(e.target.value)))}
            placeholder="Default 1"
            className="w-full bg-white p-5 rounded-bubble shadow-md shadow-indigo-50/30 border-4 border-indigo-50/20 outline-none font-black text-cozy-text"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-cozy-text/50 uppercase tracking-widest px-2 flex justify-between">
            Priority Selection
            {isMainDisabled && !isMain && <span className="text-[10px] text-rose-400 normal-case">Max 2 main habits reached</span>}
          </label>
          <button
            type="button"
            disabled={isMainDisabled && !isMain}
            onClick={() => setIsMain(!isMain)}
            className={`w-full p-5 rounded-bubble shadow-md border-4 transition-all flex items-center justify-between font-black ${isMain
              ? 'bg-indigo-500 text-white border-indigo-600 shadow-indigo-100'
              : isMainDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed grayscale' : 'bg-white text-slate-400 border-indigo-50/20 shadow-indigo-50/30'}`}
          >
            <div className="flex items-center gap-3">
              <Star size={20} fill={isMain ? "currentColor" : "none"} className={isMain ? "text-white" : "text-slate-300"} />
              <span>Make Main</span>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${isMain ? 'bg-white/30' : 'bg-slate-100'}`}>
              <motion.div
                animate={{ x: isMain ? 18 : 2 }}
                className={`absolute top-1 w-4 h-4 rounded-full ${isMain ? 'bg-white' : 'bg-slate-300'}`}
              />
            </div>
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-500 text-white p-6 rounded-bubble text-2xl font-black shadow-xl shadow-emerald-100 border-b-8 border-emerald-600 flex items-center justify-center gap-3 active:border-b-0 active:translate-y-1 transition-all"
        >
          {isEditing ? <Save size={32} /> : <Check size={32} />}
          {isEditing ? 'Save Changes' : 'Create Habit'}
        </button>
      </form>
    </div>
  );
};

export default HabitForm;
