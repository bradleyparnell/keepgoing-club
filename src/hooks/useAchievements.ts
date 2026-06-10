import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BADGES, Badge } from '../lib/badges';
import { todayISO } from '../utils/dateUtils';
import { Project } from '../types';

export interface AchievementStats {
  streak_current: number;
  streak_best: number;
  last_active_date: string | null;
  total_bricks: number;
}

export function useAchievements() {
  const { user } = useAuth();

  const [earnedIds, setEarnedIds]       = useState<string[]>([]);
  const [stats, setStats]               = useState<AchievementStats>({
    streak_current: 0, streak_best: 0, last_active_date: null, total_bricks: 0,
  });
  const [pendingBadges, setPending]     = useState<Badge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

  // Refs so async callbacks always have fresh values
  const earnedRef = useRef<string[]>([]);
  const statsRef  = useRef<AchievementStats>(stats);
  const userRef   = useRef(user);

  useEffect(() => { earnedRef.current = earnedIds; }, [earnedIds]);
  useEffect(() => { statsRef.current  = stats;     }, [stats]);
  useEffect(() => { userRef.current   = user;      }, [user]);

  // Process badge queue: show next when current is cleared
  useEffect(() => {
    if (!currentBadge && pendingBadges.length > 0) {
      setCurrentBadge(pendingBadges[0]);
      setPending(prev => prev.slice(1));
    }
  }, [currentBadge, pendingBadges]);

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    const u = userRef.current;
    if (!u) return;
    const [achRes, profileRes] = await Promise.all([
      supabase.from('achievements').select('badge_id').eq('user_id', u.id),
      supabase.from('profiles')
        .select('streak_current,streak_best,last_active_date,total_bricks')
        .eq('id', u.id)
        .single(),
    ]);
    if (achRes.data) {
      const ids = (achRes.data as { badge_id: string }[]).map(a => a.badge_id);
      setEarnedIds(ids);
      earnedRef.current = ids;
    }
    if (profileRes.data) {
      const s: AchievementStats = {
        streak_current:   (profileRes.data as AchievementStats).streak_current   ?? 0,
        streak_best:      (profileRes.data as AchievementStats).streak_best      ?? 0,
        last_active_date: (profileRes.data as AchievementStats).last_active_date ?? null,
        total_bricks:     (profileRes.data as AchievementStats).total_bricks     ?? 0,
      };
      setStats(s);
      statsRef.current = s;
    }
  };

  const awardBadge = async (badgeId: string) => {
    if (earnedRef.current.includes(badgeId)) return;
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge || !userRef.current) return;
    try {
      const { error } = await supabase
        .from('achievements')
        .insert({ user_id: userRef.current.id, badge_id: badgeId });
      if (error) return; // duplicate or table missing — skip silently
      const newIds = [...earnedRef.current, badgeId];
      setEarnedIds(newIds);
      earnedRef.current = newIds;
      setPending(prev => [...prev, badge]);
    } catch {
      // Table may not exist yet — no crash
    }
  };

  // ── Public callbacks ────────────────────────────────────────────────────

  const onProjectCreated = async () => {
    await awardBadge('first_plan');
  };

  const onBrickCompleted = async (
    projects: Project[],
    completedProjectId: string | null,
  ) => {
    const u = userRef.current;
    if (!u) return;

    const today = todayISO();
    const s     = statsRef.current;

    // ── Streak logic ─────────────────────────────────────────────────────
    let newStreak = s.streak_current;
    if (s.last_active_date !== today) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      newStreak = (s.last_active_date === yesterday) ? s.streak_current + 1 : 1;
    }
    const newBest  = Math.max(s.streak_best, newStreak);
    const newTotal = s.total_bricks + 1;

    const newStats: AchievementStats = {
      streak_current:   newStreak,
      streak_best:      newBest,
      last_active_date: today,
      total_bricks:     newTotal,
    };
    setStats(newStats);
    statsRef.current = newStats;

    // Persist (fire-and-forget)
    supabase.from('profiles').update({
      streak_current:   newStreak,
      streak_best:      newBest,
      last_active_date: today,
      total_bricks:     newTotal,
    }).eq('id', u.id).then(() => {});

    // ── Badge checks ─────────────────────────────────────────────────────
    await awardBadge('first_brick');
    if (newTotal >= 10)  await awardBadge('bricks_10');
    if (newTotal >= 50)  await awardBadge('bricks_50');
    if (newTotal >= 100) await awardBadge('bricks_100');
    if (newTotal >= 500) await awardBadge('bricks_500');
    if (newStreak >= 3)  await awardBadge('streak_3');
    if (newStreak >= 7)  await awardBadge('streak_7');
    if (newStreak >= 30) await awardBadge('streak_30');

    // Perfect day: all projects for today fully complete
    if (completedProjectId) {
      const todayProjects = projects.filter(p => p.plannedDate === today);
      if (todayProjects.length > 0) {
        const allDone = todayProjects.every(p =>
          p.id === completedProjectId
            ? (p.completedTomatoes + 1) >= p.totalTomatoes
            : p.completedTomatoes >= p.totalTomatoes,
        );
        if (allDone) await awardBadge('perfect_day');
      }
    }
  };

  return {
    earnedIds,
    stats,
    currentBadge,
    clearCurrentBadge: () => setCurrentBadge(null),
    onProjectCreated,
    onBrickCompleted,
    reload: loadData,
  };
}
