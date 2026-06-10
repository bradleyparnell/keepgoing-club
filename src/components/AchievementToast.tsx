import React, { useEffect, useState } from 'react';
import { Badge, RARITY_LABELS, RARITY_TEXT, RARITY_BAR } from '../lib/badges';

interface Props {
  badge: Badge;
  onClose: () => void;
}

const DURATION = 5500;

export const AchievementToast: React.FC<Props> = ({ badge, onClose }) => {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 60);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.max(0, p - (100 / (DURATION / 100))));
    }, 100);

    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, DURATION);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
      clearInterval(progressInterval);
    };
  }, [onClose]);

  const textColor = RARITY_TEXT[badge.rarity];
  const barColor  = RARITY_BAR[badge.rarity];

  const borderMap = {
    common:    'border-gray-500/50',
    rare:      'border-blue-500/60',
    epic:      'border-purple-500/60',
    legendary: 'border-orange-500/70',
  };

  const glowMap = {
    common:    '',
    rare:      'shadow-blue-500/10',
    epic:      'shadow-purple-500/15',
    legendary: 'shadow-orange-500/20',
  };

  return (
    <div
      className={`
        fixed z-[200] transition-all duration-500
        bottom-24 right-4 md:bottom-6 md:right-6
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
      `}
      style={{ maxWidth: '300px', minWidth: '260px' }}
    >
      <div className={`
        rounded-2xl border ${borderMap[badge.rarity]}
        bg-black/85 backdrop-blur-2xl
        shadow-2xl ${glowMap[badge.rarity]}
        overflow-hidden
      `}>
        <div className="px-4 py-3.5 flex gap-3 items-start">
          {/* Emoji */}
          <div className="text-4xl leading-none mt-0.5 shrink-0">{badge.emoji}</div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] font-black uppercase tracking-widest ${textColor} mb-0.5`}>
              Badge Unlocked · {RARITY_LABELS[badge.rarity]}
            </div>
            <div className="text-white font-black text-sm leading-tight">{badge.name}</div>
            <div className="text-white/55 text-xs mt-0.5 leading-snug">{badge.desc}</div>
          </div>

          {/* Close */}
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
            className="text-white/30 hover:text-white/70 text-xl leading-none mt-0.5 shrink-0 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-white/[0.06]">
          <div
            className={`h-full ${barColor} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
