import { queuePhotoDeletion } from "./photo-deletion.ts";
import { claimPhotos } from "./claim-photos.ts";
import type { PhotoTicket } from "./photo-tickets.ts";
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
  tickets: PhotoTicket[] = [],
) {
  return store.$transaction(async (db) => {
    await db.$queryRaw`SELECT "id" FROM "easelife"."Listing" WHERE "id" = ${id} AND "managementToken" = ${token} FOR UPDATE`;
    const listing = await db.listing.findFirst({
      where: { id, managementToken: token },
      include: { _count: { select: { photos: true } } },
    });
    if (!listing) throw new Error("Listing not found.");
    if (listing._count.photos + photoUrls.length + tickets.length > MAX_PHOTOS) throw new UploadError(`A listing can have up to ${MAX_PHOTOS} photos.`);
    const claimed = await claimPhotos(db, tickets);
    return db.listing.update({
      where: { id, managementToken: token },
      data: {
        ...fields,
        photos: {
          create: [...photoUrls, ...claimed].map((url, index) => ({ url, order: listing._count.photos + index })),
        },
      },
    });
  });
}

export async function deleteOwnedListing(store: PrismaClient, id: string, token: string) {
  if (!id || !token) throw new Error("Listing not found.");
  return store.$transaction(async (db) => {
    await db.$queryRaw`SELECT "id" FROM "easelife"."Listing" WHERE "id" = ${id} AND "managementToken" = ${token} FOR UPDATE`;
    const listing = await findOwnedListing(db, id, token);
    if (!listing) {
      if (await db.listing.findUnique({ where: { id }, select: { id: true } })) throw new Error("Listing not found.");
      return [];
    }
    const urls = listing.photos.map(photo => photo.url);
    await queuePhotoDeletion(db, urls);
    await db.listing.delete({ where: { id, managementToken: token } });
    return urls;
  }, { maxWait: 10000, timeout: 15000 });
}

export async function deleteListingsWithPhotos(store: PrismaClient, where: Prisma.ListingWhereInput) {
  return store.$transaction(async (db) => {
    const candidates = await db.listing.findMany({ where, select: { id: true } });
    const ids = candidates.map(listing => listing.id);
    if (ids.length === 0) return [];
    await db.$queryRaw(Prisma.sql`SELECT "id" FROM "easelife"."Listing" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
    const photos = await db.photo.findMany({ where: { listingId: { in: ids } }, select: { url: true } });
    const urls = photos.map(photo => photo.url);
    await queuePhotoDeletion(db, urls);
    await db.listing.deleteMany({ where: { id: { in: ids } } });
    return urls;
  }, { maxWait: 10000, timeout: 15000 });
}
