import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BALLOT_COOKIE, VOTES_REQUIRED } from "@/lib/constants";
import { verifyCookie } from "@/lib/hash";
import { VoteGrid } from "./VoteGrid";
import { TeamCard } from "@/components/TeamCard";
import type { Team } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  // If they've already voted, redirect to /thanks.
  const cookieStore = await cookies();
  const ballotCookie = cookieStore.get(BALLOT_COOKIE)?.value;
  if (ballotCookie) {
    const fp = verifyCookie(ballotCookie);
    if (fp) {
      const admin = getAdminSupabase();
      const { data } = await admin
        .from("ballots")
        .select("id")
        .eq("fingerprint_hash", fp)
        .maybeSingle();
      if (data) redirect("/thanks");
    }
  }

  const supabase = await getServerSupabase();
  const [{ data: settings }, { data: teamsData }] = await Promise.all([
    supabase
      .from("settings")
      .select("voting_open, voting_closes_at")
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, members, demo_url, tagline, thumbnail_url, summary")
      .order("created_at", { ascending: true }),
  ]);

  const open =
    !!settings?.voting_open &&
    (!settings?.voting_closes_at ||
      new Date(settings.voting_closes_at).getTime() > Date.now());

  const teams = (teamsData as Team[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <div className="band band-light">
        <Header variant="light" />
        <div className="band-inner">
          <span className="eyebrow">{open ? "VOTING" : "DEMOS"}</span>
          <h1 className="h-display text-text-on-light mt-3">
            {open ? (
              <>
                Cast your vote for{" "}
                <span className="h-emphasis">the best demo.</span>
              </>
            ) : (
              <>
                Browse every{" "}
                <span className="h-emphasis">demo on the ballot.</span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-xl text-text-muted-light leading-[1.6]">
            {open
              ? `Pick exactly ${VOTES_REQUIRED} teams. No ranking — your three picks count equally. You can only vote once.`
              : "Open each team's demo to see what they built. Voting opens when the admin flips the switch."}
          </p>

          {open && (
            <ol className="mt-8 grid gap-6 sm:grid-cols-3 max-w-3xl">
              <Instr n="01" t="Pick three" b="Tap any card to select. Tap again to deselect." />
              <Instr n="02" t="Confirm" b="We'll show your picks before locking the ballot." />
              <Instr n="03" t="Done" b="One ballot per person. Votes are final." />
            </ol>
          )}

          <div className="mt-10">
            {open ? (
              <VoteGrid teams={teams} />
            ) : (
              <Gallery teams={teams} />
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </main>
  );
}

function Instr({ n, t, b }: { n: string; t: string; b: string }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="num-bullet" aria-hidden>
        {n}
      </span>
      <div>
        <h3 className="font-semibold text-[16px]">{t}</h3>
        <p className="text-text-muted-light text-[14px] leading-[1.5]">{b}</p>
      </div>
    </li>
  );
}

function Gallery({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="card-light p-10 text-center max-w-xl mx-auto">
        <span className="eyebrow">NO TEAMS YET</span>
        <h2 className="text-[22px] font-semibold mt-2">
          The gallery's quiet — for now.
        </h2>
        <p className="mt-2 text-text-muted-light">
          Once captains register, their demos show up here.
        </p>
      </div>
    );
  }
  return (
    <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((t) => (
        <li key={t.id}>
          <TeamCard team={t} variant="light" showOpenLink />
        </li>
      ))}
    </ul>
  );
}
