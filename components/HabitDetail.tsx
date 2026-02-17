import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Habit, Category, DailyLog, DailyProgress } from '../types';
import { getIconById } from '../constants';
import { ArrowLeft, Pencil, List, BarChart2, ChevronLeft, ChevronRight, Bold, Italic, List as ListIcon, ListOrdered, Calendar, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getWeekDaysInTimezone,
    getMonthCalendarInTimezone,
    formatDateInTimezone
} from '../utils/dateUtils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';

interface Props {
    habit: Habit;
    category?: Category;
    logs: Record<string, DailyLog>;
    userTimezone: string;
    onBack: () => void;
    onEdit: (id: string) => void;
}

// Helper to set initial content once without React reconciliation
const InitNotes: React.FC<{ notes: string, notesRef: React.RefObject<HTMLDivElement | null> }> = ({ notes, notesRef }) => {
    useEffect(() => {
        if (notesRef.current && !notesRef.current.innerHTML) {
            notesRef.current.innerHTML = notes;
        }
    }, []); // Only on mount
    return null;
};

const HabitDetail: React.FC<Props> = ({
    habit,
    category,
    logs,
    userTimezone,
    onBack,
    onEdit
}) => {
    const [activeTab, setActiveTab] = useState<'notes' | 'stats'>(() => {
        const saved = localStorage.getItem('habitly_detail_tab');
        return (saved as 'notes' | 'stats') || 'notes';
    });
    const [showFullMonth, setShowFullMonth] = useState(() => {
        return localStorage.getItem('habitly_show_full_month') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('habitly_detail_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('habitly_show_full_month', String(showFullMonth));
    }, [showFullMonth]);

    const [calendarDate, setCalendarDate] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    });

    // --- Notes Logic ---
    const [notes, setNotes] = useState<string>(() => {
        const saved = localStorage.getItem(`habitly_notes_${habit.id}`);
        return saved || '';
    });
    const notesRef = useRef<HTMLDivElement>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(`habitly_notes_${habit.id}`, notes);
        }, 1000);
        return () => clearTimeout(timer);
    }, [notes, habit.id]);

    const handleNoteCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (notesRef.current) {
            setNotes(notesRef.current.innerHTML);
        }
    };

    // --- Stats Logic ---
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDays = useMemo(() => getWeekDaysInTimezone(weekOffset, userTimezone), [weekOffset, userTimezone]);

    const getDayValue = (date: string) => {
        const progress = logs[date]?.progress?.[habit.id];
        if (!progress) return 0;

        if (habit.goalFormat === 'min') {
            const mins = Math.floor(progress.elapsedTime / 60);
            if (mins > 0) return mins;
            // Handle manual completion for single habit without timer
            if (habit.stepType === 'single' && progress.completions > 0) {
                return habit.goal || 1;
            }
            return 0;
        }
        if (habit.goalFormat === '$') return progress.moneyEarned;
        if (habit.stepType === 'multiple') return progress.stepsCompleted;
        return progress.completions > 0 ? 1 : 0;
    };

    const chartData = useMemo(() => {
        return weekDays.map(date => {
            const val = getDayValue(date);
            const d = new Date(date);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            return {
                name: dayName,
                value: val,
                date: date
            };
        });
    }, [weekDays, logs, habit]);

    const calendarDays = useMemo(() =>
        getMonthCalendarInTimezone(calendarDate.year, calendarDate.month),
        [calendarDate]
    );

    const stats = useMemo(() => {
        const calculateTotal = (dates: string[]) => {
            return dates.reduce((acc, date) => acc + getDayValue(date), 0);
        };

        const now = new Date();
        const thisWeek = getWeekDaysInTimezone(weekOffset, userTimezone);
        const thisWeekTotal = calculateTotal(thisWeek);

        // Date range for week switcher
        const firstDay = new Date(thisWeek[0]);
        const lastDay = new Date(thisWeek[6]);
        const weekRange = firstDay.getMonth() === lastDay.getMonth()
            ? `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${firstDay.getDate()}-${lastDay.getDate()}`
            : `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${firstDay.getDate()} - ${lastDay.toLocaleDateString('en-US', { month: 'short' })} ${lastDay.getDate()}`;

        // Monthly total
        const monthStart = new Date(calendarDate.year, calendarDate.month - 1, 1);
        const monthEnd = new Date(calendarDate.year, calendarDate.month, 0);
        const monthDates: string[] = [];
        for (let d = 1; d <= monthEnd.getDate(); d++) {
            const date = new Date(calendarDate.year, calendarDate.month - 1, d);
            monthDates.push(formatDateInTimezone(date, userTimezone));
        }
        const monthTotalValue = calculateTotal(monthDates);

        // Summary Stats
        const currentYear = now.getFullYear();
        const thisYearDays = Array.from({ length: 366 }, (_, i) => {
            const d = new Date(currentYear, 0, i + 1);
            if (d.getFullYear() !== currentYear) return null;
            return formatDateInTimezone(d, userTimezone);
        }).filter(Boolean) as string[];

        const lastYearDays = Array.from({ length: 366 }, (_, i) => {
            const d = new Date(currentYear - 1, 0, i + 1);
            if (d.getFullYear() !== currentYear - 1) return null;
            return formatDateInTimezone(d, userTimezone);
        }).filter(Boolean) as string[];

        const curWeek = getWeekDaysInTimezone(0, userTimezone);
        const prevWeek = getWeekDaysInTimezone(-1, userTimezone);

        const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const curMonthDays = Array.from({ length: 31 }, (_, i) => {
            const d = new Date(curMonthStart.getFullYear(), curMonthStart.getMonth(), i + 1);
            if (d.getMonth() !== curMonthStart.getMonth()) return null;
            return formatDateInTimezone(d, userTimezone);
        }).filter(Boolean) as string[];

        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthDays = Array.from({ length: 31 }, (_, i) => {
            const d = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), i + 1);
            if (d.getMonth() !== prevMonthStart.getMonth()) return null;
            return formatDateInTimezone(d, userTimezone);
        }).filter(Boolean) as string[];

        return {
            thisWeekTotal,
            weekRange,
            monthTotalValue,
            summary: {
                thisWeek: calculateTotal(curWeek),
                lastWeek: calculateTotal(prevWeek),
                thisMonth: calculateTotal(curMonthDays),
                lastMonth: calculateTotal(prevMonthDays),
                thisYear: calculateTotal(thisYearDays),
                lastYear: calculateTotal(lastYearDays)
            }
        };
    }, [logs, habit, userTimezone, weekOffset, calendarDate]);

    const formatValue = (val: number, isTotal?: boolean) => {
        if (habit.goalFormat === 'min') {
            if (val === 0) return '0m';
            const h = Math.floor(val / 60);
            const m = val % 60;
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
        if (habit.goalFormat === '$') return `$${val}`;
        if (habit.stepType === 'multiple') return val;
        // For single habits: show checkmark for daily, count for total
        if (isTotal) return val;
        return val > 0 ? '✓' : '';
    };

    const isCompleted = (date: string) => {
        const progress = logs[date]?.progress?.[habit.id];
        return progress?.completed || false;
    };

    return (
        <div className="flex flex-col select-none pb-24">
            {/* Sticky Header — Matches HabitForm style */}
            <div className="sticky top-0 z-[60] -mx-3 -mt-2 mb-4 px-3 py-2 bg-white/60 backdrop-blur-md border-b border-white/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-9 h-9 bg-white rounded-full shadow-sm active:scale-90 transition-transform border border-indigo-50 flex items-center justify-center"
                    >
                        <ChevronLeft size={18} className="text-cozy-text" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-block flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: category?.color || '#cbd5e1' }}
                        >
                            {React.cloneElement(getIconById(habit.icon) as React.ReactElement, { size: 20 })}
                        </div>
                        <h1 className="font-black text-lg text-cozy-text tracking-tight truncate max-w-[180px]">
                            {habit.name}
                        </h1>
                    </div>
                </div>
                <button
                    onClick={() => onEdit(habit.id)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-block hover:bg-indigo-100 transition-colors active:scale-95 border-b-2 border-indigo-100"
                >
                    <Pencil size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Tabs */}
            <div className="px-3">
                <div className="bg-slate-200/50 p-1 rounded-block flex items-center">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 py-3 px-4 rounded-[calc(var(--radius-block)-4px)] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'notes'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <List size={18} strokeWidth={activeTab === 'notes' ? 3 : 2} />
                        Notes
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-3 px-4 rounded-[calc(var(--radius-block)-4px)] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'stats'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <BarChart2 size={18} strokeWidth={activeTab === 'stats' ? 3 : 2} />
                        Stats
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
                <AnimatePresence mode="wait">
                    {activeTab === 'notes' ? (
                        <motion.div
                            key="notes"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="p-4">
                                {/* Toolbar */}
                                <div className="flex items-center gap-1 mb-4 p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                                    <button onClick={() => handleNoteCommand('bold')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><Bold size={18} /></button>
                                    <button onClick={() => handleNoteCommand('italic')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><Italic size={18} /></button>
                                    <button onClick={() => handleNoteCommand('insertUnorderedList')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><ListIcon size={18} /></button>
                                    <button onClick={() => handleNoteCommand('insertOrderedList')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><ListOrdered size={18} /></button>
                                </div>

                                <div
                                    ref={notesRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        // Update state for persistence but DON'T re-sync to innerHTML
                                        setNotes(e.currentTarget.innerHTML);
                                    }}
                                    onBlur={(e) => {
                                        setNotes(e.currentTarget.innerHTML);
                                    }}
                                    className="w-full min-h-[400px] bg-white rounded-2xl p-6 text-slate-700 leading-relaxed outline-none border border-slate-100 shadow-sm font-medium"
                                    placeholder="Write your thoughts here..."
                                />
                                {/* Initialize once on mount or habit change */}
                                <InitNotes notes={notes} notesRef={notesRef} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="pt-6 space-y-3"
                        >
                            <AnimatePresence mode="wait">
                                {!showFullMonth ? (
                                    <motion.div
                                        key="weekly-chart"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white p-6 shadow-sm border border-slate-100 rounded-block mx-3"
                                    >
                                        <div className="flex flex-col items-center mb-6">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={20} /></button>
                                                <div className="text-center">
                                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">{stats.weekRange}</h3>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatValue(stats.thisWeekTotal, true)} total</span>
                                                </div>
                                                <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={20} /></button>
                                            </div>
                                        </div>

                                        <div className="h-[240px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 45, right: 10, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    {(() => {
                                                        const goalValue = habit.stepType === 'multiple' && habit.goal && habit.stepValue
                                                            ? Math.floor(habit.goal / habit.stepValue)
                                                            : habit.goal;

                                                        if (goalValue && goalValue > 0) {
                                                            return (
                                                                <ReferenceLine
                                                                    y={goalValue}
                                                                    stroke="#94A3B8"
                                                                    strokeDasharray="4 4"
                                                                    strokeWidth={1.5}
                                                                />
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        interval={0}
                                                        tick={(props: any) => {
                                                            const { x, y, payload } = props;
                                                            const d = new Date(payload.value);
                                                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                                                            const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                                                            return (
                                                                <g transform={`translate(${x},${y})`}>
                                                                    <text x={0} y={15} textAnchor="middle" fill="#1E293B" fontSize={18} fontWeight={900}>{dayName.charAt(0)}</text>
                                                                    <text x={0} y={32} textAnchor="middle" fill="#94A3B8" fontSize={10} fontWeight={500}>{dateStr}</text>
                                                                </g>
                                                            );
                                                        }}
                                                    />
                                                    <YAxis hide domain={[0, (dataMax: number) => {
                                                        const goalValue = habit.stepType === 'multiple' && habit.goal && habit.stepValue
                                                            ? Math.floor(habit.goal / habit.stepValue)
                                                            : (habit.goal || 0);
                                                        const max = Math.max(dataMax, goalValue, 1);
                                                        return max * 1.2;
                                                    }]} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F8FAFC', radius: 8 }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-xl">
                                                                        {formatValue(payload[0].value as number)}
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        radius={[4, 4, 4, 4]}
                                                        barSize={32}
                                                        label={{
                                                            position: 'top',
                                                            content: (props: any) => {
                                                                const goalValue = habit.stepType === 'multiple' && habit.goal && habit.stepValue
                                                                    ? Math.floor(habit.goal / habit.stepValue)
                                                                    : (habit.goal || 0);
                                                                const isMet = goalValue > 0 && props.value >= goalValue;
                                                                return (
                                                                    <g transform={`translate(${props.x + props.width / 2},${props.y})`}>
                                                                        {isMet && (
                                                                            <g transform="translate(-8, 8)">
                                                                                <Gem size={16} fill="white" className="text-white opacity-80" />
                                                                            </g>
                                                                        )}
                                                                        <text
                                                                            x={0}
                                                                            y={-12}
                                                                            textAnchor="middle"
                                                                            fill="#1E293B"
                                                                            fontSize={14}
                                                                            fontWeight={999}
                                                                        >
                                                                            {props.value > 0 ? formatValue(props.value, false) : ''}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.value > 0 ? (category?.color || '#6366F1') : 'rgba(203, 213, 225, 0.1)'}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="monthly-calendar"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white p-6 shadow-sm border border-slate-100 rounded-block mx-3"
                                    >
                                        <div className="flex flex-col items-center mb-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setCalendarDate(prev => prev.month === 1 ? { year: prev.year - 1, month: 12 } : { ...prev, month: prev.month - 1 })}
                                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <div className="text-center">
                                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                                        {new Date(calendarDate.year, calendarDate.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </h3>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatValue(stats.monthTotalValue, true)} total</span>
                                                </div>
                                                <button
                                                    onClick={() => setCalendarDate(prev => prev.month === 12 ? { year: prev.year + 1, month: 1 } : { ...prev, month: prev.month + 1 })}
                                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                <div key={i} className="text-center text-[10px] font-black text-slate-300 pb-2">{d}</div>
                                            ))}
                                            {calendarDays.map((day, i) => {
                                                const val = getDayValue(day.date);
                                                const completed = isCompleted(day.date);
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative border transition-all
                                                            ${day.isCurrentMonth ? 'bg-slate-50/50 border-slate-100' : 'opacity-20 border-transparent'}
                                                          `}
                                                        style={val > 0 ? { backgroundColor: category?.color || '#3B82F6', borderColor: category?.color || '#3B82F6' } : {}}
                                                    >
                                                        <span className={`text-[10px] font-bold mb-0.5 ${val > 0 ? 'text-white/80' : 'text-slate-400'}`}>
                                                            {day.dayOfMonth}
                                                        </span>
                                                        {val > 0 && (
                                                            <span className={`font-medium leading-none transition-all text-white ${habit.stepType === 'multiple' ? 'text-sm' : 'text-base'}`}>
                                                                {habit.goalFormat === 'min' ? `${val}m` : val === 1 && habit.goalFormat !== '$' ? '✓' : val}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="px-4 space-y-6">
                                {/* Calendar Toggle Button */}
                                <button
                                    onClick={() => setShowFullMonth(!showFullMonth)}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-slate-200/50"
                                >
                                    {showFullMonth ? <BarChart2 size={18} /> : <Calendar size={18} />}
                                    {showFullMonth ? 'Back to Weekly Chart' : 'See Full Month View'}
                                </button>

                                {/* Dashboard-style Summary Statistics */}
                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.15)] mx-3">
                                    <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                                        {[
                                            { label: 'THIS WEEK', value: stats.summary.thisWeek },
                                            { label: 'LAST WEEK', value: stats.summary.lastWeek },
                                            { label: 'THIS MONTH', value: stats.summary.thisMonth },
                                            { label: 'LAST MONTH', value: stats.summary.lastMonth },
                                            { label: 'THIS YEAR', value: stats.summary.thisYear },
                                            { label: 'LAST YEAR', value: stats.summary.lastYear },
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1 leading-none text-center">
                                                    {item.label}
                                                </span>
                                                <span className={`font-black tabular-nums transition-all leading-none ${item.value > 0 ? 'text-white text-2xl' : 'text-white/20 text-xl'}`}>
                                                    {formatValue(item.value, true) || '0'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HabitDetail;
