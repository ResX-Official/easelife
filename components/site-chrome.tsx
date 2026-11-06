"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function SiteHeader({ logoUrl }: { logoUrl: string | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Header logoUrl={logoUrl} />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Footer />;
}
