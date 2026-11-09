import { createHmac, timingSafeEqual } from "node:crypto";
import { MAX_PHOTOS, UploadError } from "./upload-policy.ts";
import { uploadFilename } from "./photo-storage.ts";

export type PhotoTicket = { url: string; expiresAt: number; signature: string };

function signature(url: string, expiresAt: number, secret: string) {
  if (!secret) throw new Error("Photo upload signing is not configured.");
  return createHmac("sha256", secret).update(`listing-photo:${url}:${expiresAt}`).digest("hex");
}

export function createPhotoTicket(url: string, secret: string, now = Math.floor(Date.now() / 1000)): PhotoTicket {
  const expiresAt = now + 3600;
  return { url, expiresAt, signature: signature(url, expiresAt, secret) };
}

export function verifyPhotoTickets(raw: string, secret: string, now = Math.floor(Date.now() / 1000)): PhotoTicket[] {
  if (raw.length > 20000) throw new UploadError("The photo selection is invalid. Please choose the photos again.");
  let tickets: unknown;
  try { tickets = JSON.parse(raw); } catch { throw new UploadError("The photo selection is invalid. Please choose the photos again."); }
  if (!Array.isArray(tickets) || tickets.length > MAX_PHOTOS) throw new UploadError(`A listing can have up to ${MAX_PHOTOS} photos.`);
  const urls = new Set<string>();
  for (const ticket of tickets) {
    if (!ticket || typeof ticket.url !== "string" || !uploadFilename(ticket.url) || !Number.isSafeInteger(ticket.expiresAt) || ticket.expiresAt <= now || ticket.expiresAt > now + 3600 || typeof ticket.signature !== "string" || !/^[a-f0-9]{64}$/.test(ticket.signature)) throw new UploadError("A photo upload has expired or is invalid. Please upload it again.");
    const expected = signature(ticket.url, ticket.expiresAt, secret);
    if (!timingSafeEqual(Buffer.from(ticket.signature, "hex"), Buffer.from(expected, "hex")) || urls.has(ticket.url)) throw new UploadError("The photo selection is invalid. Please choose the photos again.");
    urls.add(ticket.url);
  }
  return tickets;
}
