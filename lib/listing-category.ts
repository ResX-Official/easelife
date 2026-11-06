export const LISTING_CATEGORIES = ["rent", "sale", "staycation"] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_CATEGORY_LABELS: Record<ListingCategory, string> = {
  rent: "Luxury apartments",
  sale: "Homes for sale",
  staycation: "Staycations",
};

export const LISTING_CATEGORY_DESCRIPTIONS: Record<ListingCategory, string> = {
  rent: "Luxury apartments for daily stays and monthly living",
  sale: "Properties listed with a purchase price",
  staycation: "Short stays, retreats, and travel destinations",
};

export const LISTING_CATEGORY_PAGE_TITLES: Record<ListingCategory, string> = {
  rent: "Luxury apartments",
  sale: "Homes for sale",
  staycation: "Staycation escapes",
};
export function resolveListingCategory(params: {
  type?: string;
  category?: string;
}): ListingCategory {
  if (params.type === "sale" || params.category === "sale") return "sale";
  if (params.category === "staycation") return "staycation";
  if (params.category === "rent") return "rent";
  return "staycation";
}

export function isListingCategory(value: string): value is ListingCategory {
  return (LISTING_CATEGORIES as readonly string[]).includes(value);
}
export function categoryQueryForForm(category: ListingCategory): {
  type?: string;
  category?: string;
} {
  if (category === "sale") return { type: "sale" };
  if (category === "staycation") return { category: "staycation" };
  return {};
}
