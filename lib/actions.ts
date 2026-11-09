"use server";

import { verifyPhotoTickets } from "@/lib/photo-tickets";
import { publishListing } from "@/lib/publish-listing";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findOwnedListing, updateOwnedListing, deleteOwnedListing } from "@/lib/listing-access";
import { prisma } from "@/lib/prisma";
import { validateListingFields, validateMessage } from "@/lib/listing-validation";
import { requestLimit } from "@/lib/request-limit";
import { savePhotos, deletePhotos, UploadError } from "@/lib/uploads";

export type ActionState = { error?: string; success?: boolean; redirectTo?: string };

export async function createListing(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = await publishListing(formData);
  if (result.success) {
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/escape");
  }
  return result;
}

export async function updateListing(
  id: string,
  token: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let photoUrls: string[] = [];
  try {
    const listing = await findOwnedListing(prisma, id, token);
    if (!listing) return { error: "Listing not found." };
    if (!(await requestLimit("listing-write", 20, 3600)).allowed) return { error: "Too many listing changes. Please try again later." };
    const result = validateListingFields(formData);
    if ("error" in result) return result;
    const rawTickets = formData.get("photoTickets");
    const tickets = typeof rawTickets === "string" ? verifyPhotoTickets(rawTickets, process.env.SUPABASE_SECRET_KEY ?? "") : [];
    const files = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
    if (tickets.length && files.length) return { error: "Please choose your photos again." };
    if (files.length) photoUrls = await savePhotos(files, listing.photos.length);
    await updateOwnedListing(prisma, id, token, result.fields, photoUrls, tickets);
  } catch (error) {
    if (photoUrls.length) {
      try { await deletePhotos(photoUrls); } catch { console.error("Listing photo cleanup needs a retry"); }
    }
    if (error instanceof UploadError) return { error: error.message };
    console.error("Listing update failed", { code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown" });
    return { error: "We couldn't save your changes. Your details and photos are still here. Please try again." };
  }
  revalidatePath(`/manage/${token}`);
  revalidatePath(`/listings/${id}`);
  revalidatePath("/listings");
  revalidatePath("/");
  return { success: true };
}

export async function deleteListing(id: string, token: string) {
  const photoUrls = await deleteOwnedListing(prisma, id, token);
  await deletePhotos(photoUrls);

  revalidatePath("/listings");
  revalidatePath("/");
  redirect("/my-listings");
}

export async function sendMessage(
  listingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requestLimit("enquiry", 10, 3600)).allowed) return { error: "Too many messages. Please try again later." };
  const result = validateMessage(formData);
  if ("error" in result) return result;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return { error: "This listing no longer exists." };
  }

  if (listing.isDemo) return { error: "This is a demo listing and cannot receive enquiries." };

  await prisma.message.create({
    data: {
      listingId,
      ...result.fields,
    },
  });

  revalidatePath(`/manage/${listing.managementToken}`);

  return { success: true };
}
