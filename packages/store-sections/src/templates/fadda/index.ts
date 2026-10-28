/**
 * Fadda (template 27, sterling silver studio; Claude Design "Storefront
 * Templates"): cool grey paper, graphite actions and a silver highlight,
 * Readex Pro throughout and 12px corners. A small studio with a voice:
 * a split hero, categories, new in, press quotes, materials and care,
 * ruled reviews and a letter from the bench. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): silver rings, stacks
 * and bands on surfaces and in boxes. No hands, ears, necks, busts or
 * brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const FADDA_KEY = "fadda";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FADDA_KEY, getDesign(id)!, { corners: 12, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  sculpted: pexels(1378705, 900),
  stack: pexels(1378706, 900),
  leaf: pexels(6545018, 900),
  velvet: pexels(20507408, 900),
  tray: pexels(16063791, 900),
  bands: pexels(35205571, 900),
  promise: pexels(19525067, 900),
  engagement: pexels(27405174, 900),
  bench: pexels(33873069),
};

const NAME = L("فضة ستوديو", "Fadda Studio");

const header = lib("header-centered", {
  text: {
    "المتجر": L("خواتم", "Rings"),
    "العروض": L("ستاكات", "Stacks"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("فضة استرليني من وسط البلد", "Sterling silver from Downtown"),
    "المدونة": L("العناية", "Care"),
    "من نحن": L("الاستوديو", "The studio"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/faq" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ف", "F"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فضة ستوديو. كل الحقوق محفوظة.", "© 2026 Fadda Studio. All rights reserved."),
    "من نحن": L("الاستوديو", "The studio"),
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
    photo: [PHOTOS.sculpted],
    text: {
      "المجموعة الجديدة": L("فضة استرليني ٩٢٥", "925 sterling silver"),
      "معمول بكميات صغيرة": L("فضة متشطبة باليد", "Silver, finished by hand"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "خواتم وستاكات بتتصب في ستوديو وسط البلد، والحفر لحد ١٢ حرف مجاناً.",
        "Rings and stacks cast in our Downtown studio, with free engraving up to 12 letters.",
      ),
      "تسوّق المجموعة": L("تسوق الجديد", "Shop new in"),
      "حكايتنا": L("الاستوديو", "The studio"),
      "صورة الواجهة": L("خاتم فضة منحوت على سطح غامق", "A sculpted silver ring on a dark surface"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-photo-tiles", {
    text: { "تسوّق حسب القسم": L("اختار قطعتك", "Find your piece") },
  }),
  lib("products-feature", { text: { "اختيارنا ليك": L("وصل حديثاً", "New in"), "اختيار الأسبوع": L("قطعة الشهر", "Piece of the month") } }),
  lib("brands-quotes", {
    text: {
      "«واحد من أكتر المتاجر اللي ممكن تثق فيها لو بتدور على منتج أصلي.»": L(
        "«ستوديو الفضة اللي كل وسط البلد بيتكلم عنه.»",
        "“The silver studio everyone in Downtown is talking about.”",
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
      "سنة من تاريخ الفاتورة.": L("فضة استرليني ٩٢٥ مدموغة.", "925 sterling silver, hallmarked."),
      "بيغطي": L("التشطيب", "Finish"),
      "عيوب الصناعة.": L("مطفي أو لامع باليد.", "Brushed or polished by hand."),
      "مش بيغطي": L("المقاسات", "Sizing"),
      "الكسر والمياه وسوء الاستخدام.": L("تظبيط مقاس مجاني خلال ٣٠ يوم.", "Free resizing within 30 days."),
      "المطلوب": L("العناية", "Care"),
      "الفاتورة والعلبة الأصلية.": L("امسح بالقماشة اللي في العلبة.", "Wipe with the cloth in your box."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("التقييمات", "Reviews"),
      "قالوا عننا": L("بتتلبس كل يوم", "Worn every day"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("الستاك ما اسودّش بعد ٦ شهور لبس كل يوم.", "The stack has not tarnished after six months of daily wear."),
      "م": L("ه", "H"),
      "مريم أ.": L("هنا ر.", "Hana R."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("حفروا تاريخنا جوه الدبل في يومين.", "They engraved our date inside the bands in two days."),
      "ع": L("ي", "Y"),
      "عمر ك.": L("يوسف ك.", "Youssef K."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("تغليف تحفة، حسيته هدية بجد.", "Beautiful packaging; it felt like a real gift."),
      "ن": L("س", "S"),
      "نور ح.": L("سارة ل.", "Sara L."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("من على الترابيزة", "From the bench"),
      "أهلًا،": L("أهلاً،", "Hello,"),
      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.": L(
        "كل شهر بعمل قطعة واحدة ما بتتكررش. المشتركين بيشوفوها الأول.",
        "Every month I make one piece that is never repeated. Subscribers see it first.",
      ),
      "أ": L("ر", "R"),
      "أحمد": L("رانيا", "Rania"),
      "صاحب المتجر": L("صايغة، فضة ستوديو", "Silversmith, Fadda Studio"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الاستوديو", "The studio"), L("ستوديو فضة لشخصين في وسط البلد.", "A two-person silver studio in Downtown Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.bench,
    alt: L("ترابيزة صايغ عليها أدوات وأطباق", "A silversmith’s bench with tools and dishes"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("فضة بكميات صغيرة", "Silver in small runs"),
    text: L("كل خاتم بيتصب ويتشطب باليد في الاستوديو، فضة ٩٢٥ مدموغة.", "Every ring is cast and finished by hand in the studio, in hallmarked 925 silver."),
    more: L("والحفر مجاني، لحد ١٢ حرف.", "Engraving is free, up to 12 letters."),
    button: L("تسوق الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("فضة استرليني بكميات صغيرة في القاهرة.", "Sterling silver, made in small runs in Cairo."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.sculpted],
    ["stacks", "ستاكات", "Stacks", PHOTOS.stack],
    ["bridal", "زفاف", "Bridal", PHOTOS.engagement],
    ["bands", "دبل", "Bands", PHOTOS.bands],
    ["sets", "تشكيلات", "Selections", PHOTOS.tray],
  ],
  products: [
    ["sculpted-silver-ring", "rings", "خاتم فضة منحوت", "Sculpted Silver Ring", PHOTOS.sculpted, 950, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["leaf-pair-rings", "rings", "زوج خواتم فضة", "Silver Ring Pair", PHOTOS.leaf, 1150, { sold90: 60 }],
    ["everyday-stack", "stacks", "ستاك ٥ خواتم", "Everyday Stack of Five", PHOTOS.stack, 1650, { rating: 4.8, sold90: 96 }],
    ["eternity-stack", "stacks", "ستاك بأحجار", "Stone-set Stack", PHOTOS.velvet, 2100, { sold90: 40 }],
    ["promise-ring", "bridal", "خاتم وعد بحجر", "Gem-set Promise Ring", PHOTOS.promise, 2400, { isFeatured: true, sold90: 44 }],
    ["engagement-ring-box", "bridal", "خاتم خطوبة في علبة", "Engagement Ring in a Box", PHOTOS.engagement, 2900, { sold90: 30 }],
    ["engraved-bands", "bands", "دبلتين محفورتين", "Engraved Band Pair", PHOTOS.bands, 1250, { sold90: 71 }],
    ["ring-tray-set", "sets", "تشكيلة خواتم", "Ring Selection", PHOTOS.tray, 1100, { compareAtPrice: 1290, inStock: false, sold90: 58 }],
  ],
});

export const FADDA = libraryTemplate({
  key: FADDA_KEY,
  version: 4,
  changelog: "Fadda v4: hero, categories, section order",
  name: L("فضة", "Fadda"),
  description: L(
    "ستوديو فضة: واجهة بخاتم واحد، الجديد، آراء الصحافة، الخامات والعناية ورسالة الصايغة. أربع صفحات جاهزة.",
    "Sterling silver studio: a one-ring hero, new in, press quotes, materials and care and the silversmith’s letter. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 270,
  palette: ["#f2f2f0", "#e4e4e1", "#c9ccd2", "#1d1f22"],
  colors: {
    primary: "#1d1f22",
    secondary: "#e4e4e1",
    background: "#f2f2f0",
    foreground: "#1d1f22",
    muted: "#5d6066",
    border: "#d4d4d0",
    accent: "#c9ccd2",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الاستوديو", "The studio"), seo: { title: L("الاستوديو", "The studio") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("احجز مقاس", "Book a fitting"),
        text: L("٩ شارع شامبليون، وسط البلد، القاهرة.", "9 Champollion St, Downtown, Cairo."),
        heading: L("مقاس أو حفر أو قطعة خاصة", "A size, an engraving or a special piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الفضة والمقاسات والعناية.", "Silver, sizing and care."),
        question: L("الفضة بتسوّد؟", "Does silver tarnish?"),
        answer: L(
          "الفضة بتغمق من الهوا والرطوبة. البسها كتير وامسحها بالقماشة وخلّيها في الكيس.",
          "Silver darkens with air and moisture. Wear it often, wipe it with the cloth and keep it in its pouch.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", button: "outline", band: "paper", extras: ["product-perks"], copy: { reviews: L("كلمات من أصحابها", "Words from wearers"), related: L("قطع تتكدّس معها", "Pieces that stack with it") } },
});
