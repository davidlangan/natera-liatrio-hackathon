import { headers } from "next/headers";

/**
 * Pull the client IP out of forwarding headers in a Vercel/Netlify-friendly way.
 * Falls back to "unknown" in dev.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "unknown";
}
