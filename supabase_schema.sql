-- =====================================================
-- IELTS Peer Review Platform — Supabase SQL Schema
-- Запусти это в: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- Profiles (расширяет auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  email text default '',
  avatar text not null default 'US',
  role text not null default 'student' check (role in ('teacher', 'student')),
  created_at timestamptz default now()
);

-- Classrooms
create table if not exists public.classrooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  description text default '',
  color text default 'violet',
  created_at timestamptz default now()
);

-- Classroom students (join table)
create table if not exists public.classroom_students (
  classroom_id uuid references public.classrooms(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (classroom_id, student_id)
);

-- Assignments
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  title text not null,
  prompt text not null default '',
  essay_type text not null default 'opinion',
  deadline timestamptz not null default now() + interval '14 days',
  min_words integer default 250,
  required_reviews integer default 2,
  created_at timestamptz default now()
);

-- Essays
create table if not exists public.essays (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text default '',
  word_count integer default 0,
  status text default 'draft' check (status in ('draft', 'submitted', 'reviewing', 'reviewed')),
  submitted_at timestamptz,
  is_exam_mode boolean default false,
  time_spent_seconds integer,
  created_at timestamptz default now(),
  unique(assignment_id, author_id)
);

-- Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  essay_id uuid references public.essays(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) not null,
  overall_band decimal(3,1) default 5.0,
  general_verdict text default '',
  is_complete boolean default false,
  is_partial boolean default false,
  edited_by_teacher boolean default false,
  teacher_id uuid,
  teacher_name text,
  teacher_edited_at timestamptz,
  teacher_feedback text,
  original_band decimal(3,1),
  criteria jsonb not null default '{}',
  reviewed_criteria text[] default '{}',
  criteria_evaluators jsonb default '{}',
  contributors jsonb default '[]',
  inline_comments jsonb default '[]',
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  title text not null,
  body text not null default '',
  classroom_id uuid,
  assignment_id uuid,
  essay_id uuid,
  recipient_id text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ─── Row Level Security ────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.assignments enable row level security;
alter table public.essays enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Classrooms
create policy "classrooms_select" on public.classrooms for select using (auth.role() = 'authenticated');
create policy "classrooms_insert" on public.classrooms for insert with check (auth.uid() = teacher_id);
create policy "classrooms_update" on public.classrooms for update using (auth.uid() = teacher_id);

-- Classroom students
create policy "cs_select" on public.classroom_students for select using (auth.role() = 'authenticated');
create policy "cs_insert" on public.classroom_students for insert with check (auth.uid() = student_id);
create policy "cs_delete" on public.classroom_students for delete using (auth.uid() = student_id);

-- Assignments
create policy "assignments_select" on public.assignments for select using (auth.role() = 'authenticated');
create policy "assignments_insert" on public.assignments for insert with check (auth.role() = 'authenticated');
create policy "assignments_update" on public.assignments for update using (auth.role() = 'authenticated');

-- Essays
create policy "essays_select" on public.essays for select using (auth.role() = 'authenticated');
create policy "essays_insert" on public.essays for insert with check (auth.role() = 'authenticated');
create policy "essays_update" on public.essays for update using (auth.role() = 'authenticated');

-- Reviews
create policy "reviews_select" on public.reviews for select using (auth.role() = 'authenticated');
create policy "reviews_insert" on public.reviews for insert with check (auth.role() = 'authenticated');
create policy "reviews_update" on public.reviews for update using (auth.role() = 'authenticated');

-- Notifications
create policy "notif_select" on public.notifications
  for select using (
    auth.role() = 'authenticated'
    and (recipient_id = auth.uid()::text or recipient_id = 'all')
  );
create policy "notif_insert" on public.notifications
  for insert with check (auth.role() = 'authenticated');
create policy "notif_update" on public.notifications
  for update using (auth.role() = 'authenticated');

-- ─── Auto-create profile on signup ─────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar', 'US'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
