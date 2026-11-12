"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { PROPERTY_TYPES, CURRENCIES, PAYMENT_FREQUENCIES } from "@/lib/constants";
import {
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABELS,
  type ListingCategory,
} from "@/lib/listing-category";
import type { ActionState } from "@/lib/actions";
import { PhotoPicker } from "@/components/photo-picker";
import { createPhotoUploadQueue, PhotoUploadError } from "@/lib/upload-queue";
import type { PhotoTicket } from "@/lib/photo-tickets";
import { MAX_PHOTO_BYTES } from "@/lib/upload-policy";
import { CustomDropdown } from "@/components/custom-dropdown";

type ListingFormValues = {
  title: string;
  description: string;
  price: number | string;
  currency: string;
  paymentFrequency: string;
  listingCategory: ListingCategory;
  propertyType: string;
  bedrooms: number | string;
  bathrooms: number | string;
  city: string;
  state: string;
  address: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  maxGuests?: number;
  vibe?: string;
};

const emptyValues: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  currency: "NGN",
  paymentFrequency: "monthly",
  listingCategory: "rent",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  city: "",
  state: "",
  address: "",
  landlordName: "",
  landlordEmail: "",
  landlordPhone: "",
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none transition-shadow focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:py-2 sm:text-sm";
const labelClass = "text-sm font-medium text-zinc-800";

function ListingFormFields({
  action,
  submitLabel,
  defaultValues = emptyValues,
  existingPhotos = [],
  photosRequired = true,
  onPublished,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onPublished?: () => void;
  submitLabel: string;
  defaultValues?: ListingFormValues;
  existingPhotos?: { id: string; url: string }[];
  photosRequired?: boolean;
}) {
  const [state, setState] = useState<ActionState>({});
  const [pending, setPending] = useState(false);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const submitted = useRef(false);
  const [uploadProgress, setUploadProgress] = useState({ complete: 0, total: 0 });
  const selectionVersion = useRef(0);
  const [uploads] = useState(() => createPhotoUploadQueue(async photo => {
    const body = new FormData();
    body.set("photo", photo);
    let response: Response;
    try { response = await fetch("/api/photos", { method: "POST", body }); }
    catch { throw new PhotoUploadError("The connection was interrupted. Wait a few seconds, then click publish to retry.", 10); }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ticket) {
      const retryAfter = response.status === 429 || response.status >= 500 ? Math.min(3600, Math.max(1, Number(response.headers.get("Retry-After")) || 15)) : 0;
      throw new PhotoUploadError(result?.error || (response.status === 413 ? "This photo is too large. Please choose a smaller copy." : "A photo could not be uploaded. Wait a few seconds, then try again."), retryAfter);
    }
    return result.ticket as PhotoTicket;
  }));
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [listingCategory, setListingCategory] = useState<ListingCategory>(defaultValues.listingCategory);
  const [paymentFrequency, setPaymentFrequency] = useState(defaultValues.paymentFrequency);
  const [propertyType, setPropertyType] = useState(defaultValues.propertyType);

  function selectPhotos(files: File[]) {
    setPhotos(files);
    setPhotoError(null);
    const version = ++selectionVersion.current;
    setUploadProgress({ complete: 0, total: files.length });
    let complete = 0;
    for (const file of files) {
      if (file.size > MAX_PHOTO_BYTES) continue;
      void uploads.get(file).then(() => {
        complete++;
        if (selectionVersion.current === version) setUploadProgress({ complete, total: files.length });
      }).catch((error: unknown) => {
        if (selectionVersion.current === version) setPhotoError(error instanceof Error ? error.message : "Some photos couldn't upload yet. Click publish to retry; your details are safe.");
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current || preparingPhotos) return;
    if (photosRequired && existingPhotos.length === 0 && photos.length === 0) {
      setPhotoError("Please add at least one photo of the property.");
      return;
    }
    if (photos.some(photo => photo.size > MAX_PHOTO_BYTES)) {
      setPhotoError("Each photo must be 3 MB or smaller. Please choose a smaller copy of the large photo.");
      return;
    }
    const data = new FormData(event.currentTarget);
    data.delete("photos");
    submitted.current = true;
    setPending(true);
    setState({});
    setPhotoError(null);
    setProgress("Preparing your listing...");
    let navigating = false;
    try {
      let complete = 0;
      const tickets = await Promise.all(photos.map(async photo => {
        const ticket = await uploads.get(photo);
        complete++;
        setUploadProgress({ complete, total: photos.length });
        setProgress(`Uploading photos ${complete} of ${photos.length}...`);
        return ticket;
      }));
      data.set("photoTickets", JSON.stringify(tickets));
      setProgress("Saving listing...");
      let result: ActionState | null;
      if (photosRequired) {
        const response = await fetch("/api/listings", { method: "POST", body: data });
        result = await response.json().catch(() => null) as ActionState | null;
      } else {
        result = await new Promise<ActionState>((resolve, reject) => {
          startTransition(async () => {
            try { resolve(await action({}, data)); } catch (error) { reject(error); }
          });
        });
      }
      if (!result) throw new Error("The listing couldn't be saved. Your details are still here. Please try again.");
      if (result?.redirectTo) {
        onPublished?.();
        navigating = true;
        setProgress("Opening your listing...");
        window.location.assign(result.redirectTo);
        return;
      }
      if (result) setState(result);
    } catch (error) {
      setState({ error: error instanceof Error && !error.message.startsWith("An error occurred in the Server Components") ? error.message : "The listing couldn't be saved. Your details are still here. Please try again." });
    } finally {
      if (!navigating) {
        submitted.current = false;
        setPending(false);
        setProgress(null);
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-7 sm:gap-8"
    >
      {(state.error || photoError) && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error ?? photoError}
        </p>
      )}

      <fieldset disabled={pending} className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-blue-950 sm:text-lg">
          {listingCategory === "staycation"
            ? "Staycation details"
            : listingCategory === "sale"
              ? "Home for sale details"
              : "Luxury apartment details"}
        </legend>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="listingCategory">
            Listing type
          </label>
          <CustomDropdown
            name="listingCategory"
            required
            value={listingCategory}
            onChange={(value) => { setListingCategory(value as ListingCategory); setPaymentFrequency(value === "staycation" ? "daily" : "monthly"); setPropertyType(""); }}
            options={LISTING_CATEGORIES.map((category) => ({
              value: category,
              label: LISTING_CATEGORY_LABELS[category],
            }))}
            className={`${inputClass} flex items-center justify-between text-left`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="title">
            {listingCategory === "staycation"
              ? "Staycation name"
              : listingCategory === "sale"
                ? "Property title"
                : "Title"}
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={defaultValues.title}
            placeholder={
              listingCategory === "staycation"
                ? "e.g. Beachfront villa in Zanzibar"
                : listingCategory === "sale"
                  ? "e.g. 4-bedroom detached home in Lekki Phase 1"
                  : "e.g. Cozy 2-bedroom flat in Lekki"
            }
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="description">
            {listingCategory === "staycation"
              ? "Describe the experience"
              : listingCategory === "sale"
                ? "Describe the home"
                : "Description"}
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            defaultValue={defaultValues.description}
            placeholder={
              listingCategory === "staycation"
                ? "Share what guests can enjoy, amenities, nearby attractions, and what makes this stay special."
                : listingCategory === "sale"
                  ? "Describe the home, its features, condition, title or documentation, and the neighborhood."
                  : "Describe the property, amenities, and neighborhood."
            }
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="price">
              {listingCategory === "staycation"
                ? "Accommodation rate"
                : listingCategory === "sale"
                  ? "Asking price"
                  : "Price"}
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="any"
              required
              defaultValue={defaultValues.price}
              className={inputClass}
            />
          </div>
          {listingCategory !== "sale" && <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="paymentFrequency">
              {listingCategory === "staycation" ? "Rate applies" : "Billing period"}
            </label>
            <CustomDropdown
              name="paymentFrequency"
              value={paymentFrequency}
              onChange={setPaymentFrequency}
              className={`${inputClass} flex items-center justify-between text-left`}
              options={PAYMENT_FREQUENCIES.filter(freq => listingCategory !== "staycation" || freq !== "yearly").map(freq => ({
                value: freq,
                label: ({ daily: "Per day", monthly: "Per month", yearly: "Per year", per_stay: "Per stay" })[freq],
              }))}
            />
          </div>}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="currency">
              Currency
            </label>
            <CustomDropdown
              name="currency"
              defaultValue={defaultValues.currency}
              className={`${inputClass} flex items-center justify-between text-left`}
              options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="bedrooms">
              Bedrooms
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={defaultValues.bedrooms}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="bathrooms">
              Bathrooms
            </label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={defaultValues.bathrooms}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="propertyType">
            {listingCategory === "staycation"
              ? "Stay type"
              : listingCategory === "sale"
                ? "Home type"
                : "Property type"}
          </label>
          <CustomDropdown
            name="propertyType"
            required
            value={propertyType}
            onChange={setPropertyType}
            placeholder={listingCategory === "staycation" ? "Select a stay type" : listingCategory === "sale" ? "Select a home type" : "Select a type"}
            className={`${inputClass} flex items-center justify-between text-left`}
            options={(listingCategory === "staycation"
              ? ["Apartment", "Studio", "Penthouse", "Resort", "Villa", "Hotel", "Cabin", "Beach house", "Private retreat", "Other"]
              : listingCategory === "rent" ? Array.from(new Set(["Apartment", "Studio", "Penthouse", defaultValues.propertyType].filter(Boolean))) : PROPERTY_TYPES
            ).map((type) => ({ value: type, label: type }))}
          />
        </div>
      </fieldset>

      <fieldset disabled={pending} className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-blue-950 sm:text-lg">
          {listingCategory === "staycation"
            ? "Destination"
            : listingCategory === "sale"
              ? "Property location"
              : "Apartment location"}
        </legend>
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="city">
              {listingCategory === "staycation"
                ? "City / destination"
                : "City"}
            </label>
            <input
              id="city"
              name="city"
              required
              defaultValue={defaultValues.city}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="state">
              {listingCategory === "staycation"
                ? "Region / country"
                : "State"}
            </label>
            <input
              id="state"
              name="state"
              required
              defaultValue={defaultValues.state}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="address">
            {listingCategory === "staycation"
              ? "Address or area"
              : listingCategory === "sale"
                ? "Street address or estate"
                : "Street address"}
          </label>
          <input
            id="address"
            name="address"
            required
            defaultValue={defaultValues.address}
            className={inputClass}
          />
        </div>
      </fieldset>

      {listingCategory !== "sale" && <fieldset disabled={pending} className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-blue-950">Made for your guests</legend>
        <p className="text-sm text-slate-500">Daily and per-stay listings can appear in Escape Match. Monthly rates remain available in the catalogue.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">Maximum guests<input name="maxGuests" type="number" min="1" max="100" required defaultValue={defaultValues.maxGuests ?? 2} className="field-input" /></label>
          <label className="field-label">The vibe<select name="vibe" defaultValue={defaultValues.vibe ?? "calm"} className="field-input"><option value="calm">Quiet & calm</option><option value="pool">Poolside</option><option value="beach">Beach escape</option><option value="romantic">Romantic retreat</option><option value="celebration">Celebrate together</option></select></label>
        </div>
      </fieldset>}

      <fieldset disabled={pending} className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-blue-950 sm:text-lg">
          Photos
        </legend>
        <PhotoPicker
          onChange={selectPhotos}
          existingPhotos={existingPhotos}
          disabled={pending || preparingPhotos}
          onBusyChange={setPreparingPhotos}
          label={
            existingPhotos.length > 0 ? "Add more photos" : "Choose photos"
          }
        />
        {uploadProgress.total > 0 && <p role="status" className="text-sm text-slate-500">{uploadProgress.complete === uploadProgress.total ? "Photos ready" : `Uploading photos ${uploadProgress.complete} of ${uploadProgress.total}...`}</p>}
      </fieldset>

      <fieldset disabled={pending} className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-blue-950 sm:text-lg">
          Your contact details
        </legend>
        <p className="-mt-2 text-sm text-zinc-500">
          {listingCategory === "staycation"
            ? "Shown to guests so they can ask about availability and their stay."
            : listingCategory === "sale"
              ? "Shown to prospective buyers so they can ask about the property."
              : "Shown to guests and tenants so they can ask about daily or monthly stays."}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="landlordName">
              Your name
            </label>
            <input
              id="landlordName"
              name="landlordName"
              required
              defaultValue={defaultValues.landlordName}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="landlordEmail">
              Email
            </label>
            <input
              id="landlordEmail"
              name="landlordEmail"
              type="email"
              required
              defaultValue={defaultValues.landlordEmail}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="landlordPhone">
              Phone
            </label>
            <input
              id="landlordPhone"
              name="landlordPhone"
              type="tel"
              required
              defaultValue={defaultValues.landlordPhone}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {state.success && <p role="status" className="text-sm text-green-700">Your changes have been saved.</p>}
      <button
        type="submit"
        disabled={pending || preparingPhotos}
        className="flex h-12 w-full items-center justify-center rounded-full bg-blue-900 text-base font-medium text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-fit sm:px-8"
      >
        {pending ? progress || "Saving..." : preparingPhotos ? "Preparing photos..." : submitLabel}
      </button>
    </form>
  );
}

const draftKey = "easelife:listing-draft:v1";
const draftFields = [...Object.keys(emptyValues), "maxGuests", "vibe"];

type FormProps = Parameters<typeof ListingFormFields>[0];

export function ListingForm(props: FormProps) {
  const root = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ListingFormValues | null>(null);
  const [values, setValues] = useState<ListingFormValues | undefined>(props.defaultValues);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const enabled = props.photosRequired !== false;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const published = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    Promise.resolve().then(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          const clean = Object.fromEntries(draftFields.filter(key => typeof saved[key] === "string" && saved[key].length <= 20000).map(key => [key, saved[key]]));
          if (["rent", "sale", "staycation"].includes(clean.listingCategory)) {
            setDraft({ ...emptyValues, ...clean } as ListingFormValues);
            return;
          }
        }
        setReady(true);
      } catch {
        setReady(true);
        setNotice("Draft saving is unavailable in this browser. Keep this page open until you publish.");
      }
    });
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [enabled]);

  function saveDraft() {
    if (!enabled || !ready || published.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const form = root.current?.querySelector("form");
      if (!form || form.querySelector("fieldset:disabled")) return;
      const data = new FormData(form);
      const saved = Object.fromEntries(draftFields.map(key => [key, data.get(key)]).filter(([, value]) => typeof value === "string"));
      if (!Object.entries(saved).some(([key, value]) => !["listingCategory", "currency", "paymentFrequency"].includes(key) && value)) return;
      try {
        localStorage.setItem(draftKey, JSON.stringify(saved));
        setNotice("Draft saved in this browser. Add your photos again if you leave this page.");
      } catch {
        setNotice("Your draft couldn't be saved. Keep this page open until you publish.");
      }
    }, 0);
  }

  function clearDraft() {
    if (timer.current) clearTimeout(timer.current);
    try { localStorage.removeItem(draftKey); } catch {}
    setDraft(null);
    setNotice("");
  }

  return <div ref={root} onInput={saveDraft} onClick={saveDraft}>
    {enabled && draft && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm text-blue-950">You have a saved draft. Would you like to carry on? You’ll need to add your photos again.</p>
      <div className="mt-3 flex gap-3">
        <button type="button" className="button-primary" onClick={() => { setValues(draft); setRevision(value => value + 1); setDraft(null); setReady(true); setNotice("Draft restored. Add your photos when you're ready."); }}>Resume draft</button>
        <button type="button" className="button-secondary" onClick={() => { clearDraft(); setReady(true); }}>Discard draft</button>
      </div>
    </div>}
    {enabled && <p role="status" className="mb-5 text-sm text-slate-500">{notice || "Your details are saved in this browser as you fill them in."}</p>}
    <div inert={enabled && (!ready || !!draft)} className={enabled && draft ? "opacity-50" : undefined}>
      <ListingFormFields key={revision} {...props} defaultValues={values} onPublished={() => { published.current = true; clearDraft(); props.onPublished?.(); }} />
    </div>
  </div>;
}
