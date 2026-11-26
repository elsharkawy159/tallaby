/**
 * Tallaby Classic home page since v8 (look-first pilot, F-89, 2026-11-11):
 * eight section-library designs through `fromLibrary`, so a library
 * improvement reaches the default template (docs/systems/plan.md §1 row 3).
 * In order: the banner carousel, photo category tiles, best sellers in the
 * clean grid, the two-tone story banner, new arrivals on the tinted rail,
 * the FAQ split, a carousel of the store's first category and the big-type
 * newsletter. v9 (owner, 2026-11-25: every home has products by category and
 * a carousel) swapped the four promises for the category carousel; the
 * promises design stays for the stores that hold it.
 *
 * Classic is every new store's first site, so the copy fits any store and
 * promises nothing the seller has not set: no discounts, no typed figures,
 * no reviews. A new store's drafts keep only the hero and the sections that
 * list its own records (`../essentials.ts`).
 */
import { getDesign } from "../../designs";
import type { Design } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { CLASSIC_PHOTOS } from "./photos";
import { LINKS } from "./_shared";

/** Classic's corners on a library design; ids read `tallaby-classic-<library id>`. */
export const classicLib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary("tallaby-classic", getDesign(id)!, { corners: 16, ...patch });

// The three product sections below keep the library version they were built from (products-grid v3,
// products-rail v2, products-category-carousel v2): the library card shows the whole photo on white
// since 2026-11-26, and Classic keeps its cover photo through node patches (CLAUDE.md rule 12).

export const classicHomeHero = classicLib("hero-carousel", {
  photo: [CLASSIC_PHOTOS.heroGifts, CLASSIC_PHOTOS.heroParcel, CLASSIC_PHOTOS.heroBoxes],
  text: {
    "صورة الحملة الأولى": L("علب هدايا بشرايط على خلفية بيج", "Gift boxes with ribbons on a beige background"),
    "وصل حديثًا": L("أهلًا بك", "Welcome"),
    "الموسم الجديد وصل": L("كل ما تحتاجه في مكان واحد", "Everything you need, one place"),
    "قطع مختارة بعناية لكل يوم.": L("منتجات مختارة بعناية بتفاصيل واضحة.", "Carefully picked products with clear details."),
    "تسوّق الجديد": L("تسوّق الآن", "Shop now"),
    "صورة الحملة الثانية": L("صندوق كرتون مفتوح على طاولة خشبية", "An open cardboard box on a wooden table"),
    "الأكثر مبيعًا": L("وصل حديثًا", "Just in"),
    "المفضّلة عند عملائنا": L("جديدنا وصل", "New arrivals are here"),
    "القطع الأكثر طلبًا في المتجر.": L("أحدث المنتجات فور وصولها.", "The latest products, as soon as they arrive."),
    "تصفّح الأكثر مبيعًا": L("تصفّح الجديد", "See what's new"),
    "صورة الحملة الثالثة": L("علب هدايا ملونة على خلفية بيضاء", "Colourful gift boxes on a white background"),
    "مختارات الأسبوع": L("الأكثر طلبًا", "Most wanted"),
    "قطع مختارة لهذا الأسبوع": L("اختيارات عملائنا", "Our customers' favourites"),
    "تشكيلة مختارة من أحدث القطع في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The most-ordered products in the store."),
    "تسوّق المختارات": L("تصفّح الأكثر مبيعًا", "See best sellers"),
  },
  links: { "/products": [LINKS.shop, LINKS.newest, LINKS.bestSellers] },
});

export const classicHomeCategories = classicLib("categories-photo-tiles", {
  text: { "تسوّق حسب القسم": L("تسوّق حسب القسم", "Shop by category") },
});

export const classicHomeBestSellers = { ...classicLib("products-grid", {
  as: "best-sellers",
  text: {
    "وصل حديثًا": L("الأكثر مبيعًا", "Best sellers"),
    "أحدث المنتجات في المتجر.": L("المنتجات التي يطلبها عملاؤنا أكثر.", "The products our customers order most."),
  },
  links: { "/products": LINKS.bestSellers },
  lists: [{ source: "best-sellers" }],
  // A hairline round every photo: a packshot on pure white would otherwise have no frame on the white page.
  // The library card shows the whole photo on white since 2026-11-26; Classic keeps its cover photo on the shelf colour (rule 12).
  nodes: { "صورة البطاقة": { style: { objectFit: "cover" } }, "صورة المنتج": { style: { borderWidth: 1, borderColor: "border", background: "secondary" } } },
}), version: 3 };

export const classicHomeStory = classicLib("about-two-tone", {
  photo: [undefined, undefined, CLASSIC_PHOTOS.parcelShelf],
  text: {
    "صورة البانر": L("طرود مغلفة على رف خشب", "Wrapped parcels on a wooden shelf"),
    "مختارات المتجر": L("من متجرنا", "From our shop"),
    "مصنوع ليدوم طويلًا": L("منتجات مختارة بعناية", "Products picked with care"),
    "خامات مختارة وتفاصيل متقنة تتحمّل الاستخدام اليومي.": L("نختار كل منتج بعناية ونعرض تفاصيله بوضوح. تواصل معنا لأي سؤال.", "We choose every product with care and show its details clearly. Contact us with any question."),
    "تسوّق الآن": L("تعرّف علينا أكثر", "More about us"),
  },
  links: { "/products": LINKS.about },
});

export const classicHomeNewArrivals = { ...classicLib("products-rail", {
  as: "new-arrivals",
  text: {
    "المفضلة لدى العملاء": L("جديد", "New"),
    "الأكثر مبيعًا": L("وصل حديثًا", "New arrivals"),
  },
  links: { "/products": LINKS.newest },
  lists: [{ source: "newest", limit: 4 }],
  // Classic keeps its cover photo (the library card shows the whole photo since 2026-11-26; rule 12).
  nodes: { "صورة البطاقة": { style: { objectFit: "cover" } } },
}), version: 2 };

/**
 * The store's first category as a carousel: its name and View all, then
 * four cards in view with arrows on desktop and a swipe on phones. The
 * same hairline round every photo as the best sellers grid.
 */
export const classicHomeCategoryCarousel = { ...classicLib("products-category-carousel", {
  lists: [undefined, { limit: 4 }],
  // Classic keeps its cover photo on the shelf colour (the library card shows the whole photo on white since 2026-11-26; rule 12).
  nodes: { "صورة البطاقة": { style: { objectFit: "cover" } }, "صورة المنتج": { style: { borderWidth: 1, borderColor: "border", background: "secondary" } } },
}), version: 2 };

/** The four promises (v8's sixth section; off the v9 home, kept for the stores that hold it). */
export const classicHomePromises = classicLib("features-icon-cards", {
  text: {
    "لماذا تشتري منا": L("لماذا تتسوّق معنا", "Why shop with us"),
    "تسوّق وأنت مطمئن": L("تسوّق وأنت مطمئن", "Shop with peace of mind"),
    "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب", "Cost and time shown at checkout"),
    "أو بطرق الدفع المتاحة عند الطلب": L("أو بطرق الدفع المتاحة عند الطلب", "Or other methods shown at checkout"),
    "التفاصيل في صفحة السياسات": L("التفاصيل في صفحة السياسات", "Details on the policy page"),
    "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن طلب أو منتج", "With any question about an order or a product"),
  },
});

export const classicHomeFaq = classicLib("faq-side", {
  photo: [undefined, undefined, undefined, CLASSIC_PHOTOS.deskFlatLay],
  text: {
    "صورة القسم": L("مكتب أبيض عليه أقلام ونظارة وكوب", "A white desk with pencils, glasses and a cup"),
  },
});

export const classicHomeNewsletter = classicLib("newsletter-big", {
  // A calm pale panel (the library's is the accent colour), and no space under it: Classic's footer brings its own.
  nodes: { "اللوحة": { style: { background: "secondary" } }, "النشرة": { style: { paddingBottom: 0 }, mobile: { paddingBottom: 0 } } },
  text: {
    "اشترك في نشرتنا البريدية": L("كن أول من يعرف", "Be the first to know"),
    "كن أول من يعرف بالمنتجات الجديدة.": L("اشترك ليصلك خبر المنتجات الجديدة أولًا.", "Join the list and hear about new arrivals first."),
  },
});

/**
 * Hero, categories, then products with a photo-led break between any two
 * product sections (the story banner, then the FAQ beside its photo), and
 * the newsletter last (docs/template-rules.md §2, §2a). One scroll effect:
 * the story banner settles as it enters the screen.
 */
export const CLASSIC_HOME = [
  classicHomeHero,
  classicHomeCategories,
  classicHomeBestSellers,
  classicHomeStory,
  classicHomeNewArrivals,
  classicHomeFaq,
  classicHomeCategoryCarousel,
  classicHomeNewsletter,
] as const;
