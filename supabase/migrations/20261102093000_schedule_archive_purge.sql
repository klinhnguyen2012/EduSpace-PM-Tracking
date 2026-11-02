-- Requires a Vault secret named `archive_purge_service_role` before this migration runs.
-- If it is absent, the migration safely skips scheduling; add the secret and rerun this file.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'archive_purge_service_role'
  ) then
    raise notice 'Archive purge cron not scheduled: add Vault secret archive_purge_service_role, then rerun this migration.';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'eduspace-purge-expired-archive') then
    perform cron.unschedule('eduspace-purge-expired-archive');
  end if;

  perform cron.schedule(
    'eduspace-purge-expired-archive',
    '15 3 * * *',
    $job$select net.http_post(
      url := 'https://dzfwgpwjdjeqeswnxkdo.supabase.co/functions/v1/purge-expired-archive',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'archive_purge_service_role'),
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'archive_purge_service_role')
      ),
      body := '{}'::jsonb
    );$job$
  );
end;
$$;
