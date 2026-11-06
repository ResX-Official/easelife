import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { unsplashUrl, STOCK_PHOTOS } from "@/lib/stock-photos";

export function ExploreCities({ cities }: { cities: { city: string; count: number }[] }) {
  if (cities.length === 0) return null;

  return (
    <section className="shell destinations-section">
      <div className="destinations-panel">
        <Reveal className="section-header destination-heading">
          <SectionHeading eyebrow="A change of scene" description="Explore the neighbourhoods and destinations behind our listings.">
            Get to know<br /><span>somewhere new.</span>
          </SectionHeading>
          <Link href="/listings?category=staycation" className="text-link">Explore staycations <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </Reveal>
        <div className={`grid gap-4 sm:grid-cols-2 lg:gap-6 ${cities.length > 2 ? "lg:grid-cols-3" : ""}`}>
          {cities.map((entry, i) => (
            <Reveal key={entry.city} delay={i * 0.05}>
              <Link href={`/listings?city=${encodeURIComponent(entry.city)}`} className="destination-card group">
                <Image
                  src={unsplashUrl(STOCK_PHOTOS.cityFallbacks[i % STOCK_PHOTOS.cityFallbacks.length], "w=1000&q=80&auto=format&fit=crop")}
                  alt=""
                  fill
                  sizes={cities.length > 2 ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 50vw, 100vw"}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] tracking-wide text-blue-950">Explore the area</span>
                <div className="relative flex items-end justify-between gap-4 p-6 sm:p-8">
                  <div><p className="text-xs text-white/75">Find your next chapter in</p><h3 className="mt-1 text-3xl font-medium tracking-tight text-white sm:text-4xl">{entry.city}</h3></div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition-colors group-hover:bg-white group-hover:text-blue-950"><ArrowUpRight aria-hidden="true" className="h-5 w-5" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
