import "server-only";
import { prisma } from "@/lib/prisma";
import { preparePhotos, UploadError } from "@/lib/photo-storage";
import { deletePhotoObjects, savePhotoObjects } from "@/lib/photo-objects";
import { createStorageClient, storageBucket } from "@/lib/supabase-storage";

export { UploadError };

export async function savePhotos(files: File[], existingCount = 0) {
  if (files.length === 0) return [];
  const images = await preparePhotos(files, existingCount);
  const quotaMb = Number(process.env.UPLOAD_STORAGE_LIMIT_MB ?? 512);
  const quotaBytes = quotaMb * 1024 * 1024;
  return savePhotoObjects(prisma, createStorageClient().from(storageBucket()), images, quotaBytes);
}

export async function deletePhotos(urls: string[]) {
  if (urls.length === 0) return;
  return deletePhotoObjects(prisma, createStorageClient().from(storageBucket()), urls);
}
