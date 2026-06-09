import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Timer, LayoutGrid, Music } from 'lucide-react';
import { TimerTab } from './components/TimerTab';
import { ProjectsTab } from './components/ProjectsTab';
import { SoundsTab } from './components/SoundsTab';
import { Tab, TimerPhase, BeatMode, Project, Task } from './types';
import { neuroBeat } from './utils/audio';
import { storage } from './utils/storage';
import { todayISO } from './utils/dateUtils';
import './index.css';

const DURATIONS: Record<TimerPhase, number> = {
  focus:      25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

function playDing() {
  try {
    const ctx = new AudioContext();
    [0, 0.18, 0.36].forEach(delay => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch (_) { /* AudioContext not available */ }
}

const App: React.FC = () => {
  const [tab, setTab]                         = useState<Tab>('projects');
  const [projects, setProjects]               = useState<Project[]>([]);
  const [tasks, setTasks]                     = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [dailyBudget, setDailyBudget]         = useState(8);
  const [selectedDate, setSelectedDate]       = useState(todayISO);
  const [loading, setLoading]                 = useState(true);

  // Timer state
  const [phase, setPhase]               = useState<TimerPhase>('focus');
  const [timeLeft, setTimeLeft]         = useState(DURATIONS.focus);
  const [isRunning, setIsRunning]       = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [completed, setCompleted]       = useState(false);

  const phaseRef         = useRef(phase);
  const sessionCountRef  = useRef(sessionCount);
  const activeProjectRef = useRef(activeProjectId);
  useEffect(() => { phaseRef.current         = phase;           }, [phase]);
  useEffect(() => { sessionCountRef.current  = sessionCount;    }, [sessionCount]);
  useEffect(() => { activeProjectRef.current = activeProjectId; }, [activeProjectId]);

  // Music state
  const [beatMode, setBeatMode]         = useState<BeatMode>('gamma');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume]             = useState(0.4);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    setDailyBudget(storage.getDailyBudget());
    const today = todayISO();
    // Backfill plannedDate for any legacy projects that lack it
    const rawProjects = storage.getProjects().map((p: Project) => ({
      ...p,
      plannedDate: p.plannedDate || today,
    }));
    setProjects(rawProjects);
    setTasks(storage.getTasks());
    setActiveProjectId(storage.getActiveProjectId());
    setLoading(false);
  }, []);

  // ── Auto-save when state changes ─────────────────────────────────────────
  useEffect(() => { if (!loading) storage.saveProjects(projects);      }, [projects, loading]);
  useEffect(() => { if (!loading) storage.saveTasks(tasks);            }, [tasks, loading]);
  useEffect(() => { if (!loading) storage.setDailyBudget(dailyBudget); }, [dailyBudget, loading]);
  useEffect(() => { storage.setActiveProjectId(activeProjectId);       }, [activeProjectId]);

  // ── Timer interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // ── Handle timer completion ───────────────────────────────────────────────
  useEffect(() => {
    if (!completed) return;
    setCompleted(false);
    playDing();

    const curPhase  = phaseRef.current;
    const curCount  = sessionCountRef.current;
    const curProjId = activeProjectRef.current;

    if (curPhase === 'focus') {
      const newCount = curCount + 1;
      setSessionCount(newCount);

      if (curProjId) {
        setProjects(prev => prev.map(p => {
          if (p.id === curProjId && p.completedTomatoes < p.totalTomatoes) {
            return { ...p, completedTomatoes: p.completedTomatoes + 1 };
          }
          return p;
        }));
      }

      const nextPhase: TimerPhase = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setPhase(nextPhase);
      setTimeLeft(DURATIONS[nextPhase]);
    } else {
      setPhase('focus');
      setTimeLeft(DURATIONS.focus);
    }
  }, [completed]);

  // ── Timer controls ────────────────────────────────────────────────────────
  function handleChangePhase(p: TimerPhase) {
    if (isRunning) return;
    setPhase(p);
    setTimeLeft(DURATIONS[p]);
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(DURATIONS[phase]);
  }

  function handleSkip() {
    setIsRunning(false);
    if (phase === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      const next: TimerPhase = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setPhase(next);
      setTimeLeft(DURATIONS[next]);
    } else {
      setPhase('focus');
      setTimeLeft(DURATIONS.focus);
    }
  }

  // ── Music controls ────────────────────────────────────────────────────────
  function handleMusicToggle() {
    if (musicPlaying) {
      neuroBeat.stop();
      setMusicPlaying(false);
    } else {
      neuroBeat.start(beatMode, volume);
      setMusicPlaying(true);
    }
  }

  function handleModeChange(mode: BeatMode) {
    setBeatMode(mode);
    if (musicPlaying) neuroBeat.start(mode, volume);
  }

  function handleVolumeChange(v: number) {
    setVolume(v);
    neuroBeat.setVolume(v);
  }

  // ── Project CRUD ──────────────────────────────────────────────────────────
  function handleAddProject(name: string, tomatoes: number, plannedDate: string) {
    const id = `p_${Date.now()}`;
    const proj: Project = { id, name, color: 'primary', totalTomatoes: tomatoes, completedTomatoes: 0, plannedDate };
    setProjects(prev => [...prev, proj]);
    if (!activeProjectId) setActiveProjectId(id);
  }

  function handleDeleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }

  function handleUpdateTomatoes(projectId: string, total: number) {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, totalTomatoes: total } : p));
  }

  function handleSetBudget(n: number) {
    setDailyBudget(n);
  }

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  function handleAddTask(projectId: string, text: string) {
    const id = `t_${Date.now()}`;
    setTasks(prev => [...prev, { id, projectId, text, done: false }]);
  }

  function handleToggleTask(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  }

  function handleDeleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🧱</div>
          <span className="loading loading-spinner loading-lg text-primary" />
          <div className="font-black mt-3 text-base-content/50">Loading your focus session...</div>
        </div>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  const NAV_TABS = [
    { id: 'projects' as Tab, icon: <LayoutGrid size={22} />, label: 'Projects' },
    { id: 'timer'    as Tab, icon: <Timer      size={22} />, label: 'Timer'    },
    { id: 'sounds'   as Tab, icon: <Music      size={22} />, label: 'Sounds'   },
  ];

  return (
    <div className="flex flex-col h-screen bg-base-100 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '5rem' }}>
        {tab === 'projects' && (
          <ProjectsTab
            projects={projects}
            tasks={tasks}
            activeProjectId={activeProjectId}
            dailyBudget={dailyBudget}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSetActive={(id: string) => setActiveProjectId(id)}
            onStartFocusing={() => setTab('timer')}
            onSetBudget={handleSetBudget}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTomatoes={handleUpdateTomatoes}
          />
        )}
        {tab === 'timer' && (
          <TimerTab
            phase={phase}
            timeLeft={timeLeft}
            isRunning={isRunning}
            sessionCount={sessionCount}
            activeProject={activeProject}
            musicPlaying={musicPlaying}
            onPlay={() => setIsRunning(true)}
            onPause={() => setIsRunning(false)}
            onReset={handleReset}
            onSkip={handleSkip}
            onChangePhase={handleChangePhase}
            onGoToProjects={() => setTab('projects')}
          />
        )}
        {tab === 'sounds' && (
          <SoundsTab
            isPlaying={musicPlaying}
            beatMode={beatMode}
            volume={volume}
            onToggle={handleMusicToggle}
            onModeChange={handleModeChange}
            onVolumeChange={handleVolumeChange}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-base-200 border-t-2 border-base-300 flex z-50">
        {NAV_TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 font-extrabold text-xs transition-all ${
              tab === id ? 'text-primary' : 'text-base-content/40 hover:text-base-content/70'
            }`}
          >
            <div className={`relative transition-transform ${tab === id ? 'scale-110' : ''}`}>
              {icon}
              {id === 'sounds' && musicPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />
              )}
              {id === 'timer' && isRunning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full animate-pulse" />
              )}
            </div>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
