"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/server";
import { generatePreview, type PreviewResult } from "@/lib/url-preview";

const CAPTAIN_COOKIE_PREFIX = "nh_captain_";
const SUMMARY_MAX = 500;
const THUMBNAIL_BUCKET = "team-thumbnails";

export type RegisterFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "members" | "demo_url" | "summary" | "thumbnail_url",
      string
    >
  >;
  preview?: {
    team_id?: string;
    name: string;
    tagline: string | null;
    members: string[];
    demo_url: string | null;
    thumbnail_url: string | null;
    summary: string | null;
    running_locally: boolean;
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

/**
 * Only accept thumbnail URLs that point at our own Supabase Storage bucket.
 * The form uploads via the anon key + permissive RLS policy; this guard
 * prevents a malicious caller from setting `thumbnail_url` to an arbitrary
 * domain (which next/image would happily proxy via remotePatterns wildcards).
 */
function isAllowedThumbnailUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    } catch {
      return null;
    }
  })();
  if (!supabaseHost || url.hostname !== supabaseHost) return false;
  return url.pathname.includes(`/${THUMBNAIL_BUCKET}/`);
}

export async function registerTeam(
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const membersRaw = String(formData.get("members") ?? "");
  const demo_url = String(formData.get("demo_url") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const runningLocallyRaw = String(formData.get("running_locally") ?? "");
  const running_locally =
    runningLocallyRaw === "on" ||
    runningLocallyRaw === "true" ||
    runningLocallyRaw === "1";
  const thumbnailUploadUrl =
    String(formData.get("thumbnail_upload_url") ?? "").trim() || null;
  const editingId = String(formData.get("editing_id") ?? "").trim() || null;

  const fieldErrors: RegisterFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Team name is required.";
  if (name && name.length > 60)
    fieldErrors.name = "Team name must be 60 characters or fewer.";
  const members = parseMembers(membersRaw);
  if (members.length < 1) fieldErrors.members = "Add at least one member.";
  if (members.length > 10) fieldErrors.members = "Maximum of 10 members.";
  // demo_url is optional. If supplied, it must at least parse as http(s).
  if (demo_url && !isValidUrl(demo_url))
    fieldErrors.demo_url = "Use an http(s) URL, or leave this field blank.";
  if (!summary) {
    fieldErrors.summary = "Demo Summary is required.";
  } else if (summary.length > SUMMARY_MAX) {
    fieldErrors.summary = `Summary must be ${SUMMARY_MAX} characters or fewer.`;
  }
  if (thumbnailUploadUrl && !isAllowedThumbnailUrl(thumbnailUploadUrl)) {
    fieldErrors.thumbnail_url =
      "Thumbnail URL must come from the team-thumbnails bucket.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

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

  // Only attempt preview enrichment when a URL was supplied. A real-but-
  // unreachable URL must not block submission — generatePreview already
  // catches network errors and returns nulls, but we additionally guard
  // against unexpected throws so the form never rejects on enrichment.
  const demoUrlValue: string | null = demo_url || null;
  let preview: PreviewResult = {
    summary: null,
    thumbnail_url: null,
    source: "fallback",
  };
  if (demoUrlValue) {
    try {
      preview = await generatePreview(demoUrlValue);
    } catch {
      preview = { summary: null, thumbnail_url: null, source: "fallback" };
    }
  }

  // User-supplied summary always wins over the URL-preview-generated one.
  const finalSummary = summary;
  // User upload wins over the auto-grabbed thumbnail.
  const finalThumbnailUrl = thumbnailUploadUrl ?? preview.thumbnail_url;

  const captainToken = crypto.randomBytes(24).toString("hex");

  let teamId = editingId;
  if (editingId) {
    const { data: existing } = await admin
      .from("teams")
      .select("id, captain_token")
      .eq("id", editingId)
      .maybeSingle();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(
      `${CAPTAIN_COOKIE_PREFIX}${editingId}`,
    )?.value;
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
        demo_url: demoUrlValue,
        // Legacy column — new submissions clear it; existing rows keep
        // whatever they had unless the captain explicitly overwrote it.
        tagline: null,
        thumbnail_url: finalThumbnailUrl,
        summary: finalSummary,
        running_locally,
      })
      .eq("id", editingId);
    if (error) {
      return mapTeamMutationError(error);
    }
  } else {
    const { data: inserted, error } = await admin
      .from("teams")
      .insert({
        name,
        members,
        demo_url: demoUrlValue,
        tagline: null,
        thumbnail_url: finalThumbnailUrl,
        summary: finalSummary,
        running_locally,
        captain_token: captainToken,
      })
      .select("id, captain_token")
      .single();
    if (error) {
      return mapTeamMutationError(error);
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
      tagline: null,
      members,
      demo_url: demoUrlValue,
      thumbnail_url: finalThumbnailUrl,
      summary: finalSummary,
      running_locally,
    },
  };
}

function mapTeamMutationError(error: {
  message: string;
}): RegisterFormState {
  const msg = error.message ?? "";
  if (msg.includes("registration_closed")) {
    return { ok: false, error: "Registration is closed." };
  }
  if (msg.toLowerCase().includes("unique")) {
    return {
      ok: false,
      fieldErrors: { name: "That team name is already taken." },
    };
  }
  // Most likely cause when this fires in production: the 0003 migration
  // hasn't been pasted into Supabase yet, so `running_locally` doesn't
  // exist as a column.
  if (
    msg.toLowerCase().includes("running_locally") ||
    /column .* does not exist/i.test(msg)
  ) {
    return {
      ok: false,
      error:
        "Database isn't fully migrated yet — admin needs to run the 0003 migration in the Supabase SQL editor.",
    };
  }
  return { ok: false, error: msg };
}

export async function confirmAndRedirect(teamId: string) {
  redirect(`/browse?registered=${teamId}`);
}
