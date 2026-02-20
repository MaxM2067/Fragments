
import React, { useMemo, useState } from 'react';
import { Habit, DailyLog, Category, DailyProgress } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, YAxis, LabelList } from 'recharts';
import { TrendingUp, Award, Calendar, Zap, DollarSign, Gem, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeekDaysInTimezone, formatDateInTimezone } from '../utils/dateUtils';

interface Props {
  habits: Habit[];
  logs: Record<string, DailyLog>;
  categories: Category[];
  userTimezone: string;
  userWeekStart: 'monday' | 'sunday';
}

const Statistics: React.FC<Props> = ({ habits, logs, categories, userTimezone, userWeekStart }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const moneyHabitIds = useMemo(() => new Set(habits.filter(h => h.goalFormat === '$').map(h => h.id)), [habits]);
  const dailyMinHabitIds = useMemo(() => new Set(habits.filter(h => h.dailyMinimum).map(h => h.id)), [habits]);
  const hasMoneyHabits = moneyHabitIds.size > 0;

  const chartData = useMemo(() => {
    const weekDays = getWeekDaysInTimezone(weekOffset, userTimezone, userWeekStart);

    return weekDays.map(date => {
      const log = logs[date];
      if (!log) return { name: date, totalFragments: 0, money: 0, mood: 0, date };

      let totalFragments = 0;
      let money = 0;
      const categoryFragments: Record<string, number> = {};
      const dailyMinHabitsForDate = habits.filter(h => h.dailyMinimum);
      let dailyMinCompletedCount = 0;

      for (const [id, p] of Object.entries(log.progress)) {
        const habit = habits.find(h => h.id === id);
        if (moneyHabitIds.has(id)) {
          money += (p as DailyProgress).moneyEarned || 0;
        } else {
          const habitCompletions = (p as DailyProgress).completions || 0;
          totalFragments += habitCompletions;

          if (habit) {
            const cat = categories.find(c => c.id === habit.categoryId);
            const catName = cat ? cat.name : 'Uncategorized';
            categoryFragments[catName] = (categoryFragments[catName] || 0) + habitCompletions;
          } else {
            categoryFragments['Uncategorized'] = (categoryFragments['Uncategorized'] || 0) + habitCompletions;
          }
        }

        if (dailyMinHabitIds.has(id)) {
          const habit = habits.find(h => h.id === id);
          if (habit) {
            const progress = p as DailyProgress;
            if (habit.stepType === 'multiple') {
              const stepsCount = habit.goal && habit.stepValue ? Math.floor(habit.goal / habit.stepValue) : 0;
              if (stepsCount > 0 && progress.stepsCompleted >= stepsCount) dailyMinCompletedCount++;
            } else if (progress.completed || progress.completions > 0) {
              dailyMinCompletedCount++;
            }
          }
        }
      }

      const dailyMinMet = dailyMinHabitsForDate.length > 0 && dailyMinCompletedCount === dailyMinHabitsForDate.length;

      return {
        name: date,
        totalFragments,
        money,
        mood: log.mood,
        dailyMinMet,
        date,
        ...categoryFragments
      };
    });
  }, [logs, moneyHabitIds, dailyMinHabitIds, habits, categories, userTimezone, weekOffset, userWeekStart]);

  const stats = useMemo(() => {
    const allLogs = Object.values(logs) as DailyLog[];
    const now = new Date();
    const todayStr = formatDateInTimezone(now, userTimezone);
    const [todayYear, todayMonth] = todayStr.split('-').map(Number);

    // Total Fragments (excluding $ habits)
    const totalFragments = allLogs.reduce((sum, log) => {
      return sum + Object.entries(log.progress).reduce((ps, [id, p]) => {
        if (moneyHabitIds.has(id)) return ps;
        return ps + ((p as DailyProgress).completions || 0);
      }, 0);
    }, 0);

    // Total Money
    const totalMoney = allLogs.reduce((sum, log) => {
      return sum + Object.entries(log.progress).reduce((ps, [id, p]) => {
        if (!moneyHabitIds.has(id)) return ps;
        return ps + ((p as DailyProgress).moneyEarned || 0);
      }, 0);
    }, 0);

    const monthLogs = allLogs.filter(log => {
      const [y, m] = log.date.split('-').map(Number);
      return m === todayMonth && y === todayYear;
    });

    const monthFragments = monthLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).completions || 0), 0), 0);

    const monthMoney = monthLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        !moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).moneyEarned || 0), 0), 0);

    // Current Week Range calculation for chart title
    const thisWeek = getWeekDaysInTimezone(weekOffset, userTimezone, userWeekStart);
    const firstDay = new Date(thisWeek[0]);
    const lastDay = new Date(thisWeek[6]);
    const weekRange = firstDay.getMonth() === lastDay.getMonth()
      ? `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${firstDay.getDate()}-${lastDay.getDate()}`
      : `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${firstDay.getDate()} - ${lastDay.toLocaleDateString('en-US', { month: 'short' })} ${lastDay.getDate()}`;

    const weekFragmentsTotal = chartData.reduce((sum, day) => sum + day.totalFragments, 0);

    // Summary (Relative to 0 offset)
    const last7Days = getWeekDaysInTimezone(0, userTimezone, userWeekStart);
    const weekLogs = allLogs.filter(log => last7Days.includes(log.date));

    const weekFragments = weekLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).completions || 0), 0), 0);

    const weekMoney = weekLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        !moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).moneyEarned || 0), 0), 0);

    const moodAvg = allLogs.length > 0
      ? (allLogs.reduce((s, l) => s + l.mood, 0) / allLogs.length).toFixed(1)
      : '0';

    return { totalFragments, totalMoney, monthFragments, monthMoney, weekFragments, weekMoney, moodAvg, weekRange, weekFragmentsTotal };
  }, [logs, moneyHabitIds, userTimezone, weekOffset, userWeekStart, chartData]);

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-black text-cozy-text tracking-tight">Performance</h2>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500 p-6 rounded-block text-white shadow-header border-b-8 border-blue-700 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Award size={16} className="text-blue-200" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Frags</span>
          </div>
          <p className="text-4xl font-black tabular-nums">{stats.totalFragments}</p>
        </div>
        {hasMoneyHabits ? (
          <div className="bg-emerald-500 p-6 rounded-block text-white shadow-header border-b-8 border-emerald-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-emerald-200" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Earned</span>
            </div>
            <p className="text-4xl font-black tabular-nums">${stats.totalMoney}</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-block shadow-block border-4 border-indigo-50/20 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-cozy-text/50">Avg Mood</span>
            </div>
            <p className="text-4xl font-black text-cozy-text tabular-nums">{stats.moodAvg}</p>
          </div>
        )}
      </div>

      {/* Avg Mood (if money habits exist, show mood separately) */}
      {hasMoneyHabits && (
        <div className="bg-white p-6 rounded-block shadow-block border-4 border-indigo-50/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-cozy-text/50">Avg Mood</span>
            </div>
            <p className="text-3xl font-black text-cozy-text tabular-nums">{stats.moodAvg}</p>
          </div>
        </div>
      )}

      {/* Weekly/Monthly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-block shadow-block border-4 border-indigo-50/20">
          <Calendar size={20} className="text-blue-400 mb-2" />
          <p className="text-[10px] font-black text-cozy-text/40 uppercase tracking-widest mb-1">Weekly</p>
          <p className="text-2xl font-black text-cozy-text tabular-nums">{stats.weekFragments} <span className="text-xs font-black text-blue-500/40">frags</span></p>
          {hasMoneyHabits && (
            <p className="text-lg font-black text-emerald-500 tabular-nums mt-1">${stats.weekMoney}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-block shadow-block border-4 border-indigo-50/20">
          <Calendar size={20} className="text-blue-400 mb-2" />
          <p className="text-[10px] font-black text-cozy-text/40 uppercase tracking-widest mb-1">Monthly</p>
          <p className="text-2xl font-black text-cozy-text tabular-nums">{stats.monthFragments} <span className="text-xs font-black text-blue-500/40">frags</span></p>
          {hasMoneyHabits && (
            <p className="text-lg font-black text-emerald-500 tabular-nums mt-1">${stats.monthMoney}</p>
          )}
        </div>
      </div>

      {/* Fragments Chart */}
      <div className="bg-white p-8 rounded-block shadow-block border-4 border-indigo-50/20 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
            <TrendingUp size={20} className="text-blue-500" />
            Fragments Collected
          </h3>
          <div className="flex items-center gap-3 bg-slate-50 p-1 px-2 rounded-xl">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1 hover:bg-white rounded-lg text-slate-400 shadow-sm transition-all active:scale-95"><ChevronLeft size={16} /></button>
            <div className="text-center min-w-[100px]">
              <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider leading-none mb-0.5">{stats.weekRange}</h4>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stats.weekFragmentsTotal} total</span>
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1 hover:bg-white rounded-lg text-slate-400 shadow-sm transition-all active:scale-95"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 30 }}>
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
                      <text x={0} y={15} textAnchor="middle" fill="#1E293B" fontSize={16} fontWeight={900}>{dayName.charAt(0)}</text>
                      <text x={0} y={30} textAnchor="middle" fill="#94A3B8" fontSize={9} fontWeight={500}>{dateStr}</text>
                    </g>
                  );
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)', radius: 16 }}
                contentStyle={{ borderRadius: '2rem', border: '4px solid #FBFCFE', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff', fontWeight: 900 }}
              />
              {categories.map((cat, idx) => (
                <Bar
                  key={cat.id}
                  dataKey={cat.name}
                  stackId="a"
                  fill={cat.color}
                  barSize={24}
                  isAnimationActive={false}
                  shape={(props: any) => {
                    const { x, y, width, height, fill, payload, dataKey } = props;
                    if (height <= 0) return null;
                    const stackKeys = [...categories.map(c => c.name), 'Uncategorized'];
                    const currentIndex = stackKeys.indexOf(dataKey);
                    const isTop = stackKeys.slice(currentIndex + 1).every(key => !payload[key] || payload[key] === 0);
                    const r = 12;
                    if (isTop) {
                      return (
                        <path
                          d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
                          fill={fill}
                        />
                      );
                    }
                    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                  }}
                />
              ))}
              <Bar
                dataKey="Uncategorized"
                stackId="a"
                fill="#E2E8F0"
                barSize={24}
                isAnimationActive={false}
                shape={(props: any) => {
                  const { x, y, width, height, fill } = props;
                  if (height <= 0) return null;
                  const r = 12;
                  return (
                    <path
                      d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
                      fill={fill}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="dailyMinMet"
                  content={(props: any) => {
                    const { x, y, width, value } = props;
                    if (!value) return null;
                    return (
                      <svg x={x + width / 2 - 8} y={y - 28} width={16} height={16} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
                        <Gem size={16} className="text-amber-400" fill="currentColor" />
                      </svg>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Money Chart (only if money habits exist) */}
      {hasMoneyHabits && (
        <div className="bg-white p-8 rounded-block shadow-block border-4 border-indigo-50/20 space-y-6">
          <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
            <DollarSign size={20} className="text-emerald-500" />
            Money Earned
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#CBD5E1' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)', radius: 16 }}
                  contentStyle={{ borderRadius: '2rem', border: '4px solid #FBFCFE', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff', fontWeight: 900 }}
                  formatter={(value: number) => [`$${value}`, 'Money']}
                />
                <Bar dataKey="money" fill="#10B981" radius={[12, 12, 12, 12]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Mood Chart */}
      <div className="bg-white p-8 rounded-block shadow-block border-4 border-indigo-50/20 space-y-6">
        <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
          <Award size={20} className="text-indigo-500" />
          Recent Mood
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#FBFCFE" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 11, fontWeight: 900, fill: '#CBD5E1' }}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              />
              <YAxis hide domain={[-1, 4]} />
              <Tooltip
                contentStyle={{ borderRadius: '2rem', border: '4px solid #FBFCFE', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff', fontWeight: 900 }}
              />
              <Line type="monotone" dataKey="mood" stroke="#6366F1" strokeWidth={6} dot={{ r: 6, fill: '#6366F1', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
