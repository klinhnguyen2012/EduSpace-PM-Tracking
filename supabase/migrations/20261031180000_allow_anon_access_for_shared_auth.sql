-- Allow anon access for shared admin credentials
grant select, update on public.profiles to anon;
grant select, insert, update, delete on public.tasks to anon;
grant select, insert, update, delete on public.bugs to anon;

create policy "Anon can view profiles"
  on public.profiles for select to anon
  using (true);

create policy "Anon can manage tasks"
  on public.tasks for all to anon
  using (true)
  with check (true);

create policy "Anon can manage bugs"
  on public.bugs for all to anon
  using (true)
  with check (true);

grant select, insert, delete on storage.objects to anon;

create policy "Anon can view task images"
  on storage.objects for select to anon
  using (bucket_id = 'task-images');

create policy "Anon can upload task images"
  on storage.objects for insert to anon
  with check (bucket_id = 'task-images');

create policy "Anon can delete task images"
  on storage.objects for delete to anon
  using (bucket_id = 'task-images');

