import { revalidatePath } from "next/cache";
import { publishListing } from "@/lib/publish-listing";
import { hasMatchingOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasMatchingOrigin(request)) return Response.json({ error: "This request is not allowed." }, { status: 403 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Add your listing details." }, { status: 400 });
  const maxBody = 128 * 1024;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > maxBody) {
        await reader.cancel();
        return Response.json({ error: "The listing details are too large. Photos should be uploaded separately." }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data: FormData;
  try { data = await new Response(bytes, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData(); }
  catch { return Response.json({ error: "The listing details could not be read. Please try again." }, { status: 400 }); }
  const result = await publishListing(data);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/escape");
  }
  return Response.json(result, { status: result.success ? 201 : 400, headers: { "Cache-Control": "no-store" } });
}
