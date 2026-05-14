import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeaderboardLive } from "@/app/leaderboard/LeaderboardLive";
import { computeTopThreeWithOthers } from "@/lib/standings";
import { isAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  if (!(await isAdmin())) {
    redirect("/admin");
  }
  const { top, otherCount } = await computeTopThreeWithOthers();

  return (
    <main className="min-h-screen">
      <div className="band band-dark">
        <Header variant="dark" />
        <div className="band-inner">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="eyebrow-strong">ADMIN · LEADERBOARD</span>
              <h1 className="h-display mt-3 max-w-3xl text-text-on-dark">
                Live standings.{" "}
                <span className="h-emphasis">Top three only.</span>
              </h1>
              <p className="mt-5 max-w-xl text-text-muted-dark leading-[1.6]">
                Realtime — updates as ballots come in. Project this at the end
                of the event. Voters never see this page; the public
                <code className="mx-1 px-1.5 py-0.5 rounded bg-surface-dark border border-border-dark text-[13px]">/leaderboard</code>
                URL silently redirects them to the admin login.
              </p>
            </div>
            <Link href="/admin" className="btn btn-secondary">
              ← Back to admin
            </Link>
          </div>

          <div className="mt-12">
            <LeaderboardLive
              initialStandings={top}
              initialNonTopCount={otherCount}
            />
          </div>
        </div>
      </div>
      <Footer variant="dark" />
    </main>
  );
}
