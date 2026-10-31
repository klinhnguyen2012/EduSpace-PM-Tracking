-- Store task image paths in the task row and the image files in a private bucket.
alter table public.tasks
  add column attachments text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-images',
  'task-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

grant select, insert, delete on storage.objects to authenticated;

create policy "Signed-in users can view task images"
  on storage.objects for select to authenticated
  using (bucket_id = 'task-images');

create policy "Signed-in users can upload task images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-images');

create policy "Signed-in users can delete task images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'task-images');
