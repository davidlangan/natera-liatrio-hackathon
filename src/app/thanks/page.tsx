import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/server";
import { Confetti } from "./Confetti";

export const dynamic = "force-dynamic";

export default async function ThanksPage() {
  const cookieStore = await cookies();
  const picksRaw = cookieStore.get("nh_picks")?.value;
  let picks: { id: string; name: string }[] = [];
  if (picksRaw) {
    try {
      const ids = JSON.parse(picksRaw) as string[];
      const admin = getAdminSupabase();
      const { data } = await admin
        .from("teams")
        .select("id, name")
        .in("id", ids);
      if (data) {
        picks = ids
          .map((id) => data.find((t) => t.id === id))
          .filter(Boolean) as { id: string; name: string }[];
      }
    } catch {
      // shrug — show the generic thanks message
    }
  }

  return (
    <main className="min-h-screen relative">
      <Confetti />
      <div className="band band-dark">
        <Header variant="dark" />
        <div className="band-inner relative">
          <span className="eyebrow-strong">BALLOT IN</span>
          <h1 className="h-display mt-3 max-w-3xl text-text-on-dark">
            Thanks for voting.{" "}
            <span className="h-emphasis">Your picks are locked.</span>
          </h1>
          <p className="mt-5 max-w-xl text-text-muted-dark leading-[1.6]">
            One vote per person — yours is in. Results will be unveiled at the
            end of the hackathon. No peeking 😉
          </p>

          {picks.length > 0 && (
            <ul className="mt-10 grid gap-4 max-w-xl">
              {picks.map((p, i) => (
                <li
                  key={p.id}
                  className="card-dark p-4 flex items-center gap-4"
                >
                  <span className="text-liatrio-green text-[32px] font-semibold leading-none tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[18px] font-medium">{p.name}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primary">
              Back to home
            </Link>
            <Link href="/vote" className="btn btn-secondary">
              Browse all demos
            </Link>
          </div>
        </div>
      </div>
      <Footer variant="dark" />
    </main>
  );
}
