-- ── Gamification: streaks + badges ──────────────────────────────────────────
-- Run this once in Supabase SQL Editor.

-- Add streak / gamification columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_current   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_best      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS total_bricks     INTEGER DEFAULT 0;

-- Achievements (badge unlock log)
CREATE TABLE IF NOT EXISTS achievements (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id  TEXT        NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users can only see and write their own rows
CREATE POLICY "Users manage own achievements"
  ON achievements FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
