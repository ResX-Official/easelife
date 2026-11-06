"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { getSavedListings, removeSavedListing, subscribeSavedListings, getSavedListingsSnapshot, getServerSavedListingsSnapshot } from "@/lib/my-listings";

export default function MyListingsPage() {
  const snapshot = useSyncExternalStore(subscribeSavedListings, getSavedListingsSnapshot, getServerSavedListingsSnapshot);
  const listings = useMemo(() => getSavedListings(snapshot), [snapshot]);

  return (
    <div className="interior-page"><div className="shell max-w-4xl">
      <PageIntro eyebrow="Your spaces" title="Good places. All yours." description="Your listings saved on this browser. Keep each private management link safe so you can access it on another device.">
        <Link href="/list-property" className="button-primary">List a new space <ArrowUpRight className="h-4 w-4" /></Link>
      </PageIntro>

      {listings.length === 0 ? (
        <div className="empty-panel"><Building2 className="h-8 w-8 text-blue-800" /><h2>Your next listing starts here.</h2><p>No listings saved on this browser yet.</p><Link href="/list-property" className="button-primary">Share your space <ArrowUpRight className="h-4 w-4" /></Link></div>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="saved-listing"
            >
              <div className="min-w-0">
                <p className="font-medium wrap-anywhere text-zinc-900">{listing.title}</p>
                <p className="text-sm wrap-anywhere text-zinc-500">
                  {listing.city}, {listing.state}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-sm font-medium">
                <Link href={`/manage/${listing.token}`} className="text-blue-900 underline">
                  Manage
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    removeSavedListing(listing.id);
                  }}
                  className="text-zinc-500 hover:text-red-600"
                >
                  Remove from this browser
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div></div>
  );
}
