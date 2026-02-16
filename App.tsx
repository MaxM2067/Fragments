
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ViewState, Habit, Category, DailyLog, DailyProgress } from './types';
import { DEFAULT_CATEGORIES, TIMER_MAX_DURATION_SECONDS } from './constants';
import HabitList from './components/HabitList';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import HabitForm from './components/HabitForm';
import BottomNav from './components/BottomNav';
import MoodBar from './components/MoodBar';
import { motion, AnimatePresence } from 'framer-motion';
import { getTodayInTimezone } from './utils/dateUtils';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('habits');
  const [habits, setHabits] = useState<Habit[]>(() => {
    try { const s = localStorage.getItem('habitly_habits'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => {
    try { const s = localStorage.getItem('habitly_categories'); return s ? JSON.parse(s) : DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    return localStorage.getItem('habitly_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [logs, setLogs] = useState<Record<string, DailyLog>>(() => {
    try { const s = localStorage.getItem('habitly_logs'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [today, setToday] = useState(() => getTodayInTimezone(localStorage.getItem('habitly_timezone') || undefined));

  // Timestamp-based active timers: { habitId: { startedAt: ms, accumulatedTime: seconds } }
  type TimerEntry = { startedAt: number; accumulatedTime: number };
  const [activeTimers, setActiveTimers] = useState<Record<string, TimerEntry>>({});
  const activeTimersRef = useRef(activeTimers);
  activeTimersRef.current = activeTimers;

  // Derive activeHabitIds set for child components
  const activeHabitIds = useMemo(() => new Set(Object.keys(activeTimers)), [activeTimers]);

  // Compute real elapsed time for a timer from timestamps
  const computeElapsedTime = useCallback((timer: TimerEntry): number => {
    const sessionSeconds = (Date.now() - timer.startedAt) / 1000;
    return Math.min(
      Math.floor(timer.accumulatedTime + sessionSeconds),
      TIMER_MAX_DURATION_SECONDS
    );
  }, []);

  // Persist active timers to localStorage
  const saveActiveTimers = useCallback((timers: Record<string, TimerEntry>) => {
    localStorage.setItem('habitly_active_timers', JSON.stringify(timers));
  }, []);

  // Sync elapsed time from active timers into logs
  const syncTimersToLogs = useCallback((timers: Record<string, TimerEntry>) => {
    if (Object.keys(timers).length === 0) return;
    setLogs(prev => {
      const todayStr = getTodayInTimezone(userTimezone);
      const existingLog = prev[todayStr] || { date: todayStr, mood: 0, progress: {} };
      const newProgress = { ...existingLog.progress };

      for (const [id, timer] of Object.entries(timers)) {
        const elapsed = computeElapsedTime(timer);
        const p = newProgress[id] || { habitId: id, completed: false, completions: 0, elapsedTime: 0, stepsCompleted: 0, moneyEarned: 0 };
        newProgress[id] = { ...p, elapsedTime: elapsed };
      }

      return { ...prev, [todayStr]: { ...existingLog, progress: newProgress } };
    });
  }, [computeElapsedTime]);

  // Stop a timer and finalize its elapsed time in logs
  const stopTimer = useCallback((habitId: string) => {
    setActiveTimers(prev => {
      const timer = prev[habitId];
      if (!timer) return prev;
      // Finalize elapsed time in logs
      const elapsed = computeElapsedTime(timer);
      setLogs(logsPrev => {
        const todayStr = getTodayInTimezone(userTimezone);
        const existingLog = logsPrev[todayStr] || { date: todayStr, mood: 0, progress: {} };
        const p = existingLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0, stepsCompleted: 0, moneyEarned: 0 };
        return {
          ...logsPrev,
          [todayStr]: {
            ...existingLog,
            progress: { ...existingLog.progress, [habitId]: { ...p, elapsedTime: elapsed } }
          }
        };
      });
      const { [habitId]: _, ...rest } = prev;
      saveActiveTimers(rest);
      return rest;
    });
  }, [computeElapsedTime, saveActiveTimers]);

  // Restore active timers on mount
  useEffect(() => {
    const savedTimers = localStorage.getItem('habitly_active_timers');
    if (savedTimers) {
      try {
        const parsed: Record<string, TimerEntry> = JSON.parse(savedTimers);
        // Auto-stop any that exceeded the limit while page was closed
        const stillActive: Record<string, TimerEntry> = {};
        for (const [id, timer] of Object.entries(parsed)) {
          const elapsed = Math.floor(timer.accumulatedTime + (Date.now() - timer.startedAt) / 1000);
          if (elapsed < TIMER_MAX_DURATION_SECONDS) {
            stillActive[id] = timer;
          }
        }
        setActiveTimers(stillActive);
        saveActiveTimers(stillActive);
        syncTimersToLogs(stillActive);
      } catch { /* corrupted data, ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Day rollover check
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getTodayInTimezone(userTimezone);
      if (current !== today) {
        // Sync final times before resetting
        syncTimersToLogs(activeTimersRef.current);
        setToday(current);
        setActiveTimers({});
        saveActiveTimers({});
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [today, saveActiveTimers, syncTimersToLogs]);

  // UI refresh interval — only for display, not for time accumulation
  useEffect(() => {
    if (Object.keys(activeTimers).length === 0) return;

    const interval = setInterval(() => {
      // Check for auto-stop (2h limit)
      const timersRef = activeTimersRef.current;
      for (const [id, timer] of Object.entries(timersRef)) {
        const elapsed = computeElapsedTime(timer);
        if (elapsed >= TIMER_MAX_DURATION_SECONDS) {
          stopTimer(id);
        }
      }
      // Sync current elapsed times into logs for display
      syncTimersToLogs(activeTimersRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers, computeElapsedTime, stopTimer, syncTimersToLogs]);

  // Visibility change — recalculate elapsed when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timers = activeTimersRef.current;
        if (Object.keys(timers).length === 0) return;

        // Check for 2h auto-stop
        for (const [id, timer] of Object.entries(timers)) {
          const elapsed = computeElapsedTime(timer);
          if (elapsed >= TIMER_MAX_DURATION_SECONDS) {
            stopTimer(id);
          }
        }
        // Sync all remaining active timers
        syncTimersToLogs(activeTimersRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [computeElapsedTime, stopTimer, syncTimersToLogs]);

  // Save data
  useEffect(() => {
    localStorage.setItem('habitly_habits', JSON.stringify(habits));
    localStorage.setItem('habitly_categories', JSON.stringify(categories));
    localStorage.setItem('habitly_logs', JSON.stringify(logs));
    localStorage.setItem('habitly_timezone', userTimezone);
  }, [habits, categories, logs, userTimezone]);

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
    setActiveTimers(prev => {
      if (prev[habitId]) {
        // Stopping: finalize elapsed time
        const timer = prev[habitId];
        const elapsed = computeElapsedTime(timer);
        setLogs(logsPrev => {
          const existingLog = logsPrev[today] || { date: today, mood: 0, progress: {} };
          const p = existingLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0, stepsCompleted: 0, moneyEarned: 0 };
          return {
            ...logsPrev,
            [today]: {
              ...existingLog,
              progress: { ...existingLog.progress, [habitId]: { ...p, elapsedTime: elapsed } }
            }
          };
        });
        const { [habitId]: _, ...rest } = prev;
        saveActiveTimers(rest);
        return rest;
      } else {
        // Starting: record current timestamp and current accumulated time
        const currentLog = logs[today] || { date: today, mood: 0, progress: {} };
        const currentElapsed = currentLog.progress[habitId]?.elapsedTime || 0;
        const newTimers = {
          ...prev,
          [habitId]: { startedAt: Date.now(), accumulatedTime: currentElapsed }
        };
        saveActiveTimers(newTimers);
        return newTimers;
      }
    });
  };

  const updateHabitProgress = (habitId: string, update: Partial<DailyProgress>) => {
    setLogs(prev => {
      const existingLog = prev[today] || { date: today, mood: 0, progress: {} };
      const existingProgress = existingLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0, stepsCompleted: 0, moneyEarned: 0 };

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

    const isMoneyGoal = habit.goalFormat === '$';
    const isMultiStep = habit.stepType === 'multiple';
    const existingProgress = currentLog.progress[habitId] || { habitId, completed: false, completions: 0, elapsedTime: 0, stepsCompleted: 0, moneyEarned: 0 };

    if (isMultiStep) {
      const stepsCount = habit.goal && habit.stepValue ? Math.floor(habit.goal / habit.stepValue) : 0;
      const newSteps = (existingProgress.stepsCompleted || 0) + 1;
      const cyclesCompleted = stepsCount > 0 ? Math.floor(newSteps / stepsCount) : 0;
      const hasCompletedFirstCycle = stepsCount > 0 && newSteps >= stepsCount;

      if (isMoneyGoal) {
        updateHabitProgress(habitId, {
          stepsCompleted: newSteps,
          moneyEarned: (existingProgress.moneyEarned || 0) + (habit.stepValue || 0),
          completed: hasCompletedFirstCycle,
        });
      } else {
        const reward = habit.rewardValue || 1;
        updateHabitProgress(habitId, {
          stepsCompleted: newSteps,
          completions: cyclesCompleted * reward,
          completed: hasCompletedFirstCycle,
        });
      }
    } else {
      // Single step
      if (isMoneyGoal) {
        updateHabitProgress(habitId, {
          moneyEarned: (existingProgress.moneyEarned || 0) + (habit.stepValue || 0),
          completed: true,
        });
      } else {
        const incrementMins = habit.goal || habit.oneTimeValue || 0;
        const reward = habit.rewardValue || 1;
        updateHabitProgress(habitId, {
          completions: (existingProgress.completions || 0) + reward,
          completed: true,
          elapsedTime: existingProgress.elapsedTime + (incrementMins * 60)
        });
      }
    }
  };

  const handleDecrementCompletion = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isMoneyGoal = habit.goalFormat === '$';
    const isMultiStep = habit.stepType === 'multiple';
    const existingProgress = currentLog.progress[habitId];
    if (!existingProgress) return;

    if (isMultiStep) {
      if ((existingProgress.stepsCompleted || 0) <= 0) return;
      const stepsCount = habit.goal && habit.stepValue ? Math.floor(habit.goal / habit.stepValue) : 0;
      const newSteps = Math.max(0, (existingProgress.stepsCompleted || 0) - 1);
      const cyclesCompleted = stepsCount > 0 ? Math.floor(newSteps / stepsCount) : 0;

      if (isMoneyGoal) {
        updateHabitProgress(habitId, {
          stepsCompleted: newSteps,
          moneyEarned: Math.max(0, (existingProgress.moneyEarned || 0) - (habit.stepValue || 0)),
          completed: stepsCount > 0 && newSteps >= stepsCount,
        });
      } else {
        const reward = habit.rewardValue || 1;
        updateHabitProgress(habitId, {
          stepsCompleted: newSteps,
          completions: cyclesCompleted * reward,
          completed: stepsCount > 0 && newSteps >= stepsCount,
        });
      }
    } else {
      // Single step
      if (isMoneyGoal) {
        updateHabitProgress(habitId, {
          moneyEarned: Math.max(0, (existingProgress.moneyEarned || 0) - (habit.stepValue || 0)),
          completed: (existingProgress.moneyEarned || 0) - (habit.stepValue || 0) > 0,
        });
      } else {
        if ((existingProgress.completions || 0) <= 0) return;
        const reward = habit.rewardValue || 1;
        const incrementMins = habit.goal || habit.oneTimeValue || 0;
        const newCompletions = Math.max(0, (existingProgress.completions || 0) - reward);
        updateHabitProgress(habitId, {
          completions: newCompletions,
          completed: newCompletions > 0,
          elapsedTime: Math.max(0, existingProgress.elapsedTime - (incrementMins * 60))
        });
      }
    }
  };

  const handleSkipHabit = (habitId: string) => {
    const existingProgress = currentLog.progress[habitId];
    updateHabitProgress(habitId, { skipped: !existingProgress?.skipped });
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
    setActiveTimers(prev => {
      if (!prev[id]) return prev;
      const { [id]: _, ...rest } = prev;
      saveActiveTimers(rest);
      return rest;
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
            onSkipHabit={handleSkipHabit}
            onAddClick={() => { setEditingHabitId(null); setView('add-habit'); }}
            onEditHabit={startEditing}
          />
        );
      case 'mood':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <h2 className="text-3xl font-black text-cozy-text tracking-tight">How are you feeling?</h2>
            <MoodBar mood={currentLog.mood} onMoodChange={updateMood} isLarge />
            <button
              onClick={() => setView('habits')}
              className="px-10 py-4 bg-indigo-500 text-white font-black rounded-block shadow-xl shadow-indigo-100 border-b-8 border-indigo-600 active:border-b-0 active:translate-y-1 transition-all"
            >
              Done for now
            </button>
          </div>
        );
      case 'statistics':
        return <Statistics habits={habits} logs={logs} categories={categories} userTimezone={userTimezone} />;
      case 'settings':
        return (
          <Settings
            categories={categories}
            setCategories={setCategories}
            habits={habits}
            onDeleteHabit={deleteHabit}
            onEditHabit={startEditing}
            userTimezone={userTimezone}
            setUserTimezone={setUserTimezone}
          />
        );
      case 'add-habit':
        return (
          <HabitForm
            habits={habits}
            categories={categories}
            onSave={saveHabit}
            onCancel={() => { setEditingHabitId(null); setView('habits'); }}
            initialHabit={habits.find(h => h.id === editingHabitId)}
            isSkipped={editingHabitId ? !!currentLog.progress[editingHabitId]?.skipped : false}
            onToggleSkip={handleSkipHabit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-cozy-text pb-20 select-none shadow-inner" style={{ background: 'linear-gradient(135deg, #5DC6F3, #5AAA62)' }}>
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-2"
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
