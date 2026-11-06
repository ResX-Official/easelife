import path from "node:path";
import { prisma } from "@/lib/prisma";
import { preparePhotos, removePhotos, storePhotos, UploadError } from "@/lib/photo-storage";

const directory = path.join(process.cwd(), "public", "uploads");

export { UploadError };

export async function savePhotos(files: File[], existingCount = 0) {
  if (files.length === 0) return [];
  const images = await preparePhotos(files, existingCount);
  const quotaMb = Number(process.env.UPLOAD_STORAGE_LIMIT_MB ?? 1024);
  if (!Number.isFinite(quotaMb) || quotaMb <= 0) throw new Error("UPLOAD_STORAGE_LIMIT_MB must be a positive number.");
  let urls: string[] = [];
  try {
    return await prisma.$transaction(async (db) => {
      await db.$executeRaw`
        INSERT INTO "SiteSetting" ("key", "value") VALUES ('upload-write-lock', '')
        ON CONFLICT ("key") DO UPDATE SET "value" = "value"
      `;
      urls = await storePhotos(directory, images, quotaMb * 1024 * 1024);
      return urls;
    }, { maxWait: 10000, timeout: 30000 });
  } catch (error) {
    await removePhotos(directory, urls);
    throw error;
  }
}

export async function deletePhotos(urls: string[]) {
  if (urls.length === 0) return;
  await prisma.$transaction(async (db) => {
    await db.$executeRaw`
      INSERT INTO "SiteSetting" ("key", "value") VALUES ('upload-write-lock', '')
      ON CONFLICT ("key") DO UPDATE SET "value" = "value"
    `;
    await removePhotos(directory, urls);
  }, { maxWait: 10000, timeout: 30000 });
}
