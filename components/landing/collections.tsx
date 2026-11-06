import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { STOCK_PHOTOS, unsplashUrl } from "@/lib/stock-photos";

const collections = [
  { number: "01", label: "Apartment living, elevated", title: "Stay a day. Settle in. Own it.", description: "Luxury apartments for daily stays, monthly living, or ownership.", href: "/listings?category=apartments", photo: STOCK_PHOTOS.cityFallbacks[1], action: "Explore apartments" },
  { number: "02", label: "A moment away", title: "Check out of the everyday.", description: "Beautiful stays and a change of scene.", href: "/listings?category=staycation", photo: STOCK_PHOTOS.cityFallbacks[4], action: "Discover stays" },
  { number: "03", label: "A future to build", title: "Make your next big move.", description: "Homes for sale, with room for your plans.", href: "/listings?type=sale", photo: STOCK_PHOTOS.cityFallbacks[0], action: "Find a home to buy" },
  { number: "04", label: "Better together", title: "Get your people on board.", description: "Pick privately. Reveal your group’s escape.", href: "/escape", photo: STOCK_PHOTOS.cityFallbacks[3], action: "Try Escape Match" },
];

export function Collections() {
  return (
    <section className="shell home-section collections-section">
      <Reveal className="section-header">
        <SectionHeading eyebrow="Find your kind of space">However you want <span>to live.</span></SectionHeading>
        <p className="max-w-xs text-sm leading-7 text-slate-500">Stay for a weekend. Settle in for years.<br />Start with what feels like you.</p>
      </Reveal>
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 md:gap-5 lg:gap-7">
        {collections.map((collection, i) => (
          <Reveal key={collection.href} delay={i * 0.06}>
            <Link href={collection.href} className="collection-card group">
              <div className="collection-photo">
                <Image src={unsplashUrl(collection.photo, "w=800&q=80&auto=format&fit=crop")} alt="" fill sizes="(min-width: 1280px) 275px, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="collection-number">{collection.number}</span>
                <span className="collection-arrow"><ArrowUpRight aria-hidden="true" className="h-5 w-5" /></span>
              </div>
              <div className="pt-5">
                <p className="section-eyebrow">{collection.label}</p>
                <h3 className="mt-2 text-[1.35rem] font-medium leading-snug tracking-[-0.035em] text-blue-950">{collection.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{collection.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-900">{collection.action}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
