import { connection } from "next/server";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { VisitorTracker } from "@/components/visitor-tracker";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const brico = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-ease-sans",
  fallback: ["Arial", "sans-serif"],
});

const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-regular-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  variable: "--font-ease-serif",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Easelife — Places to own. Spaces to unwind.",
  description:
    "Discover luxury apartments for daily or monthly stays, homes for sale, beautiful staycations, and Escape Match: a new way to plan a getaway with your people.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const logoSetting = await prisma.siteSetting.findUnique({ where: { key: "logoUrl" } });
  return (
    <html
      lang="en"
      className={`${brico.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader logoUrl={logoSetting?.value ?? null} />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        <VisitorTracker />
      </body>
    </html>
  );
}
