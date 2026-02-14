
import React from 'react';
import { ViewState } from '../types';
import { BarChart2, Settings, List, Smile, Plus } from 'lucide-react';

interface Props {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  resetEditing: () => void;
}

const BottomNav: React.FC<Props> = ({ currentView, setView, resetEditing }) => {
  const handleAddClick = () => {
    resetEditing();
    setView('add-habit');
  };

  const navBtn = (view: ViewState, icon: React.ReactNode, label: string) => {
    const active = currentView === view;
    return (
      <button
        onClick={() => setView(view)}
        className={`flex flex-col items-center gap-0.5 flex-1 transition-colors duration-300 ${active ? 'text-white' : 'text-white/40'}`}
      >
        <div className={`p-1.5 rounded-block transition-all duration-300 ${active ? 'bg-white/20 scale-110' : ''}`}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <nav className="relative px-2 pt-2 pb-3 flex justify-between items-center rounded-t-2xl"
      style={{ background: 'linear-gradient(135deg, #3d8a47, #2d7a3a)' }}
    >
      {navBtn('habits', <List size={20} strokeWidth={3} />, 'Habits')}
      {navBtn('mood', <Smile size={20} strokeWidth={3} />, 'Mood')}

      <div className="flex-1 flex justify-center -mt-8">
        <button
          onClick={handleAddClick}
          className="w-14 h-14 bg-white text-emerald-600 rounded-block flex items-center justify-center shadow-xl border-b-4 border-emerald-200 active:border-b-0 active:translate-y-0.5 transition-all"
        >
          <Plus size={32} strokeWidth={4} />
        </button>
      </div>

      {navBtn('statistics', <BarChart2 size={20} strokeWidth={3} />, 'Stats')}
      {navBtn('settings', <Settings size={20} strokeWidth={3} />, 'Settings')}
    </nav>
  );
};

export default BottomNav;
