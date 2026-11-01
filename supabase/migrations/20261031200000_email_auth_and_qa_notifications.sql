-- Store the email identities for task PICs and the person responsible for QA.
alter table public.tasks
  add column if not exists assignee_emails text[],
  add column if not exists qa_assignee_email text;

-- Existing task assignment names are left untouched. The app resolves emails
-- from the team directory at runtime and stores them only on future edits.
-- A fresh table records notification delivery without rewriting existing rows.
create table if not exists public.task_email_notifications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  event_key text not null,
  recipient_email text not null,
  created_at timestamptz not null default now(),
  unique (event_key, recipient_email)
);

alter table public.task_email_notifications enable row level security;
revoke all on public.task_email_notifications from anon, authenticated;
grant all on public.task_email_notifications to service_role;
