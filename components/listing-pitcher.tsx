"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CURRENCIES, formatPrice, frequencyLabel } from "@/lib/constants";
import { LISTING_CATEGORY_LABELS, type ListingCategory } from "@/lib/listing-category";
import { CustomDropdown } from "@/components/custom-dropdown";

type PitchListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  paymentFrequency: string;
  listingCategory: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string;
};

const categories: ListingCategory[] = ["rent", "sale", "staycation"];
const inputClass = "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:text-sm";

export function ListingPitcher({ listings }: { listings: PitchListing[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ListingCategory>("staycation");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [city, setCity] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const matches = useMemo(() => {
    if (!submitted) return [];
    const available = listings.filter((listing) => listing.listingCategory === category);
    const scored = available.map((listing) => {
      let score = 0;
      const reasons: string[] = [];
      const normalizedCity = city.trim().toLowerCase();
      if (normalizedCity && `${listing.city} ${listing.state}`.toLowerCase().includes(normalizedCity)) {
        score += 4;
        reasons.push(`It’s in ${listing.city}, matching your location preference`);
      }
      const maxBudget = Number(budget);
      if (budget && Number.isFinite(maxBudget)) {
        if (listing.currency === currency && listing.price <= maxBudget) {
          score += 3;
          reasons.push(`Its price is within your ${formatPrice(maxBudget, currency)} budget`);
        } else if (listing.currency === currency) {
          score -= 2;
        }
      }
      const minBedrooms = Number(bedrooms);
      if (bedrooms && Number.isFinite(minBedrooms)) {
        if (listing.bedrooms >= minBedrooms) {
          score += 2;
          reasons.push(`It has ${listing.bedrooms} bedrooms, meeting your space needs`);
        } else {
          score -= 2;
        }
      }
      if (!reasons.length) reasons.push(`A ${listing.propertyType.toLowerCase()} in ${listing.city} to explore`);
      return { listing, score, reasons };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [listings, category, budget, currency, city, bedrooms, submitted]);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-800"><Sparkles className="h-4 w-4" /> A little help finding your fit</p>
          <h2 className="mt-1 font-display text-2xl text-blue-950">Let us pitch a place to you</h2>
          <p className="mt-1 text-sm text-zinc-600">Tell us what matters. We’ll find the listings that fit.</p>
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="h-11 shrink-0 rounded-full bg-blue-900 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-800">
          {open ? "Close" : "Find my place"}
        </button>
      </div>

      {open && (
        <div className="mt-6 border-t border-blue-100 pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <fieldset className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 lg:col-span-2">
              <legend>What are you looking for?</legend>
              <CustomDropdown
                value={category}
                onChange={(value) => {
                  setCategory(value as ListingCategory);
                  setSubmitted(false);
                }}
                className={`${inputClass} flex items-center justify-between text-left`}
                options={categories.map((value) => ({
                  value,
                  label: LISTING_CATEGORY_LABELS[value],
                }))}
              />
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              Your budget (max)
              <input className={inputClass} type="number" min="0" placeholder="Any budget" value={budget} onChange={(event) => { setBudget(event.target.value); setSubmitted(false); }} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              Budget currency
              <CustomDropdown
                value={currency}
                onChange={(value) => { setCurrency(value); setSubmitted(false); }}
                className={`${inputClass} flex items-center justify-between text-left`}
                options={CURRENCIES.map((value) => ({ value, label: value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              Preferred city or country
              <input className={inputClass} placeholder="Anywhere" value={city} onChange={(event) => { setCity(event.target.value); setSubmitted(false); }} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              At least how many bedrooms?
              <input className={inputClass} type="number" min="0" placeholder="Any size" value={bedrooms} onChange={(event) => { setBedrooms(event.target.value); setSubmitted(false); }} />
            </label>
          </div>
          <button type="button" onClick={() => setSubmitted(true)} className="mt-4 h-11 rounded-full border border-blue-900 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-100">
            Pitch my options <ArrowRight className="ml-1 inline h-4 w-4" />
          </button>

          {submitted && (matches.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {matches.map(({ listing, reasons }, index) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{index === 0 ? "Our top pitch" : "Also worth a look"}</p>
                  <h3 className="mt-1 font-semibold text-blue-950">{listing.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{listing.city}, {listing.state} · {listing.bedrooms} bed</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">{formatPrice(listing.price, listing.currency)} {frequencyLabel(listing.paymentFrequency, listing.listingCategory)}</p>
                  <p className="mt-2 text-sm leading-5 text-zinc-600">{reasons[0]}.</p>
                  <span className="mt-3 inline-block text-sm font-medium text-blue-800">See this place →</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-white/80 p-4 text-sm text-zinc-600">No listings in this category yet. Try another type or browse all listings.</p>
          ))}
        </div>
      )}
    </section>
  );
}
