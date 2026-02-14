
import React, { useState, useMemo } from 'react';
import { Habit, Category, DailyProgress } from '../types';
import { getIconById } from '../constants';
import { Play, Pause, Check, Minus, Star, Gem, Diamond } from 'lucide-react';
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
  shape: 'gem' | 'diamond';
  size: number;
}

// SVG circular progress ring component
const CircularProgress: React.FC<{
  percent: number;
  size: number;
  stroke?: number;
  segments?: number;
  filledSegments?: number;
  color?: string;
}> = ({ percent, size, stroke: strokeProp, segments, filledSegments, color = '#34D399' }) => {
  const stroke = strokeProp ?? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--progress-stroke')) || 3.5);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  if (segments && segments > 0) {
    // Segmented ring for multi-step habits
    const gap = 4; // gap in degrees between segments
    const totalGap = gap * segments;
    const totalArc = 360 - totalGap;
    const segArc = totalArc / segments;

    return (
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {Array.from({ length: segments }).map((_, i) => {
          const startAngle = i * (segArc + gap) + gap / 2;
          const endAngle = startAngle + segArc;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const cx = size / 2;
          const cy = size / 2;

          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const largeArc = segArc > 180 ? 1 : 0;

          const filled = filledSegments !== undefined ? i < filledSegments : false;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={filled ? color : 'rgba(0,0,0,0.06)'}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  }

  // Continuous ring for timer-based progress
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * percent) / 100}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

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
  const stepsCompleted = progress?.stepsCompleted || 0;
  const isMultiStep = habit.stepType === 'multiple';

  const stepsCount = useMemo(() => {
    if (!isMultiStep || !habit.goal || !habit.stepValue) return 0;
    return Math.floor(habit.goal / habit.stepValue);
  }, [isMultiStep, habit.goal, habit.stepValue]);

  const isActuallyCompleted = isMultiStep
    ? (stepsCount > 0 && stepsCompleted >= stepsCount)
    : completions > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spawnParticles = () => {
    const newParticles: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 80,
      color: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8'][Math.floor(Math.random() * 5)],
      shape: Math.random() > 0.4 ? 'gem' : 'diamond',
      size: 12 + Math.floor(Math.random() * 12)
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    spawnParticles();
    onIncrementCompletion(habit.id);
  };

  const goalSeconds = habit.goal && habit.goalFormat === 'min' ? habit.goal * 60 : 0;
  const isGoalHabit = goalSeconds > 0 && !isMultiStep;
  const hasTimer = (isGoalHabit || habit.oneTimeValue) && !isMultiStep;
  const progressPercent = isGoalHabit ? Math.min(100, (elapsedTime / goalSeconds) * 100) : (isActuallyCompleted ? 100 : 0);

  const displayCount = isMultiStep ? stepsCompleted : completions;

  // Circular progress config
  const iconWrapSize = 52;
  const ringSize = iconWrapSize + 10;
  const showRing = isMultiStep ? stepsCount > 0 : isGoalHabit;

  return (
    <motion.div
      layout
      className={`relative w-full overflow-hidden bg-white/95 backdrop-blur-sm rounded-block px-3 py-2.5 border transition-all duration-500 
        ${isActuallyCompleted
          ? 'border-emerald-200/60 bg-emerald-50/40 shadow-block'
          : habit.isMain
            ? 'border-white/50 shadow-block scale-[1.01] z-10'
            : 'border-white/30 shadow-block'}`}
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {habit.isMain && (
        <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow-md z-20">
          <Star size={12} fill="currentColor" />
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 w-full">
        {/* Icon with circular progress ring */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
          {showRing && (
            <CircularProgress
              percent={isMultiStep ? 0 : progressPercent}
              size={ringSize}
              segments={isMultiStep ? stepsCount : undefined}
              filledSegments={isMultiStep ? Math.min(stepsCompleted, stepsCount) : undefined}
              color="var(--color-accent, #F59E0B)"
            />
          )}
          <div
            className={`w-[${iconWrapSize}px] h-[${iconWrapSize}px] rounded-full flex items-center justify-center text-white shadow-md shadow-black/5`}
            style={{
              backgroundColor: category?.color || '#cbd5e1',
              width: iconWrapSize,
              height: iconWrapSize,
            }}
          >
            {React.cloneElement(getIconById(habit.icon) as React.ReactElement, { size: 26 })}
          </div>
        </div>

        {/* Info + Timer inline */}
        <div className="min-w-0 flex flex-col justify-center">
          <div
            className={`font-black leading-tight line-clamp-2 ${isActuallyCompleted ? 'text-emerald-800' : 'text-cozy-text'}`}
            style={{ fontSize: 'var(--font-size-habit-name, 1.1rem)' }}
          >
            {habit.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
            <span className={`text-[10px] font-bold truncate capitalize shrink-0 ${habit.isMain ? 'text-amber-500' : 'text-slate-400'}`}>
              {category?.name} • {habit.timeOfDay} {habit.isMain && '• Main'}
            </span>
            {/* Inline timer */}
            {hasTimer && (
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleTimer(habit.id); }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${isRunning
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-500'}`}
                >
                  {isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <span className={`text-sm font-black tabular-nums truncate ${isRunning ? 'text-amber-500' : 'text-slate-400'}`}>
                  {formatTime(elapsedTime)}
                  {isGoalHabit && <span className="text-slate-300">/{habit.goal}m</span>}
                </span>
              </div>
            )}
            {/* Inline multi-step counter */}
            {isMultiStep && stepsCount > 0 && (
              <span className="text-[11px] font-black tabular-nums text-amber-500 shrink-0">
                {stepsCompleted}/{stepsCount}
              </span>
            )}
          </div>
        </div>

        {/* Check / Decrement buttons */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          <AnimatePresence>
            {displayCount > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10, scale: 0.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.5 }}
                onClick={(e) => { e.stopPropagation(); onDecrementCompletion(habit.id); }}
                className="w-8 h-8 bg-slate-50 text-slate-300 rounded-block flex items-center justify-center active:scale-90 shrink-0"
              >
                <Minus size={16} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="relative">
            <button
              onClick={handleIncrement}
              className={`w-11 h-11 rounded-block flex items-center justify-center transition-all duration-500 active:scale-90 relative z-10 shadow-xl border-b-4 ${isActuallyCompleted
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-white text-emerald-500 border-emerald-100'
                }`}
            >
              {!isMultiStep && habit.rewardValue && habit.rewardValue > 1 ? (
                <span className="text-base font-black">+{habit.rewardValue}</span>
              ) : (
                <Check size={24} strokeWidth={4} />
              )}
            </button>

            <AnimatePresence>
              {displayCount > 0 && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white z-20"
                >
                  {displayCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Crystal Particle Celebration */}
            <AnimatePresence>
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: p.x * 2.5,
                    y: -140 + p.y,
                    scale: [0, 1.6, 0.8, 0],
                    rotate: [0, 120 + Math.random() * 240, 360],
                    opacity: [1, 1, 0.6, 0]
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -ml-2 -mt-2 pointer-events-none z-50"
                >
                  {p.shape === 'gem'
                    ? <Gem size={p.size} fill={p.color} className="text-transparent drop-shadow-sm" />
                    : <Diamond size={p.size} fill={p.color} className="text-transparent drop-shadow-sm" />
                  }
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isActuallyCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-block"
        />
      )}
    </motion.div>
  );
};

export default HabitCard;
