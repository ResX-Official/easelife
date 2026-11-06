import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EscapeRoom, type EscapeRoomView } from "@/components/escape-room";
import { rankEscapeOptions, ROOM_LIFETIME_MS } from "@/lib/escape";

export const metadata = {
  title: "Your group’s escape — Escape Match | Easelife",
  description: "One link. Private picks. A place your people can agree on. Join the escape and find your group’s wavelength.",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
  openGraph: { title: "Your group chat. Finally going somewhere.", description: "You’re invited. Pick privately and reveal your group’s Escape Match on Easelife." },
};
export default async function EscapeRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const {id} = await params;
  const room = await prisma.escapeRoom.findUnique({ where: {id}, include: {
    options: { include: { listing: { select: { id: true, title: true, city: true, state: true, price: true, currency: true, paymentFrequency: true, listingCategory: true, maxGuests: true, bedrooms: true, vibe: true, isDemo: true, photos: { take: 1, orderBy: { order: "asc" } } } } }, orderBy: { id: "asc" } },
    members: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, tokenHash: true, _count: { select: { votes: true } } } },
  } });
  if (!room) notFound();
  if (new Date().getTime() - room.createdAt.getTime() > ROOM_LIFETIME_MS) return <div className="interior-page"><div className="shell empty-panel"><h1 className="text-2xl font-medium text-blue-950">Time for a fresh escape.</h1><p>This invitation has reached its 30-day limit.</p><Link href="/escape" className="button-primary">Start a new escape</Link></div></div>;
  const groupCapacity = room.status === "revealed" ? room.members.length : room.groupSize;
  if (room.options.some(({ listing }) => !["daily", "per_stay"].includes(listing.paymentFrequency) || !["rent", "staycation"].includes(listing.listingCategory) || listing.currency !== room.currency || listing.maxGuests < groupCapacity)) {
    return <div className="interior-page"><div className="shell empty-panel"><h1 className="text-2xl font-medium text-blue-950">A few details have changed.</h1><p>A host updated a stay’s rate, capacity, or listing type. Start a fresh escape to compare places that still fit your group.</p><Link href="/escape" className="button-primary">Find a fresh escape</Link></div></div>;
  }
  const jar = await cookies();
  const memberToken = jar.get(`escape_member_${id}`)?.value;
  const hostToken = jar.get(`escape_host_${id}`)?.value;
  const hash = (v: string) => createHash("sha256").update(v).digest("hex");
  const member = memberToken ? room.members.find(m=>m.tokenHash===hash(memberToken)) : undefined;
  const ownVotes = member ? await prisma.escapeVote.findMany({ where: { memberId: member.id }, select: { optionId: true, value: true } }) : [];
  let results: EscapeRoomView["results"] = [];
  if (room.status === "revealed") {
    const options = await prisma.escapeOption.findMany({ where: { roomId:id }, select: { id:true, votes: { select: { value:true } } } });
    results = rankEscapeOptions(options,room.members.length).map(({id,yes,maybe,unanimous})=>({id,yes,maybe,unanimous}));
  }
  const view: EscapeRoomView = {
    id, title: room.title, location:room.location, groupSize:room.groupSize, nights:room.nights, startDate:room.startDate, status:room.status,
    isHost: !!hostToken && room.hostHash===hash(hostToken), memberId:member?.id ?? null, memberName:member?.name ?? null,
    members:room.members.map(m=>({id:m.id,name:m.name,complete:m._count.votes===room.options.length})), ownVotes, results,
    options:room.options.map(o=>({id:o.id,listing:{ id:o.listing.id,title:o.listing.title,city:o.listing.city,state:o.listing.state,price:o.listing.price,currency:o.listing.currency,paymentFrequency:o.listing.paymentFrequency,maxGuests:o.listing.maxGuests,bedrooms:o.listing.bedrooms,vibe:o.listing.vibe,isDemo:o.listing.isDemo,photo:o.listing.photos[0]?.url ?? null }})),
  };
  return <EscapeRoom room={view} />;
}
