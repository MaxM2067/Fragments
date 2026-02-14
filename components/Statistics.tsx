
import React, { useMemo } from 'react';
import { Habit, DailyLog, Category, DailyProgress } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, YAxis } from 'recharts';
import { TrendingUp, Award, Calendar, Zap, DollarSign } from 'lucide-react';

interface Props {
  habits: Habit[];
  logs: Record<string, DailyLog>;
  categories: Category[];
}

const Statistics: React.FC<Props> = ({ habits, logs }) => {
  const moneyHabitIds = useMemo(() => new Set(habits.filter(h => h.goalFormat === '$').map(h => h.id)), [habits]);
  const hasMoneyHabits = moneyHabitIds.size > 0;

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const log = logs[date];
      if (!log) return { name: date.split('-').slice(2).join('/'), fragments: 0, money: 0, mood: 0 };

      let fragments = 0;
      let money = 0;
      for (const [id, p] of Object.entries(log.progress)) {
        if (moneyHabitIds.has(id)) {
          money += (p as DailyProgress).moneyEarned || 0;
        } else {
          fragments += (p as DailyProgress).completions || 0;
        }
      }

      return {
        name: date.split('-').slice(2).join('/'),
        fragments,
        money,
        mood: log.mood,
      };
    });
  }, [logs, moneyHabitIds]);

  const stats = useMemo(() => {
    const allLogs = Object.values(logs) as DailyLog[];
    const now = new Date();

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

    // Current Month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthLogs = allLogs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthFragments = monthLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).completions || 0), 0), 0);

    const monthMoney = monthLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        !moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).moneyEarned || 0), 0), 0);

    // Current Week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekLogs = allLogs.filter(log => new Date(log.date) >= startOfWeek);

    const weekFragments = weekLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).completions || 0), 0), 0);

    const weekMoney = weekLogs.reduce((sum, log) =>
      sum + Object.entries(log.progress).reduce((ps, [id, p]) =>
        !moneyHabitIds.has(id) ? ps : ps + ((p as DailyProgress).moneyEarned || 0), 0), 0);

    const moodAvg = allLogs.length > 0
      ? (allLogs.reduce((s, l) => s + l.mood, 0) / allLogs.length).toFixed(1)
      : '0';

    return { totalFragments, totalMoney, monthFragments, monthMoney, weekFragments, weekMoney, moodAvg };
  }, [logs, moneyHabitIds]);

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
        <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
          <TrendingUp size={20} className="text-blue-500" />
          Fragments Collected
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#CBD5E1' }} />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)', radius: 16 }}
                contentStyle={{ borderRadius: '2rem', border: '4px solid #FBFCFE', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff', fontWeight: 900 }}
              />
              <Bar dataKey="fragments" fill="#3B82F6" radius={[12, 12, 12, 12]} barSize={24} />
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

      {/* Mood Line */}
      <div className="bg-white p-8 rounded-block shadow-block border-4 border-indigo-50/20 space-y-6">
        <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
          Recent Mood
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#FBFCFE" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#CBD5E1' }} />
              <YAxis hide domain={[-3, 4]} />
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
