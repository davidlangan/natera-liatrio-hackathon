import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeaderboardLive } from "./LeaderboardLive";
import { computeTopThreeWithOthers } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { top, otherCount } = await computeTopThreeWithOthers();

  return (
    <main className="min-h-screen">
      <div className="band band-dark">
        <Header variant="dark" />
        <div className="band-inner">
          <span className="eyebrow-strong">LEADERBOARD</span>
          <h1 className="h-display mt-3 max-w-3xl text-text-on-dark">
            Live results.{" "}
            <span className="h-emphasis">Top three only.</span>
          </h1>
          <p className="mt-5 max-w-xl text-text-muted-dark leading-[1.6]">
            Standings refresh as votes come in — no manual reload required.
            We deliberately hide rank numbers and anything below third place.
          </p>

          <div className="mt-12">
            <LeaderboardLive initialStandings={top} initialNonTopCount={otherCount} />
          </div>
        </div>
      </div>
      <Footer variant="dark" />
    </main>
  );
}
