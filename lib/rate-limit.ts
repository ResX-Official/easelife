import { createHash } from "node:crypto";
import { isIP } from "node:net";

export type RateLimitStore = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number>;
};

export function clientIdentity(requestHeaders: Headers, trustedHeader?: string) {
  const value = trustedHeader ? requestHeaders.get(trustedHeader)?.trim() : undefined;
  return value && isIP(value) ? value : "shared";
}

export async function consumeRateLimit(
  store: RateLimitStore,
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number,
  now = Math.floor(Date.now() / 1000),
) {
  const window = Math.floor(now / windowSeconds);
  const key = createHash("sha256").update(`${scope}:${identity}:${window}`).digest("hex");
  const expiresAt = (window + 1) * windowSeconds;
  const rows = await store.$queryRaw<{ count: number }[]>`
    INSERT INTO "RequestLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "count" = "count" + 1
    WHERE "count" < ${limit}
    RETURNING "count"
  `;
  await store.$executeRaw`DELETE FROM "RequestLimit" WHERE "expiresAt" <= ${now}`;
  return { allowed: rows.length > 0, retryAfter: Math.max(1, expiresAt - now) };
}
