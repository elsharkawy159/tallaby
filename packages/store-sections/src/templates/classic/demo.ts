/**
 * Tallaby Classic demo store: what the template preview shows instead of the
 * seller's catalog (an everyday tech accessories shop, "Classic Store").
 * Preview only: none of it is written to the store.
 *
 * Photos (Pexels, checked 2026-11-11, white-studio packshots, no people, no
 * logos). Earbuds 7417547, 3825517, 4812959; headphones 11199906, 3394666,
 * 7772547; smart watches 393047, 12307366, 31406895; power and chargers
 * 34338614, 3921700, 3921699. Category tiles: earbuds 3945697, headphones
 * 9058883; smart watches and power reuse their best product photo (393047,
 * 3921700). The earlier speakers and cables categories had no clean packshot
 * left and were dropped.
 */
import type { TemplateDemo } from "../types";
import { pexels } from "./photos";

const CATEGORIES = [
  { id: "demo-earbuds", name: { ar: "سماعات أذن", en: "Earbuds" }, image: pexels(3945697, 900) },
  { id: "demo-headphones", name: { ar: "سماعات رأس", en: "Headphones" }, image: pexels(9058883, 900) },
  { id: "demo-watches", name: { ar: "ساعات ذكية", en: "Smart watches" }, image: pexels(393047, 900) },
  { id: "demo-power", name: { ar: "شواحن وباور بانك", en: "Power & chargers" }, image: pexels(3921700, 900) },
];

type DemoProduct = TemplateDemo["products"][number];

let order = 0;
const product = (
  id: string,
  categoryId: string,
  ar: string,
  en: string,
  photoId: number,
  price: number,
  o: Partial<Pick<DemoProduct, "compareAtPrice" | "isFeatured" | "inStock" | "rating" | "sold90">> = {},
): DemoProduct => ({
  id: `demo-${id}`,
  title: { ar, en },
  slug: id,
  image: pexels(photoId, 900),
  price,
  compareAtPrice: o.compareAtPrice ?? null,
  isFeatured: o.isFeatured ?? false,
  categoryId,
  inStock: o.inStock ?? true,
  // Newest first in the order written.
  createdAt: new Date(Date.UTC(2026, 9, 18 - order++)).toISOString(),
  rating: o.rating ?? 4.5,
  sold90: o.sold90 ?? 10,
  sold14: Math.round((o.sold90 ?? 10) / 5),
});

// Newest first as written; `sold90` orders the best sellers. The two weakest
// photos (the pink-lit watch, the power bank on concrete) sell least and are
// the oldest, so they lead neither home row.
const PRODUCTS: DemoProduct[] = [
  product("snow-wireless-headphones", "demo-headphones", "سماعة سنو لاسلكي", "Snow Wireless Headphones", 3394666, 990, { rating: 4.6, sold90: 96 }),
  product("mesh-metal-smartwatch", "demo-watches", "ساعة ميش ميتال", "Mesh Metal Smartwatch", 12307366, 1850, { rating: 4.7, sold90: 88 }),
  product("black-buds", "demo-earbuds", "سماعة بلاك بادز", "Black Buds", 7417547, 690, { rating: 4.4, sold90: 74 }),
  product("wall-charger-20w", "demo-power", "شاحن حائط 20 وات", "Wall Charger 20W", 3921700, 350, { rating: 4.5, sold90: 62 }),
  product("pure-buds", "demo-earbuds", "سماعة بيور بادز", "Pure Buds", 3825517, 1190, { rating: 4.8, sold90: 214, isFeatured: true }),
  product("float-headphones", "demo-headphones", "سماعة هوفر", "Float Headphones", 11199906, 1250, { rating: 4.6, sold90: 188, isFeatured: true }),
  product("rose-smartwatch", "demo-watches", "ساعة روز جولد", "Rose Smartwatch", 393047, 1650, { rating: 4.7, sold90: 163 }),
  product("studio-headphones", "demo-headphones", "سماعة ستوديو", "Studio Headphones", 7772547, 1390, { rating: 4.5, sold90: 128 }),
  product("cloud-buds", "demo-earbuds", "سماعة كلاود بادز", "Cloud Buds", 4812959, 1490, { rating: 4.6, sold90: 112 }),
  product("compact-wall-charger", "demo-power", "شاحن حائط مدمج", "Compact Wall Charger", 3921699, 290, { rating: 4.3, sold90: 54 }),
  product("pulse-smartwatch", "demo-watches", "ساعة بالس", "Pulse Smartwatch", 31406895, 1250, { rating: 4.2, sold90: 31 }),
  product("maggo-10k", "demo-power", "باور بانك ماج 10K", "MagGo 10K Power Bank", 34338614, 1835, { rating: 4.4, sold90: 26 }),
];

export const CLASSIC_DEMO: TemplateDemo = {
  store: {
    name: { ar: "كلاسيك ستور", en: "Classic Store" },
    description: { ar: "أساسيات كل يوم، مختارة بعناية.", en: "Everyday essentials, picked with care." },
  },
  categories: CATEGORIES.map((c) => ({ ...c, productCount: PRODUCTS.filter((p) => p.categoryId === c.id).length })),
  products: PRODUCTS,
};
