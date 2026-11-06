"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/manage/")) return;
    void fetch(`/api/visit?path=${encodeURIComponent(pathname)}`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    });
  }, [pathname]);
  return null;
}
