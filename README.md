# Natera × Liatrio · AI Hackathon Voting

A polished, mobile-first internal voting app for the Natera AI Hackathon, co-branded **Natera × Liatrio**. Built to ship today.

> **Brand**: Tokens, typography, and section bands match the `AI-Forge-Guild-Natera-Proposal.pdf` in `docs/`.
> **Logos**: Real Liatrio PNG (extracted from the proposal deck) + faithful SVG recreations live in `public/logos/`. Swap to vendor SVGs anytime — see [TODO: logos](#todo-logos) below.

## Stack

- **Next.js 15** (App Router, Server Actions, RSC) — keeps backend and UI in one repo and one deploy.
- **Supabase** (Postgres + Realtime + RLS) — gives us realtime channels for the leaderboard without writing a single socket. Database constraints and triggers enforce "voting is open" and "3 distinct teams" at the row level.
- **Tailwind v3** — the brand tokens map cleanly onto Tailwind's theme; we keep the design system in one place (`tailwind.config.ts` + `globals.css`).
- **FingerprintJS open-source** — visitor ID for the anti-fraud layer (free, no Pro plan, hashed before storage).
- **canvas-confetti** — celebratory shower on `/thanks`.
- **Vercel** — zero-ops deploy, free hobby tier, automatic env-driven preview branches.

### Why not pure SQLite + Next.js (or Pusher, Firebase, etc.)?
- We need **realtime** on the leaderboard. Supabase gives us that for free *and* gives us a hosted Postgres with row-level security, which means we don't have to invent a half-baked auth layer.
- A Next.js + Supabase + Vercel deploy reaches "live URL" in roughly 10 minutes once the migration runs. That fit the "ship today" constraint better than any DIY backend.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Hero + countdown + CTAs. Dark band. |
| `/register` | Team-captain self-serve registration with auto thumbnail + summary. Light band. |
| `/browse` | Read-only gallery of every registered team. Light band. |
| `/vote` | Pick exactly **3** teams. Selection state highlights cards, confirmation modal lists picks, fingerprint generated client-side. |
| `/thanks` | Confetti reveal of the voter's three picks + leaderboard CTA. |
| `/leaderboard` | Realtime top-3 only. No rank numbers, no peek-below-third. |
| `/admin` | Passcode-gated control panel: toggle registration/voting, set auto-close, full standings table, fraud log, CSV export, full reset. |

## Local dev

```bash
# 1. Clone + install
git clone <this-repo>
cd natera-hackathon-voting
npm install

# 2. Set up Supabase
#   - Create a free project at https://supabase.com
#   - In the SQL editor, paste the contents of supabase/migrations/0001_init.sql and run it
#   - Grab your project URL, anon key, and service role key from Project Settings → API

# 3. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSCODE, BALLOT_COOKIE_SECRET

# 4. Run
npm run dev
# → http://localhost:3000
```

The migration also seeds **one dummy team** (`Test Pilot`) so the gallery isn't empty on first load. Delete it from `/admin` once real teams arrive.

## Environment variables

See `.env.example`. The required ones:

| Name | Required | Notes |
|------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL. Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key. Public. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-only**. Bypasses RLS. Never expose. |
| `ADMIN_PASSCODE` | ✅ | Shared passcode for `/admin`. Pick something long. |
| `BALLOT_COOKIE_SECRET` | ✅ | 32-byte hex used to sign cookies and HMAC fingerprint/IP hashes. Generate with `openssl rand -hex 32`. |
| `MICROLINK_API_KEY` | optional | Higher microlink rate limits. Free tier works without one. |
| `GITLAB_HOST` | optional | Self-hosted GitLab base URL (no trailing slash). `gitlab.com` is auto-detected. |
| `NEXT_PUBLIC_EVENT_DATE` | optional | Shown in the footer. |
| `NEXT_PUBLIC_DEFAULT_VOTING_CLOSE` | optional | ISO 8601 default close time hint. Admin can override at runtime. |

## Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. Import to Vercel. Framework auto-detects as Next.js.
3. Add **all** env vars from `.env.example` (use **Production** for both Production and Preview).
4. Set the Vercel project **Node.js version** to 20 or 22.
5. Deploy. The first build takes ~60s.

> If your Supabase project is brand new, run the SQL migration **once** via the Supabase SQL editor before your first deploy. You can also run it through `psql` or `supabase db push` if you use the CLI.

### Deploy to Netlify
Drop in the same env vars and use the Next.js plugin. Works identically.

## How realtime works

The leaderboard subscribes to a Supabase channel on the `ballots` and `teams` tables. On any change event we refetch the **top-3 standings** from `/api/standings` (server-computed with the deterministic tiebreak). This is cheaper than streaming per-row and keeps the privacy guarantee that **no client ever sees an individual ballot**.

Belt-and-suspenders 15-second polling kicks in as a fallback when WebSockets are blocked by corporate networks.

## Anti-fraud: what we do, and what we don't

We're going anonymous (no login), so the defense is layered:

1. **Signed httpOnly cookie** `nh_ballot` stamped on submit; subsequent `/vote` visits redirect to `/thanks`.
2. **FingerprintJS OSS** visitor ID, hashed with an HMAC keyed by `BALLOT_COOKIE_SECRET` and persisted with the ballot. Unique-key constraint on `fingerprint_hash` makes a second ballot impossible at the DB level.
3. **IP rate limits** (HMAC-hashed IP):
   - max 1 ballot per IP per **10 minutes**
   - max 5 ballots per IP for the **entire event** (handles shared NAT — a busy office or co-working space)
4. **DB triggers** reject any insert when `settings.voting_open = false` (or past `voting_closes_at`).

### What this **doesn't** stop
- Determined cheaters with a phone, a laptop, and an LTE hotspot can vote twice.
- Browser private mode + clearing storage + an IP rotation will defeat the cookie and fingerprint layers.
- A motivated bad actor with a VPN can cycle through fresh IPs.

This is best-effort for an internal event, not a public election. Communicate that clearly.

Every blocked attempt lands in `/admin` → Anti-fraud log with reason, hashed fingerprint, hashed IP, and which existing ballot it collided with.

## Resetting the event

The fastest path: go to `/admin`, click **Reset event**, type `RESET`. This wipes ballots, fraud log, teams, and resets settings to `registration_open=true`, `voting_open=false`, no close time.

To wipe at the DB level instead:

```sql
truncate public.ballots, public.fraud_log, public.teams;
update public.settings
  set registration_open = true,
      voting_open = false,
      voting_closes_at = null
  where id = true;
```

The seed team is **not** re-inserted automatically; re-run `0001_init.sql` if you want it back.

## CSV export

`/admin` → **Export CSV**. The file contains two sections:

1. Teams with vote totals, sorted by votes desc.
2. Every ballot (id, three team ids, hashed fingerprint, hashed IP, user-agent, timestamp) for full auditability.

Both sections live in a single CSV file (separated by a `# Section N` comment row).

## Acceptance checklist mapping

The original spec's acceptance items map to:

- ✅ Brand PDF applied → `tailwind.config.ts`, `globals.css`, alternating dark/light bands on every page
- ✅ Logos in header everywhere → `src/components/Header.tsx` + `LiatrioLogo`/`NateraLogo`
- ✅ Captain registers, sees auto thumbnail + summary → `src/app/register/RegisterForm.tsx` + `src/lib/url-preview.ts`
- ✅ Captain can re-edit while open → captain token cookie scoped to `team.id`; `/register?team=<id>` flow
- ✅ Registration closed switch → DB trigger `guard_team_insert` + `/admin` toggle
- ✅ Voting open switch → DB trigger `guard_ballot_insert` + `/admin` toggle
- ✅ Exactly-3 enforced → both client `VoteGrid` and DB `ballots_distinct_teams` check
- ✅ Confirmation modal → `ConfirmModal` lists picks before submit
- ✅ Re-visit `/vote` redirects to `/thanks` → cookie + DB lookup at `vote/page.tsx`
- ✅ 6th attempt from same IP blocked → `src/lib/fraud.ts` per-IP cap
- ✅ Top-3 only, no rank numbers → `LeaderboardLive`
- ✅ Sub-2s realtime → Supabase channel + 15s poll fallback
- ✅ Voting auto-closes → `voting_closes_at` checked in both server action and DB trigger
- ✅ CSV export → `/api/admin/export`
- ✅ Mobile at 375px → Tailwind responsive grid, single-column collapse on every page
- ✅ No console / hydration warnings → `useActionState`, `Suspense`-free server components, fingerprint deferred to `useEffect`

## TODO: logos

The Liatrio mark in `public/logos/liatrio.svg` and `public/logos/liatrio-color.png` are extracted directly from the proposal deck. The Natera mark in `public/logos/natera.svg` is a faithful SVG recreation of the cover lockup (four overlapping circles + wordmark). If your team has the official vendor SVGs:

1. Drop them in `public/logos/` as `natera.svg` and `liatrio.svg` (replacing the existing files).
2. Header / Footer pick them up automatically — no code changes needed.

## Repo map

```
public/logos/        Brand assets (svg + png)
docs/                Brand reference (the proposal PDF)
supabase/migrations/ Schema, triggers, RLS, seed
src/app/             App Router pages and server actions
  api/               Route handlers (CSV export, standings JSON)
src/components/      Shared UI (Header, Footer, TeamCard, ...)
src/lib/             Supabase clients, hash, fraud, url-preview, standings
src/types/db.ts      Shared TypeScript types
```
