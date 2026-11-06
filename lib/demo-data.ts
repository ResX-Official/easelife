import type { PrismaClient } from "@prisma/client";

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80&auto=format&fit=crop`;
const photos = {
  villa: "1512917774080-9991f1c4c750", pool: "1613977257363-707ba9348227",
  house: "1600596542815-ffad4c1539a9", living: "1600210492486-724fe5c67fb0",
  terrace: "1600585154340-be6161a56a0c", interior: "1600607687939-ce8a6c25118c",
  retreat: "1449158743715-0a90ebb6d2d8", modern: "1600047509807-ba8f99d2cdde",
};
const stays = [
  { slug: "skyline-apartment", title: "The Skyline Apartment", city: "Lagos", state: "Lagos", price: 150000, maxGuests: 4, bedrooms: 2, vibe: "calm", propertyType: "Apartment", image: photos.interior, description: "An imagined luxury apartment with a bright living room, a private balcony, and two comfortable bedrooms. An illustrative daily short stay, with no real booking availability." },
  { slug: "palm-house", title: "The Palm House", city: "Lagos", state: "Lagos", price: 180000, maxGuests: 6, bedrooms: 3, vibe: "pool", propertyType: "Villa", image: photos.pool, description: "Long afternoons by the pool, open-plan living, and a shaded terrace made for catching up with your favourite people. An imagined private villa for an easy weekend away." },
  { slug: "salt-and-sun", title: "Salt & Sun Beach House", city: "Lagos", state: "Lagos", price: 240000, maxGuests: 8, bedrooms: 4, vibe: "beach", propertyType: "Beach house", image: photos.villa, description: "A bright coastal-style hideaway with generous shared spaces, an outdoor dining area, and room for the whole group. This fictional stay is designed for unhurried weekends." },
  { slug: "the-slow-house", title: "The Slow House", city: "Lagos", state: "Lagos", price: 120000, maxGuests: 4, bedrooms: 2, vibe: "calm", propertyType: "Private retreat", image: photos.living, description: "Soft morning light, calm interiors, and a cosy place to switch off. A fictional two-bedroom retreat for good books, slow breakfasts, and conversations that run late." },
  { slug: "weekend-club", title: "The Weekend Club", city: "Lagos", state: "Lagos", price: 300000, maxGuests: 10, bedrooms: 5, vibe: "celebration", propertyType: "Villa", image: photos.house, description: "Space to gather, an inviting terrace, and a large shared dining room. An imagined group-friendly villa for birthdays and reunions. Any event rules would need host confirmation on a real listing." },
  { slug: "canopy-retreat", title: "Canopy Garden Retreat", city: "Abuja", state: "FCT", price: 160000, maxGuests: 6, bedrooms: 3, vibe: "calm", propertyType: "Private retreat", image: photos.terrace, description: "A peaceful garden setting, warm interiors, and space for a few days away from the usual routine. An illustrative retreat for small groups and quiet catch-ups." },
  { slug: "blue-hour", title: "Blue Hour Pool Villa", city: "Abuja", state: "FCT", price: 210000, maxGuests: 8, bedrooms: 4, vibe: "pool", propertyType: "Villa", image: photos.modern, description: "An imagined modern villa built around easy afternoons, poolside lounging, and long dinners with friends. Generous bedrooms and shared living spaces complete the picture." },
  { slug: "hideaway-for-two", title: "A Hideaway for Two", city: "Lagos", state: "Lagos", price: 95000, maxGuests: 2, bedrooms: 1, vibe: "romantic", propertyType: "Private retreat", image: photos.interior, description: "An intimate imagined escape with thoughtful interiors and a private-feeling terrace. Made for a quiet weekend, a little celebration, or simply time together." },
  { slug: "shoreline-weekend", title: "Shoreline Weekend Villa", city: "Lagos", state: "Lagos", price: 200000, maxGuests: 6, bedrooms: 3, vibe: "beach", propertyType: "Beach house", image: photos.terrace, description: "An airy, coastal-inspired place for shared breakfasts and relaxed evenings. This fictional escape gives your group another setting to explore in Escape Match." },
];
const homes = [
  { slug: "ikoyi-skyline-penthouse", title: "Ikoyi Skyline Penthouse", city: "Ikoyi", state: "Lagos", price: 390000000, bedrooms: 3, propertyType: "Penthouse", image: photos.living, description: "A fictional penthouse for sale with generous interiors, a private terrace, and room to make it your own. Illustrative pricing and stock photos; not a real sales opportunity." },
  { slug: "cedar-residence", title: "The Cedar Residence", city: "Lekki", state: "Lagos", price: 285000000, bedrooms: 4, propertyType: "Duplex", image: photos.house, description: "An illustrative four-bedroom family home with contemporary architecture, generous living spaces, a private terrace, and landscaped outdoor areas. All details and asking prices are fictional." },
  { slug: "ikoyi-courtyard", title: "Ikoyi Courtyard House", city: "Ikoyi", state: "Lagos", price: 680000000, bedrooms: 5, propertyType: "House", image: photos.pool, description: "A fictional courtyard-style home with an inviting pool, expansive entertaining spaces, and light-filled bedrooms. An example of the kind of property you can explore on Easelife." },
  { slug: "maitama-modern", title: "Maitama Modern", city: "Abuja", state: "FCT", price: 450000000, bedrooms: 5, propertyType: "Duplex", image: photos.modern, description: "A contemporary family-home concept with floor-to-ceiling glazing, an open-plan living area, and space for work and relaxation. This is a demo property, not a real sales opportunity." },
  { slug: "terrace-on-the-green", title: "Terrace on the Green", city: "Lekki", state: "Lagos", price: 175000000, bedrooms: 3, propertyType: "House", image: photos.terrace, description: "An imagined three-bedroom home with a bright kitchen, a covered terrace, and a private garden. Sample information and imagery for exploring the Easelife experience." },
];

export async function seedDemoListings(db: Pick<PrismaClient, "listing">) {
  let added = 0;
  for (const entry of [...stays.map(s => ({ ...s, category: "staycation" })), ...homes.map(h => ({ ...h, category: "sale", maxGuests: 2, vibe: "calm" }))]) {
    const id = `demo-${entry.slug}`;
    if (await db.listing.findUnique({ where: { id }, select: { id: true } })) continue;
    await db.listing.create({ data: {
      id, title: entry.title, description: `${entry.description}\n\nDEMO LISTING: Illustrative photos, location, and pricing. Not available to book or purchase.`,
      listingCategory: entry.category, isDemo: true, price: entry.price, currency: "NGN", paymentFrequency: entry.category === "staycation" ? "daily" : "monthly",
      propertyType: entry.propertyType, bedrooms: entry.bedrooms, bathrooms: entry.bedrooms,
      maxGuests: entry.maxGuests, vibe: entry.vibe, city: entry.city, state: entry.state,
      address: "Illustrative location — no real property address", landlordName: "Easelife Demo", landlordEmail: "demo@easelife.example", landlordPhone: "",
      photos: { create: [entry.image, photos.interior, photos.living].map((id, order) => ({ url: photo(id), order })) },
    } });
    added++;
  }
  return added;
}
