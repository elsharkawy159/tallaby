/** A store counts as just created for this long after its first publish. */
export const RECENT_WINDOW_MS = 60 * 60 * 1000;
/** After this long the line shows nothing at all. */
export const LATEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** How many just-created stores the line can rotate through. */
export const RECENT_STORES_LIMIT = 5;

/**
 * The industries a seller picks at signup or in Store settings › General. They
 * fill `stores.store_category` (English) and `store_category_ar` with these
 * exact names (`STORE_INDUSTRIES` in packages/store-editor/src/lib/industries.lib.ts;
 * the test keeps the two lists equal). The home page says only the id's own
 * wording, so free text a seller typed under "Other" is never shown.
 */
export const STORE_INDUSTRY_NAMES = {
  fashion: { en: "Fashion", ar: "أزياء وملابس" },
  "shoes-bags": { en: "Shoes & Bags", ar: "أحذية وشنط" },
  electronics: { en: "Electronics", ar: "إلكترونيات" },
  "mobile-accessories": { en: "Mobile Accessories", ar: "إكسسوارات موبايل" },
  beauty: { en: "Beauty & Cosmetics", ar: "تجميل ومستحضرات" },
  home: { en: "Home & Furniture", ar: "منزل وأثاث" },
  kitchen: { en: "Kitchen & Appliances", ar: "مطبخ وأجهزة منزلية" },
  food: { en: "Food & Groceries", ar: "أغذية وبقالة" },
  sweets: { en: "Sweets & Coffee", ar: "حلويات وقهوة" },
  kids: { en: "Kids & Toys", ar: "أطفال وألعاب" },
  sports: { en: "Sports & Fitness", ar: "رياضة ولياقة" },
  jewelry: { en: "Accessories & Jewelry", ar: "إكسسوارات ومجوهرات" },
  books: { en: "Books & Stationery", ar: "كتب وأدوات مكتبية" },
  health: { en: "Health & Pharmacy", ar: "صحة وصيدلية" },
  pets: { en: "Pets", ar: "حيوانات أليفة" },
  auto: { en: "Car Accessories", ar: "إكسسوارات سيارات" },
  handmade: { en: "Handmade & Gifts", ar: "هاند ميد وهدايا" },
} as const;

export type StoreIndustryId = keyof typeof STORE_INDUSTRY_NAMES;

/** Names an industry had before: a store saved with one still counts (the test keeps this equal to the `aliases` of `STORE_INDUSTRIES`). */
export const STORE_INDUSTRY_OLD_NAMES: Partial<Record<StoreIndustryId, readonly string[]>> = {
  jewelry: ["Jewelry & Watches", "مجوهرات وساعات"],
};

const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

/** The industry whose English or Arabic name (today's or an earlier one) equals the store's category, else null (no category, or the seller's own words). */
export function storeIndustryId(category: { en?: string | null; ar?: string | null }): StoreIndustryId | null {
  const en = norm(category.en);
  const ar = norm(category.ar);
  if (!en && !ar) return null;
  for (const [id, names] of Object.entries(STORE_INDUSTRY_NAMES) as [StoreIndustryId, { en: string; ar: string }][]) {
    if ((en && norm(names.en) === en) || (ar && norm(names.ar) === ar)) return id;
  }
  for (const [id, names] of Object.entries(STORE_INDUSTRY_OLD_NAMES) as [StoreIndustryId, readonly string[]][]) {
    if (names.some((name) => norm(name) === en || norm(name) === ar)) return id;
  }
  return null;
}

/** Only what the line may say: the store's industry (never its name or seller) and when it opened. */
export type RecentStore = { industry: StoreIndustryId | null; publishedAt: string | null };
export type DatedStore = { industry: StoreIndustryId | null; publishedAtMs: number };

export type StoreLine =
  | { kind: "recent"; stores: DatedStore[] }
  | { kind: "latest"; store: DatedStore }
  | { kind: "none" };

export type StoreAge = { unit: "now" } | { unit: "minutes" | "hours" | "days"; count: number };

/**
 * What the home page's live line says at `now`. Both limits are inclusive: exactly
 * 60 minutes is still recent, and exactly 7 days is still shown. A time that is
 * missing, unreadable or in the future is ignored, and nothing here ever stands
 * in for a missing store.
 */
export function selectStoreLine(stores: readonly RecentStore[], now: number): StoreLine {
  const dated = stores
    .map((store) => ({
      industry: store.industry && store.industry in STORE_INDUSTRY_NAMES ? store.industry : null,
      publishedAtMs: store.publishedAt ? Date.parse(store.publishedAt) : Number.NaN,
    }))
    .filter((store) => store.publishedAtMs <= now && now - store.publishedAtMs <= LATEST_WINDOW_MS)
    .sort((a, b) => b.publishedAtMs - a.publishedAtMs);

  const recent = dated.filter((store) => now - store.publishedAtMs <= RECENT_WINDOW_MS);
  if (recent.length > 0) return { kind: "recent", stores: recent.slice(0, RECENT_STORES_LIMIT) };
  const latest = dated[0];
  return latest ? { kind: "latest", store: latest } : { kind: "none" };
}

/** The age to print, in whole units rounded down, so a store never reads newer than it is by more than its unit. */
export function storeAge(publishedAtMs: number, now: number): StoreAge {
  const minutes = Math.floor((now - publishedAtMs) / 60_000);
  if (minutes < 1) return { unit: "now" };
  if (minutes < 60) return { unit: "minutes", count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", count: hours };
  return { unit: "days", count: Math.floor(hours / 24) };
}
