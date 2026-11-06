"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Heart, Minus, Sparkles, Users, X } from "lucide-react";
import { joinEscape, voteEscape, revealEscape } from "@/app/escape/actions";
import { ShareLink } from "@/components/share-link";
import { estimatedPerPerson } from "@/lib/escape";
import { formatPrice, frequencyLabel } from "@/lib/constants";

type Option = { id: string; listing: { id: string; title: string; price: number; currency: string; paymentFrequency: string; city: string; state: string; maxGuests: number; bedrooms: number; vibe: string; isDemo: boolean; photo: string | null } };
type Result = { id: string; yes: number; maybe: number; unanimous: boolean };
export type EscapeRoomView = {
  id: string; title: string; location: string; groupSize: number; nights: number; startDate: string | null; status: string;
  isHost: boolean; memberId: string | null; memberName: string | null;
  members: { id: string; name: string; complete: boolean }[];
  options: Option[]; ownVotes: { optionId: string; value: number }[]; results: Result[];
};

function JoinForm({ roomId }: { roomId: string }) {
  const [state, action, pending] = useActionState(joinEscape.bind(null,roomId),{});
  const [name,setName] = useState("");
  return <form action={action} className="escape-join-form"><label className="field-label">What should we call you?<input name="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={30} autoComplete="given-name" placeholder="Your first name" className="field-input" /></label>{state.error && <p className="form-error" role="alert">{state.error}</p>}<button disabled={pending} className="button-primary w-full">{pending ? "Joining your people…" : "I’m in. Let’s find our escape."}<ArrowUpRight className="h-4 w-4" /></button><p className="text-center text-xs leading-6 text-slate-400">Your picks stay private until the group reveal.</p></form>;
}

export function EscapeRoom({ room }: { room: EscapeRoomView }) {
  const router = useRouter();
  const [pending,startTransition] = useTransition();
  const [error,setError] = useState("");
  const [reviewId,setReviewId] = useState<string | null>(null);
  const votedIds = new Set(room.ownVotes.map(v=>v.optionId));
  const active = room.options.find(o=>o.id===reviewId) ?? room.options.find(o=>!votedIds.has(o.id));
  const completeCount = room.members.filter(m=>m.complete).length;
  const revealed = room.status === "revealed";
  const unavailable = room.options.length < 2;
  const canReveal = room.isHost && room.members.length >= 2 && completeCount === room.members.length && !revealed && !unavailable;
  const memberName = room.memberName ?? "Your group";
  useEffect(()=> {
    if (revealed || unavailable) return;
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh,8000);
    document.addEventListener("visibilitychange",refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange",refresh); };
  },[router,revealed,unavailable]);
  function vote(optionId: string,value: number) {
    setError("");
    startTransition(async()=> {
      try { const result = await voteEscape(room.id,optionId,value); if(result.error) setError(result.error); else { setReviewId(null); router.refresh(); } }
      catch { setError("Your pick wasn’t saved. Check your connection and try again."); }
    });
  }
  function reveal() {
    if (!window.confirm(`Reveal picks from ${room.members.length} people now? Voting will close, and no one else can join this room.`)) return;
    setError("");
    startTransition(async()=> { try { const result = await revealEscape(room.id); if (result.error) setError(result.error); else router.refresh(); } catch { setError("We couldn’t reveal just yet. Try again."); } });
  }
  const leaderResult = room.results[0];
  const leader = leaderResult && room.options.find(o=>o.id===leaderResult.id);
  const costGroupSize = revealed ? room.members.length : room.groupSize;
  return <div className="escape-room-page"><div className="shell"><Link href="/escape" className="text-link mb-5"><ArrowLeft className="h-4 w-4" />Escape Match</Link><div className="escape-room-heading"><div><p className="section-eyebrow">{revealed ? "The group chat has spoken" : "Good company. One shared plan."}</p><h1>{room.title}</h1><p>{room.location || "Somewhere in our collection"} <span>·</span> {room.nights} {room.nights===1 ? "night" : "nights"} <span>·</span> {room.startDate ? `Proposed: ${new Date(`${room.startDate}T12:00:00Z`).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}` : "Dates flexible"}</p></div><span className="escape-status"><span />{revealed ? "Picks revealed" : "Picking in private"}</span></div>
    <div className="escape-room-layout"><main className="min-w-0">
      {error && <p role="alert" className="form-error mb-5">{error}</p>}
      {unavailable ? <div className="empty-panel"><h2>Some of these stays have moved on.</h2><p>There are fewer than two options left. Start a fresh escape to compare current stays.</p><Link href="/escape" className="button-primary">Start a fresh escape</Link></div> : revealed ? <>
        <div className="reveal-heading"><Sparkles className="h-6 w-6 text-blue-800" /><h2>{leaderResult?.unanimous ? "Everyone’s saying “I’m in.”" : leader ? "Your closest match is here." : "No shared favourite this time."}</h2><p>{leaderResult?.unanimous ? `All ${room.members.length} participants picked the same place.` : leader ? `The highest-scoring choice from ${room.members.length} participants. No unanimous “I’m in” match this time.` : "All the stays were skipped. Try another vibe, a different location, or a fresh set of options."}</p>{room.members.length < room.groupSize && <p className="!text-amber-700">Revealed early with {room.members.length} of {room.groupSize} planned participants. Cost estimates now use {room.members.length} people.</p>}</div>
        {leader ? <article className="escape-winner"><div className="escape-winner-photo">{leader.listing.photo && <Image src={leader.listing.photo} alt={leader.listing.title} fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />}<span className="escape-winner-badge"><Heart className="h-3.5 w-3.5" />{leaderResult.unanimous ? "It’s a match" : "Closest match"}</span></div><div className="p-6 sm:p-8"><p className="section-eyebrow">{leader.listing.isDemo ? "Demo escape · Not bookable" : leader.listing.city}</p><h3 className="mt-2 text-3xl font-medium tracking-tight text-blue-950">{leader.listing.title}</h3><p className="mt-3 text-sm text-slate-500">{leaderResult.yes} I’m in · {leaderResult.maybe} maybe · {room.members.length-leaderResult.yes-leaderResult.maybe} skip</p><div className="mt-6 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs text-slate-400">Estimated accommodation / person</p><p className="mt-1 text-2xl font-medium tracking-tight text-blue-950">{formatPrice(estimatedPerPerson(leader.listing.price,leader.listing.paymentFrequency,room.nights,costGroupSize),leader.listing.currency)}</p></div><Link href={`/listings/${leader.listing.id}?escape=${room.id}`} className="button-primary">{leader.listing.isDemo ? "Explore demo stay" : "View stay & enquire"}<ArrowUpRight className="h-4 w-4" /></Link></div><p className="mt-5 text-xs leading-6 text-slate-400">{leader.listing.isDemo ? "A fictional example for trying Escape Match. No booking or availability is offered." : "A match is a preference, not a reservation. Confirm dates, capacity, extra fees, and availability with the host."}</p></div></article> : <Link href="/escape" className="button-primary">Try a fresh escape <ArrowUpRight className="h-4 w-4" /></Link>}
        {room.results.length>1 && <section className="mt-8"><h3 className="mb-4 text-lg font-medium text-blue-950">Also on your wavelength</h3><div className="grid gap-3">{room.results.slice(1).map(result=>{ const option = room.options.find(o=>o.id===result.id); if(!option) return null; return <Link key={result.id} href={`/listings/${option.listing.id}?escape=${room.id}`} className="escape-runner-up">{option.listing.photo && <Image src={option.listing.photo} alt="" width={80} height={64} className="rounded-lg object-cover" />}<div><p className="text-sm font-medium text-blue-950">{option.listing.title}{option.listing.isDemo ? " · Demo" : ""}</p><p className="mt-1 text-xs text-slate-500">{result.yes} I’m in · {result.maybe} maybe</p></div><ArrowUpRight className="ml-auto h-4 w-4 text-blue-800" /></Link>;})}</div></section>}
      </> : !room.memberId ? <section className="escape-invitation"><div className="escape-invite-icon"><Users className="h-6 w-6" /></div><p className="section-eyebrow mt-6">You’re invited</p><h2>Somewhere good.<br /><span>With your people.</span></h2><p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-500">{room.members[0]?.name ?? "Your organiser"} is finding the group’s next escape. Make your picks and see where you agree.</p>{room.members.length < room.groupSize ? <JoinForm roomId={room.id} /> : <p className="demo-notice">This group is full. If you already joined, open this invitation in the same browser you used before.</p>}</section> : active ? <>
        <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-slate-500">Hey {memberName}. Could this be the one?</p><span className="text-xs text-slate-400">{room.ownVotes.length} / {room.options.length} picked</span></div><div className="vote-progress"><span style={{width:`${room.ownVotes.length/room.options.length*100}%`}} /></div>
        <article className="escape-vote-card"><div className="escape-vote-photo">{active.listing.photo && <Image src={active.listing.photo} alt={active.listing.title} fill preload sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />}<span className="escape-property-badge">{active.listing.isDemo ? "Demo stay" : "A possible escape"}</span></div><div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="section-eyebrow">{active.listing.city} · Up to {active.listing.maxGuests} guests</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-blue-950 sm:text-3xl">{active.listing.title}</h2></div><Link href={`/listings/${active.listing.id}?escape=${room.id}`} target="_blank" className="escape-details-link" aria-label={`View ${active.listing.title} in a new tab`}><ArrowUpRight className="h-5 w-5" /></Link></div><div className="escape-vote-price"><div><p>Estimated accommodation / person</p><strong>{formatPrice(estimatedPerPerson(active.listing.price,active.listing.paymentFrequency,room.nights,room.groupSize),active.listing.currency)}</strong></div><span>{formatPrice(active.listing.price,active.listing.currency)}{frequencyLabel(active.listing.paymentFrequency,"staycation")}</span></div><div className="escape-vote-buttons"><button disabled={pending} onClick={()=>vote(active.id,0)}><X className="h-5 w-5" />Skip</button><button disabled={pending} onClick={()=>vote(active.id,1)}><Minus className="h-5 w-5" />Maybe</button><button disabled={pending} onClick={()=>vote(active.id,2)}><Heart className="h-5 w-5" />I’m in</button></div><p aria-live="polite" className="mt-4 min-h-5 text-center text-xs text-slate-400">{pending ? "Saving your pick…" : "Only you can see your choices before the reveal."}</p></div></article>
      </> : <div className="escape-waiting"><span><Check className="h-7 w-7" /></span><p className="section-eyebrow mt-6">Your picks are in</p><h2>Now for the group<br /><em>to find its wavelength.</em></h2><p>{completeCount} of {room.groupSize} people have finished. Your page updates automatically. Share the invitation with anyone still missing.</p><div className="mt-8 flex flex-wrap justify-center gap-2">{room.options.map(o=><button key={o.id} onClick={()=>setReviewId(o.id)} className="button-secondary !text-xs">Edit: {o.listing.title}</button>)}</div></div>}
    </main><aside className="escape-group-panel"><section className="surface-panel"><p className="section-eyebrow">The good company</p><div className="mt-3 flex items-baseline justify-between"><h2 className="text-xl font-medium tracking-tight text-blue-950">Your people</h2><p className="text-xs text-slate-400">{room.members.length} / {room.groupSize} joined</p></div><ul className="escape-members">{room.members.map((m,i)=><li key={m.id}><span className={`member-avatar member-avatar-${i%3}`}>{m.name.slice(0,1).toUpperCase()}</span><div><p>{m.name}{m.id===room.memberId ? " (you)" : ""}</p><small>{m.complete ? "Picks are in" : revealed ? "Voting closed" : "Finding their favourites"}</small></div>{m.complete && <Check className="ml-auto h-4 w-4 text-blue-800" />}</li>)}</ul>{!revealed && <p className="mt-4 text-xs leading-6 text-slate-400">Everyone’s votes stay private until the reveal. Results open automatically when all {room.groupSize} people finish.</p>}</section>
    <section className="surface-panel"><p className="section-eyebrow mb-4">{revealed ? "The group chat has spoken" : "An escape starts with an invitation"}</p><ShareLink path={`/escape/${room.id}`} title={revealed ? `The group chat has spoken: ${room.title} · See our Escape Match` : `You’re invited: ${room.title} · Let’s find our escape on Easelife`} />{room.isHost && !revealed && <div className="mt-3 border-t border-slate-100 pt-5"><p className="text-xs leading-6 text-slate-500">Organiser controls are saved in this browser. Want to go with a smaller group? Once at least two people join and everyone who joined finishes, you can reveal early.</p><button onClick={reveal} disabled={!canReveal || pending} className="button-secondary mt-4 w-full">Reveal with the current group</button></div>}</section><p className="px-1 text-xs leading-6 text-slate-400">Accommodation estimates exclude transport, meals, and extra fees. Invitation links expire after 30 days. Keep the link within your group.</p>{revealed && <Link href="/escape" className="button-secondary w-full">Start your own escape <Sparkles className="h-4 w-4" /></Link>}</aside></div>
  </div></div>;
}
