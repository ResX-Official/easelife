import type { Prisma } from "@prisma/client";
import { uploadFilename } from "./photo-storage.ts";

export async function queuePhotoDeletion(db: Prisma.TransactionClient, urls: string[]) {
  const filenames = [...new Set(urls.map(uploadFilename).filter((name): name is string => !!name))];
  if (filenames.length === 0) return;
  await db.storedPhoto.createMany({ data: filenames.map(filename => ({ filename, size: 0, status: "deleting" })), skipDuplicates: true });
  await db.storedPhoto.updateMany({ where: { filename: { in: filenames } }, data: { status: "deleting" } });
}
