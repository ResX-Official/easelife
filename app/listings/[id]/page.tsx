import { PhotoGallery } from "@/components/photo-gallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BedDouble, Bath, MapPin, Users, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, frequencyLabel } from "@/lib/constants";
import { ContactForm } from "@/components/contact-form";

type Params = Promise<{ id: string }>;
export async function generateMetadata({ params }: { params: Params }) {
  const listing = await prisma.listing.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: listing ? `${listing.title} — Easelife` : "Property not found — Easelife" };
}
export default async function ListingDetailPage({ params, searchParams }: { params: Params; searchParams: Promise<{ escape?: string }> }) {
  const listing = await prisma.listing.findUnique({ where: { id: (await params).id }, include: { photos: { orderBy: { order: "asc" } } } });
  if (!listing) notFound();
  const stay = listing.listingCategory !== "sale";
  const apartment = ["Apartment", "Studio", "Penthouse"].includes(listing.propertyType);
  const query = await searchParams;
  const escapeId = query.escape && /^[a-z0-9-]{10,80}$/i.test(query.escape) ? query.escape : undefined;
  return (
    <div className="interior-page property-detail"><div className="shell">
      <Link href={apartment ? "/listings?category=apartments" : stay ? "/listings?category=staycation" : "/listings?type=sale"} className="text-link mb-6"><ArrowLeft className="h-4 w-4" />Back to {apartment ? "apartments" : stay ? "escapes" : "properties"}</Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p className="section-eyebrow">{listing.isDemo ? "Demo listing · Not available to book or purchase" : stay ? "Your next change of scene" : "Your next chapter"}</p><h1 className="detail-title">{listing.title}</h1><p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{listing.city}, {listing.state}</p></div>{stay && <Link href="/escape" className="button-secondary"><Sparkles className="h-4 w-4" />Plan with friends</Link>}</div>
      <PhotoGallery photos={listing.photos} title={listing.title} />
      <div className="detail-layout">
        <div>
          <div className="property-facts"><span><BedDouble />{listing.bedrooms} bedrooms</span><span><Bath />{listing.bathrooms} bathrooms</span>{stay && <span><Users />Up to {listing.maxGuests} guests</span>}<span>{listing.propertyType}</span></div>
          <section className="detail-section"><p className="section-eyebrow">The details</p><h2>{stay ? "Switch off. Make yourself at home." : "Get to know your next address."}</h2><p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600">{listing.description}</p></section>
          <section className="detail-section"><h2>{stay ? "Your destination" : "The neighbourhood"}</h2><p className="mt-3 text-sm leading-7 text-slate-500">{listing.address}, {listing.city}, {listing.state}</p>{!listing.isDemo && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.address}, ${listing.city}, ${listing.state}`)}`} target="_blank" rel="noreferrer" className="text-link">Explore on Maps <ArrowUpRight className="h-4 w-4" /></a>}</section>
          {!listing.isDemo && <section id="contact" className="detail-section scroll-mt-24"><h2>{stay ? "Ask about your stay" : "Arrange a conversation"}</h2><p className="mt-2 mb-6 text-sm text-slate-500">Send a message to {listing.landlordName}. {stay ? "Confirm dates, the total price, and availability before making plans." : "Ask questions or arrange a viewing directly."}</p><ContactForm listingId={listing.id} context={escapeId ? `I'm enquiring about a group escape. Escape Match room: ${escapeId}. Please confirm availability and the total price.` : undefined} /></section>}
        </div>
        <aside className="enquiry-card">
          <p className="section-eyebrow">{stay ? "A little escape" : "Asking price"}</p><p className="detail-price">{formatPrice(listing.price, listing.currency)}<span>{frequencyLabel(listing.paymentFrequency, listing.listingCategory)}</span></p>
          {listing.isDemo ? <div className="demo-notice"><strong>Made for exploring.</strong><p>This is a fictional demo listing with illustrative photos and prices. It is not bookable or for sale.</p></div> : <><div className="host-identity"><span>{listing.landlordName.slice(0, 1)}</span><div><p className="text-xs text-slate-500">Your {stay ? "host" : "property contact"}</p><p className="mt-1 font-medium text-blue-950">{listing.landlordName}</p></div></div><a href="#contact" className="button-primary w-full">{stay ? "Enquire about availability" : "Enquire about this property"}<ArrowUpRight className="h-4 w-4" /></a><div className="mt-5 space-y-3 text-sm text-slate-500"><a className="flex items-center gap-2 break-all" href={`mailto:${listing.landlordEmail}`}><Mail className="h-4 w-4 shrink-0" />{listing.landlordEmail}</a><a className="flex items-center gap-2" href={`tel:${listing.landlordPhone}`}><Phone className="h-4 w-4" />{listing.landlordPhone}</a></div><p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500"><ShieldCheck className="mt-1 h-4 w-4 shrink-0" />Connect directly. Confirm all details with the owner or agent before paying.</p></>}
          {escapeId && <Link href={`/escape/${escapeId}`} className="text-link mt-4"><ArrowLeft className="h-4 w-4" />Back to your group</Link>}
        </aside>
      </div>
    </div></div>
  );
}
