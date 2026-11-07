import "dotenv/config";
import { createStorageClient, storageBucket } from "../lib/supabase-storage.ts";
import { MAX_PHOTO_BYTES } from "../lib/upload-policy.ts";

const storage = createStorageClient();
const name = storageBucket();
const options = { public: false, fileSizeLimit: MAX_PHOTO_BYTES, allowedMimeTypes: ["image/webp"] };
const { data, error } = await storage.getBucket(name);
if (data?.public) throw new Error("Use a private bucket for listing photos. Change the bucket to private before continuing.");
if (error && !["400", "404"].includes(String(error.statusCode))) throw new Error(`Could not check the storage bucket: ${error.message}`);
const result = data ? await storage.updateBucket(name, options) : await storage.createBucket(name, options);
if (result.error) throw new Error(`Could not configure the storage bucket: ${result.error.message}`);
console.log(`Private storage bucket ${name} is ready.`);
