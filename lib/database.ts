import { databaseConnectionOptions } from "./database-ssl.ts";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createDatabaseClient(connectionString = process.env.DATABASE_URL) {
  const adapter = new PrismaPg(
    {
      ...databaseConnectionOptions(connectionString),
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    },
    { schema: "easelife" },
  );
  return new PrismaClient({ adapter });
}
