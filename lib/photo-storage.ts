import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES, UploadError } from "./upload-policy.ts";

export { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES, UploadError };
const MAX_PIXELS = 20_000_000;
const FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "gif"]);


export async function preparePhotos(files: File[], existingCount = 0) {
  if (files.length + existingCount > MAX_PHOTOS) throw new UploadError(`A listing can have up to ${MAX_PHOTOS} photos.`);
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) throw new UploadError("Keep the total upload under 10 MB.");
  const images: Buffer[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new UploadError("Each photo must be between 1 byte and 5 MB.");
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const options = { limitInputPixels: MAX_PIXELS, failOn: "warning" as const };
      const metadata = await sharp(input, options).metadata();
      if (!metadata.format || !FORMATS.has(metadata.format) || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) throw new Error("Unsupported image");
      images.push(await sharp(input, options).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
    } catch {
      throw new UploadError("One of the photos could not be read. Use a valid JPEG, PNG, WebP, AVIF, HEIF, or GIF image under 20 megapixels.");
    }
  }
  return images;
}

export function uploadFilename(url: string) {
  return /^\/uploads\/([a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp|avif|gif|heic|heif))$/.exec(url)?.[1];
}

export async function removePhotos(directory: string, urls: string[]) {
  for (const url of urls) {
    const filename = uploadFilename(url);
    if (!filename) continue;
    try {
      await unlink(path.join(directory, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export async function storePhotos(directory: string, images: Buffer[], quotaBytes: number) {
  await mkdir(directory, { recursive: true });
  let usedBytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isFile()) usedBytes += (await stat(path.join(directory, entry.name))).size;
  }
  if (usedBytes + images.reduce((sum, image) => sum + image.length, 0) > quotaBytes) throw new UploadError("Photo storage is full. Please contact the site owner.");
  const urls: string[] = [];
  try {
    for (const image of images) {
      const filename = `${randomUUID()}.webp`;
      const url = `/uploads/${filename}`;
      urls.push(url);
      await writeFile(path.join(directory, filename), image, { flag: "wx", mode: 0o600 });
    }
    return urls;
  } catch (error) {
    await removePhotos(directory, urls);
    throw error;
  }
}
