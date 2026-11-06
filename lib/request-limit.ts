import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIdentity, consumeRateLimit } from "@/lib/rate-limit";

export async function requestLimit(scope: string, limit: number, seconds: number) {
  const identity = clientIdentity(await headers(), process.env.TRUSTED_CLIENT_IP_HEADER);
  return consumeRateLimit(prisma, scope, identity, limit, seconds);
}
