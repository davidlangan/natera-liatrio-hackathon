import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";
import { getAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const admin = getAdminSupabase();
  const [teamsRes, ballotsRes] = await Promise.all([
    admin
      .from("teams")
      .select(
        "id, name, members, demo_url, tagline, summary, created_at",
      ),
    admin
      .from("ballots")
      .select(
        "id, team_id_1, team_id_2, team_id_3, fingerprint_hash, ip_hash, user_agent, created_at",
      )
      .order("created_at", { ascending: true }),
  ]);

  const teams = teamsRes.data ?? [];
  const ballots = ballotsRes.data ?? [];

  const counts = new Map<string, number>();
  for (const t of teams) counts.set(t.id, 0);
  for (const b of ballots) {
    for (const id of [b.team_id_1, b.team_id_2, b.team_id_3] as string[]) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const lines: string[] = [];
  lines.push("# Section 1: Teams + vote totals");
  lines.push(
    [
      "team_id",
      "name",
      "members",
      "demo_url",
      "tagline",
      "summary",
      "registered_at",
      "vote_total",
    ]
      .map(csvEscape)
      .join(","),
  );
  for (const t of teams.sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
  )) {
    lines.push(
      [
        t.id,
        t.name,
        Array.isArray(t.members) ? t.members.join("; ") : "",
        t.demo_url,
        t.tagline ?? "",
        t.summary ?? "",
        t.created_at,
        counts.get(t.id) ?? 0,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  lines.push("");
  lines.push("# Section 2: Ballots");
  lines.push(
    [
      "ballot_id",
      "team_id_1",
      "team_id_2",
      "team_id_3",
      "fingerprint_hash",
      "ip_hash",
      "user_agent",
      "created_at",
    ]
      .map(csvEscape)
      .join(","),
  );
  for (const b of ballots) {
    lines.push(
      [
        b.id,
        b.team_id_1,
        b.team_id_2,
        b.team_id_3,
        b.fingerprint_hash,
        b.ip_hash,
        b.user_agent ?? "",
        b.created_at,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const filename = `natera-hackathon-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.csv`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
