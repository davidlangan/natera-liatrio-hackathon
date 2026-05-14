"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase/server";
import { checkFraud, logFraudAttempt } from "@/lib/fraud";
import { hashSensitive, signCookie } from "@/lib/hash";
import { BALLOT_COOKIE, VOTES_REQUIRED } from "@/lib/constants";

export type VoteResult =
  | { ok: true }
  | { ok: false; reason: "invalid_selection" | "voting_closed" | "duplicate" | "rate_limited" | "internal" };

export async function submitBallot(input: {
  teamIds: string[];
  fingerprint: string;
}): Promise<VoteResult> {
  if (
    !Array.isArray(input.teamIds) ||
    input.teamIds.length !== VOTES_REQUIRED ||
    new Set(input.teamIds).size !== VOTES_REQUIRED
  ) {
    return { ok: false, reason: "invalid_selection" };
  }
  if (!input.fingerprint || input.fingerprint.length < 8) {
    return { ok: false, reason: "invalid_selection" };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    headerStore.get("cf-connecting-ip") ??
    "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";

  const fingerprintHash = hashSensitive(input.fingerprint);
  const ipHash = hashSensitive(ip);

  const admin = getAdminSupabase();

  // Check settings up front so we can return a clean error.
  const { data: settings } = await admin
    .from("settings")
    .select("voting_open, voting_closes_at")
    .eq("id", true)
    .maybeSingle();
  const closed =
    !settings?.voting_open ||
    (settings?.voting_closes_at &&
      new Date(settings.voting_closes_at).getTime() < Date.now());
  if (closed) {
    return { ok: false, reason: "voting_closed" };
  }

  // Fraud checks.
  const fraud = await checkFraud({ fingerprintHash, ipHash });
  if (!fraud.ok) {
    await logFraudAttempt({
      fingerprintHash,
      ipHash,
      userAgent,
      reason: fraud.reason,
      collidedWithBallotId: fraud.collidedBallotId ?? null,
    });
    // Tell the UI but redirect silently from the page.
    if (fraud.reason === "fingerprint_seen") {
      // Re-sign the cookie so the next page load redirects them.
      await stampVotedCookie(fingerprintHash);
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "rate_limited" };
  }

  // Insert.
  const { data, error } = await admin
    .from("ballots")
    .insert({
      team_id_1: input.teamIds[0],
      team_id_2: input.teamIds[1],
      team_id_3: input.teamIds[2],
      fingerprint_hash: fingerprintHash,
      ip_hash: ipHash,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("voting_closed")) {
      return { ok: false, reason: "voting_closed" };
    }
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      await logFraudAttempt({
        fingerprintHash,
        ipHash,
        userAgent,
        reason: "fingerprint_seen",
      });
      await stampVotedCookie(fingerprintHash);
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "internal" };
  }

  await stampVotedCookie(fingerprintHash);

  // Stash the picks in a cookie so /thanks can render them without leaking
  // any per-ballot info on the leaderboard.
  const cookieStore = await cookies();
  cookieStore.set("nh_picks", JSON.stringify(input.teamIds), {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  revalidatePath("/leaderboard");
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

async function stampVotedCookie(fingerprintHash: string) {
  const cookieStore = await cookies();
  cookieStore.set(BALLOT_COOKIE, signCookie(fingerprintHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function gotoThanks() {
  redirect("/thanks");
}
