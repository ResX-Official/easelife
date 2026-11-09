"use client";

import Link from "next/link";
import { useTransition } from "react";

export default function ErrorPage({ retry }: { retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="interior-page">
      <div className="shell empty-panel" role="alert">
        <h1 className="text-2xl font-medium text-blue-950">This page couldn&apos;t load.</h1>
        <p>Please try again in a moment.</p>
        <button disabled={pending} onClick={() => startTransition(() => retry())} className="button-primary disabled:opacity-60">{pending ? "Trying again..." : "Try again"}</button>
        <Link href="/my-listings" className="text-link">Go to my listings</Link>
      </div>
    </div>
  );
}
