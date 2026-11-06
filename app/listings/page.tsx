import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowUpRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listing-card";
import { PageIntro } from "@/components/page-intro";
import { resolveListingCategory, categoryQueryForForm, LISTING_CATEGORY_PAGE_TITLES } from "@/lib/listing-category";

type SearchParams = Promise<{ city?: string; minPrice?: string; maxPrice?: string; bedrooms?: string; propertyType?: string; currency?: string; period?: string; purpose?: string; type?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return { title: `${params.category === "apartments" ? "Luxury apartments" : LISTING_CATEGORY_PAGE_TITLES[resolveListingCategory(params)]} — Easelife` };
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = resolveListingCategory(params);
  const apartments = params.category === "apartments";
  const apartmentSale = apartments && params.purpose === "sale";
  const categoryQuery = apartments ? { category: "apartments", type: undefined } : categoryQueryForForm(category);
  const baseWhere: Prisma.ListingWhereInput = apartments ? { listingCategory: apartmentSale ? "sale" : { in: ["rent", "staycation", "sale"] }, propertyType: { in: ["Apartment", "Studio", "Penthouse"] } } : { listingCategory: category };
  const where: Prisma.ListingWhereInput = { ...baseWhere };
  if (!apartmentSale && params.period && ["daily", "monthly", "yearly", "per_stay"].includes(params.period)) {
    where.paymentFrequency = params.period;
    if (apartments) where.listingCategory = { in: ["rent", "staycation"] };
  }
  if (params.city?.trim()) where.city = { contains: params.city.trim() };
  if (params.propertyType && (!apartments || ["Apartment", "Studio", "Penthouse"].includes(params.propertyType))) where.propertyType = params.propertyType;
  where.currency = params.currency && ["NGN", "USD", "GBP", "EUR"].includes(params.currency) ? params.currency : "NGN";
  if (params.bedrooms && Number.isInteger(Number(params.bedrooms)) && Number(params.bedrooms) >= 0) where.bedrooms = { gte: Number(params.bedrooms) };
  const min = Number(params.minPrice), max = Number(params.maxPrice);
  if ((params.minPrice && Number.isFinite(min) && min >= 0) || (params.maxPrice && Number.isFinite(max) && max >= 0)) {
    where.price = { ...(params.minPrice && Number.isFinite(min) && min >= 0 ? { gte: min } : {}), ...(params.maxPrice && Number.isFinite(max) && max >= 0 ? { lte: max } : {}) };
  }
  const [listings, types] = await Promise.all([
    prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, include: { photos: { orderBy: { order: "asc" }, take: 1 } } }),
    prisma.listing.findMany({ where: baseWhere, distinct: ["propertyType"], select: { propertyType: true } }),
  ]);
  const stay = category === "staycation";
  return (
    <div className="interior-page">
      <div className="shell">
        <PageIntro eyebrow={apartments ? "Luxury apartments" : stay ? "Switch off. Settle in." : "An address for your next chapter"} title={apartments ? "Apartment living. A little elevated." : stay ? "A little further from ordinary." : category === "sale" ? "Find a place to make yours." : "A place to call home."} description={apartments ? "For a day, a month, or a place to make your own. Explore luxury apartments for short stays, monthly living, and sale." : stay ? "Poolside weekends, quiet retreats, and somewhere worth switching your phone off for." : "Explore properties, take a closer look, and connect directly with the person behind the listing."}>
          <Link href="/escape" className="button-primary"><Sparkles className="h-4 w-4" />Find our escape</Link>
        </PageIntro>
        <div className="browse-tabs" aria-label="Listing categories">
          <Link href="/listings?category=apartments" aria-current={apartments ? "page" : undefined}>Luxury apartments</Link>
          <Link href="/listings?category=staycation" aria-current={stay && !apartments ? "page" : undefined}>Stays & escapes</Link>
          <Link href="/listings?type=sale" aria-current={category === "sale" && !apartments ? "page" : undefined}>Homes for sale</Link>
        </div>
        {apartments && <nav className="apartment-period-tabs" aria-label="Apartment availability">
          <Link href="/listings?category=apartments" aria-current={!params.period && !apartmentSale ? "page" : undefined}>All apartments</Link>
          <Link href="/listings?category=apartments&period=daily" aria-current={params.period === "daily" && !apartmentSale ? "page" : undefined}>Per day</Link>
          <Link href="/listings?category=apartments&period=monthly" aria-current={params.period === "monthly" && !apartmentSale ? "page" : undefined}>Per month</Link>
          <Link href="/listings?category=apartments&purpose=sale" aria-current={apartmentSale ? "page" : undefined}>For sale</Link>
        </nav>}
        <form className="filter-panel">
          {apartmentSale && <input type="hidden" name="purpose" value="sale" />}
          {categoryQuery.type && <input type="hidden" name="type" value={categoryQuery.type} />}
          {categoryQuery.category && <input type="hidden" name="category" value={categoryQuery.category} />}
          <label className="field-label"><span>Where to?</span><input name="city" placeholder="City or destination" defaultValue={params.city} className="field-input" /></label>
          <label className="field-label"><span>{apartments ? "Apartment type" : stay ? "Stay type" : "Property type"}</span><select name="propertyType" defaultValue={params.propertyType ?? ""} className="field-input"><option value="">Any type</option>{types.map(({ propertyType }) => <option key={propertyType}>{propertyType}</option>)}</select></label>
          <label className="field-label"><span>Currency</span><select name="currency" defaultValue={params.currency ?? "NGN"} className="field-input">{["NGN", "USD", "GBP", "EUR"].map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="field-label"><span>{apartments ? "Max rate / asking price" : stay ? "Maximum rate" : "Maximum price"}</span><input name="maxPrice" type="number" min="0" placeholder="Any budget" defaultValue={params.maxPrice} className="field-input" /></label>
          <details className="filter-more"><summary><SlidersHorizontal className="h-4 w-4" />More filters</summary><div>{!apartmentSale && (apartments || stay) && <label className="field-label">Rate period<select name="period" defaultValue={params.period ?? ""} className="field-input"><option value="">All periods / sales</option><option value="daily">Per day</option><option value="monthly">Per month</option><option value="per_stay">Per stay</option><option value="yearly">Per year</option></select></label>}<label className="field-label">Minimum price<input name="minPrice" type="number" min="0" defaultValue={params.minPrice} className="field-input" /></label><label className="field-label">Min bedrooms<input name="bedrooms" type="number" min="0" defaultValue={params.bedrooms} className="field-input" /></label></div></details>
          <button className="button-primary"><Search className="h-4 w-4" />Search</button>
        </form>
        <div className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500"><strong className="font-semibold text-blue-950">{listings.length}</strong> {apartments ? "apartments" : stay ? "escapes" : "properties"} to explore{params.city ? ` in ${params.city}` : ""}</p><p className="text-xs text-slate-400">Newest first · Connect directly</p></div>
        {listings.length === 0 ? <div className="empty-panel"><Search className="h-8 w-8 text-blue-800" /><h2>No places found just yet.</h2><p>Try another location or a wider budget.</p><Link className="text-link" href={apartments ? "/listings?category=apartments" : stay ? "/listings?category=staycation" : "/listings?type=sale"}>Clear filters <ArrowUpRight className="h-4 w-4" /></Link></div> : <div className="catalog-grid">{listings.map(listing => <ListingCard key={listing.id} listing={listing} variant="editorial" />)}</div>}
        {stay && !apartmentSale && <div className="browse-escape-cta"><div><p className="section-eyebrow">Make it a group decision</p><h2>Great weekend. Same wavelength.</h2><p>Invite your people, pick your favourites privately, and reveal your group’s match.</p></div><Link href="/escape" className="button-primary">Start Escape Match <ArrowUpRight className="h-4 w-4" /></Link></div>}
      </div>
    </div>
  );
}
