/**
 * Tallaby Classic demo store: what the template preview shows instead of the
 * seller's catalog (an everyday gadgets shop, "Classic Store", from the Claude
 * Design store data). Preview only: none of it is written to the store.
 */
import type { TemplateDemo } from "../types";
import { pexels } from "./photos";

const CATEGORIES = [
  { id: "demo-earbuds", name: { ar: "سماعات أذن", en: "Earbuds" }, image: pexels(3921827, 600) },
  { id: "demo-headphones", name: { ar: "سماعات رأس", en: "Headphones" }, image: pexels(7772548, 600) },
  { id: "demo-watches", name: { ar: "ساعات ذكية", en: "Smartwatches" }, image: pexels(13007642, 600) },
  { id: "demo-power", name: { ar: "باور بانك", en: "Power banks" }, image: pexels(34338614, 600) },
  { id: "demo-speakers", name: { ar: "سبيكرات", en: "Speakers" }, image: pexels(39809998, 600) },
  { id: "demo-cables", name: { ar: "كابلات", en: "Cables" }, image: pexels(33592297, 600) },
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
  image: pexels(photoId, 700),
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

const PRODUCTS: DemoProduct[] = [
  product("pulse-buds-pro", "demo-earbuds", "سماعة بالس برو", "Pulse Buds Pro", 16703772, 1730, { compareAtPrice: 2100, rating: 4.6, sold90: 128, isFeatured: true }),
  product("ultra-3-smartwatch", "demo-watches", "ساعة ألترا 3", "Ultra 3 Smartwatch", 31406903, 1450, { rating: 4.4, sold90: 86, isFeatured: true }),
  product("maggo-10k", "demo-power", "باور بانك ماج 10K", "MagGo 10K Power Bank", 34338614, 1835, { compareAtPrice: 1990, rating: 4.8, sold90: 214 }),
  product("studio-headphones", "demo-headphones", "سماعة ستوديو", "Studio Headphones", 7772548, 990, { rating: 4.3, sold90: 52 }),
  product("mini-speaker", "demo-speakers", "سبيكر ميني", "Mini Speaker", 12021852, 620, { rating: 4.5, sold90: 301 }),
  product("classic-speaker", "demo-speakers", "سبيكر كلاسيك", "Classic Speaker", 39809998, 3200, { inStock: false, rating: 4.1, sold90: 39 }),
  product("sport-buds", "demo-earbuds", "سماعة سبورت", "Sport Buds", 33797659, 540, { compareAtPrice: 690, rating: 4.2, sold90: 77 }),
  product("slim-20k", "demo-power", "باور بانك سليم 20K", "Slim 20K Power Bank", 4072683, 1080, { rating: 4.7, sold90: 163 }),
  product("watch-x", "demo-watches", "ساعة إكس", "Watch X Series", 30707908, 1080, { rating: 4.0, sold90: 44 }),
  product("air-buds-4", "demo-earbuds", "سماعة إير 4", "Air Buds 4", 3921827, 1390, { compareAtPrice: 1600, rating: 4.5, sold90: 188 }),
  product("braided-usb-c", "demo-cables", "كابل USB-C مضفّر", "Braided USB-C Cable", 33592297, 180, { rating: 4.3, sold90: 61 }),
  product("cloud-headphones", "demo-headphones", "سماعة كلاود", "Cloud Headphones", 38918607, 1250, { rating: 4.6, sold90: 95 }),
];

export const CLASSIC_DEMO: TemplateDemo = {
  store: {
    name: { ar: "كلاسيك ستور", en: "Classic Store" },
    description: { ar: "أساسيات كل يوم، مختارة بعناية.", en: "Everyday essentials, picked with care." },
  },
  categories: CATEGORIES.map((c) => ({ ...c, productCount: PRODUCTS.filter((p) => p.categoryId === c.id).length })),
  products: PRODUCTS,
};
