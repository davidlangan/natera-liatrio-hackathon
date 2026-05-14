import crypto from "node:crypto";

/**
 * Stable HMAC-SHA256 hash for fingerprints and IPs.
 * Uses BALLOT_COOKIE_SECRET so the digests are useless across deployments
 * (and so a stolen DB dump can't be trivially re-correlated with public IPs).
 */
export function hashSensitive(input: string): string {
  const secret = process.env.BALLOT_COOKIE_SECRET ?? "dev-secret";
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

export function signCookie(payload: string): string {
  const secret = process.env.BALLOT_COOKIE_SECRET ?? "dev-secret";
  const sig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return `${payload}.${sig}`;
}

export function verifyCookie(value: string | undefined): string | null {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", process.env.BALLOT_COOKIE_SECRET ?? "dev-secret")
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  if (sig.length !== expected.length) return null;
  try {
    const ok = crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex"),
    );
    return ok ? payload : null;
  } catch {
    return null;
  }
}
