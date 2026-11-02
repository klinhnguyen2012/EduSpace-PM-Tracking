-- Soft archive task and bug rows. Existing records remain active and unchanged.
alter table public.tasks
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text check (archive_reason in ('deleted', 'completed')),
  add column if not exists archive_previous_status text;

alter table public.bugs
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text check (archive_reason in ('deleted', 'completed')),
  add column if not exists archive_previous_status text;

create index if not exists tasks_archived_at_idx on public.tasks (archived_at) where archived_at is not null;
create index if not exists bugs_archived_at_idx on public.bugs (archived_at) where archived_at is not null;
