import { prisma } from "@/lib/prisma";
import { createStorageClient, storageBucket } from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9-]+\.webp$/.test(filename)) return new Response(null, { status: 404 });
  const asset = await prisma.storedPhoto.findUnique({ where: { filename }, select: { status: true } });
  if (asset?.status !== "ready") return new Response(null, { status: 404 });
  const { data, error } = await createStorageClient().from(storageBucket()).download(filename);
  if (error || !data) throw new Error("Photo storage could not load this image.");
  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
