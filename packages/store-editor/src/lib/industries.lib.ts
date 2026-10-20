/**
 * Store industries (owner request 2026-10-18). Picking one in Store settings
 * › General fills the existing free-text `stores.store_category` (EN) and
 * `store_category_ar` (no migration); the editor's Explore tab turns the
 * category back into stock-photo searches. No React here.
 */

export type StoreIndustry = {
  id: string;
  en: string;
  ar: string;
  /** English stock-photo searches, best first. */
  queries: readonly string[];
};

export const STORE_INDUSTRIES: readonly StoreIndustry[] = [
  { id: "fashion", en: "Fashion", ar: "أزياء وملابس", queries: ["fashion clothing", "fashion model", "clothing store", "streetwear"] },
  { id: "shoes-bags", en: "Shoes & Bags", ar: "أحذية وشنط", queries: ["shoes", "sneakers", "handbags", "leather bag"] },
  { id: "electronics", en: "Electronics", ar: "إلكترونيات", queries: ["electronics gadgets", "laptop", "headphones", "smart devices"] },
  { id: "mobile-accessories", en: "Mobile Accessories", ar: "إكسسوارات موبايل", queries: ["smartphone accessories", "phone case", "wireless earbuds", "charger cable"] },
  { id: "beauty", en: "Beauty & Cosmetics", ar: "تجميل ومستحضرات", queries: ["cosmetics", "skincare products", "makeup", "perfume"] },
  { id: "home", en: "Home & Furniture", ar: "منزل وأثاث", queries: ["home interior", "furniture", "home decor", "living room"] },
  { id: "kitchen", en: "Kitchen & Appliances", ar: "مطبخ وأجهزة منزلية", queries: ["kitchen appliances", "cookware", "modern kitchen"] },
  { id: "food", en: "Food & Groceries", ar: "أغذية وبقالة", queries: ["fresh food", "groceries", "healthy food", "bakery"] },
  { id: "sweets", en: "Sweets & Coffee", ar: "حلويات وقهوة", queries: ["desserts", "coffee", "chocolate", "pastry"] },
  { id: "kids", en: "Kids & Toys", ar: "أطفال وألعاب", queries: ["kids toys", "children playing", "baby products"] },
  { id: "sports", en: "Sports & Fitness", ar: "رياضة ولياقة", queries: ["fitness", "sports equipment", "gym workout", "running"] },
  { id: "jewelry", en: "Jewelry & Watches", ar: "مجوهرات وساعات", queries: ["jewelry", "watches", "gold jewelry", "accessories"] },
  { id: "books", en: "Books & Stationery", ar: "كتب وأدوات مكتبية", queries: ["books", "stationery", "reading", "notebook"] },
  { id: "health", en: "Health & Pharmacy", ar: "صحة وصيدلية", queries: ["health care", "vitamins", "pharmacy", "wellness"] },
  { id: "pets", en: "Pets", ar: "حيوانات أليفة", queries: ["pets", "dog", "cat", "pet supplies"] },
  { id: "auto", en: "Car Accessories", ar: "إكسسوارات سيارات", queries: ["car accessories", "car interior", "automotive"] },
  { id: "handmade", en: "Handmade & Gifts", ar: "هاند ميد وهدايا", queries: ["handmade crafts", "gifts", "gift box", "pottery"] },
];

/** Searches when the store has no category we can use. */
export const GENERAL_QUERIES = ["online shopping", "products flat lay", "shopping bags"] as const;

const norm = (value: string) => value.trim().toLowerCase();

/** The industry whose English or Arabic name equals the store's category, if any. */
export function findIndustry(category: { en?: string | null; ar?: string | null }): StoreIndustry | null {
  const en = norm(category.en ?? "");
  const ar = norm(category.ar ?? "");
  return STORE_INDUSTRIES.find((i) => (en && norm(i.en) === en) || (ar && norm(i.ar) === ar)) ?? null;
}

/** Suggested searches for a store: its industry's, else its English category, else general ones. */
export function industryQueries(category: { en?: string | null; ar?: string | null }): string[] {
  const industry = findIndustry(category);
  if (industry) return [...industry.queries];
  const en = category.en?.trim();
  // Arabic-only free text is not searched (stock libraries are indexed in English).
  return en ? [en, ...GENERAL_QUERIES] : [...GENERAL_QUERIES];
}
