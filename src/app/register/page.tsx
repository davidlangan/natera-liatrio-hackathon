import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroOrbits } from "@/components/HeroOrbits";
import { RegisterForm } from "./RegisterForm";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: editingId } = await searchParams;
  const supabase = await getServerSupabase();
  const { data: settings } = await supabase
    .from("settings")
    .select("registration_open")
    .eq("id", true)
    .maybeSingle();

  let editing:
    | {
        id: string;
        name: string;
        members: string[];
        demo_url: string | null;
        tagline: string | null;
        summary: string | null;
        running_locally: boolean;
        thumbnail_url: string | null;
      }
    | undefined;

  if (editingId) {
    const admin = getAdminSupabase();
    // Tolerant select: if the 0003 migration hasn't been applied yet,
    // `running_locally` will trip the column-missing error. Fall back to
    // querying without it so editing still works for legacy rows.
    let team:
      | {
          id: string;
          name: string;
          members: string[];
          demo_url: string | null;
          tagline: string | null;
          summary: string | null;
          thumbnail_url: string | null;
          running_locally?: boolean;
          captain_token: string | null;
        }
      | null = null;
    const full = await admin
      .from("teams")
      .select(
        "id, name, members, demo_url, tagline, summary, thumbnail_url, running_locally, captain_token",
      )
      .eq("id", editingId)
      .maybeSingle();
    if (full.error) {
      const fallback = await admin
        .from("teams")
        .select(
          "id, name, members, demo_url, tagline, summary, thumbnail_url, captain_token",
        )
        .eq("id", editingId)
        .maybeSingle();
      team = fallback.data ?? null;
    } else {
      team = full.data ?? null;
    }
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(`nh_captain_${editingId}`)?.value;
    if (team && team.captain_token && cookieToken === team.captain_token) {
      editing = {
        id: team.id,
        name: team.name,
        members: team.members,
        demo_url: team.demo_url,
        tagline: team.tagline,
        summary: team.summary,
        running_locally: !!team.running_locally,
        thumbnail_url: team.thumbnail_url,
      };
    }
  }

  const closed = !settings?.registration_open && !editing;

  return (
    <main className="relative min-h-screen overflow-hidden mesh-bg">
      <HeroOrbits />

      <div className="relative z-10 band band-dark">
        <Header variant="dark" />
        <div className="band-inner">
          <span className="eyebrow-green">REGISTER YOUR TEAM</span>
          <h1 className="h-display text-text-on-dark mt-3 max-w-3xl">
            {editing ? "Update your " : "Get your team on "}
            <span className="h-emphasis">
              {editing ? "team details." : "the ballot."}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] text-text-muted-dark leading-[1.6]">
            One submission per team. Captains can edit until voting opens.
            Have a live demo? Drop the URL and we'll try to auto-generate a
            thumbnail. Running locally instead? Tick the box and tell us about
            it in the summary.
          </p>

          <div className="mt-10">
            {closed ? (
              <div className="card-dark p-8 max-w-xl">
                <span className="eyebrow">REGISTRATION CLOSED</span>
                <h2 className="text-[22px] font-semibold mt-2 text-text-on-dark">
                  Registration is closed for this event.
                </h2>
                <p className="mt-3 text-text-muted-dark">
                  Voting may already be underway. Head to the gallery to see
                  what's been built.
                </p>
                <Link href="/vote" className="btn btn-blue mt-5">
                  Browse demos →
                </Link>
              </div>
            ) : (
              <RegisterForm editing={editing} />
            )}
          </div>
        </div>
        <Footer variant="dark" />
      </div>
    </main>
  );
}
