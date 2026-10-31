-- Store bug evidence image paths in the bugs row.
-- Images share the existing private task-images bucket and its authenticated policies.
alter table public.bugs
  add column if not exists attachments text[] not null default '{}';
