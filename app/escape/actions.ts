"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requestLimit } from "@/lib/request-limit";
import { prisma } from "@/lib/prisma";
import { ESCAPE_VIBES, estimatedPerPerson, ROOM_LIFETIME_MS } from "@/lib/escape";

export type EscapeActionState = { error?: string; success?: boolean };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const secret = () => randomBytes(24).toString("hex");
const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/escape", maxAge: 30 * 86400 };
const expired = (createdAt: Date) => Date.now() - createdAt.getTime() > ROOM_LIFETIME_MS;

export async function createEscape(_previous: EscapeActionState, data: FormData): Promise<EscapeActionState> {
  if (!(await requestLimit("escape-create", 10, 3600)).allowed) return { error: "Too many requests. Please try again later." };
  const name = field(data,"name"), title = field(data,"title"), location = field(data,"location"), vibe = field(data,"vibe") || "any";
  const groupSize = Number(data.get("groupSize")), nights = Number(data.get("nights")), budgetText = field(data,"budget"), budget = budgetText ? Number(budgetText) : null;
  const currency = field(data,"currency"), startDate = field(data,"startDate");
  if (name.length < 2 || name.length > 30 || title.length < 3 || title.length > 70 || location.length > 100) return { error: "Add your name (2–30 characters) and an escape name (3–70 characters)." };
  if (!Number.isInteger(groupSize) || groupSize < 2 || groupSize > 12) return { error: "Choose a group of 2 to 12 people, including you." };
  if (!Number.isInteger(nights) || nights < 1 || nights > 14) return { error: "Choose between 1 and 14 nights." };
  if (budget !== null && (!Number.isFinite(budget) || budget <= 0 || budget > 1e10)) return { error: "Enter a positive budget per person or leave it open." };
  if (!["NGN","USD","GBP","EUR"].includes(currency) || !ESCAPE_VIBES.some(v => v.value === vibe)) return { error: "Select a valid currency and vibe." };
  if (startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isFinite(Date.parse(startDate)) || new Date(startDate).toISOString().slice(0,10) !== startDate || startDate < new Date().toISOString().slice(0,10))) return { error: "Choose a valid future date, or leave dates flexible." };
  const candidates = await prisma.listing.findMany({ where: {
    listingCategory: { in: ["staycation", "rent"] }, paymentFrequency: { in: ["daily", "per_stay"] }, maxGuests: { gte: groupSize }, currency,
    ...(vibe !== "any" ? { vibe } : {}), ...(location ? { OR: [{ city: { contains: location } },{ state: { contains: location } }] } : {}),
  }, orderBy: { createdAt: "desc" } });
  const options = candidates.filter(l => budget === null || estimatedPerPerson(l.price,l.paymentFrequency,nights,groupSize) <= budget).slice(0,6);
  if (options.length < 2) return { error: "We need at least two stays that fit your group. Try an open vibe, a wider location, or a higher budget. We won’t substitute places outside your criteria." };
  const memberSecret = secret(), hostSecret = secret();
  const room = await prisma.escapeRoom.create({ data: {
    title, location, vibe, groupSize, nights, budget, currency, startDate: startDate || null, hostHash: hash(hostSecret),
    options: { create: options.map(l => ({ listingId: l.id })) },
    members: { create: { name, tokenHash: hash(memberSecret) } },
  } });
  const jar = await cookies();
  jar.set(`escape_member_${room.id}`,memberSecret,cookieOptions);
  jar.set(`escape_host_${room.id}`,hostSecret,cookieOptions);
  redirect(`/escape/${room.id}`);
}

export async function joinEscape(roomId: string, _previous: EscapeActionState, data: FormData): Promise<EscapeActionState> {
  if (!(await requestLimit("escape-join", 30, 3600)).allowed) return { error: "Too many requests. Please try again later." };
  const name = field(data,"name");
  if (name.length < 2 || name.length > 30) return { error: "Choose a name between 2 and 30 characters." };
  const jar = await cookies(), existing = jar.get(`escape_member_${roomId}`)?.value;
  const token = existing || secret();
  const outcome = await prisma.$transaction(async db => {
    const room = await db.escapeRoom.findUnique({ where: { id: roomId }, include: { members: { select: { tokenHash: true, name: true } }, _count: { select: { options: true } } } });
    if (!room || expired(room.createdAt)) return "This invitation has expired. Start a fresh escape.";
    if (room.members.some(m => m.tokenHash === hash(token))) return null;
    if (room.status !== "voting") return "This group has already revealed its picks.";
    if (room._count.options < 2) return "Some stays were removed. Ask the organiser to start a fresh escape.";
    if (room.members.length >= room.groupSize) return "This group is full. Ask the organiser or start your own escape.";
    if (room.members.some(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return "Someone in this group is already using that name. Add an initial or pick another.";
    await db.escapeMember.create({ data: { roomId, name, tokenHash: hash(token) } });
    return null;
  });
  if (outcome) return { error: outcome };
  jar.set(`escape_member_${roomId}`,token,cookieOptions);
  revalidatePath(`/escape/${roomId}`);
  return { success: true };
}

export async function voteEscape(roomId: string, optionId: string, value: number): Promise<EscapeActionState> {
  if (!(await requestLimit("escape-vote", 180, 60)).allowed) return { error: "Too many requests. Please try again later." };
  if (![0,1,2].includes(value)) return { error: "Choose I’m in, Maybe, or Skip." };
  const token = (await cookies()).get(`escape_member_${roomId}`)?.value;
  if (!token) return { error: "Join the escape before making your picks." };
  const outcome = await prisma.$transaction(async db => {
    const room = await db.escapeRoom.findUnique({ where: { id: roomId }, include: { options: { select: { id: true } }, members: { include: { _count: { select: { votes: true } } } } } });
    if (!room || expired(room.createdAt)) return "This escape has expired. Start a fresh one.";
    if (room.status !== "voting") return "The results have been revealed. Your votes are now locked.";
    if (room.options.length < 2) return "There are not enough stays left to compare. Start a fresh escape.";
    const member = room.members.find(m => m.tokenHash === hash(token));
    if (!member || !room.options.some(o => o.id === optionId)) return "This stay or membership does not belong to the escape.";
    await db.escapeVote.upsert({ where: { memberId_optionId: { memberId: member.id, optionId } }, create: { memberId: member.id, optionId, value }, update: { value } });
    const members = await db.escapeMember.findMany({ where: { roomId }, include: { _count: { select: { votes: true } } } });
    if (members.length === room.groupSize && members.every(m => m._count.votes === room.options.length)) await db.escapeRoom.update({ where: { id: roomId }, data: { status: "revealed" } });
    return null;
  });
  if (outcome) return { error: outcome };
  revalidatePath(`/escape/${roomId}`);
  return { success: true };
}

export async function revealEscape(roomId: string): Promise<EscapeActionState> {
  if (!(await requestLimit("escape-reveal", 30, 60)).allowed) return { error: "Too many requests. Please try again later." };
  const token = (await cookies()).get(`escape_host_${roomId}`)?.value;
  if (!token) return { error: "Only the organiser can reveal early." };
  const outcome = await prisma.$transaction(async db => {
    const room = await db.escapeRoom.findUnique({ where: { id: roomId }, include: { _count: { select: { options: true } }, members: { include: { _count: { select: { votes: true } } } } } });
    if (!room || room.hostHash !== hash(token) || expired(room.createdAt)) return "This organiser link is no longer valid.";
    if (room.status === "revealed") return null;
    if (room._count.options < 2 || room.members.length < 2 || room.members.some(m => m._count.votes !== room._count.options)) return "At least two people must join, and everyone who joined must finish picking before a reveal.";
    await db.escapeRoom.update({ where: { id: roomId }, data: { status: "revealed" } });
    return null;
  });
  if (outcome) return { error: outcome };
  revalidatePath(`/escape/${roomId}`);
  return { success: true };
}
