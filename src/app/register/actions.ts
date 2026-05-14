"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/server";
import { isUrlReachable, generatePreview } from "@/lib/url-preview";

const CAPTAIN_COOKIE_PREFIX = "nh_captain_";

export type RegisterFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "members" | "demo_url" | "tagline", string>>;
  preview?: {
    team_id?: string;
    name: string;
    tagline: string | null;
    members: string[];
    demo_url: string;
    thumbnail_url: string | null;
    summary: string | null;
  };
};

function parseMembers(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

export async function registerTeam(
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const membersRaw = String(formData.get("members") ?? "");
  const demo_url = String(formData.get("demo_url") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim() || null;
  const editingId = String(formData.get("editing_id") ?? "").trim() || null;

  const fieldErrors: RegisterFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Team name is required.";
  if (name && name.length > 60)
    fieldErrors.name = "Team name must be 60 characters or fewer.";
  const members = parseMembers(membersRaw);
  if (members.length < 1) fieldErrors.members = "Add at least one member.";
  if (members.length > 10)
    fieldErrors.members = "Maximum of 10 members.";
  if (!demo_url) fieldErrors.demo_url = "Demo URL is required.";
  else if (!isValidUrl(demo_url))
    fieldErrors.demo_url = "Use an http(s) URL.";
  if (tagline && tagline.length > 120)
    fieldErrors.tagline = "Tagline must be 120 characters or fewer.";

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  // Check settings
  const admin = getAdminSupabase();
  const { data: settings } = await admin
    .from("settings")
    .select("registration_open")
    .eq("id", true)
    .maybeSingle();
  if (!settings?.registration_open) {
    return {
      ok: false,
      error: "Registration is closed.",
    };
  }

  const reachable = await isUrlReachable(demo_url);
  if (!reachable) {
    return {
      ok: false,
      fieldErrors: {
        demo_url:
          "We couldn't reach that URL. Double-check it's live and publicly accessible.",
      },
    };
  }

  const preview = await generatePreview(demo_url);
  const captainToken = crypto.randomBytes(24).toString("hex");

  let teamId = editingId;
  if (editingId) {
    const { data: existing } = await admin
      .from("teams")
      .select("id, captain_token")
      .eq("id", editingId)
      .maybeSingle();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(`${CAPTAIN_COOKIE_PREFIX}${editingId}`)?.value;
    if (!existing || existing.captain_token !== cookieToken) {
      return {
        ok: false,
        error: "You don't have permission to edit this team.",
      };
    }
    const { error } = await admin
      .from("teams")
      .update({
        name,
        members,
        demo_url,
        tagline,
        thumbnail_url: preview.thumbnail_url,
        summary: preview.summary,
      })
      .eq("id", editingId);
    if (error) {
      if (error.message.toLowerCase().includes("unique")) {
        return {
          ok: false,
          fieldErrors: { name: "That team name is already taken." },
        };
      }
      return { ok: false, error: error.message };
    }
  } else {
    const { data: inserted, error } = await admin
      .from("teams")
      .insert({
        name,
        members,
        demo_url,
        tagline,
        thumbnail_url: preview.thumbnail_url,
        summary: preview.summary,
        captain_token: captainToken,
      })
      .select("id, captain_token")
      .single();
    if (error) {
      if (error.message.includes("registration_closed")) {
        return { ok: false, error: "Registration is closed." };
      }
      if (error.message.toLowerCase().includes("unique")) {
        return {
          ok: false,
          fieldErrors: { name: "That team name is already taken." },
        };
      }
      return { ok: false, error: error.message };
    }
    teamId = inserted.id;
    const cookieStore = await cookies();
    cookieStore.set(`${CAPTAIN_COOKIE_PREFIX}${teamId}`, captainToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  revalidatePath("/browse");
  revalidatePath("/vote");
  revalidatePath("/");
  revalidatePath("/admin");

  return {
    ok: true,
    preview: {
      team_id: teamId!,
      name,
      tagline,
      members,
      demo_url,
      thumbnail_url: preview.thumbnail_url,
      summary: preview.summary,
    },
  };
}

export async function confirmAndRedirect(teamId: string) {
  redirect(`/browse?registered=${teamId}`);
}
