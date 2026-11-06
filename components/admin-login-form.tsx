"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/actions";

const fieldClass = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
        Username
        <input name="username" autoComplete="username" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
      </label>
      <button disabled={pending} className="mt-2 h-12 rounded-full bg-blue-900 px-6 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
