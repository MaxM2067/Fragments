
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

  return (
    <nav className="relative bg-white/80 backdrop-blur-md border-t-2 border-orange-50/50 px-2 pt-2 pb-6 flex justify-between items-center safe-bottom shadow-2xl shadow-orange-100/20 rounded-t-bubble">
      {/* Habits */}
      <button
        onClick={() => setView('habits')}
        className={`flex flex-col items-center gap-0.5 flex-1 transition-colors duration-300 ${currentView === 'habits' ? 'text-cozy-indigo' : 'text-slate-300'}`}
      >
        <div className={`p-2 rounded-bubble transition-all duration-500 ${currentView === 'habits' ? 'bg-indigo-50 scale-110 shadow-inner' : ''}`}>
          <List size={20} strokeWidth={3} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">Habits</span>
      </button>

      {/* Mood */}
      <button
        onClick={() => setView('mood')}
        className={`flex flex-col items-center gap-0.5 flex-1 transition-colors duration-300 ${currentView === 'mood' ? 'text-cozy-indigo' : 'text-slate-300'}`}
      >
        <div className={`p-2 rounded-bubble transition-all duration-500 ${currentView === 'mood' ? 'bg-indigo-50 scale-110 shadow-inner' : ''}`}>
          <Smile size={20} strokeWidth={3} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">Mood</span>
      </button>

      <div className="flex-1 flex justify-center -mt-12">
        <button
          onClick={handleAddClick}
          className="w-16 h-16 bg-cozy-indigo text-white rounded-bubble flex items-center justify-center shadow-xl shadow-indigo-100 border-b-8 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
        >
          <Plus size={36} strokeWidth={4} />
        </button>
      </div>

      {/* Stats */}
      <button
        onClick={() => setView('statistics')}
        className={`flex flex-col items-center gap-0.5 flex-1 transition-colors duration-300 ${currentView === 'statistics' ? 'text-cozy-indigo' : 'text-slate-300'}`}
      >
        <div className={`p-2 rounded-bubble transition-all duration-500 ${currentView === 'statistics' ? 'bg-indigo-50 scale-110 shadow-inner' : ''}`}>
          <BarChart2 size={20} strokeWidth={3} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">Stats</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => setView('settings')}
        className={`flex flex-col items-center gap-0.5 flex-1 transition-colors duration-300 ${currentView === 'settings' ? 'text-cozy-indigo' : 'text-slate-300'}`}
      >
        <div className={`p-2 rounded-bubble transition-all duration-500 ${currentView === 'settings' ? 'bg-indigo-50 scale-110 shadow-inner' : ''}`}>
          <Settings size={20} strokeWidth={3} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider">Settings</span>
      </button>
    </nav>
  );
};

export default BottomNav;
