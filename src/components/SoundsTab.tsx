import React from 'react';
import { Volume2, Headphones, Radio } from 'lucide-react';
import { BeatMode } from '../types';
import { MODE_META, neuroBeat } from '../utils/audio';

interface SoundsTabProps {
  isPlaying: boolean;
  beatMode: BeatMode;
  volume: number;
  onToggle: () => void;
  onModeChange: (mode: BeatMode) => void;
  onVolumeChange: (v: number) => void;
}

const TRACK_ORDER: BeatMode[] = ['gamma', 'alpha', 'theta', 'binaural'];

const TRACK_ICONS: Record<BeatMode, string> = {
  gamma:    '⚡',
  alpha:    '🌊',
  theta:    '🌑',
  binaural: '🎯',
};

const QUOTES = [
  { q: "The impediment to action advances action. What stands in the way becomes the way.", a: "Marcus Aurelius" },
  { q: "You have power over your mind — not outside events. Realize this, and you will find strength.", a: "Marcus Aurelius" },
  { q: "We suffer more in imagination than in reality.", a: "Seneca" },
  { q: "Either you run the day, or the day runs you.", a: "Jim Rohn" },
  { q: "It is not that I'm so smart. It is just that I stay with problems longer.", a: "Albert Einstein" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
];

export const SoundsTab: React.FC<SoundsTabProps> = ({
  isPlaying, beatMode, volume, onToggle, onModeChange, onVolumeChange,
}) => {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const active = MODE_META[beatMode];

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="pt-1">
        <h2 className="text-2xl font-black tracking-tight uppercase">Neural Audio</h2>
        <p className="text-sm font-bold text-base-content/50 mt-0.5">
          Frequency-tuned focus music. Science, not vibes.
        </p>
      </div>

      {/* Master toggle */}
      <button
        onTouchStart={() => neuroBeat.unlock()}
        onClick={onToggle}
        className={`w-full rounded-2xl p-4 flex items-center justify-between transition-all active:scale-95 shadow-lg ${
          isPlaying ? 'bg-primary text-primary-content' : 'bg-base-200'
        }`}
      >
        <div>
          <div className="font-black text-xl uppercase tracking-wide">
            {isPlaying ? `▶ ${active.name}` : '⏸ AUDIO OFFLINE'}
          </div>
          <div className={`text-sm font-bold mt-0.5 ${isPlaying ? 'text-primary-content/70' : 'text-base-content/50'}`}>
            {isPlaying ? active.tagline : 'Tap to activate neural audio'}
          </div>
        </div>
        <div className={`w-14 h-8 rounded-full flex items-center transition-all ${
          isPlaying ? 'bg-primary-content/30 justify-end pr-1' : 'bg-base-300 justify-start pl-1'
        }`}>
          <div className={`w-6 h-6 rounded-full ${isPlaying ? 'bg-primary-content' : 'bg-base-content/30'}`} />
        </div>
      </button>

      {/* How it works callout */}
      <div className="flex items-start gap-3 bg-base-200 rounded-xl p-3 border-l-4 border-primary">
        <Radio size={16} className="opacity-50 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-base-content/60 mb-0.5">How It Works</div>
          <p className="text-xs font-semibold text-base-content/50 leading-relaxed">
            Soft sine-wave chord pads are amplitude-modulated at neural entrainment
            frequencies — the same principle used by Brain.fm. Your brain's neural
            oscillations naturally sync to the pulse, nudging you into the target
            cognitive state. No drums. No game sounds. Just clean, science-backed tones.
          </p>
        </div>
      </div>

      {/* Headphone notice for binaural */}
      {beatMode === 'binaural' && (
        <div className="flex items-center gap-2 bg-base-200 rounded-xl p-3 border-l-4 border-warning">
          <Headphones size={15} className="opacity-50 shrink-0" />
          <span className="text-xs font-bold text-base-content/50">
            <strong>Headphones required</strong> for binaural beats. Without them the two carriers blend into a single tone — no beat is produced.
          </span>
        </div>
      )}

      {/* Track selector */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-widest text-base-content/40">
          Select Frequency
        </div>
        {TRACK_ORDER.map(id => {
          const meta = MODE_META[id];
          const isSelected = beatMode === id;
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`rounded-2xl text-left transition-all active:scale-95 ${
                isSelected
                  ? 'bg-primary ring-2 ring-primary shadow-lg'
                  : 'bg-base-200 hover:bg-base-300'
              }`}
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{TRACK_ICONS[id]}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-black text-base uppercase tracking-wide leading-tight ${
                      isSelected ? 'text-primary-content' : ''
                    }`}>
                      {meta.name}
                    </div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      isSelected ? 'text-primary-content/70' : 'text-base-content/40'
                    }`}>
                      {meta.tagline}
                    </div>
                    <div className={`text-xs font-semibold mt-1 leading-snug ${
                      isSelected ? 'text-primary-content/60' : 'text-base-content/30'
                    }`}>
                      {meta.desc}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-black tabular-nums shrink-0 ml-2 ${
                  isSelected ? 'text-primary-content' : 'text-base-content/25'
                }`}>
                  {meta.hzLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4 gap-3">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="opacity-60" />
            <span className="font-extrabold uppercase tracking-wide text-sm">Volume</span>
            <span className="ml-auto font-black text-base-content/50 tabular-nums">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="range range-primary"
          />
          <p className="text-xs font-semibold text-base-content/40">
            Start around 30–50%. Too loud defeats the purpose — these are background neural tones, not concert audio.
          </p>
        </div>
      </div>

      {/* Quote */}
      <div className="card bg-base-200 shadow-sm border-l-4 border-primary">
        <div className="card-body p-4 gap-1">
          <p className="text-sm font-bold leading-relaxed text-base-content/80 italic">
            "{quote.q}"
          </p>
          <p className="text-xs font-black text-primary mt-1">— {quote.a}</p>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};
