export const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Studio",
  "Penthouse",
  "Duplex",
  "Bungalow",
  "Villa",
  "Beach house",
  "Private retreat",
  "Room / Self-contain",
  "Other",
] as const;

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;

export const PAYMENT_FREQUENCIES = ["daily", "monthly", "yearly", "per_stay"] as const;

export function formatPrice(price: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(price)} ${currency}`;
}

export function frequencyLabel(
  paymentFrequency: string,
  listingCategory?: string
) {
  if (listingCategory === "sale") return "";
  const periods: Record<string, string> = { daily: "/ day", monthly: "/ month", yearly: "/ year", per_stay: "/ stay" };
  return periods[paymentFrequency] ?? "";
}
