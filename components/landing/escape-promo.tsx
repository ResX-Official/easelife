import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { STOCK_PHOTOS, unsplashUrl } from "@/lib/stock-photos";
export function EscapePromo() {
  return <section className="shell pb-8"><div className="home-escape-promo"><div><p className="section-eyebrow flex items-center gap-2 !text-blue-200"><Sparkles className="h-3.5 w-3.5" />Meet Escape Match</p><h2>Your group chat.<br /><span>Finally going somewhere.</span></h2><p>Send one invitation. Everyone picks privately. Reveal the place that gets your people on the same wavelength.</p><Link href="/escape" className="button-secondary mt-7 !border-white/20 !bg-white !text-blue-950">Find our escape <ArrowUpRight className="h-4 w-4" /></Link></div><div className="home-escape-promo-visual"><Image src={unsplashUrl(STOCK_PHOTOS.manifesto)} alt="A poolside villa to enjoy with friends" fill sizes="600px" className="object-cover" /></div></div></section>;
}
