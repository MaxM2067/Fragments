
import React, { useMemo } from 'react';
import { Habit, DailyLog, Category, DailyProgress } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, YAxis } from 'recharts';
import { TrendingUp, Award, Calendar, Zap } from 'lucide-react';

interface Props {
  habits: Habit[];
  logs: Record<string, DailyLog>;
  categories: Category[];
}

const Statistics: React.FC<Props> = ({ habits, logs }) => {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const log = logs[date];
      if (!log) return { name: date.split('-').slice(2).join('/'), fragments: 0, mood: 0 };

      const fragments = (Object.values(log.progress) as DailyProgress[]).reduce((sum, p) => sum + (p.completions || 0), 0);
      return {
        name: date.split('-').slice(2).join('/'),
        fragments: fragments,
        mood: log.mood,
      };
    });
  }, [logs]);

  const stats = useMemo(() => {
    const allLogs = Object.values(logs) as DailyLog[];
    const now = new Date();

    // Total Fragments
    const totalFragments = allLogs.reduce((sum, log) => {
      return sum + (Object.values(log.progress) as DailyProgress[]).reduce((ps, p) => ps + (p.completions || 0), 0);
    }, 0);

    // Current Month Fragments
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthFragments = allLogs
      .filter(log => {
        const d = new Date(log.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, log) => sum + (Object.values(log.progress) as DailyProgress[]).reduce((ps, p) => ps + (p.completions || 0), 0), 0);

    // Current Week Fragments
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekFragments = allLogs
      .filter(log => new Date(log.date) >= startOfWeek)
      .reduce((sum, log) => sum + (Object.values(log.progress) as DailyProgress[]).reduce((ps, p) => ps + (p.completions || 0), 0), 0);

    const moodAvg = allLogs.length > 0
      ? (allLogs.reduce((s, l) => s + l.mood, 0) / allLogs.length).toFixed(1)
      : '0';

    return { totalFragments, monthFragments, weekFragments, moodAvg };
  }, [logs]);

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-black text-cozy-text tracking-tight">Performance</h2>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-500 p-6 rounded-cozy text-white shadow-xl shadow-indigo-100 border-b-8 border-indigo-700 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-cerulean-300 fill-cerulean-300" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Frags</span>
          </div>
          <p className="text-4xl font-black tabular-nums">{stats.totalFragments}</p>
        </div>
        <div className="bg-white p-6 rounded-cozy shadow-md shadow-indigo-50/50 border-4 border-indigo-50/20 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Award size={16} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cozy-text/50">Avg Mood</span>
          </div>
          <p className="text-4xl font-black text-cozy-text tabular-nums">{stats.moodAvg}</p>
        </div>
      </div>

      {/* Weekly/Monthly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-bubble shadow-md shadow-indigo-50/50 border-4 border-indigo-50/20">
          <Calendar size={20} className="text-indigo-400 mb-2" />
          <p className="text-[10px] font-black text-cozy-text/40 uppercase tracking-widest mb-1">Weekly</p>
          <p className="text-2xl font-black text-cozy-text tabular-nums">{stats.weekFragments} <span className="text-xs font-black text-cozy-text/30">frags</span></p>
        </div>
        <div className="bg-white p-6 rounded-bubble shadow-md shadow-indigo-50/50 border-4 border-indigo-50/20">
          <Calendar size={20} className="text-indigo-400 mb-2" />
          <p className="text-[10px] font-black text-cozy-text/40 uppercase tracking-widest mb-1">Monthly</p>
          <p className="text-2xl font-black text-cozy-text tabular-nums">{stats.monthFragments} <span className="text-xs font-black text-cozy-text/30">frags</span></p>
        </div>
      </div>

      {/* Fragments Chart - Cozy */}
      <div className="bg-white p-8 rounded-cozy shadow-md shadow-indigo-50/50 border-4 border-indigo-50/20 space-y-6">
        <h3 className="font-black text-cozy-text/40 flex items-center gap-2 text-xs uppercase tracking-widest">
          <TrendingUp size={20} className="text-cozy-indigo" />
          Fragments Collected
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#CBD5E1' }} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)', radius: 16 }}
                contentStyle={{ borderRadius: '2rem', border: '4px solid #FBFCFE', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff', fontWeight: 900 }}
              />
              <Bar dataKey="fragments" fill="#818CF8" radius={[12, 12, 12, 12]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood Line - Cozy */}
      <div className="bg-white p-8 rounded-cozy shadow-md shadow-indigo-50/50 border-4 border-indigo-50/20 space-y-6">
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
