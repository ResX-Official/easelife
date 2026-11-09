"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { finishListingDeletion } from "@/lib/finish-listing-deletion";
import { queuePhotoDeletion } from "@/lib/photo-deletion";
import { deleteListingsWithPhotos } from "@/lib/listing-access";
import { requestLimit } from "@/lib/request-limit";
import { savePhotos, deletePhotos } from "@/lib/uploads";
import { seedDemoListings } from "@/lib/demo-data";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminAuthenticated,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export type AdminLoginState = { error?: string };

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  if (!(await requestLimit("admin-login", 10, 900)).allowed) {
    return { error: "Too many sign-in attempts. Try again in 15 minutes." };
  }
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (username.length > 254 || password.length > 1024 || !(await verifyAdminCredentials(username, password))) {
    return { error: "The username or password is incorrect." };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin");
}

export async function deleteAdminListing(formData: FormData) {
  try {
    if (!(await isAdminAuthenticated())) return { error: "Please sign in again before deleting this listing." };
    const id = String(formData.get("listingId") ?? "");
    if (!id) return { error: "Choose a listing to delete." };
    const photoUrls = await deleteListingsWithPhotos(prisma, { id });
    finishListingDeletion(photoUrls);
    return { success: true };
  } catch {
    return { error: "We couldn't delete this listing. Please try again." };
  }
}

export async function clearAdminData(formData: FormData) {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized.");
  if (String(formData.get("confirmation") ?? "") !== "DELETE ALL DATA") {
    throw new Error("Type DELETE ALL DATA to confirm.");
  }
  const photoUrls = await prisma.$transaction(async db => {
    const photos = await db.photo.findMany({ select: { url: true } });
    await queuePhotoDeletion(db, photos.map(photo => photo.url));
    await db.escapeRoom.deleteMany();
    await db.listing.deleteMany();
    await db.visitorEvent.deleteMany();
    return photos.map(photo => photo.url);
  });
  finishListingDeletion(photoUrls);
}

export async function updateSiteLogo(formData: FormData) {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized.");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a logo image.");
  const previous = await prisma.siteSetting.findUnique({ where: { key: "logoUrl" } });
  const [url] = await savePhotos([file]);
  await prisma.siteSetting.upsert({
    where: { key: "logoUrl" },
    create: { key: "logoUrl", value: url },
    update: { value: url },
  }).catch(async (error: unknown) => {
    await deletePhotos([url]);
    throw error;
  });
  if (previous?.value) await deletePhotos([previous.value]);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

export async function addDemoListings() {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized.");
  await seedDemoListings(prisma);
  revalidatePath("/", "layout");
  redirect("/admin?tab=settings&notice=demo-added");
}

export async function removeDemoListings(formData: FormData) {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized.");
  if (String(formData.get("confirmation")) !== "REMOVE DEMOS") throw new Error("Type REMOVE DEMOS to confirm.");
  const photoUrls = await deleteListingsWithPhotos(prisma, { isDemo: true });
  finishListingDeletion(photoUrls);
  revalidatePath("/", "layout");
  redirect("/admin?tab=settings&notice=demo-removed");
}
