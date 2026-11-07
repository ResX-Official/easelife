import { MAX_PHOTOS, UploadError } from "./upload-policy.ts";
import { Prisma, type PrismaClient } from "@prisma/client";

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
    await db.$queryRaw`SELECT "id" FROM "easelife"."Listing" WHERE "id" = ${id} AND "managementToken" = ${token} FOR UPDATE`;
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
    await db.$queryRaw`SELECT "id" FROM "easelife"."Listing" WHERE "id" = ${id} AND "managementToken" = ${token} FOR UPDATE`;
    const listing = await findOwnedListing(db, id, token);
    if (!listing) throw new Error("Listing not found.");
    await db.listing.delete({ where: { id, managementToken: token } });
    return listing.photos.map(photo => photo.url);
  });
}

export async function deleteListingsWithPhotos(store: PrismaClient, where: Prisma.ListingWhereInput) {
  return store.$transaction(async (db) => {
    const candidates = await db.listing.findMany({ where, select: { id: true } });
    const ids = candidates.map(listing => listing.id);
    if (ids.length === 0) return [];
    await db.$queryRaw(Prisma.sql`SELECT "id" FROM "easelife"."Listing" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
    const photos = await db.photo.findMany({ where: { listingId: { in: ids } }, select: { url: true } });
    await db.listing.deleteMany({ where: { id: { in: ids } } });
    return photos.map(photo => photo.url);
  });
}
