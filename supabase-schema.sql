-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vlcormzjvqcogztacsru/sql

-- Projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#ef4444',
  bricks_per_day integer not null default 4,
  planned_date date not null,
  bricks_completed integer not null default 0,
  created_at timestamptz default now()
);

-- Row Level Security: users only see their own projects
alter table public.projects enable row level security;

create policy "Users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Daily budget table
create table if not exists public.daily_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  work_hours integer not null default 8,
  created_at timestamptz default now(),
  unique(user_id)
);

alter table public.daily_settings enable row level security;

create policy "Users manage own settings"
  on public.daily_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
