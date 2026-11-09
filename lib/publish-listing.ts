import "server-only";
import type { ActionState } from "@/lib/actions";
import { verifyPhotoTickets } from "@/lib/photo-tickets";
import { claimPhotos } from "@/lib/claim-photos";
import { prisma } from "@/lib/prisma";
import { validateListingFields } from "@/lib/listing-validation";
import { requestLimit } from "@/lib/request-limit";
import { savePhotos, deletePhotos, UploadError } from "@/lib/uploads";

export async function publishListing(formData: FormData): Promise<ActionState> {
  let managementToken: string;
  let photoUrls: string[] = [];
  try {
    if (!(await requestLimit("listing-write", 20, 3600)).allowed) return { error: "Too many listing changes. Please try again later." };
    const result = validateListingFields(formData);
    if ("error" in result) return result;
    const rawTickets = formData.get("photoTickets");
    const tickets = typeof rawTickets === "string" ? verifyPhotoTickets(rawTickets, process.env.SUPABASE_SECRET_KEY ?? "") : [];
    const files = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
    if (tickets.length && files.length) return { error: "Please choose your photos again." };
    if (files.length) photoUrls = await savePhotos(files);
    if (photoUrls.length + tickets.length === 0) return { error: "Please add at least one photo of the property." };
    const listing = await prisma.$transaction(async db => {
      const claimed = await claimPhotos(db, tickets);
      return db.listing.create({
        data: {
          ...result.fields,
          photos: { create: [...photoUrls, ...claimed].map((url, order) => ({ url, order })) },
        },
      });
    });
    managementToken = listing.managementToken;
  } catch (error) {
    if (photoUrls.length) {
      try { await deletePhotos(photoUrls); } catch { console.error("Listing photo cleanup needs a retry"); }
    }
    if (error instanceof UploadError) return { error: error.message };
    console.error("Listing publish failed", { code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown" });
    return { error: "We couldn't publish your listing. Your details and photos are still here. Please try again." };
  }
  return { success: true, redirectTo: `/manage/${managementToken}` };
}
