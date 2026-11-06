"use client";

import { deleteListing } from "@/lib/actions";

export function DeleteListingButton({ id, token }: { id: string; token: string }) {
  return (
    <form
      action={deleteListing.bind(null, id, token)}
      onSubmit={(e) => {
        if (!confirm("Delete this listing permanently? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
      >
        Delete listing
      </button>
    </form>
  );
}
