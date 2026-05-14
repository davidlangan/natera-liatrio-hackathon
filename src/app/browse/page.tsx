import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getServerSupabase } from "@/lib/supabase/server";
import { TeamCard } from "@/components/TeamCard";
import Link from "next/link";
import type { Team } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = await getServerSupabase();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, members, demo_url, tagline, thumbnail_url, summary")
    .order("created_at", { ascending: true });

  const list: Team[] = (teams as Team[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <div className="band band-light">
        <Header variant="light" />
        <div className="band-inner">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">GALLERY</span>
              <h1 className="h-display text-text-on-light mt-3">
                Browse every{" "}
                <span className="h-emphasis">demo on the ballot.</span>
              </h1>
              <p className="mt-4 max-w-xl text-text-muted-light leading-[1.6]">
                Open each team's live app or repo before you vote. No vote
                buttons here — this is the preview pass.
              </p>
            </div>
            <Link href="/vote" className="btn btn-blue">
              Cast your vote →
            </Link>
          </div>

          <div className="mt-10">
            {list.length === 0 ? (
              <EmptyState />
            ) : (
              <ul
                role="list"
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {list.map((t) => (
                  <li key={t.id}>
                    <TeamCard team={t} variant="light" showOpenLink />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="card-light p-10 text-center max-w-xl mx-auto">
      <span className="eyebrow">NO TEAMS YET</span>
      <h2 className="text-[22px] font-semibold mt-2">
        The gallery's quiet — for now.
      </h2>
      <p className="mt-2 text-text-muted-light">
        Be the first to register a team and the gallery fills in instantly.
      </p>
      <Link href="/register" className="btn btn-primary mt-6 inline-flex">
        Register a team →
      </Link>
    </div>
  );
}
