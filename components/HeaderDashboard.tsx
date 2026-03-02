import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, ChevronDown } from 'lucide-react';
import { Habit, DailyLog, DailyProgress } from '../types';
import { getTodayInTimezone, formatDateInTimezone, getWeekDaysInTimezone } from '../utils/dateUtils';
import { getStorageValue, setStorageValue, STORAGE_KEYS } from '../utils/storage';

interface Props {
    habits: Habit[];
    logs: Record<string, DailyLog>;
    todayProgress: Record<string, DailyProgress>;
    userTimezone: string;
    userWeekStart: 'monday' | 'sunday';
}

const HeaderDashboard: React.FC<Props> = ({
    habits,
    logs,
    todayProgress,
    userTimezone,
    userWeekStart,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        const loadPreference = async () => {
            const saved = await getStorageValue<boolean | string>(STORAGE_KEYS.headerCollapsed);
            if (isCancelled) return;
            const collapsed = typeof saved === 'boolean' ? saved : saved === 'true';
            setIsCollapsed(collapsed);
            setIsLoaded(true);
        };
        void loadPreference();
        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        void setStorageValue(STORAGE_KEYS.headerCollapsed, isCollapsed);
    }, [isCollapsed, isLoaded]);

    const today = useMemo(() => getTodayInTimezone(userTimezone), [userTimezone]);
    const moneyHabitIds = useMemo(() => new Set(habits.filter(h => h.goalFormat === '$').map(h => h.id)), [habits]);

    const getDayFragments = useCallback((dateStr: string) => {
        const log = logs[dateStr];
        if (!log) return 0;
        return (Object.entries(log.progress) as [string, DailyProgress][]).reduce((sum, [id, p]) => {
            if (moneyHabitIds.has(id)) return sum;
            return sum + (p.completions || 0);
        }, 0);
    }, [logs, moneyHabitIds]);

    const stats = useMemo(() => {
        const todayFrags = (Object.entries(todayProgress) as [string, DailyProgress][]).reduce((sum, [id, p]) => {
            if (moneyHabitIds.has(id)) return sum;
            return sum + (p.completions || 0);
        }, 0);
        const [year, month, day] = today.split('-').map(Number);

        // Yesterday in the selected timezone
        const todayDate = new Date(year, month - 1, day);
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(todayDate.getDate() - 1);
        const yesterdayStr = formatDateInTimezone(yesterdayDate, userTimezone);
        const yesterdayFrags = getDayFragments(yesterdayStr);

        // This Week honoring user's selected week start
        const weekDates = getWeekDaysInTimezone(0, userTimezone, userWeekStart).filter(dateStr => dateStr <= today);
        const weekFrags = weekDates.reduce((sum, dateStr) => sum + getDayFragments(dateStr), 0);

        // This Month up to today (timezone-aware because `today` already is)
        let monthFrags = 0;
        for (let d = 1; d <= day; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            monthFrags += getDayFragments(dateStr);
        }

        return {
            today: todayFrags,
            yesterday: yesterdayFrags,
            week: weekFrags,
            month: monthFrags
        };
    }, [todayProgress, today, userTimezone, userWeekStart, moneyHabitIds, getDayFragments]);

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
        <div className="relative z-50 -mt-2 mb-1 select-none">
            <AnimatePresence mode="wait">
                {!isCollapsed ? (
                    <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Remove px-2 to match width of habit blocks below */}
                        <div className="pt-2 pb-2">
                            <motion.div
                                drag="y"
                                dragConstraints={{ top: -100, bottom: 0 }}
                                dragElastic={0.05}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y < -30) setIsCollapsed(true);
                                }}
                                className="bg-white/10 backdrop-blur-md px-4 pt-5 pb-4 rounded-[1.8rem] text-white border border-white/20 space-y-2 relative cursor-grab active:cursor-grabbing shadow-[0_2px_5px_rgba(0,0,0,0.15)]"
                            >
                                {/* Stats Row */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5 leading-none">Today</span>
                                        <div className="flex items-center gap-1.5 leading-none">
                                            <Gem
                                                size={36}
                                                className={`transition-colors duration-500 ${isDailyMinimumMet ? "text-amber-400" : "text-white"}`}
                                                fill={isDailyMinimumMet ? "currentColor" : "rgba(255,255,255,0.1)"}
                                            />
                                            <span className="text-5xl font-black tabular-nums tracking-tighter leading-none">{stats.today}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1.5 text-center leading-none">Yesterday</span>
                                        <span className="text-3xl font-bold tabular-nums text-white/70 leading-none">{stats.yesterday}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1.5 text-center leading-none">This week</span>
                                        <span className="text-3xl font-bold tabular-nums text-white/70 leading-none">{stats.week}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1.5 text-center leading-none">This month</span>
                                        <span className="text-3xl font-bold tabular-nums text-white/70 leading-none">{stats.month}</span>
                                    </div>
                                </div>

                                {/* Progress Bar Row */}
                                {dailyMinimumHabits.length > 0 && (
                                    <div className="space-y-1 pt-0.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Gem size={14} className={isDailyMinimumMet ? "text-amber-400" : "text-white/40"} fill={isDailyMinimumMet ? "currentColor" : "none"} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Daily Minimum</span>
                                            </div>
                                            <span className="text-[10px] font-black tabular-nums text-white/40">{dailyMinimumCompleted}/{dailyMinimumHabits.length}</span>
                                        </div>
                                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(dailyMinimumCompleted / dailyMinimumHabits.length) * 100}%` }}
                                                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                            </motion.div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex justify-center -mx-3"
                    >
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 100 }}
                            dragElastic={0.05}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 30) setIsCollapsed(false);
                            }}
                            onClick={() => setIsCollapsed(false)}
                            className="bg-white/30 backdrop-blur-md px-5 pt-2 pb-2.5 rounded-b-[1.2rem] border-x border-b border-white/30 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Today</span>
                                <Gem
                                    size={16}
                                    className={`transition-colors duration-500 ${isDailyMinimumMet ? "text-amber-400" : "text-white"}`}
                                    fill={isDailyMinimumMet ? "currentColor" : "rgba(255,255,255,0.1)"}
                                />
                                <span className="text-2xl font-black text-white leading-none">{stats.today}</span>
                            </div>
                            <ChevronDown size={14} className="text-white/40" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HeaderDashboard;
