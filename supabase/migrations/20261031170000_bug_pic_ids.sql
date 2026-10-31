alter table public.bugs
  add column if not exists test_result text,
  add column if not exists test_attachments text[] not null default '{}',
  add column if not exists pic_ids uuid[] not null default '{}';

update public.bugs
set pic_ids = array[assignee_id]::uuid[]
where assignee_id is not null
  and cardinality(pic_ids) = 0;

alter table public.tasks
  add column if not exists assignee_names text[] not null default '{}';

update public.tasks
set assignee_names = array[assignee_name]
where assignee_name is not null
  and cardinality(assignee_names) = 0;
