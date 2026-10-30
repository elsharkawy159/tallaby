/**
 * Tallaby category → Google product category (ROADMAP.md F-11b). Pure.
 *
 * Google Merchant Center, Meta and TikTok all read `google_product_category`
 * (Meta fills its own category from it), so one code-defined map serves the
 * three feeds. Values are Google taxonomy paths in English, which every
 * platform accepts in place of the numeric id. The map is keyed by the slug
 * of a Tallaby category (`categories.slug`); a product's category and its
 * parents are tried from the most specific up, so a new sub-category falls
 * back to its parent's mapping. Unmapped products get no category (the
 * platforms then guess it themselves). No AI, no lookups.
 */

export const GOOGLE_CATEGORY_BY_SLUG: Readonly<Record<string, string>> = {
  // Roots (every Tallaby root category has a mapping).
  "arts-crafts-and-sewing": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts",
  automotive: "Vehicles & Parts > Vehicle Parts & Accessories",
  baby: "Baby & Toddler",
  "beauty-and-personal-care": "Health & Beauty > Personal Care",
  books: "Media > Books",
  "clothing-shoes-and-jewelry": "Apparel & Accessories",
  electronics: "Electronics",
  "garden-and-outdoor": "Home & Garden > Lawn & Garden",
  "gifts-and-occasions": "Arts & Entertainment > Party & Celebration",
  "grocery-and-gourmet-food": "Food, Beverages & Tobacco > Food Items",
  "health-and-household": "Health & Beauty > Health Care",
  "home-and-kitchen": "Home & Garden",
  "luggage-and-travel-gear": "Luggage & Bags",
  "musical-instruments": "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments",
  "office-products": "Office Supplies",
  "pet-supplies": "Animals & Pet Supplies > Pet Supplies",
  "sports-and-outdoors": "Sporting Goods",
  "tools-and-home-improvement": "Hardware",
  "toys-and-games": "Toys & Games",

  // Fashion.
  "abayas-and-modest-wear": "Apparel & Accessories > Clothing",
  clothing: "Apparel & Accessories > Clothing",
  men: "Apparel & Accessories > Clothing",
  women: "Apparel & Accessories > Clothing",
  boys: "Apparel & Accessories > Clothing",
  girls: "Apparel & Accessories > Clothing",
  "baby-and-toddler-clothing": "Apparel & Accessories > Clothing > Baby & Toddler Clothing",
  "lingerie-and-sleepwear": "Apparel & Accessories > Clothing > Underwear & Socks",
  "men-shoes": "Apparel & Accessories > Shoes",
  "boys-shoes": "Apparel & Accessories > Shoes",
  "girls-shoes": "Apparel & Accessories > Shoes",
  "baby-shoes": "Apparel & Accessories > Shoes",
  jewelry: "Apparel & Accessories > Jewelry",
  watches: "Apparel & Accessories > Jewelry > Watches",
  "fashion-accessories": "Apparel & Accessories > Clothing Accessories",
  "handbags-and-wallets": "Apparel & Accessories > Handbags, Wallets & Cases",

  // Beauty and health.
  fragrances: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
  makeup: "Health & Beauty > Personal Care > Cosmetics",
  skincare: "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  "nail-care": "Health & Beauty > Personal Care > Cosmetics > Nail Care",
  haircare: "Health & Beauty > Personal Care > Hair Care",
  "oral-care": "Health & Beauty > Personal Care > Oral Care",
  "vitamins-and-supplements": "Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements",
  "household-supplies": "Home & Garden > Household Supplies",
  "cleaning-supplies": "Home & Garden > Household Supplies",

  // Electronics.
  "mobile-phones-and-accessories": "Electronics > Communications > Telephony > Mobile Phone Accessories",
  smartphones: "Electronics > Communications > Telephony > Mobile Phones",
  "basic-phones": "Electronics > Communications > Telephony > Mobile Phones",
  "computers-and-laptops": "Electronics > Computers",
  "computer-accessories": "Electronics > Electronics Accessories > Computer Accessories",
  "tablets-and-e-readers": "Electronics > Computers > Tablet Computers",
  audio: "Electronics > Audio",
  "cameras-and-photography": "Cameras & Optics",
  "tv-and-home-theater": "Electronics > Video",
  gaming: "Electronics > Video Game Console Accessories",
  "gaming-consoles": "Electronics > Video Game Consoles",
  "video-games": "Media > Video Games",
  "wearable-technology": "Electronics",

  // Home.
  "kitchen-and-dining": "Home & Garden > Kitchen & Dining",
  drinkware: "Home & Garden > Kitchen & Dining > Tableware > Drinkware",
  cookware: "Home & Garden > Kitchen & Dining > Cookware & Bakeware",
  "home-decor": "Home & Garden > Decor",
  lighting: "Home & Garden > Lighting",
  "bedding-and-linens": "Home & Garden > Linens & Bedding",
  bath: "Home & Garden > Bathroom Accessories",
  "household-appliances": "Home & Garden > Household Appliances",
  "storage-and-organization": "Home & Garden > Household Supplies > Storage & Organization",
  furniture: "Furniture",

  // Food.
  beverages: "Food, Beverages & Tobacco > Beverages",

  // Sports.
  "exercise-and-fitness": "Sporting Goods > Exercise & Fitness",
  "outdoor-recreation": "Sporting Goods > Outdoor Recreation",
  cycling: "Sporting Goods > Outdoor Recreation > Cycling",
};

/** A Tallaby category: what the mapping needs to walk up the tree. */
export interface FeedCategoryNode {
  slug: string | null;
  parentId: string | null;
}

/** Guard against a cycle in bad data; the real tree is 3–4 levels deep. */
const MAX_DEPTH = 8;

/**
 * The Google category of a Tallaby category: its own mapping, else the
 * nearest parent's, else null.
 */
export function googleCategoryFor(
  categoryId: string | null | undefined,
  categories: ReadonlyMap<string, FeedCategoryNode>,
): string | null {
  let id = categoryId ?? null;
  for (let depth = 0; id && depth < MAX_DEPTH; depth += 1) {
    const node = categories.get(id);
    if (!node) return null;
    const mapped = node.slug ? GOOGLE_CATEGORY_BY_SLUG[node.slug] : undefined;
    if (mapped) return mapped;
    id = node.parentId;
  }
  return null;
}
