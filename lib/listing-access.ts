import { MAX_PHOTOS, UploadError } from "./upload-policy.ts";
import type { Prisma, PrismaClient } from "@prisma/client";

type ListingStore = Pick<PrismaClient, "listing">;

export async function findOwnedListing(store: ListingStore, id: string, token: string) {
  if (!id || !token) return null;
  return store.listing.findFirst({
    where: { id, managementToken: token },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}

export async function updateOwnedListing(
  store: PrismaClient,
  id: string,
  token: string,
  fields: Prisma.ListingUpdateInput,
  photoUrls: string[],
) {
  return store.$transaction(async (db) => {
    const listing = await db.listing.findFirst({
      where: { id, managementToken: token },
      include: { _count: { select: { photos: true } } },
    });
    if (!listing) throw new Error("Listing not found.");
    if (listing._count.photos + photoUrls.length > MAX_PHOTOS) throw new UploadError(`A listing can have up to ${MAX_PHOTOS} photos.`);
    return db.listing.update({
      where: { id, managementToken: token },
      data: {
        ...fields,
        photos: {
          create: photoUrls.map((url, index) => ({ url, order: listing._count.photos + index })),
        },
      },
    });
  });
}

export async function deleteOwnedListing(store: PrismaClient, id: string, token: string) {
  return store.$transaction(async (db) => {
    const listing = await findOwnedListing(db, id, token);
    if (!listing) throw new Error("Listing not found.");
    await db.listing.delete({ where: { id, managementToken: token } });
    return listing.photos.map(photo => photo.url);
  });
}

export async function deleteListingsWithPhotos(store: PrismaClient, where: Prisma.ListingWhereInput) {
  return store.$transaction(async (db) => {
    const photos = await db.photo.findMany({ where: { listing: where }, select: { url: true } });
    await db.listing.deleteMany({ where });
    return photos.map(photo => photo.url);
  });
}
