
import React, { useState, useMemo } from 'react';
import { Habit, Category, DailyProgress } from '../types';
import HabitCard from './HabitCard';
import { LayoutGrid, Clock, Filter, Trophy } from 'lucide-react';

interface Props {
  habits: Habit[];
  categories: Category[];
  todayProgress: Record<string, DailyProgress>;
  activeHabitIds: Set<string>;
  onUpdateProgress: (habitId: string, update: Partial<DailyProgress>) => void;
  onToggleTimer: (habitId: string) => void;
  onIncrementCompletion: (habitId: string) => void;
  onDecrementCompletion: (habitId: string) => void;
  onAddClick: () => void;
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
}) => {
  const [sortBy, setSortBy] = useState<'time' | 'category'>('time');
  const [filterCategoryId, setFilterCategoryId] = useState<string | 'all'>('all');

  const processedHabits = useMemo(() => {
    let result = habits;

    // 1. Filter by Category
    if (filterCategoryId !== 'all') {
      result = result.filter(h => h.categoryId === filterCategoryId);
    }

    // 2. Sort: Main habits first, then incomplete habits, then by selected criteria
    return [...result].sort((a, b) => {
      // 1. Main habits always first
      if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;

      // 2. Completed habits go to bottom (within their group - main or regular)
      const progressA = todayProgress[a.id]?.completions || 0;
      const progressB = todayProgress[b.id]?.completions || 0;
      const isDoneA = progressA > 0;
      const isDoneB = progressB > 0;

      if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

      // 3. Secondary sorting criteria (Time or Category)
      if (sortBy === 'time') {
        const order = { morning: 1, afternoon: 2, evening: 3, anytime: 4 };
        return order[a.timeOfDay] - order[b.timeOfDay];
      } else {
        const catA = categories.find(c => c.id === a.categoryId)?.name || '';
        const catB = categories.find(c => c.id === b.categoryId)?.name || '';
        return catA.localeCompare(catB);
      }
    });
  }, [habits, sortBy, filterCategoryId, todayProgress, categories]);

  const totalFragments = useMemo(() => {
    return (Object.values(todayProgress) as DailyProgress[]).reduce((sum, p) => sum + (p.completions || 0), 0);
  }, [todayProgress]);

  return (
    <div className="space-y-4 pb-10">
      {/* Score Header - Mature Blue & Bubbly */}
      <div className="bg-gradient-to-br from-indigo-100 via-indigo-50 to-cyan-100 p-6 rounded-bubble text-cozy-text shadow-lg shadow-indigo-100/50 flex items-center justify-between border-4 border-white">
        <div>
          <p className="text-cozy-text/60 text-[10px] font-black mb-1 uppercase tracking-widest">Daily Progress</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-black tabular-nums text-cozy-text">{totalFragments}</h2>
            <span className="text-lg font-bold text-cozy-text/40">frags</span>
          </div>
          <p className="text-xs text-cozy-text/60 mt-2 font-bold italic">Давай, шевели жопкой</p>
        </div>
        <div className="w-20 h-20 bg-white rounded-bubble flex items-center justify-center shadow-inner shadow-indigo-100/50 border-4 border-indigo-50/50">
          <Trophy size={40} className="text-indigo-400 drop-shadow-md" />
        </div>
      </div>

      {/* Sticky Filter & Sort Bar - Indigo Accents */}
      <div className="sticky top-0 z-40 bg-cozy-bg/90 backdrop-blur-lg py-3 -mx-5 px-5 border-b border-indigo-50">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Sorting Toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'time' ? 'category' : 'time')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-bubble text-xs font-bold shadow-sm border-2 border-indigo-50 whitespace-nowrap active:scale-95 transition-transform text-cozy-text"
          >
            {sortBy === 'time' ? <Clock size={16} className="text-cozy-indigo" /> : <LayoutGrid size={16} className="text-cozy-indigo" />}
            By {sortBy === 'time' ? 'Time' : 'Category'}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

          {/* Category Filters */}
          <button
            onClick={() => setFilterCategoryId('all')}
            className={`px-5 py-2.5 rounded-bubble text-xs font-black capitalize transition-all whitespace-nowrap border-2 ${filterCategoryId === 'all' ? 'bg-indigo-100 text-cozy-text border-indigo-200 shadow-md' : 'bg-white text-slate-400 border-slate-50 shadow-sm'}`}
          >
            All
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`px-5 py-2.5 rounded-bubble text-xs font-black capitalize transition-all whitespace-nowrap border-2 ${filterCategoryId === cat.id
                ? 'shadow-md translate-y-[-1px]'
                : 'bg-white text-slate-400 border-slate-50 shadow-sm'}`}
              style={filterCategoryId === cat.id ? { backgroundColor: `${cat.color}30`, borderColor: cat.color, color: '#1E293B' } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Habit List */}
      <div className="grid gap-2">
        {processedHabits.length > 0 ? (
          processedHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              category={categories.find(c => c.id === habit.categoryId)}
              progress={todayProgress[habit.id]}
              isRunning={activeHabitIds.has(habit.id)}
              onUpdate={onUpdateProgress}
              onToggleTimer={onToggleTimer}
              onIncrementCompletion={onIncrementCompletion}
              onDecrementCompletion={onDecrementCompletion}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
              <Filter size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-400 tracking-tight">Nothing here...</h3>
            <p className="text-xs text-slate-400 mt-1">Try another category or add a new habit!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitList;
