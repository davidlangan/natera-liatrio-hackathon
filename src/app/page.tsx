import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroOrbits } from "@/components/HeroOrbits";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getEventState() {
  const supabase = await getServerSupabase();
  const { data: settings } = await supabase
    .from("settings")
    .select("registration_open, voting_open")
    .eq("id", true)
    .maybeSingle();
  return {
    regOpen: !!settings?.registration_open,
    votingOpen: !!settings?.voting_open,
  };
}

export default async function HomePage() {
  const { regOpen, votingOpen } = await getEventState();

  return (
    <main className="band band-dark min-h-screen">
      <Header variant="dark" />

      <section className="relative band-inner">
        <HeroOrbits />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="eyebrow-strong">AI HACKATHON</span>
          <h1 className="h-display text-text-on-dark mt-4">
            Cast your vote for{" "}
            <span className="h-emphasis">the best demo.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-text-muted-dark text-[16px] sm:text-[17px] leading-[1.6]">
            Register your team. Then pick three demos you loved. Equal weight,
            no rankings, one ballot per person.
          </p>
        </div>

        <div className="relative mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          <Tile
            href="/register"
            eyebrow="TAB 1"
            title="Register your team"
            body="Submit your team name, members, and a link to your demo or repo. Captains can edit until voting opens."
            cta={regOpen ? "Get on the ballot →" : "Registration closed"}
            disabled={!regOpen}
            accent="green"
          />
          <Tile
            href="/vote"
            eyebrow="TAB 2"
            title="Vote on demos"
            body="Open each team's demo, then pick exactly three favorites. One ballot per person; votes are final."
            cta={votingOpen ? "Cast your vote →" : "Browse demos"}
            disabled={false}
            accent="blue"
          />
        </div>
      </section>

      <Footer variant="dark" />
    </main>
  );
}

function Tile({
  href,
  eyebrow,
  title,
  body,
  cta,
  disabled,
  accent,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  disabled: boolean;
  accent: "green" | "blue";
}) {
  const accentColor =
    accent === "green" ? "text-liatrio-green" : "text-natera-blue";
  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={`card-dark p-8 transition-all duration-150 flex flex-col gap-4 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:-translate-y-0.5 hover:border-opacity-60"
      }`}
    >
      <span className={`eyebrow-strong ${accentColor}`}>{eyebrow}</span>
      <h2 className="text-[26px] sm:text-[30px] font-semibold leading-tight">
        {title}
      </h2>
      <p className="text-text-muted-dark leading-[1.55] text-[15px] flex-1">
        {body}
      </p>
      <span className={`mt-2 font-semibold ${accentColor}`}>{cta}</span>
    </Link>
  );
}
