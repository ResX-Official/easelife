import { hasMatchingOrigin } from "@/lib/request-origin";
import { requestLimit } from "@/lib/request-limit";
import { savePhotos, UploadError } from "@/lib/uploads";
import { createPhotoTicket } from "@/lib/photo-tickets";
import { MAX_PHOTO_BYTES } from "@/lib/upload-policy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasMatchingOrigin(request)) return Response.json({ error: "This upload request is not allowed." }, { status: 403 });
  try {
    const limit = await requestLimit("photo-upload", 90, 3600);
    if (!limit.allowed) return Response.json({ error: "Too many photo uploads. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const maxBody = MAX_PHOTO_BYTES + 65536;
    const declaredSize = Number(request.headers.get("content-length"));
    if (declaredSize > maxBody) return Response.json({ error: "Each photo must be 3 MB or smaller." }, { status: 413 });
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data") || !request.body) return Response.json({ error: "Choose a photo to upload." }, { status: 400 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > maxBody) {
          await reader.cancel();
          return Response.json({ error: "Each photo must be 3 MB or smaller." }, { status: 413 });
        }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const data = await new Response(body, { headers: { "content-type": request.headers.get("content-type")! } }).formData();
    const file = data.get("photo");
    if (!(file instanceof File) || data.getAll("photo").length !== 1) return Response.json({ error: "Choose one photo to upload." }, { status: 400 });
    const [url] = await savePhotos([file], 0, "staged");
    return Response.json({ ticket: createPhotoTicket(url, process.env.SUPABASE_SECRET_KEY ?? "") }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Photo upload failed", { code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown" });
    return Response.json({ error: "The photo could not be uploaded. Your details are still here. Please try again." }, { status: 503 });
  }
}
