import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { STOCK_PHOTOS, unsplashUrl } from "@/lib/stock-photos";

const benefits = [
  { title: "Zero platform commission", body: "More of your budget goes towards your next home or getaway." },
  { title: "A direct line to your next place", body: "Speak with the owner or agent. Ask questions and arrange a viewing directly." },
  { title: "One place, more possibilities", body: "Rent, buy, or get away. Explore spaces that fit the way you want to live." },
];

export function Comparison() {
  return (
    <section className="shell home-section">
      <div className="benefits-layout">
        <Reveal className="benefits-visual">
          <Image src={unsplashUrl(STOCK_PHOTOS.manifesto)} alt="Contemporary home with an open terrace and swimming pool" fill sizes="(min-width: 1280px) 540px, (min-width: 768px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          <p className="absolute bottom-7 left-7 max-w-[14rem] text-3xl leading-tight tracking-tight text-white">More room for<br /><span className="font-serif italic">what matters.</span></p>
        </Reveal>
        <Reveal className="self-center">
          <SectionHeading eyebrow="Thoughtfully simple" description="Finding a place is a big decision. Getting started should be easy.">Less in the way.<br /><span>More to look forward to.</span></SectionHeading>
          <div className="mt-7 space-y-6">
            {benefits.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800"><Check aria-hidden="true" className="h-3.5 w-3.5" /></span>
                <div><h3 className="text-sm font-semibold text-blue-950">{item.title}</h3><p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{item.body}</p></div>
              </div>
            ))}
          </div>
          <Link href="/listings" className="text-link mt-6">Find your place <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </Reveal>
      </div>
    </section>
  );
}
