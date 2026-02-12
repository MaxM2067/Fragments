
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  mood: number;
  onMoodChange: (mood: number) => void;
  isLarge?: boolean;
}

const MoodBar: React.FC<Props> = ({ mood, onMoodChange, isLarge }) => {
  const moodEmojis: Record<number, string> = {
    [-3]: '😫',
    [-2]: '😢',
    [-1]: '😕',
    [0]: '😐',
    [1]: '🙂',
    [2]: '😊',
    [3]: '🤩',
  };

  const steps = [-3, -2, -1, 0, 1, 2, 3];

  if (isLarge) {
    return (
      <div className="w-full max-w-sm mx-auto p-8 rounded-cozy bg-white shadow-xl shadow-indigo-100/50 border-4 border-indigo-50/50 flex flex-col items-center gap-8">
        <motion.div
          key={mood}
          initial={{ scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-8xl drop-shadow-xl"
        >
          {moodEmojis[mood]}
        </motion.div>

        <div className="w-full px-4">
          <div className="relative h-12 flex items-center px-1">
            <div className="absolute left-2 right-2 h-3 bg-indigo-50/50 rounded-full" />
            <div className="relative w-full flex justify-between items-center">
              {steps.map(step => (
                <button
                  key={step}
                  onClick={() => onMoodChange(step)}
                  className="group relative flex flex-col items-center justify-center w-12 h-12 z-10"
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-500 ${mood === step ? 'scale-125 bg-indigo-500 shadow-lg shadow-indigo-100 border-4 border-white' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                  />
                  {mood === step && (
                    <motion.div
                      layoutId="active-mood-large"
                      className="absolute inset-0 bg-indigo-50 rounded-bubble -z-10"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between px-2 mt-2">
            <span className="text-[11px] font-black text-cozy-text/30 uppercase tracking-widest">Low</span>
            <span className="text-[11px] font-black text-cozy-text/30 uppercase tracking-widest">High</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for smaller rendering if needed elsewhere
  return (
    <div className="mx-5 mb-2 bg-white/80 backdrop-blur-md p-3 rounded-bubble shadow-lg shadow-indigo-100/20 border-2 border-indigo-50/50 flex flex-col gap-2">
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-black text-cozy-text/40 uppercase tracking-widest">How's it going?</span>
        <span className="text-xl drop-shadow-sm">{moodEmojis[mood]}</span>
      </div>
      <div className="relative h-6 flex items-center px-1">
        <div className="absolute left-2 right-2 h-1.5 bg-indigo-50 rounded-full" />
        <div className="relative w-full flex justify-between items-center">
          {steps.map(step => (
            <button
              key={step}
              onClick={() => onMoodChange(step)}
              className="group relative flex flex-col items-center justify-center w-6 h-6 z-10"
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${mood === step ? 'scale-125 bg-indigo-500 shadow-md border-2 border-white' : 'bg-indigo-100/50 group-hover:bg-indigo-200'}`}
              />
              {mood === step && (
                <motion.div
                  layoutId="active-mood"
                  className="absolute inset-0 bg-indigo-50 rounded-full -z-10"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodBar;
