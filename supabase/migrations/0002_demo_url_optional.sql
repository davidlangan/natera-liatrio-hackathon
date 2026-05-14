-- ============================================================================
-- 0002_demo_url_optional
-- Make `teams.demo_url` nullable so captains can register without a live
-- demo link. The app code already treats null/empty as "no link" and hides
-- the Open demo button. Run this once in the Supabase SQL editor.
-- ============================================================================

alter table public.teams
  alter column demo_url drop not null;
