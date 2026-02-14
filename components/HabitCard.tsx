
import React, { useState } from 'react';
import { Habit, Category, DailyProgress } from '../types';
import { getIconById } from '../constants';
import { Play, Pause, Plus, Minus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  habit: Habit;
  category?: Category;
  progress?: DailyProgress;
  isRunning: boolean;
  onUpdate: (habitId: string, update: Partial<DailyProgress>) => void;
  onToggleTimer: (habitId: string) => void;
  onIncrementCompletion: (habitId: string) => void;
  onDecrementCompletion: (habitId: string) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const HabitCard: React.FC<Props> = ({
  habit,
  category,
  progress,
  isRunning,
  onToggleTimer,
  onIncrementCompletion,
  onDecrementCompletion
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const elapsedTime = progress?.elapsedTime || 0;
  const completions = progress?.completions || 0;
  const isActuallyCompleted = completions > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spawnParticles = () => {
    const newParticles: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
      color: ['#6366F1', '#38BDF8', '#818CF8', '#A5B4FC'][Math.floor(Math.random() * 4)]
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    spawnParticles();
    onIncrementCompletion(habit.id);
  };

  const goalSeconds = habit.goal ? habit.goal * 60 : 0;
  const isGoalHabit = goalSeconds > 0;
  const progressPercent = isGoalHabit ? Math.min(100, (elapsedTime / goalSeconds) * 100) : (isActuallyCompleted ? 100 : 0);

  return (
    <motion.div
      layout
      className={`relative bg-white rounded-cozy p-4 border-2 transition-all duration-500 
        ${isActuallyCompleted
          ? 'border-emerald-100 bg-emerald-50/20 shadow-sm'
          : habit.isMain
            ? 'border-indigo-200 shadow-xl shadow-indigo-100/50 scale-[1.02] z-10'
            : 'border-transparent shadow-indigo-50/30 shadow-md'}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {habit.isMain && !isActuallyCompleted && (
        <div className="absolute -top-2 -left-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg z-20 animate-bounce-subtle">
          <Star size={14} fill="currentColor" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-bubble flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/5 transition-transform ${habit.isMain ? 'ring-4 ring-indigo-50' : ''}`}
          style={{ backgroundColor: category?.color || '#cbd5e1' }}
        >
          {React.cloneElement(getIconById(habit.icon) as React.ReactElement, { size: 32 })}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <div className={`flex items-start gap-2 ${isActuallyCompleted ? 'text-emerald-900' : 'text-cozy-text'}`}>
            <span className="font-black text-lg leading-tight transition-colors line-clamp-2 min-w-0">
              {habit.name}
            </span>
            {habit.isMain && isActuallyCompleted && <Star size={16} fill="currentColor" className="text-indigo-400 shrink-0 mt-1" />}
          </div>
          <p className={`text-[11px] font-bold truncate capitalize mt-1 ${habit.isMain ? 'text-indigo-400' : 'text-slate-400'}`}>
            {category?.name} • {habit.timeOfDay} {habit.isMain && '• Main'}
          </p>
        </div>

        {/* Increment Plus Button with Bubble Counter */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {completions > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20, scale: 0.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.5 }}
                onClick={(e) => { e.stopPropagation(); onDecrementCompletion(habit.id); }}
                className="w-10 h-10 bg-slate-50 text-slate-300 rounded-bubble flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90"
              >
                <Minus size={20} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="relative">
            <button
              onClick={handleIncrement}
              className={`w-14 h-14 rounded-bubble flex items-center justify-center transition-all duration-500 active:scale-90 relative z-10 ${completions > 0
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                : 'bg-white text-slate-300 border-4 border-emerald-50/20 shadow-sm'
                }`}
            >
              {habit.rewardValue && habit.rewardValue > 1 ? (
                <span className="text-xl font-black">+{habit.rewardValue}</span>
              ) : (
                <Plus size={36} strokeWidth={4} />
              )}
            </button>

            <AnimatePresence>
              {completions > 0 && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white z-20"
                >
                  {completions}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Particle Celebration */}
            <AnimatePresence>
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: p.x * 2.5,
                    y: -120 + p.y,
                    scale: [0, 1.8, 0],
                    rotate: [0, 180, 360],
                    opacity: 0
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -ml-2 -mt-2 pointer-events-none z-0"
                >
                  <Star size={20} fill={p.color} className="text-transparent" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Timer Row */}
      {(isGoalHabit || habit.oneTimeValue) && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50/30 px-3 py-2 rounded-cozy border border-emerald-50/50 shrink-0">
            <span className={`text-sm font-black tabular-nums ${isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-500'}`}>
              {formatTime(elapsedTime)}
            </span>
            {isGoalHabit && <span className="text-[10px] text-slate-300 font-bold">/ {habit.goal}m</span>}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleTimer(habit.id); }}
            className={`w-10 h-10 rounded-bubble flex items-center justify-center transition-all ${isRunning ? 'bg-emerald-400 text-white shadow-md' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100'}`}
          >
            {isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>

          {/* Progress Bar Container - Rounder */}
          {isGoalHabit && (
            <div className="flex-1 bg-slate-100/30 h-3 rounded-full overflow-hidden p-0.5 border border-emerald-50/10">
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
          )}
        </div>
      )}

      {isActuallyCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-indigo-500/5 pointer-events-none rounded-cozy"
        />
      )}
    </motion.div>
  );
};

export default HabitCard;
