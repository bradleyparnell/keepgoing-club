import { Project, Task } from '../types';

const P = 'kg_';

export const storage = {
  getDailyBudget: (): number => {
    const v = localStorage.getItem(`${P}daily_budget`);
    return v ? parseInt(v, 10) || 8 : 8;
  },
  setDailyBudget: (n: number): void => {
    localStorage.setItem(`${P}daily_budget`, String(n));
  },

  getProjects: (): Project[] => {
    try { return JSON.parse(localStorage.getItem(`${P}projects`) || '[]'); }
    catch { return []; }
  },
  saveProjects: (projects: Project[]): void => {
    localStorage.setItem(`${P}projects`, JSON.stringify(projects));
  },

  getTasks: (): Task[] => {
    try { return JSON.parse(localStorage.getItem(`${P}tasks`) || '[]'); }
    catch { return []; }
  },
  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem(`${P}tasks`, JSON.stringify(tasks));
  },

  getActiveProjectId: (): string | null => {
    return localStorage.getItem(`${P}active_project`);
  },
  setActiveProjectId: (id: string | null): void => {
    if (id) localStorage.setItem(`${P}active_project`, id);
    else localStorage.removeItem(`${P}active_project`);
  },
};
