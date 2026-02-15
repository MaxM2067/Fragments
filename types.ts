
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type GoalFormat = 'min' | 'times' | '$';
export type StepType = 'single' | 'multiple';

export interface Habit {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  icon: string;
  repetition: 'daily' | 'weekly' | 'custom';
  timeOfDay: TimeOfDay;
  oneTimeValue?: number; // In minutes
  goal?: number; // Goal value in goalFormat units
  rewardValue?: number; // Fragments earned per completion (for min/times)
  stepType?: StepType; // 'single' (default) or 'multiple'
  goalFormat?: GoalFormat; // 'min' (default), 'times', or '$'
  stepValue?: number; // Value per step in goalFormat units (also $ per step for '$' goals)
  isMain?: boolean;
  dailyMinimum?: boolean;
  keepInListWhenDone?: boolean;
  createdAt: number;
}

export interface DailyProgress {
  habitId: string;
  completed: boolean;
  completions: number; // Fragment completions (for min/times habits)
  elapsedTime: number; // In seconds
  stepsCompleted: number; // Steps done today (for multi-step habits)
  moneyEarned: number; // $ earned today (for $ habits)
  skipped?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: number; // -3 to 3
  progress: Record<string, DailyProgress>;
}

export type ViewState = 'habits' | 'mood' | 'statistics' | 'settings' | 'add-habit';
