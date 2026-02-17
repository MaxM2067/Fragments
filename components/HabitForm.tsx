
import React, { useState, useMemo } from 'react';
import { Habit, Category, TimeOfDay, GoalFormat, StepType } from '../types';
import { ICONS, getIconById } from '../constants';
import { ChevronLeft, Check, Save, Star, Layers, Zap, DollarSign, ChevronDown, Gem, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  habits: Habit[];
  categories: Category[];
  onSave: (habit: Habit) => void;
  onCancel: () => void;
  initialHabit?: Habit;
  isSkipped?: boolean;
  onToggleSkip?: (habitId: string) => void;
}

const HabitForm: React.FC<Props> = ({
  habits,
  categories,
  onSave,
  onCancel,
  initialHabit,
  isSkipped,
  onToggleSkip
}) => {
  const [name, setName] = useState(initialHabit?.name || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [categoryId, setCategoryId] = useState(initialHabit?.categoryId || categories[0]?.id || '');
  const [icon, setIcon] = useState(initialHabit?.icon || ICONS[0].id);
  const [showIcons, setShowIcons] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialHabit?.timeOfDay || 'anytime');
  const [stepType, setStepType] = useState<StepType>(initialHabit?.stepType || 'single');
  const [goalFormat, setGoalFormat] = useState<GoalFormat>(initialHabit?.goalFormat || 'times');
  const [goal, setGoal] = useState<number | ''>(initialHabit?.goal || '');
  const [stepValue, setStepValue] = useState<number | ''>(initialHabit?.stepValue || '');
  const [oneTimeValue, setOneTimeValue] = useState<number | ''>(initialHabit?.oneTimeValue || '');
  const [rewardValue, setRewardValue] = useState<number>(initialHabit?.rewardValue || 1);
  const [isMain, setIsMain] = useState<boolean>(initialHabit?.isMain || false);
  const [dailyMinimum, setDailyMinimum] = useState<boolean>(initialHabit?.dailyMinimum || false);
  const [keepInListWhenDone, setKeepInListWhenDone] = useState<boolean>(initialHabit?.keepInListWhenDone || false);

  const mainHabitsCount = habits.filter(h => h.isMain && h.id !== initialHabit?.id).length;
  const isMainDisabled = mainHabitsCount >= 2;

  const stepsCount = useMemo(() => {
    if (stepType !== 'multiple' || !goal || !stepValue) return 0;
    return Math.floor(Number(goal) / Number(stepValue));
  }, [stepType, goal, stepValue]);

  const goalFormatLabel = (format: GoalFormat) => {
    switch (format) { case 'min': return 'min'; case 'times': return 'times'; case '$': return '$'; }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const isMoneyGoal = goalFormat === '$';
    const habitData: Habit = {
      id: initialHabit?.id || Math.random().toString(36).substr(2, 9),
      name, description, categoryId, icon,
      repetition: 'daily', timeOfDay, stepType, goalFormat,
      goal: goal === '' ? undefined : Number(goal),
      stepValue: stepValue !== '' ? Number(stepValue) : undefined,
      oneTimeValue: oneTimeValue === '' ? undefined : Number(oneTimeValue),
      rewardValue: isMoneyGoal ? 0 : Number(rewardValue),
      isMain,
      dailyMinimum,
      keepInListWhenDone,
      createdAt: initialHabit?.createdAt || Date.now(),
    };
    onSave(habitData);
  };

  const isEditing = !!initialHabit;

  const pill = (label: string, active: boolean, onClick: () => void, iconEl?: React.ReactNode) => (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 rounded-block text-xs font-black transition-all border-2 ${active
        ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
        : 'bg-white text-slate-400 border-slate-100'}`}
    >{iconEl}{label}</button>
  );

  const sectionClass = "bg-white rounded-block p-4 shadow-sm border-2 border-indigo-50/30 space-y-3";
  const labelClass = "text-[10px] font-black text-cozy-text/40 uppercase tracking-widest";
  const inputClass = "w-full bg-slate-50/50 px-4 py-3 rounded-block border-2 border-slate-100 outline-none focus:border-cozy-indigo/30 transition-all font-bold text-cozy-text";

  return (
    <div className="flex flex-col relative">
      {/* Sticky Header — Fixed at the very top of the scroll container */}
      <div className="sticky top-0 z-[60] -mx-3 -mt-2 mb-4 px-3 py-2 bg-white/60 backdrop-blur-md border-b border-white/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} type="button" className="w-9 h-9 bg-white rounded-full shadow-sm active:scale-90 transition-transform border border-indigo-50 flex items-center justify-center">
            <ChevronLeft size={18} className="text-cozy-text" />
          </button>
          <h2 className="text-lg font-black text-cozy-text tracking-tight">{isEditing ? 'Edit Habit' : 'New Habit'}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && onToggleSkip && (
            <button
              type="button"
              onClick={() => onToggleSkip(initialHabit.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-block text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isSkipped
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
            >
              <Minus size={14} className={isSkipped ? 'text-white' : 'text-slate-300'} />
              {isSkipped ? 'Skipped' : 'Skip Day'}
            </button>
          )}
          <button
            onClick={() => {
              const form = document.getElementById('habit-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            type="button"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-block text-sm font-black shadow-lg shadow-indigo-100 border-b-4 border-indigo-800 flex items-center gap-2 active:border-b-0 active:translate-y-1 transition-all"
          >
            {isEditing ? <Save size={18} /> : <Check size={18} />}
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      <form id="habit-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* ═══ BLOCK 1: Main Info ═══ */}
        <div className={sectionClass}>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Main Info</p>

          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Daily Meditation" className={`${inputClass} text-base font-black`} required />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-block text-[11px] font-black transition-all border-2 ${categoryId === cat.id
                    ? 'shadow-sm translate-y-[-1px]' : 'bg-white text-slate-400 border-slate-100'}`}
                  style={categoryId === cat.id ? { backgroundColor: `${cat.color}30`, borderColor: cat.color, color: '#1E293B' } : {}}
                >{cat.name}</button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className={labelClass}>Time of Day</label>
            <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
              className={`${inputClass} py-2.5 capitalize appearance-none`}>
              <option value="anytime">Anytime</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          {/* Icon — collapsible */}
          <div>
            <button type="button" onClick={() => setShowIcons(!showIcons)}
              className="flex items-center justify-between w-full py-2"
            >
              <div className="flex items-center gap-2">
                <span className={labelClass}>Icon</span>
                <div className="w-8 h-8 rounded-block bg-indigo-50 flex items-center justify-center text-indigo-400">
                  {React.cloneElement(getIconById(icon) as React.ReactElement, { size: 18 })}
                </div>
              </div>
              <motion.div animate={{ rotate: showIcons ? 180 : 0 }}>
                <ChevronDown size={16} className="text-slate-300" />
              </motion.div>
            </button>
            <AnimatePresence>
              {showIcons && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-6 gap-2 pt-2 max-h-[180px] overflow-y-auto">
                    {ICONS.map(i => (
                      <button key={i.id} type="button"
                        onClick={() => { setIcon(i.id); setShowIcons(false); }}
                        className={`p-2.5 rounded-block flex items-center justify-center transition-all ${icon === i.id
                          ? 'bg-indigo-100 text-cozy-indigo shadow-inner'
                          : 'bg-slate-50 text-slate-300 hover:bg-indigo-50/50'}`}
                      >
                        {React.cloneElement(i.component as React.ReactElement, { size: 20 })}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Habit Toggle */}
          <button type="button" disabled={isMainDisabled && !isMain} onClick={() => setIsMain(!isMain)}
            className={`w-full px-4 py-2.5 rounded-block border-2 transition-all flex items-center justify-between font-black text-sm ${isMain
              ? 'bg-indigo-500 text-white border-indigo-600'
              : isMainDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <Star size={16} fill={isMain ? "currentColor" : "none"} />
              <span>Main Goal</span>
              {isMainDisabled && !isMain && <span className="text-[9px] text-rose-400 normal-case ml-1">max 2</span>}
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${isMain ? 'bg-white/30' : 'bg-slate-100'}`}>
              <motion.div animate={{ x: isMain ? 14 : 2 }}
                className={`absolute top-0.5 w-4 h-4 rounded-full ${isMain ? 'bg-white' : 'bg-slate-300'}`} />
            </div>
          </button>

          {/* Daily Minimum Toggle */}
          <button type="button" onClick={() => setDailyMinimum(!dailyMinimum)}
            className={`w-full px-4 py-2.5 rounded-block border-2 transition-all flex items-center justify-between font-black text-sm ${dailyMinimum
              ? 'bg-amber-400 text-white border-amber-500 shadow-sm'
              : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <Gem size={16} fill={dailyMinimum ? "currentColor" : "none"} />
              <span>Daily Minimum</span>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${dailyMinimum ? 'bg-white/30' : 'bg-slate-100'}`}>
              <motion.div animate={{ x: dailyMinimum ? 14 : 2 }}
                className={`absolute top-0.5 w-4 h-4 rounded-full ${dailyMinimum ? 'bg-white' : 'bg-slate-300'}`} />
            </div>
          </button>

          {/* Keep in List Toggle */}
          <button type="button" onClick={() => setKeepInListWhenDone(!keepInListWhenDone)}
            className={`w-full px-4 py-2.5 rounded-block border-2 transition-all flex items-center justify-between font-black text-sm ${keepInListWhenDone
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <Layers size={16} />
              <span>Keep in list when done</span>
            </div>
            <div className={`w-8 h-5 rounded-full relative transition-colors ${keepInListWhenDone ? 'bg-white/30' : 'bg-slate-100'}`}>
              <motion.div animate={{ x: keepInListWhenDone ? 14 : 2 }}
                className={`absolute top-0.5 w-4 h-4 rounded-full ${keepInListWhenDone ? 'bg-white' : 'bg-slate-300'}`} />
            </div>
          </button>
        </div>

        {/* ═══ BLOCK 2: Goal Details ═══ */}
        <div className={sectionClass}>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Goal Details</p>

          {/* Goal Format */}
          <div>
            <label className={labelClass}>Goal Format</label>
            <div className="flex gap-1.5 mt-1">
              {pill('Times', goalFormat === 'times', () => setGoalFormat('times'))}
              {pill('Minutes', goalFormat === 'min', () => setGoalFormat('min'))}
              {pill('$', goalFormat === '$', () => setGoalFormat('$'), <DollarSign size={12} />)}
            </div>
          </div>

          {/* Frag Value (only for non-$ goals) */}
          {goalFormat !== '$' && (
            <div>
              <label className={labelClass}>Frag Value</label>
              <input type="number" value={rewardValue === 0 ? '' : rewardValue}
                onChange={e => setRewardValue(e.target.value === '' ? 0 : Math.max(1, Number(e.target.value)))}
                placeholder="1" className={inputClass} min="1" />
            </div>
          )}

          {/* Step Type */}
          <div>
            <label className={labelClass}>Steps</label>
            <div className="flex gap-1.5 mt-1">
              {pill('Single', stepType === 'single', () => setStepType('single'), <Zap size={12} />)}
              {pill('Multiple', stepType === 'multiple', () => setStepType('multiple'), <Layers size={12} />)}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className={labelClass}>Goal ({goalFormatLabel(goalFormat)})</label>
            <input type="number" value={goal}
              onChange={e => setGoal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Optional" className={inputClass} />
          </div>

          {/* Step Value + Steps Count (only for multiple) */}
          {stepType === 'multiple' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Step Value ({goalFormatLabel(goalFormat)})</label>
                <input type="number" value={stepValue}
                  onChange={e => setStepValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Per step" className={inputClass} min="1" />
              </div>
              <div>
                <label className={labelClass}>Steps Count</label>
                <div className="bg-indigo-50/50 px-4 py-3 rounded-block border-2 border-indigo-100/30 font-black text-cozy-text flex items-center justify-center gap-1.5">
                  {stepsCount > 0 ? (
                    <>
                      <Layers size={14} className="text-indigo-400" />
                      <span className="text-lg tabular-nums">{stepsCount}</span>
                      <span className="text-[10px] text-cozy-text/40">steps</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-cozy-text/30">—</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default HabitForm;
