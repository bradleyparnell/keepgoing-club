export type Tab = 'timer' | 'projects' | 'sounds';
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';
export type BeatMode = 'gamma' | 'alpha' | 'theta' | 'binaural';

export interface Project {
  id: string;
  name: string;
  color: string;
  totalTomatoes: number;
  completedTomatoes: number;
}

export interface Task {
  id: string;
  projectId: string;
  text: string;
  done: boolean;
}
