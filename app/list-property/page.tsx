import { Building2, Link2, Sparkles } from "lucide-react";
import { ListingForm } from "@/components/listing-form";
import { createListing } from "@/lib/actions";

export const metadata = { title: "List a property — Easelife" };

const steps = [
  { icon: Sparkles, title: "Pick your listing type", body: "Luxury apartment, home for sale, or staycation — choose the right category." },
  { icon: Building2, title: "Add photos and details", body: "Title, pricing, location, and a few great photos go a long way." },
  { icon: Link2, title: "Publish and save your link", body: "You get a private manage URL to edit the listing and read enquiries." },
];

export default function ListPropertyPage() {
  return (
    <div className="border-t border-zinc-200/80 bg-gradient-to-b from-blue-50/90 via-white to-zinc-50/80">
      <div className="shell grid max-w-6xl gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:py-16">
        <aside className="lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">List on Easelife</p>
          <h1 className="mt-2 font-display text-section text-blue-950">List a property or destination</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">No account required. Publish in minutes and manage everything from your private link.</p>
          <ol className="mt-8 hidden flex-col gap-5 lg:flex">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-900 shadow-sm ring-1 ring-zinc-200/80">{i + 1}</span>
                <div><p className="text-sm font-semibold text-blue-950">{step.title}</p><p className="mt-0.5 text-sm leading-snug text-zinc-500">{step.body}</p></div>
              </li>
            ))}
          </ol>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex gap-3 overflow-x-auto pb-1 lg:hidden">
            {steps.map((step, i) => (
              <div key={step.title} className="flex min-w-[11rem] shrink-0 flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-900">{i + 1}</span><p className="text-sm font-medium text-blue-950">{step.title}</p></div>
            ))}
          </div>
          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-blue-950/5 ring-1 ring-zinc-100">
            <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-950 to-blue-900 px-5 py-5 sm:px-8 sm:py-6"><p className="text-sm font-medium text-blue-100">New listing</p><p className="mt-1 font-display text-xl text-white sm:text-2xl">Tell us about the property</p></div>
            <div className="px-5 py-6 sm:px-8 sm:py-8"><ListingForm action={createListing} submitLabel="Publish listing" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
