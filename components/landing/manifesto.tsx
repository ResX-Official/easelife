import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { unsplashUrl, STOCK_PHOTOS } from "@/lib/stock-photos";

export function Manifesto() {
  return (
    <section className="shell pb-4 sm:pb-6">
      <div className="manifesto-panel">
        <Image src={unsplashUrl(STOCK_PHOTOS.manifesto)} alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#102445]/90 via-[#102445]/65 to-[#102445]/10" />
        <Reveal className="relative max-w-3xl px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
          <p className="section-eyebrow !text-blue-100">More than a place</p>
          <p className="mt-5 text-[clamp(2.5rem,4.5vw,4.5rem)] font-medium leading-[1.1] tracking-[-0.045em] text-white">Room for the life<br />you <span className="font-serif font-normal italic text-blue-100">want to live.</span></p>
          <p className="mt-6 max-w-md text-sm leading-7 text-blue-50/80">Slow mornings. New beginnings. A weekend that feels a world away. The right space makes room for all of it.</p>
        </Reveal>
      </div>
    </section>
  );
}
