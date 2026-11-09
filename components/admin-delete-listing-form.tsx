"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDeleteListingForm({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current || !window.confirm(`Delete “${title}” and its enquiries?`)) return;
    submitted.current = true;
    setPending(true);
    setError(null);
    let complete = false;
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) { setError(result?.error || "We couldn't delete this listing. Please try again."); return; }
      complete = true;
      setDeleted(true);
      try { router.refresh(); } catch { }
    } catch {
      setError("The connection was interrupted. Please try deleting again.");
    } finally {
      if (!complete) { submitted.current = false; setPending(false); }
    }
  }

  if (deleted) return <p role="status" className="text-sm text-slate-500">Deleted</p>;
  return (
    <form className="sm:self-start" onSubmit={handleSubmit}>
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="h-10 rounded-full border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">{pending ? "Deleting..." : "Delete"}</button>
    </form>
  );
}
