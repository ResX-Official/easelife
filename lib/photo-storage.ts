import sharp from "sharp";

import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES, UploadError } from "./upload-policy.ts";

export { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES, UploadError };
const MAX_PIXELS = 20_000_000;
const FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "gif"]);


export async function preparePhotos(files: File[], existingCount = 0) {
  if (files.length + existingCount > MAX_PHOTOS) throw new UploadError(`A listing can have up to ${MAX_PHOTOS} photos.`);
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) throw new UploadError("Keep the total upload under 3 MB.");
  const images: Buffer[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new UploadError("Each photo must be between 1 byte and 3 MB.");
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const options = { limitInputPixels: MAX_PIXELS, failOn: "warning" as const };
      const metadata = await sharp(input, options).metadata();
      if (!metadata.format || !FORMATS.has(metadata.format) || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) throw new Error("Unsupported image");
      const image = await sharp(input, options).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      if (image.length > MAX_PHOTO_BYTES) throw new Error("Image is too large");
      images.push(image);
    } catch {
      throw new UploadError("One of the photos could not be read. Use a valid JPEG, PNG, WebP, AVIF, HEIF, or GIF image under 20 megapixels.");
    }
  }
  return images;
}

export function uploadFilename(url: string) {
  return /^\/uploads\/([a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp|avif|gif|heic|heif))$/.exec(url)?.[1];
}
