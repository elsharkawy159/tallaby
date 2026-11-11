/**
 * Tallaby Classic home page since v8 (look-first pilot, F-89, 2026-11-11):
 * eight section-library designs through `fromLibrary`, so a library
 * improvement reaches the default template (docs/systems/plan.md §1 row 3).
 * In order: the banner carousel, photo category tiles, best sellers in the
 * clean grid, the two-tone story banner, new arrivals on the tinted rail,
 * the four promises, the FAQ split and the big-type newsletter.
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

export const classicHomeHero = classicLib("hero-carousel", {
  photo: [CLASSIC_PHOTOS.heroGifts, CLASSIC_PHOTOS.heroParcel, CLASSIC_PHOTOS.heroBoxes],
  text: {
    "صورة الحملة الأولى": L("علب هدايا بشرايط على خلفية بيج", "Gift boxes with ribbons on a beige background"),
    "وصل حديثًا": L("أهلًا بيك", "Welcome"),
    "الموسم الجديد وصل": L("كل اللي محتاجه في مكان واحد", "Everything you need, one place"),
    "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("منتجات مختارة بعناية، توصلك لحد باب البيت.", "Carefully picked products, delivered to your door."),
    "تسوّق الجديد": L("تسوّق الآن", "Shop now"),
    "صورة الحملة الثانية": L("كرتونة مفتوحة على ترابيزة خشب", "An open cardboard box on a wooden table"),
    "الأكثر مبيعًا": L("وصل حديثًا", "Just in"),
    "المفضّلة عند عملائنا": L("جديدنا وصل", "New arrivals are here"),
    "القطع اللي بترجع لها كل مرة.": L("أحدث المنتجات أول ما توصل عندنا.", "The latest products, as soon as they reach us."),
    "شوف الأكثر مبيعًا": L("شوف الجديد", "See what's new"),
    "صورة الحملة الثالثة": L("علب هدايا ملونة على خلفية بيضا", "Colourful gift boxes on a white background"),
    "عروض الأسبوع": L("الأكثر طلبًا", "Most wanted"),
    "خصومات لفترة محدودة": L("اختيارات عملائنا", "Our customers' favourites"),
    "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("المنتجات اللي الناس بترجع تطلبها تاني.", "The products people come back to order again."),
    "تسوّق العروض": L("شوف الأكثر مبيعًا", "See best sellers"),
  },
  links: { "/products": [LINKS.shop, LINKS.newest, LINKS.bestSellers] },
});

export const classicHomeCategories = classicLib("categories-photo-tiles", {
  text: { "تسوّق حسب القسم": L("تسوّق حسب القسم", "Shop by category") },
});

export const classicHomeBestSellers = classicLib("products-grid", {
  as: "best-sellers",
  text: {
    "وصل حديثًا": L("الأكثر مبيعًا", "Best sellers"),
    "أحدث المنتجات اللي نزلت المتجر.": L("المنتجات اللي عملاءنا بيطلبوها أكتر.", "The products our customers order most."),
  },
  links: { "/products": LINKS.bestSellers },
  lists: [{ source: "best-sellers" }],
  // A hairline round every photo: a packshot on pure white would otherwise have no frame on the white page.
  nodes: { "صورة المنتج": { style: { borderWidth: 1, borderColor: "border" } } },
});

export const classicHomeStory = classicLib("about-two-tone", {
  photo: [undefined, undefined, CLASSIC_PHOTOS.parcelShelf],
  text: {
    "صورة البانر": L("طرود مغلفة على رف خشب", "Wrapped parcels on a wooden shelf"),
    "صناعة مصرية": L("من متجرنا", "From our shop"),
    "متعمول عشان يريّحك ويعيش معاك": L("بنهتم بكل طلب كأنه لينا", "We treat every order as our own"),
    "خامات مختارة وتفاصيل متشطبة بإيدينا، عشان تفضل معاك سنين.": L(
      "بنختار كل منتج بعناية، وبنرد على كل رسالة بنفسنا قبل الطلب وبعده.",
      "We choose every product with care and answer every message ourselves, before and after you order.",
    ),
    "تسوّق الآن": L("اعرف عنّا أكتر", "More about us"),
  },
  links: { "/products": LINKS.about },
});

export const classicHomeNewArrivals = classicLib("products-rail", {
  as: "new-arrivals",
  text: {
    "بيحبوها": L("جديد", "New"),
    "الأكثر مبيعًا": L("وصل حديثًا", "New arrivals"),
  },
  links: { "/products": LINKS.newest },
  lists: [{ source: "newest", limit: 4 }],
});

export const classicHomePromises = classicLib("features-icon-cards", {
  text: {
    "لماذا تشتري منا": L("ليه تشتري مننا", "Why shop with us"),
    "تسوّق وأنت مطمئن": L("اطلب وإنت مطمّن", "Shop with peace of mind"),
    "من يوم إلى ٤ أيام لكل المحافظات": L("من يوم لـ ٤ أيام لكل المحافظات", "1 to 4 days, all governorates"),
    "أو ادفع بالبطاقة والمحفظة": L("أو ادفع بالكارت والمحفظة", "Or pay by card and wallet"),
    "١٤ يومًا لتغيّر رأيك": L("١٤ يوم تغيّر رأيك", "14 days to change your mind"),
    "أشخاص حقيقيون طوال الأسبوع": L("ناس حقيقية، ٧ أيام في الأسبوع", "Real people, 7 days a week"),
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
    "خد ١٠٪ خصم على أول طلب": L("خليك أول من يعرف", "Be the first to know"),
    "عروض للمشتركين بس، مرة في الأسبوع.": L("اشترك وأول ما يوصل منتج جديد هتعرف.", "Join the list and hear about new arrivals first."),
  },
});

/**
 * Hero, categories, then products with a photo-led break between the two
 * product sections, trust and questions after the products they support, and
 * the newsletter last (docs/template-rules.md §2, §2a). One scroll effect:
 * the story banner settles as it enters the screen.
 */
export const CLASSIC_HOME = [
  classicHomeHero,
  classicHomeCategories,
  classicHomeBestSellers,
  classicHomeStory,
  classicHomeNewArrivals,
  classicHomePromises,
  classicHomeFaq,
  classicHomeNewsletter,
] as const;
