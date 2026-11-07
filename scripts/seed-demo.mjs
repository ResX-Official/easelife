import "dotenv/config";
import { createDatabaseClient } from "../lib/database.ts";
import { seedDemoListings } from "../lib/demo-data.ts";
const prisma = createDatabaseClient();
try { console.log(`Added ${await seedDemoListings(prisma)} demo listings. Existing listings preserved.`); }
finally { await prisma.$disconnect(); }
