import Link from "next/link";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-blue-900/30 bg-[#101d3d]">
      <div className="shell flex flex-col gap-10 py-12 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:py-14">
        <div className="flex max-w-xs flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-white">
              <Home className="h-4 w-4" />
            </span>
            Easelife
          </Link>
          <p className="text-sm text-slate-400">
            Discover luxury apartments, homes for sale, and curated staycation
            escapes across Nigeria, the Maldives, Ethiopia, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 xs:gap-12 sm:flex sm:gap-16">
          <div className="flex flex-col gap-1 sm:gap-3">
            <p className="mb-1 text-sm font-semibold text-white sm:mb-0">Explore</p>
            <Link href="/listings?category=apartments" className="w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:py-0">Luxury apartments</Link>
            <Link href="/escape" className="w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:py-0">
              Escape Match
            </Link>
            <Link href="/listings?type=sale" className="w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:py-0">
              Properties for sale
            </Link>
          </div>
          <div className="flex flex-col gap-1 sm:gap-3">
            <p className="mb-1 text-sm font-semibold text-white sm:mb-0">List</p>
            <Link href="/list-property" className="w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:py-0">
              List a property
            </Link>
            <Link href="/listings?category=staycation" className="w-fit py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:py-0">
              Staycation escapes
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-400">
        Easelife &mdash; Places to own. Spaces to unwind.
      </div>
    </footer>
  );
}
