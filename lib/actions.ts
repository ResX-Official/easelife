"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findOwnedListing, updateOwnedListing, deleteOwnedListing } from "@/lib/listing-access";
import { prisma } from "@/lib/prisma";
import { validateListingFields, validateMessage } from "@/lib/listing-validation";
import { requestLimit } from "@/lib/request-limit";
import { savePhotos, deletePhotos, UploadError } from "@/lib/uploads";

export type ActionState = { error?: string; success?: boolean };

export async function createListing(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requestLimit("listing-write", 20, 3600)).allowed) return { error: "Too many listing changes. Please try again later." };
  const result = validateListingFields(formData);
  if ("error" in result) return result;

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  let photoUrls: string[];
  try {
    photoUrls = await savePhotos(files);
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
  if (photoUrls.length === 0) {
    return {
      error:
        files.length > 0
          ? "Those files aren't images we can accept — try JPEG, PNG, or WebP."
          : "Please add at least one photo of the property.",
    };
  }

  const listing = await prisma.listing.create({
    data: {
      ...result.fields,
      photos: { create: photoUrls.map((url, order) => ({ url, order })) },
    },
  }).catch(async (error: unknown) => {
    await deletePhotos(photoUrls);
    throw error;
  });

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/escape");
  redirect(`/manage/${listing.managementToken}`);
}

export async function updateListing(
  id: string,
  token: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const listing = await findOwnedListing(prisma, id, token);
  if (!listing) {
    return { error: "Listing not found." };
  }

  if (!(await requestLimit("listing-write", 20, 3600)).allowed) return { error: "Too many listing changes. Please try again later." };
  const result = validateListingFields(formData);
  if ("error" in result) return result;

  const newFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const nextOrder = await prisma.photo.count({ where: { listingId: id } });
  let newPhotoUrls: string[];
  try {
    newPhotoUrls = await savePhotos(newFiles, nextOrder);
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  try {
    await updateOwnedListing(prisma, id, token, result.fields, newPhotoUrls);
  } catch (error) {
    await deletePhotos(newPhotoUrls);
    if (error instanceof UploadError) return { error: error.message };
    throw error;
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
