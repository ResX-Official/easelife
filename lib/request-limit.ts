import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIdentity, consumeRateLimit } from "@/lib/rate-limit";

export async function requestLimit(scope: string, limit: number, seconds: number) {
  const trustedHeader = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_CLIENT_IP_HEADER;
  const identity = clientIdentity(await headers(), trustedHeader);
  return consumeRateLimit(prisma, scope, identity, limit, seconds);
}
