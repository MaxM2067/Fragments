
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Habit, Category, DailyLog, DailyProgress } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import HabitList from './components/HabitList';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import HabitForm from './components/HabitForm';
import BottomNav from './components/BottomNav';
import MoodBar from './components/MoodBar';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('habits');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [activeHabitIds, setActiveHabitIds] = useState<Set<string>>(new Set());

  // Load data
  useEffect(() => {
    const savedHabits = localStorage.getItem('habitly_habits');
    const savedCats = localStorage.getItem('habitly_categories');
    const savedLogs = localStorage.getItem('habitly_logs');

    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const timer = setInterval(() => {
      const current = new Date().toISOString().split('T')[0];
      if (current !== today) {
        setToday(current);
        setActiveHabitIds(new Set()); // Reset timers on new day
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [today]);

  // Global Timer Interval
  useEffect(() => {
    if (activeHabitIds.size === 0) return;

    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = { ...prev };
        const existingLog = newLogs[today] || { date: today, mood: 0, progress: {} };
        const newProgress = { ...existingLog.progress };

        activeHabitIds.forEach(id => {
          const p = newProgress[id] || { habitId: id, completed: false, completions: 0, elapsedTime: 0 };
          newProgress[id] = { ...p, elapsedTime: p.elapsedTime + 1 };
        });

        newLogs[today] = { ...existingLog, progress: newProgress };
        return newLogs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHabitIds, today]);

  // Save data
  useEffect(() => {
    localStorage.setItem('habitly_habits', JSON.stringify(habits));
    localStorage.setItem('habitly_categories', JSON.stringify(categories));
    localStorage.setItem('habitly_logs', JSON.stringify(logs));
  }, [habits, categories, logs]);

  const currentLog = useMemo(() => {
    return logs[today] || { date: today, mood: 0, progress: {} };
  }, [logs, today]);

  const updateMood = (mood: number) => {
    setLogs(prev => ({
      ...prev,
      [today]: { ...currentLog, mood }
    }));
  };

  const toggleTimer = (habitId: string) => {
    setActiveHabitIds(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  };

  const updateHabitProgress = (habitId: string, update: Partial<DailyProgress>) => {
    setLogs(prev => {
      const existingLog = prev[today] || { date: today, mood: 0, progress: {} };
      const existingProgress = existingLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0 };

      return {
        ...prev,
        [today]: {
          ...existingLog,
          progress: {
            ...existingLog.progress,
            [habitId]: { ...existingProgress, ...update }
          }
        }
      };
    });
  };

  const handleIncrementCompletion = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const incrementMins = habit.goal || habit.oneTimeValue || 0;
    const reward = habit.rewardValue || 1;
    const existingProgress = currentLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0 };

    updateHabitProgress(habitId, {
      completions: (existingProgress.completions || 0) + reward,
      completed: true,
      elapsedTime: existingProgress.elapsedTime + (incrementMins * 60)
    });
  };

  const handleDecrementCompletion = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const reward = habit.rewardValue || 1;
    const existingProgress = currentLog.progress[habitId];
    if (!existingProgress || (existingProgress.completions || 0) <= 0) return;

    const incrementMins = habit.goal || habit.oneTimeValue || 0;
    const newCompletions = Math.max(0, (existingProgress.completions || 0) - reward);

    updateHabitProgress(habitId, {
      completions: newCompletions,
      completed: newCompletions > 0,
      elapsedTime: Math.max(0, existingProgress.elapsedTime - (incrementMins * 60))
    });
  };

  const saveHabit = (habit: Habit) => {
    setHabits(prev => {
      const exists = prev.some(h => h.id === habit.id);
      if (exists) {
        return prev.map(h => h.id === habit.id ? habit : h);
      }
      return [...prev, habit];
    });
    setEditingHabitId(null);
    setView('habits');
  };

  const startEditing = (id: string) => {
    setEditingHabitId(id);
    setView('add-habit');
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setActiveHabitIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const renderContent = () => {
    switch (view) {
      case 'habits':
        return (
          <HabitList
            habits={habits}
            categories={categories}
            todayProgress={currentLog.progress}
            activeHabitIds={activeHabitIds}
            onUpdateProgress={updateHabitProgress}
            onToggleTimer={toggleTimer}
            onIncrementCompletion={handleIncrementCompletion}
            onDecrementCompletion={handleDecrementCompletion}
            onAddClick={() => { setEditingHabitId(null); setView('add-habit'); }}
          />
        );
      case 'mood':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <h2 className="text-3xl font-black text-cozy-text tracking-tight">How are you feeling?</h2>
            <MoodBar mood={currentLog.mood} onMoodChange={updateMood} isLarge />
            <button
              onClick={() => setView('habits')}
              className="px-10 py-4 bg-indigo-500 text-white font-black rounded-bubble shadow-xl shadow-indigo-100 border-b-8 border-indigo-600 active:border-b-0 active:translate-y-1 transition-all"
            >
              Done for now
            </button>
          </div>
        );
      case 'statistics':
        return <Statistics habits={habits} logs={logs} categories={categories} />;
      case 'settings':
        return (
          <Settings
            categories={categories}
            setCategories={setCategories}
            habits={habits}
            onDeleteHabit={deleteHabit}
            onEditHabit={startEditing}
          />
        );
      case 'add-habit':
        return (
          <HabitForm
            categories={categories}
            onSave={saveHabit}
            onCancel={() => { setEditingHabitId(null); setView('habits'); }}
            initialHabit={habits.find(h => h.id === editingHabitId)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-cozy-text pb-20 select-none">
      <header className="p-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-black text-indigo-500 flex items-center gap-2 tracking-tight">
          My Fragments <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-bubble uppercase tracking-widest border border-slate-200/50">V3</span>
        </h1>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-2"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <BottomNav currentView={view} setView={setView} resetEditing={() => setEditingHabitId(null)} />
        </div>
      </div>
    </div>
  );
};

export default App;
