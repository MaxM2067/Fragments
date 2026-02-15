
import React, { useState, useMemo } from 'react';
import { Habit, Category, DailyProgress } from '../types';
import HabitCard from './HabitCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIconById } from '../constants';

interface HabitGroupProps {
    title: string;
    isFirst?: boolean;
    habits: Habit[];
    categories: Category[];
    todayProgress: Record<string, DailyProgress>;
    activeHabitIds: Set<string>;
    onUpdateProgress: (habitId: string, update: Partial<DailyProgress>) => void;
    onToggleTimer: (habitId: string) => void;
    onIncrementCompletion: (habitId: string) => void;
    onDecrementCompletion: (habitId: string) => void;
    onSkipHabit: (habitId: string) => void;
    onEditHabit: (id: string) => void;
    swipedHabitId: string | null;
    setSwipedHabitId: (id: string | null) => void;
}

const HabitGroup: React.FC<HabitGroupProps> = ({
    title,
    isFirst,
    habits,
    categories,
    todayProgress,
    activeHabitIds,
    onUpdateProgress,
    onToggleTimer,
    onIncrementCompletion,
    onDecrementCompletion,
    onSkipHabit,
    onEditHabit,
    swipedHabitId,
    setSwipedHabitId,
}) => {
    const isCollapsible = habits.length > 1;
    const [isExpanded, setIsExpanded] = useState(true);

    const effectivelyExpanded = !isCollapsible || isExpanded;

    const firstHabit = habits[0];
    const firstCategory = categories.find(c => c.id === firstHabit.categoryId);

    const summaryText = useMemo(() => {
        if (habits.length <= 1) return firstHabit.name;
        return `${firstHabit.name}, +${habits.length - 1} more`;
    }, [habits, firstHabit]);

    return (
        <div className="habit-group-container">
            <div className="habit-group-header" style={{ marginTop: isFirst ? '0.1rem' : undefined }}>
                <span className="habit-group-title">{title}</span>
                <div className="habit-group-line" />
                {isCollapsible && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="habit-group-toggle"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
            </div>

            <AnimatePresence initial={false}>
                {effectivelyExpanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="space-y-2"
                        style={{
                            gap: 'var(--spacing-list-gap, 0.5rem)',
                            position: 'relative',
                            zIndex: 2, /* Higher than headers */
                        }}
                    >
                        <div className="grid" style={{ gap: 'var(--spacing-list-gap, 0.5rem)' }}>
                            {habits.map(habit => (
                                <HabitCard
                                    key={habit.id}
                                    habit={habit}
                                    category={categories.find(c => c.id === habit.categoryId)}
                                    progress={todayProgress[habit.id]}
                                    isRunning={activeHabitIds.has(habit.id)}
                                    onUpdate={onUpdateProgress}
                                    onToggleTimer={onToggleTimer}
                                    onIncrementCompletion={onIncrementCompletion}
                                    onDecrementCompletion={onDecrementCompletion}
                                    onSkip={onSkipHabit}
                                    onEdit={onEditHabit}
                                    isSwiped={swipedHabitId === habit.id}
                                    onSwipe={(id) => setSwipedHabitId(id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="habit-stack-container"
                        onClick={() => setIsExpanded(true)}
                    >
                        <div className="habit-stack-bg-2" />
                        <div className="habit-stack-bg" />
                        <div className="habit-stack-main">
                            <div className="habit-stack-content">
                                <div
                                    className="habit-stack-icon"
                                    style={{ backgroundColor: firstCategory?.color || '#cbd5e1' }}
                                >
                                    {React.cloneElement(getIconById(firstHabit.icon) as React.ReactElement, { size: 22 })}
                                </div>
                                <div className="habit-stack-info">
                                    <div className="habit-stack-group-name">{title}</div>
                                    <div className="habit-stack-summary truncate">{summaryText}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HabitGroup;
