"use client";

import { useActionState, useState } from "react";
import { PROPERTY_TYPES, CURRENCIES, PAYMENT_FREQUENCIES } from "@/lib/constants";
import {
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABELS,
  type ListingCategory,
} from "@/lib/listing-category";
import type { ActionState } from "@/lib/actions";
import { PhotoPicker } from "@/components/photo-picker";
import { MAX_UPLOAD_BYTES as MAX_TOTAL_BYTES } from "@/lib/upload-policy";
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

export function ListingForm({
  action,
  submitLabel,
  defaultValues = emptyValues,
  existingPhotos = [],
  photosRequired = true,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  defaultValues?: ListingFormValues;
  existingPhotos?: { id: string; url: string }[];
  photosRequired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [listingCategory, setListingCategory] = useState<ListingCategory>(defaultValues.listingCategory);
  const [paymentFrequency, setPaymentFrequency] = useState(defaultValues.paymentFrequency);
  const [propertyType, setPropertyType] = useState(defaultValues.propertyType);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (photosRequired && existingPhotos.length === 0 && photos.length === 0) {
      event.preventDefault();
      setPhotoError("Please add at least one photo of the property.");
      return;
    }
    if (photos.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      event.preventDefault();
      setPhotoError(
        "Those photos are too large to upload at once — remove a few."
      );
      return;
    }
    setPhotoError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col gap-7 sm:gap-8"
    >
      {(state.error || photoError) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error ?? photoError}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
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

      <fieldset className="flex flex-col gap-4">
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

      {listingCategory !== "sale" && <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-blue-950">Made for your guests</legend>
        <p className="text-sm text-slate-500">Daily and per-stay listings can appear in Escape Match. Monthly rates remain available in the catalogue.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">Maximum guests<input name="maxGuests" type="number" min="1" max="100" required defaultValue={defaultValues.maxGuests ?? 2} className="field-input" /></label>
          <label className="field-label">The vibe<select name="vibe" defaultValue={defaultValues.vibe ?? "calm"} className="field-input"><option value="calm">Quiet & calm</option><option value="pool">Poolside</option><option value="beach">Beach escape</option><option value="romantic">Romantic retreat</option><option value="celebration">Celebrate together</option></select></label>
        </div>
      </fieldset>}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-blue-950 sm:text-lg">
          Photos
        </legend>
        <PhotoPicker
          onChange={(files) => {
            setPhotos(files);
            setPhotoError(null);
          }}
          existingPhotos={existingPhotos}
          label={
            existingPhotos.length > 0 ? "Add more photos" : "Choose photos"
          }
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
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

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-blue-900 text-base font-medium text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-fit sm:px-8"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
