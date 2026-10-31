-- Task assignees are workspace names, not Supabase login accounts.
alter table public.tasks
  drop constraint if exists tasks_assignee_id_fkey;

alter table public.tasks
  add column assignee_name text;

-- Preserve existing assignments as their profile display names where possible.
update public.tasks as task
set assignee_name = profile.display_name
from public.profiles as profile
where task.assignee_id = profile.id;

alter table public.tasks
  drop column assignee_id;

drop index if exists public.tasks_assignee_id_idx;
