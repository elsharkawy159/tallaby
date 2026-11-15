/**
 * Pure (template 09, minimal skincare; Claude Design "Storefront
 * Templates"): warm off-white paper, a deep sage for actions and a pale
 * sage highlight, Noto Naskh Arabic headings over Almarai and 20px
 * corners. A calm, ingredient-led store: split-screen launch, four
 * promises, best sellers, what is in every bottle, a four-step routine, the
 * rating summary and FAQs. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): bottles, droppers,
 * jars and tubes on plain surfaces. No people, hands or brand labels.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Nabta Skin itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const PURE_KEY = "pure";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PURE_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  serum: pexels(8101534, 900),
  serumHero: pexels(8101534),
  vitaminC: pexels(8054400, 900),
  dropper: pexels(10819538, 900),
  eucalyptusOil: pexels(4857813, 900),
  creamJars: pexels(6690232, 900),
  lotions: pexels(7691162, 900),
  squeezeTubes: pexels(8049849, 900),
  set: pexels(6167398, 900),
  amberMirror: pexels(7796455),
};

const NAME = L("نبتة", "Nabta");

/**
 * Nabta Skin's own content: what the look is built with when no edition is
 * applied (the template `pure` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The split hero: `eyebrow` names the newest product, `cta` goes to the newest products.
  hero: {
    alt: L("زجاجة سيرم بقطّارة", "A serum bottle with a dropper"),
    eyebrow: L("جديد · سيرم الهيالورونيك", "New · Hyaluronic Water Serum"),
    title: L("عناية بالبشرة بمكونات بسيطة", "Skincare with simple ingredients"),
    line: L(
      "مكونات قليلة وواضحة، مناسبة للاستخدام اليومي.",
      "Short, clear ingredient lists for everyday use.",
    ),
    cta: L("تسوّق الجديد", "Shop new in"),
  },
  categories: { title: L("تسوّق حسب الخطوة", "Shop by step") },
  // Four products of `journey.primary` in a grid: the title must say the same.
  products: {
    primary: {
      title: L("الأكثر مبيعاً", "Best sellers"),
      line: L("أكثر أربعة منتجات طلبًا في المتجر.", "The four most ordered products in the store."),
    },
  },
  // The home's photo-and-list block: an eyebrow, a title, three points (`custom.story-point-1..3`, one line each) and a link to the about page.
  story: {
    alt: L("زجاجة بقطّارة بجانب فرع أوكالبتوس", "A dropper bottle beside a eucalyptus branch"),
    eyebrow: L("في كل عبوة", "In every bottle"),
    title: L("مكونات أقل، لكل منها سبب", "Fewer ingredients, chosen for a reason"),
    cta: L("اعرف المزيد عن نبتة", "More about Nabta"),
  },
  // Optional: two buyer quotes with their names (the avatar letter is the name's first letter). Without them the home page goes from the story block to the FAQ.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      {
        quote: L(
          "الغسول لطيف في الاستخدام، والعبوة تكفي حوالي ثلاثة أشهر.",
          "The cleanser is gentle to use, and one bottle lasts about three months.",
        ),
        name: L("هدى ر.", "Hoda R."),
      },
      {
        quote: L(
          "سيرم الهيالورونيك خفيف ولا يتكتل تحت واقي الشمس.",
          "The hyaluronic serum is light and does not pill under sunscreen.",
        ),
        name: L("يارا إ.", "Yara E."),
      },
    ],
  },
  footer: { line: L("منتجات عناية بالبشرة بمكونات قليلة وواضحة.", "Skincare with short, clear ingredient lists.") },
  about: {
    line: L("متجر لمنتجات العناية بالبشرة بمكونات واضحة.", "A skincare shop with clear ingredient lists."),
    alt: L("زجاجات عسلية على مرآة", "Amber bottles on a mirror"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("عناية بسيطة لكل يوم", "Simple care for every day"),
    text: L("نختار منتجات العناية بالبشرة بمكونات قليلة وواضحة، ونعرض قائمة المكونات كاملة لكل منتج.", "We pick skincare with short, clear ingredient lists and show the full list for every product."),
    more: L("ولكل منتج طريقة استخدام واضحة في صفحته.", "And every product page explains how to use it."),
    // Goes to the best sellers.
    cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L("٣١ شارع محمد مظهر، الزمالك، القاهرة.", "31 Mohamed Mazhar St, Zamalek, Cairo."),
    heading: L("اسألنا عن أي منتج", "Ask us about any product"),
  },
  faq: {
    line: L("المكونات والتوصيل والاسترجاع.", "Ingredients, delivery and returns."),
    question: L("المنتجات مناسبة للبشرة الحساسة؟", "Are the products suitable for sensitive skin?"),
    answer: L(
      "قائمة المكونات كاملة في صفحة كل منتج. وإذا لم تكن متأكدًا، تواصل معنا لنساعدك في الاختيار.",
      "The full ingredient list is on every product page. If you are unsure, contact us and we will help you choose.",
    ),
  },
  custom: {
    // The store's short name inside "About …" (header, footer, about page).
    "store-short": L("نبتة", "Nabta"),
    // The four-step routine: a title, then four steps of one word and one short line each.
    "routine-title": L("من أين تبدأ؟", "Where to start?"),
    "routine-1-title": L("التنظيف", "Cleanse"),
    "routine-1-line": L("صباحًا ومساءً، لمدة ٣٠ ثانية.", "Morning and night, 30 seconds."),
    "routine-2-title": L("السيرم", "Serum"),
    "routine-2-line": L("سيرم واحد حسب احتياجك.", "One serum for your needs."),
    "routine-3-title": L("الترطيب", "Moisturise"),
    "routine-3-line": L("كريم ليلًا ولوشن نهارًا.", "Cream at night, lotion by day."),
    "routine-4-title": L("الحماية", "Protect"),
    "routine-4-line": L("واقي شمس كل صباح.", "Sunscreen every morning."),
    // The story block's three points, one line each.
    "story-point-1": L("بدون عطور أو زيوت عطرية", "No fragrance, no essential oils"),
    "story-point-2": L("طريقة استخدام واضحة لكل منتج", "Clear directions for every product"),
    "story-point-3": L("قائمة المكونات كاملة في صفحة كل منتج", "Full ingredient list on every page"),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the home's list block (4:5); about: the about page (4:5).
  photos: { hero: { tall: PHOTOS.serumHero }, story: PHOTOS.eucalyptusOil, about: PHOTOS.amberMirror },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Shop all, Best sellers, FAQ, Top rated) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const short = c.custom["store-short"]!;
  const aboutShort = L(`عن ${short.ar}`, `About ${short.en}`);

  const header = lib("header-line", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "المتجر": L("كل المنتجات", "Shop all"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "المدونة": L("الأسئلة", "FAQ"),
      "من نحن": L(aboutShort.ar, "About"),
    },
    links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
  });

  const footer = lib("footer-ruled", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "منتجات مختارة بعناية لكل يوم.": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutShort,
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات مختارة بمواصفات واضحة لكل يوم.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": L("كل المنتجات", "Shop all"),
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [NEW, SHOP] },
    }),
    lib("categories-photo-tiles", {
      text: { "تسوّق حسب القسم": c.categories.title },
    }),
    lib("products-grid", {
      as: "best-sellers",
      text: {
        "وصل حديثًا": c.products.primary.title,
        "أحدث المنتجات في المتجر.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 4 }],
    }),
    lib("features-steps", {
      text: {
        "الطلب في ٤ خطوات": c.custom["routine-title"]!,
        "اختر": c.custom["routine-1-title"]!,
        "أضف ما يعجبك إلى السلة": c.custom["routine-1-line"]!,
        "اطلب": c.custom["routine-2-title"]!,
        "عنوانك ورقم هاتفك فقط": c.custom["routine-2-line"]!,
        "نؤكد": c.custom["routine-3-title"]!,
        "نؤكد طلبك معك": c.custom["routine-3-line"]!,
        "استلم": c.custom["routine-4-title"]!,
        "يصلك الطلب على عنوانك": c.custom["routine-4-line"]!,
      },
    }),
    lib("about-list", {
      photo: [undefined, undefined, undefined, undefined, undefined, c.photos.story],
      text: {
        "صورة المتجر": c.story.alt,
        "مع كل منتج": c.story.eyebrow,
        "تفاصيل واضحة لكل منتج": c.story.title,
        "صور ومواصفات لكل منتج": c.custom["story-point-1"]!,
        "تفاصيل ومقاسات واضحة": c.custom["story-point-2"]!,
        "تواصل معنا لأي سؤال": c.custom["story-point-3"]!,
        "اعرف أكثر": c.story.cta,
      },
    }),
    ...(reviews
      ? [
          lib("testimonials-rating", {
            text: {
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "كل التقييمات": L("المنتجات الأعلى تقييماً", "Shop top rated"),
            },
            links: { "/products": RATED },
          }),
        ]
      : []),
    lib("faq-columns", { as: "home-faq", text: { "أسئلة شائعة": L("أسئلة شائعة", "Common questions") } }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutShort, c.about.line),
    aboutStory(lib, {
      photo: c.photos.about ?? c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: BEST,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutShort.ar, "About"), seo: { title: aboutShort }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("منتجات عناية بالبشرة بمكونات قليلة وواضحة.", "Skincare with short, clear ingredient lists."),
  categories: [
    ["cleansers", "غسول", "Cleansers", PHOTOS.squeezeTubes],
    ["serums", "سيرم وزيوت", "Serums & oils", PHOTOS.serum],
    ["moisturisers", "مرطبات", "Moisturisers", PHOTOS.creamJars],
    ["sets", "مجموعات", "Sets", PHOTOS.set],
    ["body", "عناية الجسم", "Body care", PHOTOS.lotions],
  ],
  products: [
    ["hyaluronic-water-serum", "serums", "سيرم الهيالورونيك", "Hyaluronic Water Serum", PHOTOS.serum, 690, { isFeatured: true, rating: 4.9, sold90: 348 }],
    ["oat-milk-cleanser", "cleansers", "غسول حليب الشوفان", "Oat Milk Cleanser", PHOTOS.squeezeTubes, 450, { rating: 4.8, sold90: 212 }],
    ["vitamin-c-serum", "serums", "سيرم فيتامين سي", "Vitamin C Brightening Serum", PHOTOS.vitaminC, 780, { compareAtPrice: 920, rating: 4.7, sold90: 190 }],
    ["rosehip-face-oil", "serums", "زيت ورد المسك", "Rosehip Face Oil", PHOTOS.dropper, 640, { isFeatured: true, sold90: 96 }],
    ["eucalyptus-night-oil", "serums", "زيت ليلي بالأوكالبتوس", "Eucalyptus Night Oil", PHOTOS.eucalyptusOil, 690, { sold90: 40 }],
    ["barrier-repair-cream", "moisturisers", "كريم إصلاح الحاجز", "Barrier Repair Cream", PHOTOS.creamJars, 720, { rating: 4.8, sold90: 265 }],
    ["light-day-lotion", "moisturisers", "لوشن نهاري خفيف", "Light Day Lotion", PHOTOS.lotions, 590, { sold90: 74 }],
    ["morning-set", "sets", "مجموعة الصباح", "The Morning Set", PHOTOS.set, 1650, { compareAtPrice: 1890, rating: 4.9, sold90: 58 }],
    ["eucalyptus-body-lotion", "body", "لوشن جسم بالأوكالبتوس", "Eucalyptus Body Lotion", PHOTOS.lotions, 520, { sold90: 61 }],
  ],
});

export const PURE = editionTemplate({
  key: PURE_KEY,
  version: 5,
  changelog: "Pure v4: categories, section order",
  name: L("بيور", "Pure"),
  description: L(
    "عناية بالبشرة بهدوء: مكونات واضحة، روتين من ٤ خطوات وتقييمات. أربع صفحات جاهزة.",
    "Calm skincare: clear ingredients, a four-step routine and ratings. Four ready pages.",
  ),
  category: "beauty",
  style: ["minimal"],
  sortOrder: 90,
  palette: ["#faf8f3", "#e9ede4", "#4f6146", "#26302a"],
  colors: {
    primary: "#4f6146",
    secondary: "#e9ede4",
    background: "#ffffff",
    foreground: "#26302a",
    muted: "#5c665e",
    border: "#dfe3d8",
    accent: "#d9e4cc",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 20,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "story.alt",
    "story.eyebrow",
    "story.title",
    "story.cta",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.store-short",
    "custom.routine-title",
    "custom.routine-1-title",
    "custom.routine-1-line",
    "custom.routine-2-title",
    "custom.routine-2-line",
    "custom.routine-3-title",
    "custom.routine-3-line",
    "custom.routine-4-title",
    "custom.routine-4-line",
    "custom.story-point-1",
    "custom.story-point-2",
    "custom.story-point-3",
  ],
  // Buyer quotes are demo claims: a pack writes real ones or leaves the group out (the section is then not built).
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["reviews", "photos.about"],
  // Four best sellers in a grid; no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { thumbs: "bottom", surface: "shelf", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("تكمل روتينك", "Complete your routine") } },
});
