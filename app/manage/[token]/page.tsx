import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Inbox, LockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateListing } from "@/lib/actions";
import { isListingCategory } from "@/lib/listing-category";
import { ListingForm } from "@/components/listing-form";
import { DeleteListingButton } from "@/components/delete-listing-button";
import { SaveToMyListings } from "@/components/save-to-my-listings";
import { PageIntro } from "@/components/page-intro";
import { ShareLink } from "@/components/share-link";

export const metadata = { title: "Manage your space — Easelife", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function ManageListingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const listing = await prisma.listing.findUnique({ where: { managementToken: token }, include: { photos: { orderBy: { order: "asc" } }, messages: { orderBy: { createdAt: "desc" } } } });
  if (!listing) notFound();
  return (
    <div className="interior-page"><div className="shell">
      <SaveToMyListings id={listing.id} token={token} title={listing.title} city={listing.city} state={listing.state} />
      <PageIntro eyebrow="Your host workspace" title="A little care goes a long way." description={`Manage ${listing.title}, update its details, and keep your conversations in one place.`}><Link href={`/listings/${listing.id}`} className="button-secondary">View public listing <ArrowUpRight className="h-4 w-4" /></Link></PageIntro>
      <div className="management-grid">
        <div className="editor-card"><div className="editor-card-header"><p className="section-eyebrow">Make it yours</p><h2>Edit your listing</h2></div><div className="editor-card-body"><ListingForm action={updateListing.bind(null, listing.id, token)} submitLabel="Save changes" photosRequired={false} existingPhotos={listing.photos} defaultValues={{ ...listing, listingCategory: isListingCategory(listing.listingCategory) ? listing.listingCategory : "sale" }} /></div></div>
        <aside className="flex flex-col gap-5">
          <section className="surface-panel"><LockKeyhole className="h-5 w-5 text-blue-800" /><h2 className="mt-4 text-lg font-medium text-blue-950">Your private access</h2><p className="mt-2 mb-4 text-sm leading-7 text-slate-500">This link allows editing and access to enquiries. Save it somewhere private. Share your public listing with guests and buyers instead.</p><ShareLink path={`/manage/${token}`} title="My private listing management link" privateLink /></section>
          <section className="surface-panel"><div className="flex items-center justify-between"><h2 className="text-lg font-medium text-blue-950">Your inbox</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-900">{listing.messages.length}</span></div>{listing.messages.length === 0 ? <div className="py-8 text-center"><Inbox className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm text-slate-500">A conversation starts here.</p><p className="mt-2 text-xs leading-6 text-slate-400">Buyer and guest enquiries will appear in your inbox.</p></div> : <ul className="mt-5 divide-y divide-slate-100">{listing.messages.map(message => <li key={message.id} className="py-5 first:pt-0"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold text-blue-950">{message.senderName}</p><time className="text-[10px] text-slate-400">{message.createdAt.toLocaleDateString("en-GB")}</time></div><a href={`mailto:${message.senderEmail}`} className="mt-1 block break-all text-xs text-blue-700">{message.senderEmail}</a>{message.senderPhone && <p className="mt-1 text-xs text-slate-500">{message.senderPhone}</p>}<p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-600">{message.body}</p></li>)}</ul>}</section>
          <details className="surface-panel"><summary className="cursor-pointer text-sm font-medium text-red-700">Remove this listing</summary><p className="my-4 text-sm leading-6 text-slate-500">Permanently deletes the listing and its enquiries.</p><DeleteListingButton id={listing.id} token={token} /></details>
        </aside>
      </div>
    </div></div>
  );
}
