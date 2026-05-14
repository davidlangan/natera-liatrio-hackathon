import { cookies } from "next/headers";
import { signCookie, verifyCookie } from "./hash";

const ADMIN_COOKIE = "nh_admin";

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signCookie("admin"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const v = cookieStore.get(ADMIN_COOKIE)?.value;
  return verifyCookie(v) === "admin";
}

export function passcodesMatch(input: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
