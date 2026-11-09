import { Prisma } from "@prisma/client";
import type { PhotoTicket } from "./photo-tickets.ts";
import { UploadError } from "./upload-policy.ts";

export async function claimPhotos(db: Prisma.TransactionClient, tickets: PhotoTicket[]) {
  if (tickets.length === 0) return [];
  const filenames = tickets.map(ticket => ticket.url.split("/").pop()!);
  await db.$queryRaw(Prisma.sql`SELECT "filename" FROM "easelife"."StoredPhoto" WHERE "filename" IN (${Prisma.join(filenames)}) ORDER BY "filename" FOR UPDATE`);
  const assets = await db.storedPhoto.findMany({ where: { filename: { in: filenames }, status: "staged" } });
  if (assets.length !== tickets.length) throw new UploadError("Some photos are no longer available. Please upload them again.");
  if (tickets.some(ticket => ticket.expiresAt <= Math.floor(Date.now() / 1000))) throw new UploadError("A photo upload has expired. Please upload it again.");
  await db.storedPhoto.updateMany({ where: { filename: { in: filenames }, status: "staged" }, data: { status: "ready" } });
  return tickets.map(ticket => ticket.url);
}
