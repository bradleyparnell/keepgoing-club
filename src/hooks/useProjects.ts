import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  bricks_per_day: number;
  planned_date: string;
  bricks_completed: number;
  notes: string;
  is_completed: boolean;
  created_at: string;
}

export function useProjects(selectedDate: string) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('planned_date', selectedDate)
      .order('created_at', { ascending: true });
    if (!error && data) setProjects(data);
    setLoading(false);
  }, [user, selectedDate]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (name: string, color: string, bricksPerDay: number) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        color,
        bricks_per_day: bricksPerDay,
        planned_date: selectedDate,
        bricks_completed: 0,
      })
      .select()
      .single();
    if (!error && data) setProjects(prev => [...prev, data]);
  };

  const incrementBrick = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newCount = Math.min(project.bricks_completed + 1, project.bricks_per_day);
    const { error } = await supabase
      .from('projects')
      .update({ bricks_completed: newCount })
      .eq('id', projectId);
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, bricks_completed: newCount } : p));
    }
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const updateNotes = async (projectId: string, notes: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ notes })
      .eq('id', projectId);
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes } : p));
    }
  };

  const markComplete = async (projectId: string, completed: boolean) => {
    await supabase.from('projects').update({ is_completed: completed }).eq('id', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_completed: completed } : p));
  };

  return { projects, loading, addProject, incrementBrick, deleteProject, updateNotes, markComplete, refresh: fetchProjects };
}

export function useMonthProjects(year: number, month: number) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const mm   = String(month).padStart(2, '0');
    const last = new Date(year, month, 0).getDate();
    const start = `${year}-${mm}-01`;
    const end   = `${year}-${mm}-${String(last).padStart(2, '0')}`;
    supabase
      .from('projects')
      .select('id, name, color, planned_date, bricks_per_day, bricks_completed, notes, is_completed')
      .eq('user_id', user.id)
      .gte('planned_date', start)
      .lte('planned_date', end)
      .then(({ data }) => { if (data) setProjects(data as Project[]); });
  }, [user, year, month]);

  return projects;
}

export function useDailySettings() {
  const { user } = useAuth();
  const [workHours, setWorkHoursState] = useState(8);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('daily_settings')
      .select('work_hours')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setWorkHoursState(data.work_hours);
      });
  }, [user]);

  const setWorkHours = async (hours: number) => {
    if (!user) return;
    setWorkHoursState(hours);
    await supabase
      .from('daily_settings')
      .upsert({ user_id: user.id, work_hours: hours }, { onConflict: 'user_id' });
  };

  return { workHours, setWorkHours };
}
