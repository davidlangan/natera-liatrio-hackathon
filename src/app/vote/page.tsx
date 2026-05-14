import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BALLOT_COOKIE, VOTES_REQUIRED } from "@/lib/constants";
import { verifyCookie } from "@/lib/hash";
import { VoteGrid } from "./VoteGrid";
import { Countdown } from "@/components/Countdown";
import type { Team } from "@/types/db";
import Link from "next/link";

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
          <span className="eyebrow">VOTING</span>
          <h1 className="h-display text-text-on-light mt-3">
            Cast your vote for{" "}
            <span className="h-emphasis">the best demo.</span>
          </h1>
          <p className="mt-5 max-w-xl text-text-muted-light leading-[1.6]">
            Pick exactly {VOTES_REQUIRED} teams. No ranking — your three picks
            count equally. You can only vote once.
          </p>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3 max-w-3xl">
            <Instr n="01" t="Pick three" b="Tap any card to select. Tap again to deselect." />
            <Instr n="02" t="Confirm" b="We'll show your picks before locking the ballot." />
            <Instr n="03" t="Watch live" b="The leaderboard updates instantly after submit." />
          </ol>

          <div className="mt-10">
            {!open ? (
              <ClosedState closesAt={settings?.voting_closes_at ?? null} />
            ) : (
              <VoteGrid teams={teams} />
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

function ClosedState({ closesAt }: { closesAt: string | null }) {
  const past =
    closesAt !== null && new Date(closesAt).getTime() < Date.now();
  return (
    <div className="card-light p-8 max-w-xl">
      <span className="eyebrow">
        {past ? "VOTING CLOSED" : "VOTING NOT OPEN YET"}
      </span>
      <h2 className="text-[22px] font-semibold mt-2">
        {past
          ? "Voting wrapped up. Head to the leaderboard."
          : "Voting hasn't opened yet."}
      </h2>
      <p className="mt-2 text-text-muted-light">
        {past
          ? "Thanks to everyone who voted."
          : "Check back when the admin flips the switch."}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/browse" className="btn btn-ghost-light">
          Browse demos
        </Link>
        <Link href="/leaderboard" className="btn btn-blue">
          See leaderboard →
        </Link>
      </div>
      {closesAt && !past && (
        <div className="mt-6">
          <Countdown closesAt={closesAt} label="OPENS / CLOSES AT" compact />
        </div>
      )}
    </div>
  );
}
