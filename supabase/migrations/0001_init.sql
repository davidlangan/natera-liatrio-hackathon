-- ============================================================================
-- Natera × Liatrio AI Hackathon — Voting App
-- Schema, constraints, RLS, and realtime configuration.
-- Run this once in the Supabase SQL editor (or via supabase db push).
-- ============================================================================

-- ---------- Extensions ------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.settings (
  id                 boolean primary key default true,
  registration_open  boolean not null default true,
  voting_open        boolean not null default false,
  voting_closes_at   timestamptz,
  updated_at         timestamptz not null default now(),
  constraint settings_singleton check (id)
);

insert into public.settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  members       jsonb not null default '[]'::jsonb,
  demo_url      text not null,
  tagline       text,
  thumbnail_url text,
  summary       text,
  captain_token text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint teams_name_length check (char_length(name) between 1 and 60),
  constraint teams_tagline_length check (tagline is null or char_length(tagline) <= 120),
  constraint teams_members_size check (jsonb_array_length(members) between 1 and 10)
);

create table if not exists public.ballots (
  id               uuid primary key default gen_random_uuid(),
  team_id_1        uuid not null references public.teams(id) on delete cascade,
  team_id_2        uuid not null references public.teams(id) on delete cascade,
  team_id_3        uuid not null references public.teams(id) on delete cascade,
  fingerprint_hash text not null,
  ip_hash          text not null,
  user_agent       text,
  created_at       timestamptz not null default now(),
  constraint ballots_distinct_teams check (
    team_id_1 <> team_id_2
    and team_id_1 <> team_id_3
    and team_id_2 <> team_id_3
  ),
  constraint ballots_fingerprint_unique unique (fingerprint_hash)
);

create index if not exists ballots_ip_hash_created_idx on public.ballots (ip_hash, created_at desc);
create index if not exists ballots_t1_idx on public.ballots (team_id_1);
create index if not exists ballots_t2_idx on public.ballots (team_id_2);
create index if not exists ballots_t3_idx on public.ballots (team_id_3);

create table if not exists public.fraud_log (
  id                     uuid primary key default gen_random_uuid(),
  fingerprint_hash       text,
  ip_hash                text,
  user_agent             text,
  reason                 text not null,
  collided_with_ballot_id uuid references public.ballots(id) on delete set null,
  attempted_at           timestamptz not null default now()
);

-- ---------- Touched-at trigger ---------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
before update on public.teams
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute procedure public.set_updated_at();

-- ---------- Gate inserts on settings ---------------------------------------
-- A team can only be created when registration is open.
create or replace function public.guard_team_insert() returns trigger as $$
declare
  is_open boolean;
begin
  select registration_open into is_open from public.settings where id = true;
  if not coalesce(is_open, false) then
    raise exception 'registration_closed';
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_guard_team_insert on public.teams;
create trigger trg_guard_team_insert
before insert on public.teams
for each row execute procedure public.guard_team_insert();

-- A ballot can only be created when voting is open AND not past close time.
create or replace function public.guard_ballot_insert() returns trigger as $$
declare
  s public.settings%rowtype;
begin
  select * into s from public.settings where id = true;
  if not coalesce(s.voting_open, false) then
    raise exception 'voting_closed';
  end if;
  if s.voting_closes_at is not null and now() > s.voting_closes_at then
    raise exception 'voting_closed';
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_guard_ballot_insert on public.ballots;
create trigger trg_guard_ballot_insert
before insert on public.ballots
for each row execute procedure public.guard_ballot_insert();

-- ---------- Public view: top-3 standings -----------------------------------
-- Used by the leaderboard. Tiebreak: earliest-arriving third vote ranks higher.
create or replace view public.standings as
with vote_counts as (
  select t.id as team_id,
         t.name,
         t.tagline,
         t.thumbnail_url,
         t.demo_url,
         coalesce(b.cnt, 0) as votes
  from public.teams t
  left join (
    select team_id, count(*)::int as cnt
    from (
      select team_id_1 as team_id from public.ballots
      union all
      select team_id_2 from public.ballots
      union all
      select team_id_3 from public.ballots
    ) all_votes
    group by team_id
  ) b on b.team_id = t.id
),
total as (
  select greatest(sum(votes), 1)::numeric as t from vote_counts
)
select vc.team_id,
       vc.name,
       vc.tagline,
       vc.thumbnail_url,
       vc.demo_url,
       vc.votes,
       round((vc.votes::numeric / (select t from total)) * 100, 1) as pct
from vote_counts vc;

-- ---------- Realtime publications ------------------------------------------
-- Supabase's `supabase_realtime` publication powers client-side channels.
alter publication supabase_realtime add table public.ballots;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.settings;

-- ---------- Row Level Security ---------------------------------------------
alter table public.settings  enable row level security;
alter table public.teams     enable row level security;
alter table public.ballots   enable row level security;
alter table public.fraud_log enable row level security;

-- Settings: readable by everyone, writable only via service role
create policy "settings_read"  on public.settings  for select using (true);

-- Teams: readable by everyone; insert/update via server (service role) only.
create policy "teams_read"     on public.teams     for select using (true);

-- Ballots: NOT readable client-side (privacy); writes via server only.
-- (No public read policy on purpose. Service role bypasses RLS.)

-- Fraud log: not exposed to the client.

-- ---------- Seed: one dummy team -------------------------------------------
insert into public.teams (name, members, demo_url, tagline, thumbnail_url, summary)
values (
  'Test Pilot',
  '["Alex Park","Jamie Rivera","Sam Chen"]'::jsonb,
  'https://example.com',
  'A friendly placeholder so the gallery is never empty.',
  null,
  'Seeded team used to verify the gallery renders on first load. Delete me from /admin once real teams register.'
)
on conflict (name) do nothing;
