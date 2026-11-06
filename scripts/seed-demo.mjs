import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { seedDemoListings } from "../lib/demo-data.ts";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
try { console.log(`Added ${await seedDemoListings(prisma)} demo listings. Existing listings preserved.`); }
finally { await prisma.$disconnect(); }
