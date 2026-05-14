import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/**
 * Public leaderboard URL is intentionally hidden. Admins are forwarded to the
 * gated reveal view; everyone else lands on /admin (which prompts for the
 * passcode), keeping voters insulated from intermediate standings so they
 * aren't influenced before they cast their ballot.
 */
export default async function LeaderboardRedirect() {
  if (await isAdmin()) {
    redirect("/admin/leaderboard");
  }
  redirect("/admin");
}
