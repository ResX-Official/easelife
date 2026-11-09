import "server-only";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { deletePhotos } from "@/lib/uploads";

export function finishListingDeletion(urls: string[]) {
  if (urls.length) {
    try {
      after(async () => {
        try { await deletePhotos(urls); }
        catch { console.error("Listing removed; queued photo cleanup will be retried."); }
      });
    } catch {
      console.error("Listing removed; photo cleanup remains queued.");
    }
  }
  try {
    for (const path of ["/", "/listings", "/escape", "/admin"]) revalidatePath(path);
  } catch {
    console.error("Listing removed; page refresh could not be scheduled.");
  }
}
