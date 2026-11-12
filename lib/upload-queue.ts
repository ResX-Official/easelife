import type { PhotoTicket } from "./photo-tickets.ts";

export class PhotoUploadError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter = 0) { super(message); this.retryAfter = retryAfter; }
}

export function createPhotoUploadQueue(upload: (file: File) => Promise<PhotoTicket>, concurrency = 3) {
  const completed = new Map<File, PhotoTicket>();
  const pending = new Map<File, Promise<PhotoTicket>>();
  const waiting: (() => void)[] = [];
  let active = 0;
  let blockedUntil = 0;
  let blockedError: PhotoUploadError | undefined;

  async function get(file: File): Promise<PhotoTicket> {
    const cached = completed.get(file);
    if (cached && cached.expiresAt > Date.now() / 1000 + 30) return cached;
    const existing = pending.get(file);
    if (existing) return existing;
    const task = (async () => {
      await new Promise<void>(resolve => {
        const enter = () => { active++; resolve(); };
        if (active < concurrency) enter(); else waiting.push(enter);
      });
      try {
        if (blockedError && Date.now() < blockedUntil) throw blockedError;
        const ticket = await upload(file);
        completed.set(file, ticket);
        return ticket;
      } catch (error) {
        if (error instanceof PhotoUploadError && error.retryAfter > 0 && error !== blockedError) {
          blockedError = error;
          blockedUntil = Date.now() + error.retryAfter * 1000;
        }
        throw error;
      } finally {
        active--;
        waiting.shift()?.();
      }
    })();
    pending.set(file, task);
    try { return await task; } finally { pending.delete(file); }
  }

  return { get };
}
