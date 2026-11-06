"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Menu, X } from "lucide-react";

const links = [
  { href: "/listings?category=apartments", label: "Luxury apartments" },
  { href: "/listings?category=staycation", label: "Stays & escapes" },
  { href: "/listings?type=sale", label: "For sale" },
  { href: "/escape", label: "Escape Match" },
  { href: "/my-listings", label: "My listings" },
];

export function Header({ logoUrl }: { logoUrl: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="shell flex items-center justify-between gap-3 py-3.5 sm:py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-blue-950 sm:text-lg"
          onClick={() => setOpen(false)}
        >
          {logoUrl ? (
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              <Image src={logoUrl} alt="" fill sizes="36px" className="object-contain" />
            </span>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white">
              <Home className="h-4 w-4" />
            </span>
          )}
          Easelife
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-600 lg:flex lg:gap-7">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-blue-900">
              {link.label}
            </Link>
          ))}
          <Link
            href="/list-property"
            className="whitespace-nowrap rounded-full bg-blue-900 px-4 py-2 text-white shadow-sm shadow-blue-900/20 transition-colors hover:bg-blue-800"
          >
            List a property
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-blue-950 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-zinc-200/80 lg:hidden"
          >
            <div className="shell flex max-h-[70svh] flex-col gap-1 overflow-y-auto py-3 text-sm font-medium text-zinc-600">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center transition-colors hover:text-blue-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/list-property"
                onClick={() => setOpen(false)}
                className="mt-2 mb-2 flex min-h-11 items-center justify-center rounded-full bg-blue-900 px-4 text-center text-white shadow-sm shadow-blue-900/20 transition-colors hover:bg-blue-800"
              >
                List a property
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
