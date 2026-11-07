import { connection } from "next/server";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listing-card";
import { Reveal } from "@/components/reveal";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExploreCities } from "@/components/landing/explore-cities";
import { Comparison } from "@/components/landing/comparison";
import { Collections } from "@/components/landing/collections";
import { Faq } from "@/components/landing/faq";
import { EscapePromo } from "@/components/landing/escape-promo";
import { CtaBanner } from "@/components/landing/cta-banner";

export default async function Home() {
  await connection();
  const [listings, listingCount, cityGroups] = await Promise.all([
    prisma.listing.findMany({
      where: { listingCategory: { in: ["sale", "staycation", "rent"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.listing.count({ where: { listingCategory: { in: ["sale", "staycation", "rent"] } } }),
    prisma.listing.groupBy({
      where: { listingCategory: "staycation" },
      by: ["city"],
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 6,
    }),
  ]);

  const cities = cityGroups.map((group) => ({
    city: group.city,
    count: group._count.city,
  }));

  return (
    <div className="home-page flex flex-col">
      <Hero listingCount={listingCount} cityCount={cities.length} />

      <StatsBar listingCount={listingCount} cityCount={cities.length} />

      <Collections />

      <section className="featured-section">
        <div className="shell home-section">
          <Reveal className="section-header">
            <SectionHeading eyebrow="Fresh on the market" description="The latest places to rent, buy, and make your own.">
              Homes worth <span>a closer look.</span>
            </SectionHeading>
            <Link href="/listings" className="text-link">Explore all listings <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
          </Reveal>

          {listings.length === 0 ? (
            <p className="text-zinc-500">
              No listings yet.{" "}
              <Link href="/list-property" className="font-medium text-blue-900 underline">
                Be the first to list a property
              </Link>
              .
            </p>
          ) : (
            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 ${listings.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {listings.map((listing, i) => (
                <Reveal key={listing.id} delay={(i % 3) * 0.06}>
                  <ListingCard listing={listing} variant="editorial" />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <EscapePromo />

      <Comparison />

      <ExploreCities cities={cities} />

      <HowItWorks />

      <Faq />

      <CtaBanner />
    </div>
  );
}
