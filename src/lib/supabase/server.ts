import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Anon-key server client that respects RLS. Use for reads from a server
 * component or route handler when you don't need elevated privileges.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          toSet: { name: string; value: string; options: Record<string, unknown> }[],
        ) => {
          for (const { name, value, options } of toSet) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Called from a Server Component — set() is read-only there.
            }
          }
        },
      },
    },
  );
}

/**
 * Service-role client. NEVER import this from a client component or expose
 * the underlying instance to the browser. Bypasses RLS.
 */
export function getAdminSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
