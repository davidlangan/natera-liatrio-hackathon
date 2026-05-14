"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/server";
import {
  clearAdminSession,
  isAdmin,
  passcodesMatch,
  setAdminSession,
} from "@/lib/admin-session";

async function assertAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

export type AdminLoginState = { error: string };

export async function loginAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!passcodesMatch(passcode)) {
    return { error: "Wrong passcode." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function setRegistrationOpen(open: boolean) {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin
    .from("settings")
    .update({ registration_open: open })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/");
}

export async function setVotingOpen(open: boolean) {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin
    .from("settings")
    .update({ voting_open: open })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/vote");
  revalidatePath("/");
}

export async function setVotingClosesAt(iso: string | null) {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin
    .from("settings")
    .update({ voting_closes_at: iso })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/vote");
}

export async function deleteTeam(teamId: string) {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin.from("teams").delete().eq("id", teamId);
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath("/vote");
}

export async function updateTeam(input: {
  id: string;
  name?: string;
  tagline?: string | null;
  demo_url?: string;
}) {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin
    .from("teams")
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
      ...(input.demo_url !== undefined ? { demo_url: input.demo_url } : {}),
    })
    .eq("id", input.id);
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath("/vote");
}

export async function resetEverything() {
  await assertAdmin();
  const admin = getAdminSupabase();
  await admin.from("ballots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("fraud_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin
    .from("settings")
    .update({
      registration_open: true,
      voting_open: false,
      voting_closes_at: null,
    })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/vote");
  revalidatePath("/leaderboard");
}
