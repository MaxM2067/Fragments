
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  icon: string;
  repetition: 'daily' | 'weekly' | 'custom';
  timeOfDay: TimeOfDay;
  oneTimeValue?: number; // In minutes
  goal?: number; // In minutes
  rewardValue?: number; // Fragments earned per completion
  createdAt: number;
}

export interface DailyProgress {
  habitId: string;
  completed: boolean;
  completions: number; // Added to track multiple completions/points
  elapsedTime: number; // In seconds
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: number; // -3 to 3
  progress: Record<string, DailyProgress>;
}

export type ViewState = 'habits' | 'mood' | 'statistics' | 'settings' | 'add-habit';
