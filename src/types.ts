export type Tab = 'timer' | 'projects' | 'sounds' | 'calendar';
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';
export type BeatMode = 'gamma' | 'alpha' | 'theta' | 'binaural' | 'lofi' | 'ceo';

export interface Project {
  id: string;
  name: string;
  color: string;
  totalTomatoes: number;
  completedTomatoes: number;
  plannedDate: string; // YYYY-MM-DD
  notes: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  text: string;
  done: boolean;
}
