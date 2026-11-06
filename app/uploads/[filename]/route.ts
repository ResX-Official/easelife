import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const imageTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|avif|gif|heic|heif)$/.test(filename)) {
    return new Response(null, { status: 404 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", filename));
    return new Response(file, {
      headers: {
        "Content-Type": imageTypes[path.extname(filename).slice(1)],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
}
