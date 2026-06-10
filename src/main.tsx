import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Timer, LayoutGrid, Music, CalendarDays, Trophy, HelpCircle } from 'lucide-react';
import { TimerTab } from './components/TimerTab';
import { ProjectsTab } from './components/ProjectsTab';
import { SoundsTab } from './components/SoundsTab';
import { CalendarTab } from './components/CalendarTab';
import AuthScreen from './components/AuthScreen';
import UserMenu from './components/UserMenu';
import OnboardingModal from './components/OnboardingModal';
import ResetPasswordPage from './components/ResetPasswordPage';
import AdminPage from './components/AdminPage';
import { Tab, TimerPhase, BeatMode, Project } from './types';
import { neuroBeat } from './utils/audio';
import { todayISO } from './utils/dateUtils';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useProjects, useDailySettings } from './hooks/useProjects';
import { useAchievements } from './hooks/useAchievements';
import { AchievementToast } from './components/AchievementToast';
import { BadgesModal } from './components/BadgesModal';
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

// ── Nature background images (random on each page load) ─────────────────
const NATURE_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80', // Swiss Alps sunset
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80', // Sunlit forest
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80', // Mountain lake reflection
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80', // Aerial green hills
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80', // Misty mountain path
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80', // Moraine Lake
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=1920&q=80', // Green rolling hills
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80', // Mountain peaks
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=80', // Ocean waves
  'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?auto=format&fit=crop&w=1920&q=80', // Northern lights
];

// ── Inner App (uses auth + Supabase hooks) ────────────────────────────────
const AppInner: React.FC = () => {
  const [tab, setTab]                         = useState<Tab>('projects');
  const [selectedDate, setSelectedDate]       = useState(todayISO);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Auth
  const { user } = useAuth();

  // Supabase data hooks
  const { projects: rawProjects, addProject, incrementBrick, deleteProject } = useProjects(selectedDate);
  const { workHours, setWorkHours } = useDailySettings();
  const achievements = useAchievements();
  const [showBadges, setShowBadges] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Pick a random nature bg image once per mount (changes on page reload)
  const [bgImage] = useState(
    () => NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)]
  );

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

  // Keep a ref to projects so timer-completion callback has fresh data
  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const achievementsRef = useRef(achievements);
  useEffect(() => { achievementsRef.current = achievements; });

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

      // ← Supabase brick increment + achievement check
      if (curProjId) {
        incrementBrick(curProjId);
        achievementsRef.current.onBrickCompleted(projectsRef.current, curProjId);
      }

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
    achievements.onProjectCreated();
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
    { id: 'projects'  as Tab, icon: <LayoutGrid  size={22} />, label: 'Projects'  },
    { id: 'calendar'  as Tab, icon: <CalendarDays size={22} />, label: 'Calendar'  },
    { id: 'timer'     as Tab, icon: <Timer        size={22} />, label: 'Timer'     },
    { id: 'sounds'    as Tab, icon: <Music        size={22} />, label: 'Sounds'    },
  ];

  const tabContent = (
    <>
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
      {tab === 'calendar' && (
        <CalendarTab
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onNavigateToProjects={() => setTab('projects')}
        />
      )}
    </>
  );

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bgImage})` }}
      data-theme="keepgoing"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/55 pointer-events-none z-0" />

      <OnboardingModal
        userId={user?.id}
        forceOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* Achievement toast */}
      {achievements.currentBadge && (
        <AchievementToast
          badge={achievements.currentBadge}
          onClose={achievements.clearCurrentBadge}
        />
      )}

      {/* Badges modal */}
      {showBadges && (
        <BadgesModal
          earnedIds={achievements.earnedIds}
          stats={achievements.stats}
          onClose={() => setShowBadges(false)}
        />
      )}

      {/* ── DESKTOP layout (md+) ───────────────────────────────────────── */}
      <div className="hidden md:flex fixed inset-0 z-10">

        {/* Left sidebar */}
        <aside className="flex flex-col w-60 shrink-0 bg-[#0e0e0e]/95 backdrop-blur-md border-r border-white/[0.07]">

          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
            <span className="text-3xl leading-none">🧱</span>
            <div>
              <div className="text-primary font-black text-sm uppercase tracking-widest leading-none">Keep Going</div>
              <div className="text-white/25 text-[10px] font-bold uppercase tracking-widest mt-1">Focus Club</div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-3 flex-1 pt-5">
            {NAV_TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left w-full ${
                  tab === id
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-white/40 hover:text-white/75 hover:bg-white/5 border border-transparent'
                }`}
              >
                {icon}
                <span>{label}</span>
                {id === 'sounds' && musicPlaying && (
                  <span className="ml-auto w-2 h-2 bg-success rounded-full shrink-0" />
                )}
                {id === 'timer' && isRunning && (
                  <span className="ml-auto w-2 h-2 bg-error rounded-full animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </nav>

          {/* Session counter + Achievements */}
          <div className="mx-3 mb-2 flex gap-2">
            {sessionCount > 0 && (
              <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.07]">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Today</div>
                <div className="text-primary font-black text-lg leading-none">{sessionCount} <span className="text-white/40 text-xs font-bold">bricks</span></div>
              </div>
            )}
            <button
              onClick={() => setShowBadges(true)}
              title="Achievements"
              className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl border transition-all group
                ${sessionCount > 0 ? '' : 'flex-1'}
                bg-white/5 border-white/[0.07] hover:bg-orange-500/10 hover:border-orange-500/30`}
            >
              <Trophy size={18} className="text-white/30 group-hover:text-orange-400 transition-colors" />
              {achievements.earnedIds.length > 0 && (
                <span className="text-[9px] font-black text-orange-400 leading-none">{achievements.earnedIds.length}</span>
              )}
            </button>
          </div>

          {/* How it works */}
          <div className="px-3 pb-2">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent transition-all text-sm font-semibold"
            >
              <HelpCircle size={16} />
              <span>How it works</span>
            </button>
          </div>

          {/* User menu */}
          <div className="p-4 border-t border-white/[0.07]">
            <UserMenu />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#111111]/85 backdrop-blur-sm">
          {tabContent}
        </main>
      </div>

      {/* ── MOBILE layout (< md) ──────────────────────────────────────────── */}
      <div className="md:hidden relative z-10 flex flex-col h-screen bg-[#111111] max-w-lg mx-auto">

        {/* User menu + trophy top-right */}
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all group"
            title="How it works"
          >
            <HelpCircle size={16} className="text-white/30 group-hover:text-orange-400 transition-colors" />
          </button>
          <button
            onClick={() => setShowBadges(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all group"
          >
            <Trophy size={16} className="text-white/30 group-hover:text-orange-400 transition-colors" />
            {achievements.earnedIds.length > 0 && (
              <span className="text-[10px] font-black text-orange-400">{achievements.earnedIds.length}</span>
            )}
          </button>
          <UserMenu />
        </div>

        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '5rem' }}>
          {tabContent}
        </div>

        {/* Bottom nav */}
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

  // Handle password reset redirect (Supabase lands here with #access_token)
  if (window.location.pathname === '/reset-password') return <ResetPasswordPage />;
  if (window.location.pathname === '/admin') return <AdminPage />;

  if (!user) return <AuthScreen />;
  return <AppInner />;
};

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AppRoot />
  </AuthProvider>
);
