-- Separate post-fix verification from the original bug report and its screenshots.
alter table public.bugs
  add column if not exists test_result text,
  add column if not exists test_attachments text[] not null default '{}';
