import { CURRENCIES, PAYMENT_FREQUENCIES, PROPERTY_TYPES } from "./constants.ts";
import { isListingCategory } from "./listing-category.ts";

export function getString(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function numberField(data: FormData, name: string) {
  const value = getString(data, name);
  return value ? Number(value) : NaN;
}

export function validateListingFields(data: FormData) {
  const fields = {
    title: getString(data, "title"),
    description: getString(data, "description"),
    price: numberField(data, "price"),
    currency: getString(data, "currency") || "USD",
    paymentFrequency: getString(data, "paymentFrequency") || "monthly",
    listingCategory: getString(data, "listingCategory") || "sale",
    maxGuests: getString(data, "maxGuests") ? numberField(data, "maxGuests") : 2,
    vibe: getString(data, "vibe") || "calm",
    propertyType: getString(data, "propertyType"),
    bedrooms: numberField(data, "bedrooms"),
    bathrooms: numberField(data, "bathrooms"),
    city: getString(data, "city"),
    state: getString(data, "state"),
    address: getString(data, "address"),
    landlordName: getString(data, "landlordName"),
    landlordEmail: getString(data, "landlordEmail"),
    landlordPhone: getString(data, "landlordPhone"),
  };
  const textLimits = { title: 150, description: 10000, city: 100, state: 100, address: 300, landlordName: 100 } as const;
  for (const [key, max] of Object.entries(textLimits)) {
    const value = fields[key as keyof typeof textLimits];
    if (!value || value.length > max) return { error: `${key} is required and must be ${max} characters or fewer.` };
  }
  if (!validEmail(fields.landlordEmail)) return { error: "Enter a valid email address (up to 254 characters)." };
  if (!validPhone(fields.landlordPhone)) return { error: "Enter a valid phone number (7–15 digits)." };
  if (!Number.isFinite(fields.price) || fields.price <= 0 || fields.price > 1e12) return { error: "Enter a price between 0 and 1 trillion." };
  if (!CURRENCIES.includes(fields.currency as typeof CURRENCIES[number])) return { error: "Select a valid currency." };
  if (!PROPERTY_TYPES.includes(fields.propertyType as typeof PROPERTY_TYPES[number])) return { error: "Select a valid property type." };
  if (!PAYMENT_FREQUENCIES.includes(fields.paymentFrequency as typeof PAYMENT_FREQUENCIES[number])) return { error: "Select a valid billing period." };
  if (!isListingCategory(fields.listingCategory)) return { error: "Select a valid listing category." };
  for (const value of [fields.bedrooms, fields.bathrooms]) {
    if (!Number.isInteger(value) || value < 0 || value > 100) return { error: "Bedrooms and bathrooms must be whole numbers between 0 and 100." };
  }
  if (!Number.isInteger(fields.maxGuests) || fields.maxGuests < 1 || fields.maxGuests > 100) return { error: "Guest capacity must be between 1 and 100." };
  if (!["calm", "pool", "beach", "romantic", "celebration"].includes(fields.vibe)) return { error: "Select a valid vibe." };
  return { fields };
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return value.length <= 40 && /^[+\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}

export function validateMessage(data: FormData) {
  const fields = {
    senderName: getString(data, "senderName"),
    senderEmail: getString(data, "senderEmail"),
    senderPhone: getString(data, "senderPhone"),
    body: getString(data, "body"),
  };
  if (!fields.senderName || fields.senderName.length > 100 || !fields.body || fields.body.length > 5000) return { error: "Add your name (up to 100 characters) and a message (up to 5,000 characters)." };
  if (!validEmail(fields.senderEmail)) return { error: "Enter a valid email address." };
  if (!validPhone(fields.senderPhone)) return { error: "Enter a valid phone number (7–15 digits)." };
  return { fields };
}
