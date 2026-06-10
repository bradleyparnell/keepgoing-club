import React from 'react';
import { X, Flame, Zap } from 'lucide-react';
import { BADGES, RARITY_COLORS, RARITY_TEXT, RARITY_LABELS } from '../lib/badges';
import { AchievementStats } from '../hooks/useAchievements';

interface Props {
  earnedIds: string[];
  stats: AchievementStats;
  onClose: () => void;
}

export const BadgesModal: React.FC<Props> = ({ earnedIds, stats, onClose }) => {
  const earned = new Set(earnedIds);
  const earnedCount = earnedIds.length;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-[#0e0e0e]/95 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">🏆 Achievements</h2>
            <p className="text-white/35 text-xs font-bold mt-0.5">
              {earnedCount} of {BADGES.length} badges earned
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Streak + stats bar */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Streak</span>
            </div>
            <div className="text-white font-black text-2xl leading-none">{stats.streak_current}</div>
            <div className="text-white/35 text-[10px] font-bold mt-0.5">days</div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Best</span>
            </div>
            <div className="text-white font-black text-2xl leading-none">{stats.streak_best}</div>
            <div className="text-white/35 text-[10px] font-bold mt-0.5">days</div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">Total</div>
            <div className="text-white font-black text-2xl leading-none">{stats.total_bricks}</div>
            <div className="text-white/35 text-[10px] font-bold mt-0.5">🧱 bricks</div>
          </div>
        </div>

        {/* Badge grid */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map(badge => {
              const isEarned = earned.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`
                    relative rounded-2xl border p-4 transition-all
                    ${isEarned
                      ? `${RARITY_COLORS[badge.rarity]} shadow-sm`
                      : 'border-white/[0.05] bg-white/[0.02] opacity-40 grayscale'
                    }
                  `}
                >
                  {/* Earned glow for legendary */}
                  {isEarned && badge.rarity === 'legendary' && (
                    <div className="absolute inset-0 rounded-2xl bg-orange-500/5 pointer-events-none" />
                  )}

                  <div className="text-3xl mb-2 leading-none">
                    {isEarned ? badge.emoji : '🔒'}
                  </div>

                  <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isEarned ? RARITY_TEXT[badge.rarity] : 'text-white/30'}`}>
                    {RARITY_LABELS[badge.rarity]}
                  </div>

                  <div className={`font-black text-sm leading-tight mb-1 ${isEarned ? 'text-white' : 'text-white/40'}`}>
                    {badge.name}
                  </div>

                  <div className={`text-[11px] leading-snug ${isEarned ? 'text-white/55' : 'text-white/25'}`}>
                    {badge.desc}
                  </div>

                  {isEarned && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/50">✓ Earned</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer nudge */}
          <p className="text-center text-white/20 text-xs font-bold mt-6">
            Complete focus sessions to unlock more 🧱
          </p>
        </div>
      </div>
    </div>
  );
};
