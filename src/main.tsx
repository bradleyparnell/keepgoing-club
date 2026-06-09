import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Timer, LayoutGrid, Music } from 'lucide-react';
import { TimerTab } from './components/TimerTab';
import { ProjectsTab } from './components/ProjectsTab';
import { SoundsTab } from './components/SoundsTab';
import AuthScreen from './components/AuthScreen';
import UserMenu from './components/UserMenu';
import OnboardingModal from './components/OnboardingModal';
import { Tab, TimerPhase, BeatMode, Project } from './types';
import { neuroBeat } from './utils/audio';
import { todayISO } from './utils/dateUtils';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useProjects, useDailySettings } from './hooks/useProjects';
import './index.css';

const DURATIONS: Record<TimerPhase, number> = {
  focus:      25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

function playDing() {
  try {
    const CtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!CtxClass) return;
    const ctx = new CtxClass();
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
  } catch (_) {}
}

// ── Inner App (uses auth + Supabase hooks) ────────────────────────────────
const AppInner: React.FC = () => {
  const [tab, setTab]                         = useState<Tab>('projects');
  const [selectedDate, setSelectedDate]       = useState(todayISO);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Supabase data hooks
  const { projects: rawProjects, addProject, incrementBrick, deleteProject } = useProjects(selectedDate);
  const { workHours, setWorkHours } = useDailySettings();

  // Map Supabase fields → internal Project shape expected by components
  const projects: Project[] = rawProjects.map(p => ({
    id:                p.id,
    name:              p.name,
    color:             p.color,
    totalTomatoes:     p.bricks_per_day,
    completedTomatoes: p.bricks_completed,
    plannedDate:       p.planned_date,
  }));

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

  // ── Timer interval ──────────────────────────────────────────────────────
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

  // ── Handle timer completion ─────────────────────────────────────────────
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

      // ← Supabase brick increment
      if (curProjId) incrementBrick(curProjId);

      const nextPhase: TimerPhase = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setPhase(nextPhase);
      setTimeLeft(DURATIONS[nextPhase]);
    } else {
      setPhase('focus');
      setTimeLeft(DURATIONS.focus);
    }
  }, [completed, incrementBrick]);

  // ── Timer controls ──────────────────────────────────────────────────────
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

  // ── Music controls ──────────────────────────────────────────────────────
  function handleMusicToggle() {
    if (musicPlaying) { neuroBeat.stop(); setMusicPlaying(false); }
    else              { neuroBeat.start(beatMode, volume); setMusicPlaying(true); }
  }
  function handleModeChange(mode: BeatMode) {
    setBeatMode(mode);
    if (musicPlaying) neuroBeat.start(mode, volume);
  }
  function handleVolumeChange(v: number) {
    setVolume(v);
    neuroBeat.setVolume(v);
  }

  // ── Project handlers (call Supabase) ────────────────────────────────────
  function handleAddProject(name: string, bricksPerDay: number, _plannedDate: string) {
    addProject(name, '#b45309', bricksPerDay);
  }
  function handleDeleteProject(id: string) {
    deleteProject(id);
    if (activeProjectId === id) setActiveProjectId(null);
  }
  // No-op stubs for task handlers (tasks not in Supabase schema yet)
  const handleAddTask    = (_pid: string, _text: string) => {};
  const handleToggleTask = (_tid: string) => {};
  const handleDeleteTask = (_tid: string) => {};
  const handleUpdateTomatoes = (_pid: string, _n: number) => {};

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  const NAV_TABS = [
    { id: 'projects' as Tab, icon: <LayoutGrid size={22} />, label: 'Projects' },
    { id: 'timer'    as Tab, icon: <Timer      size={22} />, label: 'Timer'    },
    { id: 'sounds'   as Tab, icon: <Music      size={22} />, label: 'Sounds'   },
  ];

  return (
    <div className="flex flex-col h-screen bg-base-100 max-w-lg mx-auto" data-theme="keepgoing">
      <OnboardingModal />
      {/* User avatar top-right */}
      <div className="absolute top-3 right-4 z-50">
        <UserMenu />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '5rem' }}>
        {tab === 'projects' && (
          <ProjectsTab
            projects={projects}
            tasks={[]}
            activeProjectId={activeProjectId}
            dailyBudget={workHours}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSetActive={(id: string) => setActiveProjectId(id)}
            onStartFocusing={() => setTab('timer')}
            onSetBudget={setWorkHours}
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

// ── Auth gate ─────────────────────────────────────────────────────────────
const AppRoot: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🧱</div>
          <div className="text-zinc-500 text-sm font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <AppInner />;
};

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AppRoot />
  </AuthProvider>
);
