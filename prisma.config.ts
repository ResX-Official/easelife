import "dotenv/config";
import { isSupabaseDatabase, supabaseCertificatePath } from "./lib/database-ssl";
import { defineConfig } from "prisma/config";

let url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (isSupabaseDatabase(parsed)) {
    parsed.searchParams.set("sslmode", "require");
    parsed.searchParams.set("sslcert", supabaseCertificatePath());
    parsed.searchParams.set("sslaccept", "strict");
    parsed.searchParams.set("schema", "easelife");
    url = parsed.toString();
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
