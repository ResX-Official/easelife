"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { removeSavedListing } from "@/lib/my-listings";

export function DeleteListingButton({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current || !window.confirm("Delete this listing and its enquiries? This can't be undone.")) return;
    submitted.current = true;
    setPending(true);
    setError(null);
    let navigating = false;
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error || "We couldn't delete this listing. Please try again.");
        return;
      }
      try { removeSavedListing(id); } catch { }
      navigating = true;
      router.replace("/my-listings");
    } catch {
      setError("The connection was interrupted. Please try deleting again.");
    } finally {
      if (!navigating) { submitted.current = false; setPending(false); }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Deleting..." : "Delete listing"}
      </button>
    </form>
  );
}
