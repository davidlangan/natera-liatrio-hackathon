import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { isAdmin } from "@/lib/admin-session";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { FraudEntry, Settings, Team } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="min-h-screen">
        <div className="band band-light">
          <Header variant="light" />
          <div className="band-inner">
            <AdminLogin />
          </div>
        </div>
        <Footer variant="light" />
      </main>
    );
  }

  const admin = getAdminSupabase();
  const [{ data: settings }, teamsRes, ballotsRes, fraudRes] = await Promise.all(
    [
      admin
        .from("settings")
        .select("*")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("teams")
        .select(
          "id, name, members, demo_url, tagline, thumbnail_url, summary, captain_token, created_at, updated_at",
        )
        .order("created_at", { ascending: true }),
      admin
        .from("ballots")
        .select("team_id_1, team_id_2, team_id_3"),
      admin
        .from("fraud_log")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(100),
    ],
  );

  const teams = (teamsRes.data as Team[] | null) ?? [];
  const ballots = ballotsRes.data ?? [];
  const fraud = (fraudRes.data as FraudEntry[] | null) ?? [];

  const counts = new Map<string, number>();
  for (const t of teams) counts.set(t.id, 0);
  for (const b of ballots) {
    for (const id of [b.team_id_1, b.team_id_2, b.team_id_3] as string[]) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const rows = teams
    .map((t) => ({ ...t, votes: counts.get(t.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen">
      <div className="band band-dark">
        <Header variant="dark" />
        <div className="band-inner">
          <AdminDashboard
            settings={settings as Settings | null}
            rows={rows}
            totalBallots={ballots.length}
            fraud={fraud}
          />
        </div>
      </div>
      <Footer variant="dark" />
    </main>
  );
}
