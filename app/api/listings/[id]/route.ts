import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteOwnedListing, deleteListingsWithPhotos } from "@/lib/listing-access";
import { finishListingDeletion } from "@/lib/finish-listing-deletion";
import { hasMatchingOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasMatchingOrigin(request)) return Response.json({ error: "This request is not allowed." }, { status: 403 });
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return Response.json({ error: "Listing not found." }, { status: 404 });
  try {
    const authorization = request.headers.get("authorization");
    let urls: string[];
    if (authorization) {
      const token = /^Bearer ([a-zA-Z0-9-]{16,100})$/.exec(authorization)?.[1];
      if (!token) return Response.json({ error: "This management link is invalid." }, { status: 403 });
      try { urls = await deleteOwnedListing(prisma, id, token); }
      catch (error) {
        if (error instanceof Error && error.message === "Listing not found.") return Response.json({ error: "This management link cannot delete the listing." }, { status: 403 });
        throw error;
      }
    } else {
      if (!(await isAdminAuthenticated())) return Response.json({ error: "Please sign in again before deleting this listing." }, { status: 401 });
      urls = await deleteListingsWithPhotos(prisma, { id });
    }
    finishListingDeletion(urls);
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Listing deletion failed", { code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown" });
    return Response.json({ error: "We couldn't delete this listing. Please try again." }, { status: 503 });
  }
}
