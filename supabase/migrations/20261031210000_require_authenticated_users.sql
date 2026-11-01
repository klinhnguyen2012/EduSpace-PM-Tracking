-- Apply after the email-login app is deployed and member accounts can sign in.
-- Remove temporary shared-login access for anonymous users.
drop policy if exists "Anon can view profiles" on public.profiles;
drop policy if exists "Anon can manage tasks" on public.tasks;
drop policy if exists "Anon can manage bugs" on public.bugs;
drop policy if exists "Anon can view task images" on storage.objects;
drop policy if exists "Anon can upload task images" on storage.objects;
drop policy if exists "Anon can delete task images" on storage.objects;
revoke all on public.profiles, public.tasks, public.bugs from anon;
revoke all on storage.objects from anon;
