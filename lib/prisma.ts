import "server-only";
import { createDatabaseClient } from "@/lib/database";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createDatabaseClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
