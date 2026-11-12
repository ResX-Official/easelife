import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { uploadFilename } from "./photo-storage.ts";
import { UploadError } from "./upload-policy.ts";

type Bucket = {
  upload(path: string, body: Buffer, options: { contentType: string; cacheControl: string; upsert: boolean }): Promise<{ error: unknown }>;
  remove(paths: string[]): Promise<{ error: unknown }>;
};

export async function deletePhotoObjects(db: PrismaClient, bucket: Bucket, urls: string[]) {
  const filenames = [...new Set(urls.map(uploadFilename).filter((name): name is string => !!name))];
  if (filenames.length === 0) return;
  await db.storedPhoto.updateMany({ where: { filename: { in: filenames } }, data: { status: "deleting" } });
  const { error } = await bucket.remove(filenames);
  if (error) throw new Error("Photo storage could not remove the files. Their storage allowance has been kept for a retry.");
  await db.storedPhoto.deleteMany({ where: { filename: { in: filenames } } });
}

export async function cleanupPendingPhotos(db: PrismaClient, bucket: Bucket) {
  const stale = await db.storedPhoto.findMany({
    where: { OR: [{ status: "deleting" }, { status: { in: ["pending", "staged"] }, createdAt: { lt: new Date(Date.now() - 3600000) } }] },
    take: 100,
    select: { filename: true },
  });
  await deletePhotoObjects(db, bucket, stale.map(photo => `/uploads/${photo.filename}`));
}

export async function savePhotoObjects(db: PrismaClient, bucket: Bucket, images: Buffer[], quotaBytes: number, status: "ready" | "staged" = "ready") {
  if (!Number.isSafeInteger(quotaBytes) || quotaBytes <= 0) throw new Error("Photo storage quota must be a positive whole number of bytes.");
  if (images.length === 0) return [];
  try {
    await cleanupPendingPhotos(db, bucket);
  } catch {
    console.error("Photo cleanup deferred; reserved storage is still counted.");
  }
  const assets = images.map(image => ({ filename: `${randomUUID()}.webp`, size: image.length }));
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(68094021)`;
    const total = await tx.storedPhoto.aggregate({ _sum: { size: true } });
    const requested = assets.reduce((sum, asset) => sum + asset.size, 0);
    if ((total._sum.size ?? 0) + requested > quotaBytes) throw new UploadError("Photo storage is full. Please contact the site owner.");
    await tx.storedPhoto.createMany({ data: assets });
  }, { maxWait: 10000, timeout: 15000 });
  const urls = assets.map(asset => `/uploads/${asset.filename}`);
  try {
    for (const [index, asset] of assets.entries()) {
      const { error } = await bucket.upload(asset.filename, images[index], {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        const status = error && typeof error === "object" && "statusCode" in error ? String(error.statusCode) : "unknown";
        console.error("Photo storage upload failed", { status });
        throw new Error("Photo storage is temporarily unavailable.");
      }
    }
    await db.storedPhoto.updateMany({ where: { filename: { in: assets.map(asset => asset.filename) } }, data: { status } });
    return urls;
  } catch (error) {
    try {
      await deletePhotoObjects(db, bucket, urls);
    } catch {
      throw new Error("Photo upload failed and cleanup is queued for retry.");
    }
    throw error;
  }
}
