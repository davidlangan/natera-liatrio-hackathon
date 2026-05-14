-- ============================================================================
-- 0003_running_locally_and_thumbnails
-- 1. Adds `teams.running_locally` boolean. The /register form lets a captain
--    declare their demo will be shown in person (no live URL).
-- 2. Provisions the `team-thumbnails` Supabase Storage bucket plus the
--    public-read + anonymous-insert policies the optional thumbnail upload
--    needs. Storage object writes require the service role from `supabase-js`
--    inside the SQL editor, so this whole file must be pasted into the
--    Supabase SQL editor manually — it cannot be applied via plain psql.
-- ============================================================================

alter table public.teams
  add column if not exists running_locally boolean not null default false;

-- ---- Storage bucket for custom team thumbnails ----------------------------
-- Public-read so the saved `thumbnail_url` resolves from any browser via
-- next/image. Anonymous insert because /register is unauthenticated; the
-- server action validates that the URL we persist points at this bucket.

insert into storage.buckets (id, name, public)
values ('team-thumbnails', 'team-thumbnails', true)
on conflict (id) do update set public = excluded.public;

-- Drop-then-create keeps this snippet safely re-runnable. (Postgres'
-- `create policy` does not universally support `if not exists`.)
drop policy if exists "team-thumbnails public read" on storage.objects;
create policy "team-thumbnails public read"
  on storage.objects for select
  using (bucket_id = 'team-thumbnails');

drop policy if exists "team-thumbnails anon upload" on storage.objects;
create policy "team-thumbnails anon upload"
  on storage.objects for insert
  with check (bucket_id = 'team-thumbnails');
