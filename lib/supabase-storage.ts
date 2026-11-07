import { createClient } from "@supabase/supabase-js";

export function createStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY before using photo storage.");
  const parsed = new URL(url);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) throw new Error("SUPABASE_URL must use HTTPS in production.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage;
}

export function storageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "listing-photos";
}
