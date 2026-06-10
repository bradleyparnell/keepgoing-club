export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  rarity: BadgeRarity;
}

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common:    'border-gray-500/40  bg-gray-800/40',
  rare:      'border-blue-500/50  bg-blue-900/25',
  epic:      'border-purple-500/50 bg-purple-900/25',
  legendary: 'border-orange-500/60 bg-orange-900/25',
};

export const RARITY_TEXT: Record<BadgeRarity, string> = {
  common:    'text-gray-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-orange-400',
};

export const RARITY_BAR: Record<BadgeRarity, string> = {
  common:    'bg-gray-400',
  rare:      'bg-blue-400',
  epic:      'bg-purple-400',
  legendary: 'bg-orange-500',
};

export const RARITY_LABELS: Record<BadgeRarity, string> = {
  common:    'Common',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

export const BADGES: Badge[] = [
  {
    id: 'first_plan',
    name: 'Blueprint',
    emoji: '📅',
    desc: 'Scheduled your first project',
    rarity: 'common',
  },
  {
    id: 'first_brick',
    name: 'First Brick',
    emoji: '🧱',
    desc: 'Completed your first focus session',
    rarity: 'common',
  },
  {
    id: 'streak_3',
    name: 'On Fire',
    emoji: '🔥',
    desc: 'Built for 3 days in a row',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Unstoppable',
    emoji: '⚡',
    desc: 'Kept the streak alive for 7 days',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Elite',
    emoji: '👑',
    desc: '30 consecutive days. You are the machine.',
    rarity: 'legendary',
  },
  {
    id: 'bricks_10',
    name: 'Wall Builder',
    emoji: '🏗️',
    desc: '10 focus sessions completed',
    rarity: 'common',
  },
  {
    id: 'bricks_50',
    name: 'Machine',
    emoji: '⚙️',
    desc: '50 focus sessions completed',
    rarity: 'rare',
  },
  {
    id: 'bricks_100',
    name: 'Century',
    emoji: '💯',
    desc: '100 focus sessions completed',
    rarity: 'epic',
  },
  {
    id: 'bricks_500',
    name: 'Legend',
    emoji: '🔱',
    desc: '500 focus sessions. Absolutely insane.',
    rarity: 'legendary',
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    emoji: '🌟',
    desc: 'Completed every planned brick in a single day',
    rarity: 'rare',
  },
];
