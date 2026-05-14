import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroOrbits } from "@/components/HeroOrbits";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getEventState() {
  const supabase = await getServerSupabase();
  const [{ data: settings }, { count: teamCount }] = await Promise.all([
    supabase
      .from("settings")
      .select("registration_open, voting_open")
      .eq("id", true)
      .maybeSingle(),
    supabase.from("teams").select("id", { count: "exact", head: true }),
  ]);
  return {
    regOpen: !!settings?.registration_open,
    votingOpen: !!settings?.voting_open,
    teamCount: teamCount ?? 0,
  };
}

export default async function HomePage() {
  const { regOpen, votingOpen, teamCount } = await getEventState();

  return (
    <main className="relative min-h-screen overflow-hidden mesh-bg">
      <HeroOrbits />

      <div className="relative z-10">
        <Header variant="dark" />

        <section className="mx-auto max-w-6xl px-6 pt-10 pb-24 sm:pt-16 sm:pb-32">
          {/* Event badge */}
          <div className="flex justify-center">
            <span className="event-badge">
              <span className="dot" aria-hidden />
              Natera × Liatrio · AI Hackathon 2026
            </span>
          </div>

          {/* Hero headline */}
          <h1 className="h-hero text-center mt-8 text-balance text-text-on-dark">
            Build it. Ship it.
            <br />
            <span className="h-gradient">Vote for it.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-center text-text-muted-dark text-[17px] sm:text-[19px] leading-[1.55] text-pretty">
            Submit your team's demo or cast your vote for the best AI work of
            the day.
          </p>

          {/* The two giant CTA buttons */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
            <CtaButton
              href="/register"
              label="Submit Demo"
              caption={regOpen ? "Get on the ballot" : "Registration closed"}
              tone="green"
              disabled={!regOpen}
            />
            <CtaButton
              href="/vote"
              label="Vote"
              caption={
                votingOpen
                  ? "Cast your three picks"
                  : teamCount > 0
                  ? "Browse the demos"
                  : "Voting opens soon"
              }
              tone="blue"
              disabled={false}
            />
          </div>

          {/* Quick stats / footnote */}
          <div className="mt-16 flex justify-center">
            <div className="flex items-center gap-6 text-[13px] text-text-dim-dark">
              <Stat label="Teams registered" value={teamCount} />
              <span className="w-px h-5 bg-border-dark" aria-hidden />
              <Stat
                label="Picks per ballot"
                value={3}
                accent="text-liatrio-green"
              />
              <span className="w-px h-5 bg-border-dark" aria-hidden />
              <Stat
                label="Ballots per person"
                value={1}
                accent="text-natera-blue"
              />
            </div>
          </div>
        </section>

        <Footer variant="dark" />
      </div>
    </main>
  );
}

function CtaButton({
  href,
  label,
  caption,
  tone,
  disabled,
}: {
  href: string;
  label: string;
  caption: string;
  tone: "green" | "blue";
  disabled: boolean;
}) {
  const inner = (
    <>
      <span className="cta-sub">
        {tone === "green" ? "Step 1" : "Step 2"}
      </span>
      <span className="text-[34px] sm:text-[40px] font-black leading-none tracking-tight">
        {label}
      </span>
      <span className="cta-arrow">
        {caption}
        {!disabled && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        )}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div
        className="cta-mega cta-disabled"
        aria-disabled
        role="button"
        tabIndex={-1}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`cta-mega ${tone === "green" ? "cta-green" : "cta-blue"}`}
    >
      {inner}
    </Link>
  );
}

function Stat({
  label,
  value,
  accent = "text-text-on-dark",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`text-[16px] font-bold tabular-nums ${accent}`}>
        {value}
      </span>
      <span className="uppercase tracking-eyebrow text-[11px] text-text-muted-dark">
        {label}
      </span>
    </span>
  );
}
