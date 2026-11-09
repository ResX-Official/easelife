import type { PrismaClient } from "@prisma/client";

export async function loadSiteLogo(store: Pick<PrismaClient, "siteSetting">) {
  try {
    const setting = await store.siteSetting.findUnique({ where: { key: "logoUrl" } });
    return setting?.value ?? null;
  } catch {
    console.error("Site logo unavailable; using the site name.");
    return null;
  }
}
