export function unsplashUrl(id: string, params = "w=1800&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

export const STOCK_PHOTOS = {
  hero: "1512917774080-9991f1c4c750",
  manifesto: "1613977257363-707ba9348227",
  cta: "1600566753086-00f18fb6b3ea",
  cityFallbacks: [
    "1600596542815-ffad4c1539a9",
    "1600607687939-ce8a6c25118c",
    "1568605114967-8130f3a36994",
    "1600585154340-be6161a56a0c",
    "1600210492486-724fe5c67fb0",
    "1600047509807-ba8f99d2cdde",
  ],
};
