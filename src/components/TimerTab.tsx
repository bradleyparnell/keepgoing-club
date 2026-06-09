import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { TimerPhase, Project } from '../types';
import { Brick } from './Brick';

interface TimerTabProps {
  phase: TimerPhase;
  timeLeft: number;
  isRunning: boolean;
  sessionCount: number;
  activeProject: Project | null;
  musicPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onChangePhase: (p: TimerPhase) => void;
  onGoToProjects: () => void;
}

const DURATIONS: Record<TimerPhase, number> = {
  focus:      25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

const PHASE_META: Record<TimerPhase, { label: string; sublabel: string; btnClass: string; textClass: string; progressClass: string }> = {
  focus:      { label: 'EXECUTE',  sublabel: 'Lock in. Lay the brick.', btnClass: 'btn-error',   textClass: 'text-error',   progressClass: 'progress-error'   },
  shortBreak: { label: 'REGROUP',  sublabel: 'Breathe. Stay sharp.',    btnClass: 'btn-success', textClass: 'text-success', progressClass: 'progress-success' },
  longBreak:  { label: 'RECOVER',  sublabel: 'Earned it. Reset hard.',  btnClass: 'btn-info',    textClass: 'text-info',    progressClass: 'progress-info'    },
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const TimerTab: React.FC<TimerTabProps> = ({
  phase, timeLeft, isRunning, sessionCount, activeProject, musicPlaying,
  onPlay, onPause, onReset, onSkip, onChangePhase, onGoToProjects,
}) => {
  const total = DURATIONS[phase];
  const pct = Math.round(((total - timeLeft) / total) * 100);
  const meta = PHASE_META[phase];
  const displaySessions = Math.max(4, sessionCount + 1);

  return (
    <div className="flex flex-col items-center gap-5 px-4 pt-6 pb-4">

      {/* Phase pills */}
      <div className="flex gap-2 bg-base-200 p-1 rounded-full">
        {(['focus', 'shortBreak', 'longBreak'] as TimerPhase[]).map(p => (
          <button
            key={p}
            onClick={() => !isRunning && onChangePhase(p)}
            className={`btn btn-sm rounded-full font-black uppercase tracking-wide text-xs transition-all ${
              phase === p ? `${PHASE_META[p].btnClass} shadow` : 'btn-ghost text-base-content/40'
            }`}
          >
            {PHASE_META[p].label}
          </button>
        ))}
      </div>

      {/* Timer block */}
      <div className="flex flex-col items-center gap-1">
        <div className={`text-sm font-black tracking-widest uppercase ${meta.textClass}`}>
          {meta.sublabel}
        </div>
        <div
          className={`font-black tabular-nums leading-none tracking-tight transition-all ${
            isRunning ? 'text-base-content' : 'text-base-content/50'
          }`}
          style={{ fontSize: 'clamp(4.5rem, 24vw, 7.5rem)' }}
        >
          {fmt(timeLeft)}
        </div>
        <div className={`text-xs font-black uppercase tracking-widest mt-1 ${meta.textClass} opacity-60`}>
          {meta.label}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <progress
          className={`progress w-full h-5 rounded-full ${meta.progressClass}`}
          value={pct}
          max={100}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button onClick={onReset} className="btn btn-ghost btn-circle btn-lg opacity-60 hover:opacity-100 active:scale-90">
          <RotateCcw size={24} />
        </button>
        <button
          onClick={isRunning ? onPause : onPlay}
          className={`btn btn-circle shadow-xl font-black active:scale-90 ${meta.btnClass}`}
          style={{ width: '5.5rem', height: '5.5rem' }}
        >
          {isRunning ? <Pause size={36} /> : <Play size={36} />}
        </button>
        <button onClick={onSkip} className="btn btn-ghost btn-circle btn-lg opacity-60 hover:opacity-100 active:scale-90">
          <SkipForward size={24} />
        </button>
      </div>

      {/* Music indicator */}
      {musicPlaying && (
        <div className="badge badge-primary font-black gap-1 px-3 py-3 animate-pulse uppercase tracking-wide text-xs">
          ⚡ Neural audio active
        </div>
      )}

      {/* Today's reps */}
      <div className="card bg-base-200 w-full max-w-xs shadow">
        <div className="card-body p-4">
          <div className="text-xs font-black uppercase tracking-widest text-base-content/40 mb-3">
            Bricks Laid Today
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: displaySessions }).map((_, i) => (
              <Brick
                key={i}
                size={18}
                done={i < sessionCount}
                faded={i >= sessionCount}
              />
            ))}
          </div>
          <div className="font-black mt-3 text-base">
            {sessionCount}{' '}
            <span className="text-base-content/40 font-semibold text-sm">
              {sessionCount === 1 ? 'brick laid' : 'bricks laid'}
            </span>
          </div>
        </div>
      </div>

      {/* Active project */}
      {activeProject ? (
        <div className="card bg-base-200 w-full max-w-xs shadow ring-2 ring-error">
          <div className="card-body p-4">
            <div className="text-xs font-black uppercase tracking-widest text-error mb-1">
              🎯 Current Target
            </div>
            <div className="text-xl font-black leading-tight mb-3 uppercase">
              {activeProject.name}
            </div>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {Array.from({ length: activeProject.totalTomatoes }).map((_, i) => (
                <Brick
                  key={i}
                  size={18}
                  done={i < activeProject.completedTomatoes}
                  faded={false}
                />
              ))}
            </div>
            <div className="font-black text-sm">
              <span className={`text-base ${
                activeProject.totalTomatoes - activeProject.completedTomatoes === 0
                  ? 'text-success'
                  : 'text-error'
              }`}>
                {activeProject.totalTomatoes - activeProject.completedTomatoes === 0
                  ? '✓ WALL COMPLETE'
                  : `${activeProject.totalTomatoes - activeProject.completedTomatoes} bricks remaining`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onGoToProjects}
          className="btn btn-outline btn-error font-black w-full max-w-xs uppercase tracking-wide"
        >
          🧱 Assign Your Target →
        </button>
      )}

      {/* Motivational tag */}
      <div className="text-xs font-black uppercase tracking-widest text-base-content/25 pb-2 text-center">
        {phase === 'focus'
          ? 'No shortcuts. No excuses. Lay the brick.'
          : phase === 'shortBreak'
          ? 'Breathe. Hydrate. Come back stronger.'
          : 'You earned this. Prepare for the next session.'}
      </div>
    </div>
  );
};
