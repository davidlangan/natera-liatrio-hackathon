import { getAdminSupabase } from "./supabase/server";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const PER_IP_WINDOW = TEN_MINUTES_MS;
const PER_IP_WINDOW_MAX = 1;
const PER_IP_EVENT_MAX = 5;

export type FraudOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "fingerprint_seen"
        | "ip_rate_limit_short"
        | "ip_rate_limit_event"
        | "voting_closed";
      collidedBallotId?: string;
    };

/**
 * Layered defense. Order of checks:
 *  1. Has this fingerprint already submitted a ballot?
 *  2. Has this IP submitted in the last 10 minutes?
 *  3. Has this IP submitted >= 5 ballots for the whole event?
 */
export async function checkFraud(input: {
  fingerprintHash: string;
  ipHash: string;
}): Promise<FraudOutcome> {
  const supabase = getAdminSupabase();

  const fp = await supabase
    .from("ballots")
    .select("id")
    .eq("fingerprint_hash", input.fingerprintHash)
    .maybeSingle();
  if (fp.error && fp.error.code !== "PGRST116") {
    throw new Error(`fraud_check_failed: ${fp.error.message}`);
  }
  if (fp.data) {
    return {
      ok: false,
      reason: "fingerprint_seen",
      collidedBallotId: fp.data.id,
    };
  }

  const sinceShort = new Date(Date.now() - PER_IP_WINDOW).toISOString();
  const ipRecent = await supabase
    .from("ballots")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", input.ipHash)
    .gt("created_at", sinceShort);
  if (ipRecent.error) {
    throw new Error(`fraud_check_failed: ${ipRecent.error.message}`);
  }
  if ((ipRecent.count ?? 0) >= PER_IP_WINDOW_MAX) {
    return { ok: false, reason: "ip_rate_limit_short" };
  }

  const ipTotal = await supabase
    .from("ballots")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", input.ipHash);
  if (ipTotal.error) {
    throw new Error(`fraud_check_failed: ${ipTotal.error.message}`);
  }
  if ((ipTotal.count ?? 0) >= PER_IP_EVENT_MAX) {
    return { ok: false, reason: "ip_rate_limit_event" };
  }

  return { ok: true };
}

export async function logFraudAttempt(args: {
  fingerprintHash: string | null;
  ipHash: string | null;
  userAgent: string | null;
  reason: string;
  collidedWithBallotId?: string | null;
}) {
  const supabase = getAdminSupabase();
  await supabase.from("fraud_log").insert({
    fingerprint_hash: args.fingerprintHash,
    ip_hash: args.ipHash,
    user_agent: args.userAgent,
    reason: args.reason,
    collided_with_ballot_id: args.collidedWithBallotId ?? null,
  });
}
