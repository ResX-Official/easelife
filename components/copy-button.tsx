"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 shadow-sm transition-colors hover:bg-blue-50"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
