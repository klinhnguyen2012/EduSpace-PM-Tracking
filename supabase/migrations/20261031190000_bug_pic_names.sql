alter table public.bugs
  add column if not exists pic_names text[] not null default '{}';

update public.bugs as bug
set pic_names = coalesce((
  select array_agg(profile.display_name order by assigned_pic.ordinality)
  from unnest(bug.pic_ids) with ordinality as assigned_pic(id, ordinality)
  join public.profiles as profile on profile.id = assigned_pic.id
  where profile.display_name = any(array['Khoa', 'Chiến', 'Trân', 'Linh']::text[])
), '{}'::text[])
where cardinality(bug.pic_ids) > 0
  and cardinality(bug.pic_names) = 0;
