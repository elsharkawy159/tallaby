/**
 * Matbakh (template 65, kitchen basics, modern; Claude Design "Storefront
 * Templates"): white paper, a cool green-grey shelf, a carrot orange for
 * actions and a butter-yellow highlight, Readex Pro throughout and 14px
 * corners. A practical kitchen shop: a "what are you cooking?" search,
 * departments, this week's tabbed shelf, a budget shelf, the week's offers,
 * open before you pay and simple promises. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): dinnerware, mugs,
 * boards, wooden and silicone utensils, jars, pans and tea towels. No
 * people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Matbakh Shop itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const MATBAKH_KEY = "matbakh";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MATBAKH_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const LOW = "/products?sort=price-low";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dinnerSet: pexels(6213678, 900),
  mugPair: pexels(7674564, 900),
  boards: pexels(6208155, 900),
  utensils: pexels(6692134, 900),
  pantry: pexels(4440173, 900),
  jarRack: pexels(10252345, 900),
  towels: pexels(4794849, 900),
  speckledCups: pexels(4259833, 900),
  measuring: pexels(38848778, 900),
  spatulas: pexels(3722564, 900),
  pans: pexels(5447100, 900),
  pinkPots: pexels(15245007, 900),
  stackedPlates: pexels(8903358, 900),
  utensilPot: pexels(7303732, 900),
  spoonJug: pexels(9475254, 900),
  blueMugs: pexels(8903360, 900),
  flatLay: pexels(3847465),
};

const NAME = L("مطبخ شوب", "Matbakh Shop");

/**
 * Matbakh Shop's own content: what the look is built with when no edition
 * is applied (the template `matbakh` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's delivery chip: one short line.
  announcement: [L("أدوات السفرة والتحضير والتخزين", "Tableware, prep and storage")],
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن لوح، برطمان، كوب…", "Search boards, jars, mugs…") },
  // Four links, one per category in the store's order (one or two words each): the header and the category tiles show them.
  nav: [
    { label: L("أدوات السفرة", "Tableware"), href: search("طقم") },
    { label: L("التحضير", "Prep"), href: search("لوح") },
    { label: L("التخزين", "Storage"), href: search("برطمان") },
    { label: L("الطاسات والحلل", "Pans & pots"), href: search("طاسة") },
  ],
  // A search hero: `title` is the question over the search box, `line` its placeholder.
  hero: { title: L("ماذا تطبخ؟", "What are you cooking?"), line: L("لوح، برطمان، كوب، طاسة", "Board, jar, mug, pan") },
  categories: { title: L("الأقسام", "Departments") },
  // The tabbed block's title (its tabs are new in, best sellers and lowest price).
  products: { primary: { title: L("هذا الأسبوع", "This week") } },
  // Four promises with icons, a title of a few words and a short line each.
  trust: [
    { title: L("تفاصيل واضحة", "Clear details"), line: L("صور ومواصفات لكل منتج.", "Photos and specs for every product.") },
    { title: L("مقاسات واضحة", "Clear sizes"), line: L("مقاس وسعة كل منتج في صفحته.", "Every product's size and capacity on its page.") },
    { title: L("تشكيلة متنوعة", "A wide range"), line: L("أدوات للسفرة والتحضير والتخزين.", "Tools for the table, prep and storage.") },
    { title: L("تواصل معنا", "Contact us"), line: L("لأي سؤال عن طلب أو منتج.", "With any question about an order or a product.") },
  ],
  about: {
    line: L("أدوات مطبخ عملية بأسعار مناسبة.", "Practical kitchen tools at fair prices."),
    alt: L("أطباق وأكواب سيراميك من الأعلى", "Ceramic plates, bowls and mugs from above"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أساسيات الطبخ اليومي", "The basics you cook with every day"),
    text: L(
      "نختار أطباقًا وألواحًا وبرطمانات وطاسات تتحمّل الاستخدام اليومي، ونعرض مواصفاتها بوضوح.",
      "We pick plates, boards, jars and pans made for everyday use and show their specs clearly.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتج.", "Contact us with any question about a product."),
    // Goes to the best sellers.
    cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("راسلنا على matbakh@matbakhshop.eg.", "Write to matbakh@matbakhshop.eg."),
    heading: L("اسأل عن طلب أو منتج", "Ask about an order or a product"),
  },
  faq: {
    line: L("الخامات والعناية والطلب.", "Materials, care and ordering."),
    question: L("هل الأطباق مناسبة لغسالة الأطباق؟", "Are the plates dishwasher safe?"),
    answer: L("طريقة العناية بكل منتج موضحة في صفحته، ويمكنك التواصل معنا لأي سؤال.", "Each product's care is shown on its page, and you can contact us with any question."),
  },
  custom: {
    // The category tiles' line under the title.
    "categories-line": L("للسفرة والتحضير والتخزين.", "For the table, prep and storage."),
    // The budget block: a title and one line (the products show lowest price first).
    "budget-title": L("أدوات مطبخ تناسب ميزانيتك", "Kitchen tools for your budget"),
    "budget-line": L(
      "رتّبنا لك الأدوات من الأقل سعرًا. تريد الأطقم الكبيرة أولًا؟ اختر من الأزرار.",
      "Tools sorted from the lowest price. Want the big sets first? Use the buttons.",
    ),
    // The open-box block's three steps, one line each.
    "open-box-1": L("نتصل بك قبل الوصول بساعة.", "We call an hour before arrival."),
    "open-box-2": L("افتح العلبة وتأكد من سلامة المنتجات.", "Open the box and check everything is intact."),
    "open-box-3": L("إذا وجدت أي مشكلة، أعد الطلب للمندوب دون أن تدفع شيئًا.", "If anything is wrong, hand the order back and pay nothing."),
    // The promises' heading, a few words.
    "trust-title": L("تسوّق وأنت مطمئن", "Shop with confidence"),
  },
  // The about page's photo (4:5). The category tiles show the categories' photos (`photos.tiles`).
  photos: { story: PHOTOS.flatLay },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Best sellers, All products, New in, Lowest price, Why us) and the layout
 * stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const x = c.custom;
  const nav = c.nav;
  const tiles = c.photos.tiles;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-search", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
      "وصل حديثًا": nav[0]!.label,
      "الأكثر مبيعًا": nav[1]!.label,
      "العروض": nav[2]!.label,
      "هدايا": nav[3]!.label,
      "إكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
      "صور ومواصفات لكل منتج": c.announcement[0]!,
    },
    links: { "/products": [undefined, nav[0]!.href, nav[1]!.href, nav[2]!.href, nav[3]!.href, BEST] },
  });

  const footer = lib("footer-help", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-search", {
      text: {
        "عمّ تبحث اليوم؟": c.hero.title,
        "اكتب اسم المنتج": c.hero.line,
      },
    }),
    lib("categories-tiles", {
      photo: [tiles[0]!, tiles[1]!, tiles[2]!, tiles[3]!],
      text: {
        "تسوّق حسب القسم": c.categories.title,
        "اختر القسم الذي يناسبك من كل ما نقدمه.": x["categories-line"]!,
        "كل الأقسام": L("كل المنتجات", "All products"),
        "وصل حديثًا": nav[0]!.label,
        "الأكثر مبيعًا": nav[1]!.label,
        "العروض": nav[2]!.label,
        "هدايا": nav[3]!.label,
      },
      links: { "/products": [SHOP, nav[0]!.href, nav[1]!.href, nav[2]!.href, nav[3]!.href] },
    }),
    lib("products-tabbed", {
      text: {
        "منتجاتنا": c.products.primary.title,
        "وصل جديد": L("وصل جديد", "New in"),
        "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
        "العروض": L("الأقل سعراً", "Lowest price"),
      },
      links: { "/products": [NEW, BEST, LOW] },
    }),
    lib("finder-budget", {
      text: {
        "ابدأ بالأقل سعرًا": x["budget-title"]!,
        "رتّبنا لك المنتجات من الأقل سعرًا. تريد رؤية الأعلى سعرًا أولًا؟ اختر من الأزرار.": x["budget-line"]!,
      },
    }),
    lib("pay-open-box", {
      text: {
        "نتصل بك قبل الوصول بساعة.": x["open-box-1"]!,
        "جرّب المنتج أمام المندوب.": x["open-box-2"]!,
        "إذا وجدت أي مشكلة، أعد الطلب للمندوب دون أن تدفع شيئًا.": x["open-box-3"]!,
      },
    }),
    lib("features-icon-cards", {
      text: {
        "لماذا تشتري منا": L("لماذا نحن", "Why us"),
        "تسوّق وأنت مطمئن": x["trust-title"]!,
        "الشحن": c.trust[0]!.title,
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب": c.trust[0]!.line,
        "الدفع عند الاستلام": c.trust[1]!.title,
        "أو بطرق الدفع المتاحة عند الطلب": c.trust[1]!.line,
        "الاستبدال والاسترجاع": c.trust[2]!.title,
        "التفاصيل في صفحة السياسات": c.trust[2]!.line,
        "تواصل معنا": c.trust[3]!.title,
        "لأي سؤال عن طلب أو منتج": c.trust[3]!.line,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
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
      { slug: "about", name: L("من نحن", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("أدوات مطبخ عملية بأسعار مناسبة.", "Practical kitchen tools at fair prices."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.stackedPlates],
    ["prep", "التحضير", "Prep", PHOTOS.utensilPot],
    ["storage", "التخزين", "Storage", PHOTOS.pantry],
    ["cookware", "الطاسات والحلل", "Pans & pots", PHOTOS.pans],
    ["linen", "فوط ومفارش", "Linen", PHOTOS.towels],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم عشاء ستون وير لـ٦ أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "tableware", "كوبان مرسومان يدويًا", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { rating: 4.7, sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح زيتون ٣ قطع", "Olive Wood Board Set of 3", PHOTOS.boards, 690, { isFeatured: true, sold90: 104 }],
    ["beech-utensil-set", "prep", "طقم ملاعق زان ٥ قطع", "Beech Utensil Set of 5", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 61 }],
    ["glass-jar-set", "storage", "٦ برطمانات زجاج بغطاء محكم", "Glass Jar Set of 6", PHOTOS.jarRack, 560, { sold90: 39 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة ٤ قطع", "Striped Tea Towels, Set of 4", PHOTOS.towels, 280, { sold90: 47 }],
    ["speckled-cup-set", "tableware", "طقم فناجين منقطة", "Speckled Cup & Saucer Set", PHOTOS.speckledCups, 780, { rating: 4.8, sold90: 52 }],
    ["steel-measuring-set", "prep", "طقم مكاييل ستانلس", "Steel Measuring Set", PHOTOS.measuring, 290, { sold90: 76 }],
    ["silicone-spatula-set", "prep", "طقم سباتولا سيليكون", "Silicone Spatula Set", PHOTOS.spatulas, 260, { compareAtPrice: 320, sold90: 95 }],
    ["frying-pan-set", "cookware", "طقم طاسات ٣ مقاسات", "Frying Pan Set of 3", PHOTOS.pans, 1850, { rating: 4.6, sold90: 34 }],
    ["granite-pot-set", "cookware", "طقم حلل جرانيت وردي", "Pink Granite Pot Set", PHOTOS.pinkPots, 2950, { compareAtPrice: 3400, inStock: false, sold90: 18 }],
  ],
});

export const MATBAKH = editionTemplate({
  key: MATBAKH_KEY,
  version: 3,
  changelog: "Matbakh v2: product page",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("مطبخ", "Matbakh"),
  description: L(
    "أساسيات مطبخ عصرية: بحث سريع، أقسام، شلف الأسبوع، على قد الميزانية وافتح قبل ما تدفع. أربع صفحات جاهزة.",
    "Modern kitchen basics: quick search, departments, this week's shelf, a budget shelf and open before you pay. Four ready pages.",
  ),
  category: "kitchen",
  style: ["bold"],
  sortOrder: 650,
  palette: ["#ffffff", "#f1f4f2", "#ffd166", "#e85d04"],
  colors: {
    primary: "#e85d04",
    secondary: "#f1f4f2",
    background: "#ffffff",
    foreground: "#14201a",
    muted: "#4d5a52",
    border: "#e1e7e3",
    accent: "#ffd166",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 14,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.search",
    "nav.0",
    "nav.1",
    "nav.2",
    "nav.3",
    "hero.title",
    "hero.line",
    "categories.title",
    "products.primary.title",
    "trust",
    "about",
    "contact",
    "faq",
    "photos.story",
    "custom.categories-line",
    "custom.budget-title",
    "custom.budget-line",
    "custom.open-box-1",
    "custom.open-box-2",
    "custom.open-box-3",
    "custom.trust-title",
  ],
  // The tabbed block has its own tabs, so `primary` is not read; the four category tiles read `photos.tiles` and `nav`; no category rows.
  optional: [],
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
