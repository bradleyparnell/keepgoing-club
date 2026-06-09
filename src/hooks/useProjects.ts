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

  return { projects, loading, addProject, incrementBrick, deleteProject, refresh: fetchProjects };
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
