const STORAGE_KEY = "easerent:my-listings";

export type SavedListing = {
  id: string;
  token: string;
  title: string;
  city: string;
  state: string;
};

export function getSavedListingsSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getServerSavedListingsSnapshot() {
  return null;
}

export function subscribeSavedListings(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_KEY, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_KEY, onChange);
  };
}

export function getSavedListings(raw = getSavedListingsSnapshot()): SavedListing[] {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveListing(listing: SavedListing) {
  if (typeof window === "undefined") return;
  const existing = getSavedListings().filter((l) => l.id !== listing.id);
  const updated = [listing, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(STORAGE_KEY));
}

export function removeSavedListing(id: string) {
  if (typeof window === "undefined") return;
  const updated = getSavedListings().filter((l) => l.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(STORAGE_KEY));
}
