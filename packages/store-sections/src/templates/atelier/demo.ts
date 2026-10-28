/**
 * Atelier demo store: what the template preview shows instead of the
 * seller's catalog (a fashion house, "Maison Nour"). Preview only: none of it
 * is written to the store when the template is used.
 */
import type { TemplateDemo } from "../types";
import { pexels } from "./photos";

const CATEGORIES = [
  { id: "demo-dresses", name: { ar: "الفساتين", en: "Dresses" }, image: pexels(19733576, 900) },
  { id: "demo-outerwear", name: { ar: "البالطوهات", en: "Outerwear" }, image: pexels(36180263, 900) },
  { id: "demo-tailoring", name: { ar: "القمصان والتفصيل", en: "Shirts & tailoring" }, image: pexels(6461477, 900) },
  { id: "demo-knitwear", name: { ar: "التريكو", en: "Knitwear" }, image: pexels(14641440, 900) },
  { id: "demo-bags", name: { ar: "الشنط والإكسسوار", en: "Bags & accessories" }, image: pexels(9327162, 900) },
  { id: "demo-sets", name: { ar: "الأطقم", en: "Sets" }, image: pexels(30569743, 900) },
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
  rating: o.rating ?? 4.7,
  sold90: o.sold90 ?? 10,
  sold14: Math.round((o.sold90 ?? 10) / 5),
});

const PRODUCTS: DemoProduct[] = [
  product("floral-shirt-dress", "demo-dresses", "فستان قميص مشجّر", "Floral Shirt Dress", 31683080, 3450, { rating: 4.9, sold90: 61 }),
  product("camel-wool-coat", "demo-outerwear", "بالطو صوف جملي", "Camel Wool Coat", 36180266, 6900, { rating: 4.9, sold90: 44 }),
  product("band-collar-linen-shirt", "demo-tailoring", "قميص كتان بياقة صينية", "Band-Collar Linen Shirt", 22441297, 1950, { rating: 4.8, sold90: 38 }),
  product("cocoa-cable-knit", "demo-knitwear", "بلوفر تريكو كاكاو", "Cocoa Cable Knit", 14641438, 1850, { sold90: 27 }),
  product("leather-tote", "demo-bags", "شنطة جلد توت", "Leather Tote", 27174573, 3800, { rating: 4.8, sold90: 21 }),
  product("printed-maxi-dress", "demo-dresses", "فستان ماكسي مطبوع", "Printed Maxi Dress", 18984479, 4200, { compareAtPrice: 4900, sold90: 19 }),
  product("sand-tailored-blazer", "demo-tailoring", "بليزر رملي مفصّل", "Sand Tailored Blazer", 9168856, 4400, { compareAtPrice: 5200, isFeatured: true, rating: 4.8, sold90: 33 }),
  product("ivory-cotton-overshirt", "demo-outerwear", "قميص قطن عاجي واسع", "Ivory Cotton Overshirt", 4641825, 2650, { sold90: 15 }),
  product("speckled-merino-sweater", "demo-knitwear", "بلوفر ميرينو منقّط", "Speckled Merino Sweater", 5710046, 2100, { rating: 4.6, sold90: 12 }),
  product("mini-leather-duffle", "demo-bags", "شنطة جلد صغيرة", "Mini Leather Duffle", 22434759, 2900, { compareAtPrice: 3400, sold90: 9 }),
  product("earth-tone-knit-set", "demo-sets", "طقم تريكو بألوان الأرض", "Earth-Tone Knit Set", 30569743, 2250, { rating: 4.6, sold90: 52 }),
  product("monochrome-silk-scarf", "demo-bags", "إيشارب حرير أبيض وأسود", "Monochrome Silk Scarf", 25524049, 950, { inStock: false, sold90: 7 }),
];

export const ATELIER_DEMO: TemplateDemo = {
  store: {
    name: { ar: "ميزون نور", en: "Maison Nour" },
    description: { ar: "قطع هادئة، مفصّلة في القاهرة.", en: "Quiet pieces, cut in Cairo." },
  },
  categories: CATEGORIES.map((c) => ({ ...c, productCount: PRODUCTS.filter((p) => p.categoryId === c.id).length })),
  products: PRODUCTS,
};
