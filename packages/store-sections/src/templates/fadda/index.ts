/**
 * Fadda (template 27, sterling silver studio; Claude Design "Storefront
 * Templates"): cool grey paper, graphite actions and a silver highlight,
 * Readex Pro throughout and 12px corners. A small studio with a voice:
 * a split hero, categories, new in, press quotes, materials and care,
 * ruled reviews and a letter from the bench. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, lettering, hallmarks or
 * logos) in the public `library-media` bucket, `editions/silver-jewelry/`:
 * the hero, one tile per category and the about bench as `scene-<slot>`,
 * and the eight products as white-background packshots named by slug (they
 * replace the Pexels photos, one of which was the hero, a tile and a
 * product at once).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { editionPhoto } from "../editions/media";
import { demoStore, libraryTemplate } from "../library-template";

export const FADDA_KEY = "fadda";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FADDA_KEY, getDesign(id)!, { corners: 12, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const photo = (name: string) => editionPhoto("silver-jewelry", name);

const PHOTOS = {
  /** A sculpted ring standing on graphite stone (square, the split hero). */
  hero: photo("scene-hero"),
  /** Category tiles, 3:4. */
  rings: photo("scene-tile-1"),
  stacks: photo("scene-tile-2"),
  bridal: photo("scene-tile-3"),
  bands: photo("scene-tile-4"),
  sets: photo("scene-tile-5"),
  /** A silversmith's bench by a tall window in Downtown Cairo (the about page). */
  bench: photo("scene-about"),
};

/** The demo products' white-background packshots, by slug. */
const shot = (slug: string) => photo(slug);

const NAME = L("فضة ستوديو", "Fadda Studio");

const header = lib("header-centered", {
  text: {
    "المتجر": L("خواتم", "Rings"),
    "العروض": L("خواتم متراكبة", "Stacks"),
    "اسم متجرك": NAME,
    "مختارات بعناية": L("خواتم فضة استرليني", "Sterling silver rings"),
    "المدونة": L("العناية", "Care"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/faq" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ف", "F"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فضة ستوديو. كل الحقوق محفوظة.", "© 2026 Fadda Studio. All rights reserved."),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

/**
 * Home (v4, template-rules §2a): one ring on a split hero, the categories,
 * then the jewellery journey: new pieces first, what the press says, the
 * metal and the care behind them, reviews, and the letter from the bench.
 */
const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.hero],
    text: {
      "المجموعة الجديدة": L("فضة استرليني ٩٢٥", "925 sterling silver"),
      "مختارة بعناية": L("خواتم فضة لكل يوم", "Silver rings for every day"),
      "قطع مختارة بعناية، لكل قطعة تفاصيلها المميزة.": L(
        "خواتم فردية وأطقم خواتم متراكبة من فضة ٩٢٥.",
        "Single rings and stacking sets in 925 silver.",
      ),
      "تسوّق المجموعة": L("تسوّق الجديد", "Shop new in"),
      "حكايتنا": L("حكايتنا", "Our story"),
      "صورة الواجهة": L("خاتم فضة منحوت على سطح غامق", "A sculpted silver ring on a dark surface"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-photo-tiles", {
    text: { "تسوّق حسب القسم": L("اختر قطعتك", "Find your piece") },
  }),
  lib("products-feature", { text: { "اختيارنا لك": L("وصل حديثاً", "New in"), "اختيار الأسبوع": L("قطعة الشهر", "Piece of the month") } }),
  lib("brands-quotes", {
    text: {
      "«من أكثر المتاجر الموثوقة للتسوق عبر الإنترنت.»": L(
        "«تشكيلة خواتم فضة بتصاميم بسيطة.»",
        "“A range of silver rings in simple designs.”",
      ),
      "ساحل": "Cairo Style",
      "أوربت": "Enterprise",
      "ميزان": "Scoop",
    },
  }),
  lib("text-terms", {
    text: {
      "شروط الضمان": L("الخامات والعناية", "Materials & care"),
      "المدة": L("المعدن", "Metal"),
      "سنة من تاريخ الفاتورة.": L("فضة استرليني ٩٢٥.", "925 sterling silver."),
      "يغطي": L("التشطيب", "Finish"),
      "عيوب الصناعة.": L("مطفي أو لامع.", "Brushed or polished."),
      "لا يغطي": L("المقاسات", "Sizing"),
      "الكسر والمياه وسوء الاستخدام.": L("المقاس مذكور لكل خاتم.", "The size is listed for every ring."),
      "المطلوب": L("العناية", "Care"),
      "الفاتورة والعلبة الأصلية.": L("امسحها بقطعة قماش ناعمة.", "Wipe with a soft cloth."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("التقييمات", "Reviews"),
      "قالوا عنا": L("للاستخدام اليومي", "For everyday wear"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("طقم الخواتم حافظ على لونه مع الاستخدام اليومي.", "The stack has kept its colour with daily wear."),
      "م": L("ه", "H"),
      "مريم أ.": L("هنا ر.", "Hana R."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("الدبل جميلة وتشطيبها ناعم.", "The bands are lovely with a smooth finish."),
      "ع": L("ي", "Y"),
      "عمر ك.": L("يوسف ك.", "Youssef K."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الخاتم أجمل من الصور.", "The ring looks even better than the photos."),
      "ن": L("س", "S"),
      "نور ح.": L("سارة ل.", "Sara L."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة الشهر", "Monthly letter"),
      "أهلًا،": L("أهلاً،", "Hello,"),
      "نكتب رسالة قصيرة عن أحدث المنتجات في المتجر.": L(
        "نكتب رسالة قصيرة عن أحدث القطع في المتجر.",
        "A short letter about the newest pieces in the store.",
      ),
      "أ": L("ر", "R"),
      "أحمد": L("رانيا", "Rania"),
      "صاحب المتجر": L("فريق فضة ستوديو", "The Fadda Studio team"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("خواتم ودبل من الفضة الاسترليني.", "Sterling silver rings and bands.")),
  aboutStory(lib, {
    photo: PHOTOS.bench,
    alt: L("طاولة صائغ عليها أدوات وأطباق", "A silversmith’s bench with tools and dishes"),
    eyebrow: L("منتجاتنا", "Our pieces"),
    title: L("خواتم من الفضة", "Silver rings"),
    text: L("نختار خواتم ودبلًا من فضة ٩٢٥، ونعرض المقاس والخامة لكل قطعة.", "We pick rings and bands in 925 silver, with the size and metal of every piece."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خواتم ودبل من الفضة الاسترليني.", "Sterling silver rings and bands."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.rings],
    ["stacks", "خواتم متراكبة", "Stacks", PHOTOS.stacks],
    ["bridal", "زفاف", "Bridal", PHOTOS.bridal],
    ["bands", "دبل", "Bands", PHOTOS.bands],
    ["sets", "تشكيلات", "Selections", PHOTOS.sets],
  ],
  products: [
    ["sculpted-silver-ring", "rings", "خاتم فضة منحوت", "Sculpted Silver Ring", shot("sculpted-silver-ring"), 950, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["leaf-pair-rings", "rings", "زوج خواتم فضة", "Silver Ring Pair", shot("leaf-pair-rings"), 1150, { sold90: 60 }],
    ["everyday-stack", "stacks", "طقم ٥ خواتم متراكبة", "Everyday Stack of Five", shot("everyday-stack"), 1650, { rating: 4.8, sold90: 96 }],
    ["eternity-stack", "stacks", "طقم خواتم بأحجار", "Stone-set Stack", shot("eternity-stack"), 2100, { sold90: 40 }],
    ["promise-ring", "bridal", "خاتم وعد بحجر", "Gem-set Promise Ring", shot("promise-ring"), 2400, { isFeatured: true, sold90: 44 }],
    ["engagement-ring-box", "bridal", "خاتم خطوبة في علبة", "Engagement Ring in a Box", shot("engagement-ring-box"), 2900, { sold90: 30 }],
    ["engraved-bands", "bands", "دبلتان محفورتان", "Engraved Band Pair", shot("engraved-bands"), 1250, { sold90: 71 }],
    ["ring-tray-set", "sets", "تشكيلة خواتم", "Ring Selection", shot("ring-tray-set"), 1100, { compareAtPrice: 1290, inStock: false, sold90: 58 }],
  ],
});

export const FADDA = libraryTemplate({
  key: FADDA_KEY,
  version: 4,
  changelog: "Fadda v4: hero, categories, section order",
  name: L("فضة", "Fadda"),
  description: L(
    "ستوديو فضة: واجهة بخاتم واحد، الجديد، آراء الصحافة، الخامات والعناية ورسالة المتجر. أربع صفحات جاهزة.",
    "Sterling silver studio: a one-ring hero, new in, press quotes, materials and care and the silversmith’s letter. Four ready pages.",
  ),
  category: "jewelry",
  style: ["luxe", "minimal"],
  sortOrder: 270,
  palette: ["#f2f2f0", "#e4e4e1", "#c9ccd2", "#1d1f22"],
  colors: {
    primary: "#1d1f22",
    secondary: "#e4e4e1",
    background: "#ffffff",
    foreground: "#1d1f22",
    muted: "#5d6066",
    border: "#d4d4d0",
    accent: "#c9ccd2",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 12,
  // White-background packshots: a square white stage shows each ring whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("حكايتنا", "Our story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("تواصل معنا لأي سؤال عن مقاس أو قطعة.", "Contact us with any question about a size or a piece."),
        heading: L("سؤال عن مقاس أو قطعة", "A question about a size or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الفضة والمقاسات والعناية.", "Silver, sizing and care."),
        question: L("هل تتغير الفضة مع الوقت؟", "Does silver tarnish?"),
        answer: L(
          "قد تغمق الفضة بفعل الهواء والرطوبة. امسحها بقطعة قماش ناعمة واحفظها في كيس مغلق.",
          "Silver can darken with air and humidity. Wipe it with a soft cloth and keep it in a closed pouch.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", button: "outline", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء المشترين", "Buyer reviews"), related: L("قطع تُلبس معها", "Pieces that stack with it") } },
});
