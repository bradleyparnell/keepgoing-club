import React, { useMemo, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { TimerPhase, Project } from '../types';
import { Brick } from './Brick';

// ── Bible verses by phase ─────────────────────────────────────────────────
const VERSES: Record<TimerPhase, { text: string; ref: string }[]> = {
  focus: [
    { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", ref: "Colossians 3:23" },
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "Commit to the Lord whatever you do, and he will establish your plans.", ref: "Proverbs 16:3" },
    { text: "The plans of the diligent lead to profit as surely as haste leads to poverty.", ref: "Proverbs 21:5" },
    { text: "Do not be anxious about anything, but in every situation present your requests to God.", ref: "Philippians 4:6" },
    { text: "Let your eyes look straight ahead; fix your gaze directly before you.", ref: "Proverbs 4:25" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9" },
    { text: "Whatever your hand finds to do, do it with all your might.", ref: "Ecclesiastes 9:10" },
    { text: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7" },
    { text: "Run in such a way as to get the prize.", ref: "1 Corinthians 9:24" },
    { text: "No eye has seen, no ear has heard, no mind has conceived what God has prepared for those who love him.", ref: "1 Corinthians 2:9" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  ],
  shortBreak: [
    { text: "He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.", ref: "Psalm 23:2–3" },
    { text: "Come to me, all you who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28" },
    { text: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", ref: "Psalm 28:7" },
    { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    { text: "Those who hope in the Lord will renew their strength. They will soar on wings like eagles.", ref: "Isaiah 40:31" },
    { text: "Cast your cares on the Lord and he will sustain you.", ref: "Psalm 55:22" },
  ],
  longBreak: [
    { text: "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.", ref: "Zephaniah 3:17" },
    { text: "He gives strength to the weary and increases the power of the weak.", ref: "Isaiah 40:29" },
    { text: "Return to your rest, my soul, for the Lord has been good to you.", ref: "Psalm 116:7" },
    { text: "And on the seventh day God finished his work that he had done, and he rested.", ref: "Genesis 2:2" },
    { text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", ref: "Numbers 6:24–25" },
    { text: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.", ref: "Psalm 4:8" },
  ],
};

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
  onUpdateNotes: (projectId: string, notes: string) => void;
}

const DURATIONS: Record<TimerPhase, number> = {
  focus:      25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

const PHASE_META: Record<TimerPhase, {
  label: string; sublabel: string;
  btnClass: string; textClass: string; progressClass: string; ringClass: string;
}> = {
  focus:      { label: 'EXECUTE',  sublabel: 'Lock in. Lay the brick.', btnClass: 'btn-error',   textClass: 'text-error',   progressClass: 'progress-error',   ringClass: 'ring-error'   },
  shortBreak: { label: 'REGROUP',  sublabel: 'Breathe. Stay sharp.',    btnClass: 'btn-success', textClass: 'text-success', progressClass: 'progress-success', ringClass: 'ring-success' },
  longBreak:  { label: 'RECOVER',  sublabel: 'Earned it. Reset hard.',  btnClass: 'btn-info',    textClass: 'text-info',    progressClass: 'progress-info',    ringClass: 'ring-info'    },
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const TimerTab: React.FC<TimerTabProps> = ({
  phase, timeLeft, isRunning, sessionCount, activeProject, musicPlaying,
  onPlay, onPause, onReset, onSkip, onChangePhase, onGoToProjects, onUpdateNotes,
}) => {
  const [notesValue, setNotesValue] = useState(activeProject?.notes ?? '');
  useEffect(() => { setNotesValue(activeProject?.notes ?? ''); }, [activeProject?.id, activeProject?.notes]);
  const total = DURATIONS[phase];
  const pct = Math.round(((total - timeLeft) / total) * 100);
  const meta = PHASE_META[phase];
  const verse = useMemo(() => {
    const pool = VERSES[phase];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [phase, sessionCount]);
  const displaySessions = Math.max(4, sessionCount + 1);

  return (
    /* ── Outer: stacked on mobile, two columns on desktop ── */
    <div className="w-full h-full md:grid md:grid-cols-[3fr_2fr] md:gap-0 flex flex-col">

      {/* ══ LEFT PANEL — clock + controls ══════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center gap-5 px-6 pt-8 pb-6 md:border-r md:border-white/10">

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

        {/* Sublabel */}
        <div className={`text-sm font-black tracking-widest uppercase ${meta.textClass}`}>
          {meta.sublabel}
        </div>

        {/* Giant clock */}
        <div
          className={`font-black tabular-nums leading-none tracking-tight transition-all select-none ${
            isRunning ? 'text-base-content' : 'text-base-content/50'
          }`}
          style={{ fontSize: 'clamp(5rem, 18vw, 11rem)' }}
        >
          {fmt(timeLeft)}
        </div>

        {/* Phase label under clock */}
        <div className={`text-xs font-black uppercase tracking-widest ${meta.textClass} opacity-60 -mt-3`}>
          {meta.label}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <progress
            className={`progress w-full h-3 rounded-full ${meta.progressClass}`}
            value={pct}
            max={100}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-1">
          <button onClick={onReset} className="btn btn-ghost btn-circle btn-lg opacity-60 hover:opacity-100 active:scale-90">
            <RotateCcw size={26} />
          </button>
          <button
            onClick={isRunning ? onPause : onPlay}
            className={`btn btn-circle shadow-2xl font-black active:scale-90 ${meta.btnClass}`}
            style={{ width: '6rem', height: '6rem' }}
          >
            {isRunning ? <Pause size={40} /> : <Play size={40} />}
          </button>
          <button onClick={onSkip} className="btn btn-ghost btn-circle btn-lg opacity-60 hover:opacity-100 active:scale-90">
            <SkipForward size={26} />
          </button>
        </div>

        {/* Music indicator */}
        {musicPlaying && (
          <div className="badge badge-primary font-black gap-1 px-3 py-3 animate-pulse uppercase tracking-wide text-xs">
            ⚡ Neural audio active
          </div>
        )}

        {/* Motivational tag — desktop only, anchored to bottom of left panel */}
        <div className="hidden md:block text-xs font-black uppercase tracking-widest text-base-content/25 text-center mt-auto pt-4">
          {phase === 'focus'
            ? 'No shortcuts. No excuses. Lay the brick.'
            : phase === 'shortBreak'
            ? 'Breathe. Hydrate. Come back stronger.'
            : 'You earned this. Prepare for the next session.'}
        </div>
      </div>

      {/* ══ RIGHT PANEL — stats + project + verse ══════════════════════════ */}
      <div className="flex flex-col gap-4 px-6 pt-6 pb-6 md:overflow-y-auto md:max-h-full">

        {/* Bricks laid today */}
        <div className="card bg-base-200 shadow">
          <div className="card-body p-4">
            <div className="text-xs font-black uppercase tracking-widest text-base-content/40 mb-3">
              Bricks Laid Today
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: displaySessions }).map((_, i) => (
                <Brick key={i} size={18} done={i < sessionCount} faded={i >= sessionCount} />
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
          <div className={`card bg-base-200 shadow ring-2 ${meta.ringClass}`}>
            <div className="card-body p-4">
              <div className={`text-xs font-black uppercase tracking-widest ${meta.textClass} mb-1`}>
                🎯 Current Target
              </div>
              <div className="text-xl font-black leading-tight mb-3 uppercase">
                {activeProject.name}
              </div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {Array.from({ length: activeProject.totalTomatoes }).map((_, i) => (
                  <Brick key={i} size={18} done={i < activeProject.completedTomatoes} faded={false} />
                ))}
              </div>
              <div className="font-black text-sm">
                <span className={`text-base ${
                  activeProject.totalTomatoes - activeProject.completedTomatoes === 0
                    ? 'text-success' : meta.textClass
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
            className="btn btn-outline btn-error font-black w-full uppercase tracking-wide"
          >
            🧱 Assign Your Target →
          </button>
        )}

        {/* Notes — only shown when a project is active */}
        {activeProject && (
          <div className="card bg-base-200 shadow">
            <div className="card-body p-4 gap-2">
              <div className="text-xs font-black uppercase tracking-widest text-base-content/40">📝 Session Notes</div>
              <textarea
                className="textarea textarea-bordered w-full text-sm font-medium resize-none bg-base-100/50 focus:outline-none focus:border-primary/50"
                placeholder="Capture thoughts, blockers, next steps…"
                rows={4}
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                onBlur={() => onUpdateNotes(activeProject.id, notesValue)}
              />
              <div className="text-[10px] font-bold text-base-content/25 text-right">auto-saves on blur</div>
            </div>
          </div>
        )}

        {/* Bible verse */}
        <div className="card bg-base-200/60 border border-primary/20">
          <div className="card-body p-4 gap-1">
            <div className="text-xs font-black uppercase tracking-widest text-primary/60 mb-1">✝ Word</div>
            <p className="text-sm font-semibold leading-snug text-base-content/80 italic">
              "{verse.text}"
            </p>
            <p className="text-xs font-black uppercase tracking-widest text-primary mt-1">
              {verse.ref}
            </p>
          </div>
        </div>

        {/* Motivational tag — mobile only */}
        <div className="md:hidden text-xs font-black uppercase tracking-widest text-base-content/25 pb-2 text-center">
          {phase === 'focus'
            ? 'No shortcuts. No excuses. Lay the brick.'
            : phase === 'shortBreak'
            ? 'Breathe. Hydrate. Come back stronger.'
            : 'You earned this. Prepare for the next session.'}
        </div>
      </div>
    </div>
  );
};
