"use client";

import { deleteAdminListing } from "@/app/admin/actions";

export function AdminDeleteListingForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteAdminListing}
      className="sm:self-start"
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${title}” and its enquiries?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="listingId" value={id} />
      <button className="h-10 rounded-full border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50">Delete</button>
    </form>
  );
}
