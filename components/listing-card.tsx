import Image from "next/image";
import Link from "next/link";
import { formatPrice, frequencyLabel } from "@/lib/constants";

type ListingCardData = {
  id: string;
  isDemo?: boolean;
  maxGuests?: number;
  title: string;
  price: number;
  currency: string;
  paymentFrequency: string;
  listingCategory: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string;
  photos: { url: string }[];
};

export function ListingCard({
  listing,
  variant,
}: {
  listing: ListingCardData;
  variant?: "editorial";
}) {
  const photo = listing.photos[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`${variant === "editorial" ? "editorial-listing " : ""}group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl shadow-lg shadow-blue-950/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/20 xs:aspect-[4/5] sm:rounded-3xl`}
    >
      {photo ? (
        <Image
          src={photo.url}
          alt={listing.title}
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          className="listing-photo object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="listing-photo absolute inset-0 flex items-center justify-center bg-zinc-100 text-sm text-zinc-400">
          No photo
        </div>
      )}
      <div className="listing-overlay absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-blue-950 backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
        {listing.isDemo ? "Demo · " : ""}{listing.propertyType}
      </span>

      <div className="listing-details relative flex min-w-0 flex-col gap-1 p-4 sm:p-5">
        <p className="font-display text-xl wrap-anywhere text-white sm:text-2xl">
          {formatPrice(listing.price, listing.currency)}
          <span className="text-sm font-normal text-white/70">
            {" "}
            {frequencyLabel(listing.paymentFrequency, listing.listingCategory)}
          </span>
        </p>
        <p className="line-clamp-1 text-sm font-medium wrap-anywhere text-white/90 sm:text-base">
          {listing.title}
        </p>
        <p className="text-xs wrap-anywhere text-white/70 sm:text-sm">
          {listing.city}, {listing.state} &middot; {listing.bedrooms} bed &middot;{" "}
          {listing.bathrooms} bath
        </p>
      </div>
    </Link>
  );
}
