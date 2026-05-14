import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroOrbits } from "@/components/HeroOrbits";
import { Countdown } from "@/components/Countdown";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getEventState() {
  const supabase = await getServerSupabase();
  const [{ data: settings }, { count: teamCount }] = await Promise.all([
    supabase.from("settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("teams").select("id", { count: "exact", head: true }),
  ]);
  return {
    settings,
    teamCount: teamCount ?? 0,
  };
}

export default async function HomePage() {
  const { settings, teamCount } = await getEventState();
  const votingOpen = !!settings?.voting_open;
  const closesAt = settings?.voting_closes_at ?? null;

  return (
    <main className="band band-dark min-h-screen">
      <Header variant="dark" />

      {/* Hero */}
      <section className="relative band-inner">
        <HeroOrbits />
        <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-7">
            <span className="eyebrow-strong">AI HACKATHON · VOTING</span>
            <h1 className="h-display text-text-on-dark">
              Cast your vote for{" "}
              <span className="h-emphasis">the best demo.</span>
            </h1>
            <p className="text-text-muted-dark text-[16px] sm:text-[17px] max-w-xl leading-[1.6]">
              Internal voting is now {votingOpen ? "open" : "preparing to open"}{" "}
              for the Natera × Liatrio AI Hackathon. Browse what the teams built,
              then pick your three favorite demos. Equal weight, no rankings,
              one ballot per person.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/browse"
                className="btn btn-secondary"
                aria-label="Browse demos"
              >
                Browse demos
              </Link>
              <Link
                href="/vote"
                className="btn btn-primary"
                aria-label="Cast your vote"
              >
                Cast your vote →
              </Link>
            </div>
          </div>

          <div className="relative card-dark p-6 sm:p-8">
            <Countdown closesAt={closesAt} />
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat n={teamCount} label="teams registered" />
              <Stat
                n={votingOpen ? "Open" : "Closed"}
                label="voting status"
                color={votingOpen ? "#A3E635" : "#f59e0b"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Light band: "How it works" with green numerals */}
      <section className="band band-light">
        <div className="band-inner">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2 className="h-section mt-3 max-w-3xl">
            Three picks, <span className="h-emphasis">equal weight,</span> one
            ballot per person.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              n="01"
              title="Browse the demos"
              body="Open each team's live app or repo from the gallery. No vote buttons here — this is the preview-before-you-vote view."
            />
            <Step
              n="02"
              title="Pick your top three"
              body="Select exactly three teams on the vote page. We don't rank them; they're equally weighted toward each team's total."
            />
            <Step
              n="03"
              title="Watch the leaderboard"
              body="Once you submit, the live leaderboard updates instantly across every browser in the room. Top three only — no spoilers for the others."
            />
          </div>
        </div>
      </section>

      {/* Register CTA */}
      <section className="band band-dark">
        <div className="band-inner grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <span className="eyebrow-strong">REGISTER YOUR TEAM</span>
            <h2 className="h-section mt-3 max-w-xl">
              Built something cool?{" "}
              <span className="h-emphasis">Get on the ballot.</span>
            </h2>
            <p className="mt-5 text-text-muted-dark leading-[1.6] max-w-lg">
              Team captains self-serve. Drop in your team name, members, and a
              link to your live demo or GitLab repo — we'll auto-generate a
              thumbnail and summary for the gallery.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                Register a team →
              </Link>
              <Link href="/leaderboard" className="btn btn-secondary">
                View leaderboard
              </Link>
            </div>
          </div>

          <ul className="space-y-3 text-[15px] text-text-muted-dark">
            <Bullet>One-line tagline (optional) and member chips</Bullet>
            <Bullet>Auto thumbnail from microlink or the GitLab API</Bullet>
            <Bullet>Edits stay open until voting begins</Bullet>
            <Bullet>Anti-fraud: fingerprint + IP rate-limit + cookie</Bullet>
          </ul>
        </div>
      </section>

      <Footer variant="dark" />
    </main>
  );
}

function Stat({
  n,
  label,
  color,
}: {
  n: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div>
      <p
        className="text-[44px] sm:text-[56px] font-semibold leading-none"
        style={{ color: color ?? "#A3E635" }}
      >
        {n}
      </p>
      <p className="mt-1 text-[12px] uppercase tracking-eyebrow text-text-muted-dark">
        {label}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card-light p-7 flex gap-5">
      <div className="num-bullet shrink-0">{n}</div>
      <div className="space-y-2">
        <h3 className="text-[20px] font-semibold leading-tight">{title}</h3>
        <p className="text-[15px] text-text-muted-light leading-[1.55]">
          {body}
        </p>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-1.5 inline-block w-2 h-2 rounded-full bg-liatrio-green"
      />
      <span>{children}</span>
    </li>
  );
}
