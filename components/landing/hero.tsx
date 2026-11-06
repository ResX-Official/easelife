import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, MapPin, Search } from "lucide-react";
import { unsplashUrl, STOCK_PHOTOS } from "@/lib/stock-photos";

const searchCategories = [
  { value: "apartments", label: "Apartments" },
  { value: "sale", label: "Buy a home" },
  { value: "staycation", label: "Find an escape" },
];

export function Hero({
  listingCount,
  cityCount,
}: {
  listingCount: number;
  cityCount: number;
}) {
  return (
    <section aria-labelledby="hero-heading" className="hero-section">
      <div className="shell hero-layout">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            Exceptional places. New possibilities.
          </p>

          <h1 id="hero-heading" className="hero-title">
            Your next chapter{" "}
            <span>starts here.</span>
          </h1>

          <p className="hero-description">
            Luxury apartments for a day or a month. Homes to own.
            Discover a space for your next chapter.
          </p>

          <form action="/listings" method="get" className="hero-search">
            <fieldset className="hero-search-categories">
              <legend className="sr-only">What are you looking for?</legend>
              {searchCategories.map(({ value, label }) => (
                <label key={value} className="hero-search-category">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    defaultChecked={value === "staycation"}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full px-3 py-2.5 text-center text-xs font-medium transition-colors peer-checked:bg-blue-950 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700 sm:px-4 sm:text-sm">
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="hero-search-location">
              <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-800" />
              <div className="min-w-0 flex-1">
                <label htmlFor="hero-city" className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Where would you like to be?
                </label>
                <input
                  id="hero-city"
                  name="city"
                  type="search"
                  placeholder="Enter a city or destination"
                  className="mt-1 w-full min-w-0 rounded-sm bg-transparent py-1 text-base text-blue-950 outline-none placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:text-sm"
                />
              </div>
              <button type="submit" aria-label="Search properties" className="hero-search-submit">
                <Search aria-hidden="true" className="h-5 w-5" />
                <span className="hidden sm:inline">Explore</span>
              </button>
            </div>
          </form>

          <div className="hero-footnote">
            <p>
              <span className="font-semibold text-blue-950">{listingCount}</span>{" "}
              {listingCount === 1 ? "place" : "places"} to discover
              <span aria-hidden="true" className="mx-2 text-zinc-300">/</span>
              <span className="font-semibold text-blue-950">{cityCount}</span>{" "}
              {cityCount === 1 ? "destination" : "destinations"}
            </p>
            <Link href="/list-property" className="group inline-flex items-center gap-1.5 font-medium text-blue-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
              List your property
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <Image
            src={unsplashUrl(STOCK_PHOTOS.hero)}
            alt="Sunlit contemporary villa with floor-to-ceiling windows and a palm-lined terrace"
            fill
            preload
            sizes="(min-width: 112rem) 750px, (min-width: 64rem) 45vw, (min-width: 40rem) calc(100vw - 48px), calc(100vw - 32px)"
            className="object-cover object-[58%_center]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0c1b31]/80 via-transparent to-black/5" />
          <span className="hero-image-label">A little extraordinary, every day.</span>

          <div className="hero-image-caption">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/75">Make room for more</p>
              <p className="text-3xl font-medium leading-[1.15] tracking-[-0.035em] text-white sm:text-4xl">Better spaces.<br />Even better living.</p>
            </div>
            <Link href="/listings" aria-label="Browse luxury homes" className="hero-image-link">
              <ArrowUpRight aria-hidden="true" className="h-6 w-6" />
            </Link>
          </div>
          <div aria-hidden="true" className="hero-image-index">
            <span className="h-px w-8 bg-white/80" />
            <span>Find your kind of extraordinary</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
