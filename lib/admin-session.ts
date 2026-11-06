import { createHmac, timingSafeEqual } from "node:crypto";

export function safeEqual(left: string, right: string) {
  const digest = (value: string) => createHmac("sha256", "admin-comparison").update(value).digest();
  return timingSafeEqual(digest(left), digest(right));
}

export function signSession(expiresAt: number, secret: string) {
  if (!secret) throw new Error("Admin credentials are not configured.");
  const payload = String(expiresAt);
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySession(token: string, secret: string, now = Math.floor(Date.now() / 1000)) {
  if (!secret || token.length > 200) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !/^\d+$/.test(payload)) return false;
  const expiry = Number(payload);
  if (!Number.isSafeInteger(expiry) || expiry <= now) return false;
  return safeEqual(token, signSession(expiry, secret));
}
