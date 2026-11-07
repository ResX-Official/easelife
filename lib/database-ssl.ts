import { readFileSync } from "node:fs";
import path from "node:path";

export function isSupabaseDatabase(url: URL) {
  return url.hostname.endsWith(".supabase.com") || url.hostname.endsWith(".supabase.co");
}

export function supabaseCertificatePath() {
  return path.join(process.cwd(), "prisma", "certificates", "supabase-root.crt");
}

export function databaseConnectionOptions(connectionString?: string) {
  if (!connectionString) return { connectionString };
  const url = new URL(connectionString);
  if (!isSupabaseDatabase(url)) return { connectionString };
  for (const parameter of ["sslmode", "sslcert", "sslkey", "sslrootcert", "sslaccept", "uselibpqcompat"]) url.searchParams.delete(parameter);
  return {
    connectionString: url.toString(),
    ssl: { ca: readFileSync(supabaseCertificatePath(), "utf8"), rejectUnauthorized: true },
  };
}
