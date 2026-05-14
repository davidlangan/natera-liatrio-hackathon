import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
        demo_url: string;
        tagline: string | null;
      }
    | undefined;

  if (editingId) {
    const admin = getAdminSupabase();
    const { data: team } = await admin
      .from("teams")
      .select("id, name, members, demo_url, tagline, captain_token")
      .eq("id", editingId)
      .maybeSingle();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(`nh_captain_${editingId}`)?.value;
    if (team && team.captain_token && cookieToken === team.captain_token) {
      editing = {
        id: team.id,
        name: team.name,
        members: team.members,
        demo_url: team.demo_url,
        tagline: team.tagline,
      };
    }
  }

  const closed = !settings?.registration_open && !editing;

  return (
    <main className="min-h-screen">
      <div className="band band-light">
        <Header variant="light" />
        <div className="band-inner">
          <span className="eyebrow">REGISTER YOUR TEAM</span>
          <h1 className="h-display text-text-on-light mt-3 max-w-3xl">
            {editing
              ? "Update your "
              : "Get your team on "}
            <span className="h-emphasis">
              {editing ? "team details." : "the ballot."}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] text-text-muted-light leading-[1.6]">
            One submission per team. Captains can edit until voting opens. We
            auto-generate a thumbnail and a one-line summary from the demo URL.
          </p>

          <div className="mt-10">
            {closed ? (
              <div className="card-light p-8 max-w-xl">
                <span className="eyebrow">REGISTRATION CLOSED</span>
                <h2 className="text-[22px] font-semibold mt-2">
                  Registration is closed for this event.
                </h2>
                <p className="mt-3 text-text-muted-light">
                  Voting may already be underway. Head to the gallery to see
                  what's been built.
                </p>
                <Link href="/browse" className="btn btn-blue mt-5">
                  Browse demos →
                </Link>
              </div>
            ) : (
              <RegisterForm editing={editing} />
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </main>
  );
}
