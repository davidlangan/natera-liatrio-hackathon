import { getAdminSupabase } from "./supabase/server";
import type { Standing } from "@/types/db";

/**
 * Compute the top 3 teams + the "everyone else" count, applying the
 * tiebreak rule: when two teams are tied on raw votes, the one whose
 * third (chronologically) vote arrived first ranks higher.
 *
 * The deterministic tiebreak is intentionally hidden from the UI.
 */
export async function computeTopThreeWithOthers(): Promise<{
  top: Standing[];
  otherCount: number;
  full: Standing[];
}> {
  const admin = getAdminSupabase();
  const { data: teams, error: teamsErr } = await admin
    .from("teams")
    .select("id, name, tagline, thumbnail_url, demo_url");
  if (teamsErr) {
    return { top: [], otherCount: 0, full: [] };
  }

  const { data: ballots, error: ballotsErr } = await admin
    .from("ballots")
    .select("team_id_1, team_id_2, team_id_3, created_at")
    .order("created_at", { ascending: true });
  if (ballotsErr || !teams) {
    return { top: [], otherCount: 0, full: [] };
  }

  // Tally votes per team plus the "nth vote arrival time".
  type Tally = {
    votes: number;
    arrivalTimes: number[]; // ascending list of vote times
  };
  const tally = new Map<string, Tally>();
  for (const t of teams) tally.set(t.id, { votes: 0, arrivalTimes: [] });

  for (const b of ballots ?? []) {
    const ts = new Date(b.created_at).getTime();
    for (const id of [b.team_id_1, b.team_id_2, b.team_id_3] as string[]) {
      const entry = tally.get(id);
      if (!entry) continue;
      entry.votes += 1;
      entry.arrivalTimes.push(ts);
    }
  }

  const total = Math.max(1, Array.from(tally.values()).reduce((a, t) => a + t.votes, 0));

  const ranked: (Standing & { _tieKey: number })[] = teams.map((t) => {
    const e = tally.get(t.id) ?? { votes: 0, arrivalTimes: [] };
    // tiebreak: time of the 3rd vote arrival (earlier wins)
    const tieKey = e.arrivalTimes[2] ?? e.arrivalTimes[e.arrivalTimes.length - 1] ?? Number.POSITIVE_INFINITY;
    return {
      team_id: t.id,
      name: t.name,
      tagline: t.tagline,
      thumbnail_url: t.thumbnail_url,
      demo_url: t.demo_url,
      votes: e.votes,
      pct: Math.round((e.votes / total) * 1000) / 10,
      _tieKey: tieKey,
    };
  });

  ranked.sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a._tieKey - b._tieKey; // earlier 3rd vote ranks higher
  });

  const visible = ranked.filter((r) => r.votes > 0).slice(0, 3);
  const otherCount = Math.max(0, teams.length - visible.length);
  const full: Standing[] = ranked.map(({ _tieKey: _tk, ...rest }) => rest);

  return { top: visible.map(({ _tieKey: _tk, ...rest }) => rest), otherCount, full };
}
