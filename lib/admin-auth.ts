import { safeEqual, signSession, verifySession } from "@/lib/admin-session";
import { cookies } from "next/headers";

const COOKIE_NAME = "easerent_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSession(expiresAt, process.env.ADMIN_PASSWORD ?? ""), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token, process.env.ADMIN_PASSWORD ?? "");
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
