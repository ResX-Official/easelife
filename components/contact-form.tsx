"use client";

import { useActionState } from "react";
import { sendMessage } from "@/lib/actions";

const inputClass =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none transition-shadow focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:py-2 sm:text-sm";
const labelClass = "text-sm font-medium text-zinc-800";

export function ContactForm({ listingId, context }: { listingId: string; context?: string }) {
  const action = sendMessage.bind(null, listingId);
  const [state, formAction, pending] = useActionState(action, {});

  if (state.success) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        Your message was sent. The property owner or agent will reach out to you directly.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="senderName">
            Your name
          </label>
          <input id="senderName" name="senderName" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="senderEmail">
            Email
          </label>
          <input
            id="senderEmail"
            name="senderEmail"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="senderPhone">
            Phone
          </label>
          <input
            id="senderPhone"
            name="senderPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="body">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          defaultValue={context}
          placeholder="I'm interested in this property..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Your details go straight to the owner or agent &mdash; no account needed.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-medium text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-fit sm:px-10 sm:text-base"
        >
          {pending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}
