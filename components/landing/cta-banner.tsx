import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { unsplashUrl, STOCK_PHOTOS } from "@/lib/stock-photos";

export function CtaBanner() {
  return (
    <section className="shell pb-12 sm:pb-16">
      <Reveal className="owner-banner">
        <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <p className="section-eyebrow !text-blue-200">For owners & agents</p>
          <h2 className="section-title !text-white">Your space.<br />Someone’s <span className="!text-blue-200">next chapter.</span></h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75">A home, an investment, a perfect escape. Put your property in front of the people looking for a place just like yours.</p>
          <Link href="/list-property" className="mt-7 inline-flex min-h-12 items-center gap-5 rounded-full bg-white px-6 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">List your property <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <div className="relative hidden min-h-80 md:block"><Image src={unsplashUrl(STOCK_PHOTOS.cta)} alt="Bright living space with contemporary furnishings" fill sizes="(min-width: 768px) 45vw, 0px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 to-transparent" /></div>
      </Reveal>
    </section>
  );
}
