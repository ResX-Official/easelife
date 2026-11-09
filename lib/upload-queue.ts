import type { PhotoTicket } from "./photo-tickets.ts";

export function createPhotoUploadQueue(upload: (file: File) => Promise<PhotoTicket>, concurrency = 3) {
  const completed = new Map<File, PhotoTicket>();
  const pending = new Map<File, Promise<PhotoTicket>>();
  const waiting: (() => void)[] = [];
  let active = 0;

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
        const ticket = await upload(file);
        completed.set(file, ticket);
        return ticket;
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
