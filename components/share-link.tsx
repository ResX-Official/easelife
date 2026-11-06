"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function ShareLink({ path, title, privateLink = false }: { path: string; title: string; privateLink?: boolean }) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const url = origin ? new URL(path, origin).href : path;
  const [notice, setNotice] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(url); setNotice("Link copied"); }
    catch { setNotice("Select and copy the link below"); }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title, text: title, url }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copy(); }
  }
  return <div><div className="flex flex-wrap gap-2"><button type="button" onClick={copy} className="button-secondary">{notice === "Link copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Copy link</button>{!privateLink && <><button type="button" onClick={share} className="button-primary"><Share2 className="h-4 w-4" />Invite your people</button><a className="button-secondary" href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a></>}</div><input readOnly aria-label={privateLink ? "Private management link" : "Invitation link"} value={url} onFocus={e => e.target.select()} className="mt-3 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500" /><p aria-live="polite" className="mt-2 min-h-4 text-xs text-blue-800">{notice}</p></div>;
}
