
import React, { useState, useMemo } from 'react';
import { Habit, Category, DailyProgress } from '../types';
import HabitCard from './HabitCard';
import HabitGroup from './HabitGroup';
import { LayoutGrid, Clock, Filter, Gem, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  habits: Habit[];
  categories: Category[];
  todayProgress: Record<string, DailyProgress>;
  activeHabitIds: Set<string>;
  onUpdateProgress: (habitId: string, update: Partial<DailyProgress>) => void;
  onToggleTimer: (habitId: string) => void;
  onIncrementCompletion: (habitId: string) => void;
  onDecrementCompletion: (habitId: string) => void;
  onSkipHabit: (habitId: string) => void;
  onAddClick: () => void;
  onEditHabit: (id: string) => void;
}

const HabitList: React.FC<Props> = ({
  habits,
  categories,
  todayProgress,
  activeHabitIds,
  onUpdateProgress,
  onToggleTimer,
  onIncrementCompletion,
  onDecrementCompletion,
  onSkipHabit,
  onEditHabit
}) => {
  const [sortBy, setSortBy] = useState<'time' | 'category'>('time');
  const [filterCategoryId, setFilterCategoryId] = useState<string | 'all' | 'daily-minimum'>('all');
  const [swipedHabitId, setSwipedHabitId] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const prevProgressRef = React.useRef(todayProgress);

  // Track completions to trigger the 3s delay
  React.useEffect(() => {
    const newlyDone = habits.filter(h => {
      if (h.keepInListWhenDone) return false;

      const p = todayProgress[h.id];
      const isDone = (p?.completions || 0) > 0 || p?.completed;

      const prevP = prevProgressRef.current[h.id];
      const wasDone = (prevP?.completions || 0) > 0 || prevP?.completed;

      return isDone && !wasDone;
    });

    if (newlyDone.length > 0) {
      newlyDone.forEach(h => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.add(h.id);
          return next;
        });

        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const next = new Set(prev);
            next.delete(h.id);
            return next;
          });
        }, 3000);
      });
    }
    prevProgressRef.current = todayProgress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayProgress, habits]);

  const filteredHabits = useMemo(() => {
    let result = habits;
    if (filterCategoryId === 'daily-minimum') {
      result = result.filter(h => h.dailyMinimum);
    } else if (filterCategoryId !== 'all') {
      result = result.filter(h => h.categoryId === filterCategoryId);
    }
    // Filter out skipped habits for today
    result = result.filter(h => !todayProgress[h.id]?.skipped);
    return result;
  }, [habits, filterCategoryId, todayProgress]);

  const groupedHabits = useMemo(() => {
    const groups: { title: string; habits: Habit[] }[] = [];
    const doneTodayHabits: Habit[] = [];

    const getIsDone = (h: Habit) => (todayProgress[h.id]?.completions || 0) > 0 || todayProgress[h.id]?.completed;
    const getWasDone = (h: Habit) => (prevProgressRef.current[h.id]?.completions || 0) > 0 || prevProgressRef.current[h.id]?.completed;

    const filteredAndSplit = filteredHabits.filter(h => {
      const isDone = getIsDone(h);
      const wasDone = getWasDone(h);
      const isJustDone = isDone && !wasDone;

      if (isDone && !h.keepInListWhenDone && !recentlyCompleted.has(h.id) && !isJustDone) {
        doneTodayHabits.push(h);
        return false;
      }
      return true;
    });

    if (sortBy === 'time') {
      const timeGroups: Record<string, Habit[]> = {
        'Morning': [],
        'Day & Anytime': [],
        'Evening': []
      };

      filteredAndSplit.forEach(h => {
        if (h.timeOfDay === 'morning') timeGroups['Morning'].push(h);
        else if (h.timeOfDay === 'evening') timeGroups['Evening'].push(h);
        else timeGroups['Day & Anytime'].push(h);
      });

      if (timeGroups['Morning'].length > 0) groups.push({ title: 'Morning', habits: timeGroups['Morning'] });
      if (timeGroups['Day & Anytime'].length > 0) groups.push({ title: 'Day & Anytime', habits: timeGroups['Day & Anytime'] });
      if (timeGroups['Evening'].length > 0) groups.push({ title: 'Evening', habits: timeGroups['Evening'] });
    } else {
      const categoryGroups: Record<string, Habit[]> = {};

      filteredAndSplit.forEach(h => {
        const cat = categories.find(c => c.id === h.categoryId);
        const catName = cat ? cat.name : 'Uncategorized';
        if (!categoryGroups[catName]) categoryGroups[catName] = [];
        categoryGroups[catName].push(h);
      });

      Object.keys(categoryGroups).sort().forEach(catName => {
        groups.push({ title: catName, habits: categoryGroups[catName] });
      });
    }

    // Sort habits within each group: Main first, then completed last (only if NOT "Keep in list")
    groups.forEach(group => {
      group.habits.sort((a, b) => {
        if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;

        const isDoneA = getIsDone(a);
        const isDoneB = getIsDone(b);
        const isJustDoneA = isDoneA && !getWasDone(a);
        const isJustDoneB = isDoneB && !getWasDone(b);

        // If keeping in list or recently done, don't move to bottom
        const effectivelyDoneA = isDoneA && !a.keepInListWhenDone && !recentlyCompleted.has(a.id) && !isJustDoneA;
        const effectivelyDoneB = isDoneB && !b.keepInListWhenDone && !recentlyCompleted.has(b.id) && !isJustDoneB;

        if (effectivelyDoneA !== effectivelyDoneB) return effectivelyDoneA ? 1 : -1;
        return 0;
      });
    });

    // Add Done Today group at the end
    if (doneTodayHabits.length > 0) {
      groups.push({ title: 'Done Today', habits: doneTodayHabits });
    }

    return groups;
  }, [filteredHabits, sortBy, categories, todayProgress, recentlyCompleted]);

  const moneyHabitIds = useMemo(() => new Set(habits.filter(h => h.goalFormat === '$').map(h => h.id)), [habits]);

  const totalFragments = useMemo(() => {
    return (Object.entries(todayProgress) as [string, DailyProgress][]).reduce((sum, [id, p]) => {
      if (moneyHabitIds.has(id)) return sum;
      return sum + (p.completions || 0);
    }, 0);
  }, [todayProgress, moneyHabitIds]);

  const totalMoney = useMemo(() => {
    return (Object.entries(todayProgress) as [string, DailyProgress][]).reduce((sum, [id, p]) => {
      if (!moneyHabitIds.has(id)) return sum;
      return sum + (p.moneyEarned || 0);
    }, 0);
  }, [todayProgress, moneyHabitIds]);

  const hasMoneyHabits = moneyHabitIds.size > 0;

  const dailyMinimumHabits = useMemo(() => habits.filter(h => h.dailyMinimum), [habits]);
  const dailyMinimumCompleted = useMemo(() => {
    if (dailyMinimumHabits.length === 0) return 0;
    return dailyMinimumHabits.filter(h => {
      const p = todayProgress[h.id];
      if (!p) return false;
      if (h.stepType === 'multiple') {
        const stepsCount = h.goal && h.stepValue ? Math.floor(h.goal / h.stepValue) : 0;
        return stepsCount > 0 && p.stepsCompleted >= stepsCount;
      }
      return p.completed || p.completions > 0;
    }).length;
  }, [dailyMinimumHabits, todayProgress]);

  const isDailyMinimumMet = dailyMinimumHabits.length > 0 && dailyMinimumCompleted === dailyMinimumHabits.length;

  return (
    <div className="space-y-3 pb-10">
      {/* Score Header */}
      <div className="relative z-20 bg-white/20 backdrop-blur-sm p-5 rounded-block text-white border border-white/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/60 text-[10px] font-black mb-1 uppercase tracking-widest">Daily Progress</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black tabular-nums">{totalFragments}</h2>
              <span className="text-base font-bold text-blue-200/60">frags</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMoneyHabits && (
              <div className="w-16 h-16 bg-emerald-600/50 rounded-block flex flex-col items-center justify-center border border-emerald-400/30">
                <DollarSign size={14} className="text-white/60" />
                <span className="text-lg font-black text-white tabular-nums">{totalMoney}</span>
              </div>
            )}
            <div className={`w-16 h-16 rounded-block flex items-center justify-center border transition-all duration-700 ${isDailyMinimumMet ? 'bg-amber-400 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-white/15 border-white/20'}`}>
              <Gem size={32} className={`transition-all duration-700 ${isDailyMinimumMet ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110' : 'text-white/70'}`} fill={isDailyMinimumMet ? "currentColor" : "none"} />
            </div>
          </div>
        </div>

        {/* Daily Minimum Progress Bar */}
        {dailyMinimumHabits.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gem size={12} className={isDailyMinimumMet ? "text-amber-400" : "text-white/40"} fill={isDailyMinimumMet ? "currentColor" : "none"} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Daily Min</span>
              </div>
              <span className="text-[10px] font-black tabular-nums text-white/50">{dailyMinimumCompleted}/{dailyMinimumHabits.length}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 mt-1 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(dailyMinimumCompleted / dailyMinimumHabits.length) * 100}%` }}
                className={`h-full transition-all duration-700 bg-gradient-to-r from-amber-200/40 via-amber-400 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)] relative`}
              >
                {/* Subtle shine effect on top of the gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Sort Bar — transparent, no background plate */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto scrollbar-hide pt-2 pb-0">
        <button
          onClick={() => setSortBy(sortBy === 'time' ? 'category' : 'time')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-block text-[11px] font-bold border border-white/20 whitespace-nowrap active:scale-95 transition-transform text-white shadow-block"
        >
          {sortBy === 'time' ? <Clock size={14} /> : <LayoutGrid size={14} />}
          By {sortBy === 'time' ? 'Time' : 'Cat'}
        </button>

        <div className="h-5 w-px bg-white/20 mx-0.5 shrink-0" />

        <button
          onClick={() => setFilterCategoryId('all')}
          className={`px-4 py-2 rounded-block text-[11px] font-black capitalize whitespace-nowrap border transition-all ${filterCategoryId === 'all'
            ? 'bg-white/30 text-white border-white/30'
            : 'bg-transparent text-white/50 border-white/10'}`}
        >
          All
        </button>

        <button
          onClick={() => setFilterCategoryId('daily-minimum')}
          className={`px-4 py-2 rounded-block text-[11px] font-black capitalize whitespace-nowrap border transition-all flex items-center gap-1.5 ${filterCategoryId === 'daily-minimum'
            ? 'bg-amber-400 text-white border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
            : 'bg-white/15 text-white/50 border-white/10'}`}
        >
          <Gem size={14} fill={filterCategoryId === 'daily-minimum' ? "currentColor" : "none"} />
          Daily Min
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategoryId(cat.id)}
            className={`px-4 py-2 rounded-block text-[11px] font-black capitalize whitespace-nowrap border transition-all ${filterCategoryId === cat.id
              ? 'bg-white/30 text-white border-white/30'
              : 'bg-transparent text-white/50 border-white/10'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Habit List with Groups */}
      <div className="pb-4 flex flex-col">
        {groupedHabits.length > 0 ? (
          groupedHabits.map((group, idx) => (
            <motion.div
              layout
              key={group.title}
              style={{ position: 'relative', zIndex: groupedHabits.length - idx }}
              transition={{ type: 'spring', stiffness: 120, damping: 25 }}
            >
              <HabitGroup
                title={group.title}
                isFirst={idx === 0}
                habits={group.habits}
                categories={categories}
                todayProgress={todayProgress}
                activeHabitIds={activeHabitIds}
                onUpdateProgress={onUpdateProgress}
                onToggleTimer={onToggleTimer}
                onIncrementCompletion={onIncrementCompletion}
                onDecrementCompletion={onDecrementCompletion}
                onSkipHabit={onSkipHabit}
                onEditHabit={onEditHabit}
                swipedHabitId={swipedHabitId}
                setSwipedHabitId={setSwipedHabitId}
              />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/20 backdrop-blur-sm rounded-block border border-white/20">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white/30">
              <Filter size={24} />
            </div>
            <h3 className="text-base font-bold text-white/60 tracking-tight">Nothing here...</h3>
            <p className="text-xs text-white/40 mt-1">Try another category or add a new habit!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitList;

