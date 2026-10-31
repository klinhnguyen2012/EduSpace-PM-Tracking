-- EduSpace V1 core data model.
-- All signed-in team members share task and bug data. RLS blocks anonymous access.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null unique,
  role text not null default 'Member',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  output text,
  acceptance_criteria text[] not null default '{}',
  assignee_id uuid references public.profiles (id) on delete set null,
  priority text check (priority in ('P0', 'P1', 'P2')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'qa', 'done', 'paused')),
  start_date date,
  deadline date,
  links text[] not null default '{}',
  notes text,
  feedback text,
  is_blocked boolean not null default false,
  blocker_reason text,
  source_note text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.bugs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  severity text not null default 'medium'
    check (severity in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'fixed', 'retesting', 'closed')),
  assignee_id uuid references public.profiles (id) on delete set null,
  related_task_id uuid references public.tasks (id) on delete set null,
  environment text check (environment in ('staging', 'production')),
  evidence_link text,
  notes text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_status_deadline_idx on public.tasks (status, deadline);
create index bugs_status_severity_idx on public.bugs (status, severity);
create index bugs_assignee_id_idx on public.bugs (assignee_id);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.bugs enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.bugs to authenticated;

create policy "Signed-in users can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Signed-in users can manage tasks"
  on public.tasks for all to authenticated
  using (true)
  with check (true);

create policy "Signed-in users can manage bugs"
  on public.bugs for all to authenticated
  using (true)
  with check (true);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add profiles for users that existed before this migration.
insert into public.profiles (id, display_name, email)
select id, split_part(email, '@', 1), email
from auth.users
where email is not null
on conflict (id) do nothing;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger bugs_set_updated_at
  before update on public.bugs
  for each row execute function public.set_updated_at();
