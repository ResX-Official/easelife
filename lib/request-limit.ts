import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIdentity, consumeRateLimit, releaseRateLimit } from "@/lib/rate-limit";

export async function requestLimit(scope: string, limit: number, seconds: number) {
  const trustedHeader = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_CLIENT_IP_HEADER;
  const identity = clientIdentity(await headers(), trustedHeader);
  const result = await consumeRateLimit(prisma, scope, identity, limit, seconds);
  let released = false;
  return { ...result, async release() {
    if (!result.allowed || released) return;
    released = true;
    await releaseRateLimit(prisma, result.key);
  } };
}
