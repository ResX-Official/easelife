"use client";
import { useActionState, useState, type ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";
import { createEscape } from "@/app/escape/actions";
import { ESCAPE_VIBES } from "@/lib/escape";

export function EscapeCreateForm({ locations }: { locations: string[] }) {
  const [state, action, pending] = useActionState(createEscape, {});
  const [values, setValues] = useState({ name: "", title: "", location: "", vibe: "any", groupSize: "4", nights: "1", currency: "NGN", budget: "", startDate: "" });
  function update(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
  }
  return <form action={action} className="escape-create-form">
    <div className="mb-6"><p className="section-eyebrow">One link. Your people. Somewhere good.</p><h2>Let’s get out of the group chat.</h2><p className="mt-3 text-sm leading-7 text-slate-500">Set the scene. We’ll find up to six stays for everyone to pick from privately.</p></div>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Your first name<input required name="name" value={values.name} onChange={update} minLength={2} maxLength={30} placeholder="e.g. Ada" autoComplete="given-name" className="field-input" /></label><label className="field-label">Give your escape a name<input required name="title" value={values.title} onChange={update} minLength={3} maxLength={70} placeholder="e.g. The overdue weekend" className="field-input" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Where are we going?<select name="location" value={values.location} onChange={update} className="field-input"><option value="">Anywhere in our collection</option>{locations.map(l => <option key={l}>{l}</option>)}</select></label><label className="field-label">What’s the vibe?<select name="vibe" value={values.vibe} onChange={update} className="field-input">{ESCAPE_VIBES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select></label></div>
    <div className="grid grid-cols-2 gap-4"><label className="field-label">People, including you<input name="groupSize" value={values.groupSize} onChange={update} type="number" min="2" max="12" required className="field-input" /></label><label className="field-label">How many nights?<input name="nights" value={values.nights} onChange={update} type="number" min="1" max="14" required className="field-input" /></label></div>
    <div className="grid gap-4 sm:grid-cols-[1fr_2fr]"><label className="field-label">Currency<select name="currency" value={values.currency} onChange={update} className="field-input">{["NGN","USD","GBP","EUR"].map(c=><option key={c}>{c}</option>)}</select></label><label className="field-label">Stay budget per person (optional)<input name="budget" value={values.budget} onChange={update} type="number" min="1" placeholder="Leave open, or set a limit" className="field-input" /></label></div>
    <label className="field-label">Proposed start date (optional)<input type="date" name="startDate" value={values.startDate} onChange={update} min={new Date().toISOString().slice(0,10)} className="field-input" /></label>
    <p className="text-xs leading-6 text-slate-400">Estimates split the listed accommodation rate equally. Extras and transport aren’t included. Dates and availability need host confirmation.</p>
    <button disabled={pending} className="button-primary w-full">{pending ? "Finding your possibilities…" : "Create our escape"}<ArrowRight className="h-4 w-4" /></button>
    <p className="text-center text-[11px] text-slate-400">No account. No payment. Just possibilities.</p>
  </form>;
}
