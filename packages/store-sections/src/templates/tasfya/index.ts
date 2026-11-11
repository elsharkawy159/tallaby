/**
 * Tasfya (template 53, fashion outlet; Claude Design "Storefront Templates"):
 * white paper, black ink, a loud red for actions and a yellow highlight,
 * Lalezar headings over Cairo text and 8px corners. An outlet (v3): the
 * shop window, the rails (categories), just dropped, shop by budget, selling
 * fast, open before you pay and shopper reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Edition-ready (ROADMAP F-90): the sections are built by `look(content,
 * journey)` from `DEFAULT_CONTENT`, and with it the look builds exactly its
 * v3 output (`../editions/__fixtures__/tasfya.v3.json`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): clothes on shop rails
 * and wooden hangers, a store window with sale signs, dresses on a wall
 * hook, a clutch and a shoulder bag. No people, no hands, no mannequins and
 * no logos (the design's photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const TASFYA_KEY = "tasfya";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TASFYA_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  polkaDresses: pexels(1943846, 900),
  womenRail: pexels(12048380, 900),
  teeRail: pexels(5698851, 900),
  sweaterRails: pexels(3812433, 900),
  shimmerClutch: pexels(32498616, 900),
  rhinestoneBag: pexels(15432831, 900),
  jacketRail: pexels(18144397, 900),
  blouses: pexels(11435420, 900),
  knitTops: pexels(37420550, 900),
  tanks: pexels(3735633, 900),
  basicsRail: pexels(8743972, 900),
  saleWindow: pexels(33276443),
};

const NAME = L("تصفية أوتلت", "Tasfya Outlet");

/** Tasfya's own content (the outlet), copied from v3 character for character. */
const DEFAULT_CONTENT: LookDefaults = {
  announcement: [L("قطع حقيقية من محلات حقيقية", "Real pieces from real shops")],
  labels: { search: L("ابحث عن ماركة أو قطعة…", "Search brands and pieces…") },
  nav: [
    { label: L("فساتين", "Dresses"), href: search("فستان") },
    { label: L("قمصان وجواكت", "Shirts & jackets"), href: search("جاكيت") },
    { label: L("شنط", "Bags"), href: search("شنطة") },
  ],
  hero: {
    alt: L("فترينة محل فيها رفوف لبس", "A shop window with clothing rails"),
    eyebrow: L("أوتلت", "Outlet"),
    title: L("قطع حقيقية من محلات حقيقية", "Real pieces from real shops"),
    line: L("قطع جديدة كل خميس، وتبديل خلال ٧ أيام.", "New pieces every Thursday, and exchanges within 7 days."),
    cta: L("تسوق الأوتلت", "Shop the outlet"),
  },
  categories: { title: L("لفّ على الرفوف", "Browse the rails") },
  products: { primary: { title: L("لسه نازل", "Just dropped"), line: L("لسه نازل", "Just dropped") } },
  rows: [{ title: L("بيخلص بسرعة", "Selling fast") }],
  reviews: {
    title: L("اللي اشتروا قالوا", "Shoppers say"),
    items: [
      { quote: L("الجاكيت وصل جديد بالتيكت بتاعه، ونفس اللي في الصورة بالظبط.", "The jacket arrived new with its tag, exactly like the photo."), name: L("دينا ف.", "Dina F.") },
      { quote: L("قست الفستان قدام المندوب وطلع واسع، رجعته من غير ما أدفع.", "Tried the dress at the door, it was loose, and I sent it back without paying."), name: L("هشام ط.", "Hesham T.") },
      { quote: L("بلحق كل خميس قبل المقاسات ما تخلص.", "I check every Thursday before the sizes run out."), name: L("سارة م.", "Sara M.") },
    ],
  },
  about: {
    line: L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices."),
    alt: L("فترينة محل فيها رفوف لبس", "A shop window with clothing rails"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("الموسم اللي فات، بنص التمن", "Last season, at half the price"),
    text: L("بنشتري الكميات اللي فضلت عند المحلات آخر الموسم، ونبيعها بأسعار تصفية.", "We buy what shops have left at the end of each season and sell it at clearance prices."),
    more: L("كل قطعة بتتفحص، ولو فيها علامة صغيرة بنكتبها في الوصف.", "Every piece is checked, and any small mark is written in the description."),
    cta: L("تسوق الأوتلت", "Shop the outlet"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("كل يوم من ١٢ الضهر لـ ١١ بالليل، على واتساب أو الإيميل.", "Every day, 12 pm to 11 pm, on WhatsApp or by email."),
    heading: L("اسأل عن مقاس أو قطعة", "Ask about a size or a piece"),
  },
  faq: {
    line: L("التبديل والتوصيل والمقاسات.", "Exchanges, delivery and sizes."),
    question: L("ينفع أبدّل قطعة من الأوتلت؟", "Can I exchange an outlet piece?"),
    answer: L("أيوه، خلال ٧ أيام لو بالتيكت بتاعها، ما عدا قطع العينة.", "Yes, within 7 days with its tags on, except sample pieces."),
  },
  custom: {
    // The footer's phone, and its WhatsApp and tel links (digits with the country code, the same on both sides).
    phone: L("٠١٠٠ ٢٢٣ ٣٤٤٠", "+20 100 223 3440"),
    "phone-digits": L("201002233440", "201002233440"),
    // The store's short name inside "About <name>".
    "store-short": L("تصفية", "Tasfya"),
    // Shop by budget: three price bands, lowest first.
    "budget-1": L("أقل من ٥٠٠", "Under 500"),
    "budget-2": L("٥٠٠ – ١٬٠٠٠", "500 – 1,000"),
    "budget-3": L("أكتر من ١٬٠٠٠", "Over 1,000"),
    // Open before you pay: its two lines.
    "open-box-1": L("قيس القطعة وشوفها قدام المندوب.", "Check the piece and try it on in front of the courier."),
    "open-box-2": L("لو المقاس مش مظبوط رجّعه للمندوب ومتدفعش حاجة.", "If the size is wrong, hand it back and pay nothing."),
    // The 2nd and 3rd reviewers' cities.
    "reviews-city-2": L("الإسكندرية", "Alexandria"),
    "reviews-city-3": L("الجيزة", "Giza"),
  },
  photos: { hero: { wide: PHOTOS.saleWindow } },
};

function look(c: LookContent, journey: LookJourney): LookParts {
  void journey;
  const name = c.store.name;
  const x = c.custom;
  const short = x["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  const digits = x["phone-digits"]!.en;
  const reviews = c.reviews.items;

  const header = lib("header-search", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
      "وصل حديثًا": c.products.primary.title,
      "العروض": c.nav[0]!.label,
      "هدايا": c.nav[1]!.label,
      "إكسسوارات": c.nav[2]!.label,
      "توصيل خلال ٤٨ ساعة": c.announcement[0]!,
    },
    links: { "/products": [undefined, NEW, BEST, c.nav[0]!.href, c.nav[1]!.href, c.nav[2]!.href] },
  });

  const footer = lib("footer-help", {
    text: {
      "٠١٠٠ ١٢٣ ٤٥٦٧": x.phone!,
      "م": initialOf(name),
      "اسم متجرك": name,
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: {
      "https://wa.me/201001234567": `https://wa.me/${digits}`,
      "tel:+201001234567": `tel:+${digits}`,
      "/products": [undefined, NEW, BEST, RATED],
    },
  });

  const home: Design[] = [
    lib("hero-fullbleed", {
      photo: [c.photos.hero.wide],
      text: {
        "المجموعة الجديدة": c.hero.eyebrow,
        "صُنعت لتدوم معك": c.hero.title,
        "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "صورة الواجهة": c.hero.alt,
      },
    }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    lib("products-tabbed", {
      text: {
        "المتجر": L("الأوتلت", "Outlet"),
        "منتجاتنا": c.products.primary.line,
        "العروض": L("الأعلى تقييماً", "Top rated"),
      },
      links: { "/products": [NEW, BEST, RATED] },
    }),
    lib("finder-price-bands", {
      text: {
        "أقل من ٦٠٠": x["budget-1"]!,
        "٦٠٠ – ١٬٥٠٠": x["budget-2"]!,
        "أكتر من ١٬٥٠٠": x["budget-3"]!,
      },
    }),
    lib("products-carousel", {
      text: { "الأكثر مبيعاً": c.rows[0]!.title },
      links: { "/products": BEST },
    }),
    lib("pay-open-box", {
      text: {
        "جرّب المنتج قدام المندوب.": x["open-box-1"]!,
        "لو فيه أي مشكلة رجّعه للمندوب ومتدفعش حاجة.": x["open-box-2"]!,
      },
    }),
    lib("testimonials-classic", {
      text: {
        "آراء العملاء": c.reviews.title,
        "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews[0]!.quote,
        "م": initialOf(reviews[0]!.name),
        "مريم أ.": reviews[0]!.name,
        "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews[1]!.quote,
        "ع": initialOf(reviews[1]!.name),
        "عمر ك.": reviews[1]!.name,
        "الإسكندرية": x["reviews-city-2"]!,
        "أسعار معقولة وجودة أفضل مما توقعت.": reviews[2]!.quote,
        "ن": initialOf(reviews[2]!.name),
        "نور ح.": reviews[2]!.name,
        "الجيزة": x["reviews-city-3"]!,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.hero.wide,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: SHOP,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("عن تصفية", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices."),
  categories: [
    ["women", "حريمي", "Women", PHOTOS.womenRail],
    ["men", "رجالي", "Men", PHOTOS.jacketRail],
    ["bags", "شنط", "Bags", PHOTOS.shimmerClutch],
    ["basics", "أساسيات", "Basics", PHOTOS.sweaterRails],
    ["tops", "توبات وبلوزات", "Tops & blouses", PHOTOS.blouses],
  ],
  products: [
    ["polka-midi-dress", "women", "فستان بولكا ميدي", "Polka Midi Dress", PHOTOS.polkaDresses, 990, { compareAtPrice: 2400, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["corduroy-jacket", "men", "جاكيت قطيفة", "Corduroy Jacket", PHOTOS.jacketRail, 890, { compareAtPrice: 1990, sold90: 88 }],
    ["shimmer-clutch", "bags", "كلاتش لامع", "Shimmer Flap Clutch", PHOTOS.shimmerClutch, 790, { compareAtPrice: 1850, sold90: 52 }],
    ["heavy-tee", "basics", "تيشيرت تقيل", "Heavy Tee", PHOTOS.teeRail, 220, { compareAtPrice: 450, rating: 4.7, sold90: 300 }],
    ["printed-blouse", "tops", "بلوزة مطبوعة", "Printed Blouse", PHOTOS.blouses, 490, { compareAtPrice: 1100, sold90: 64 }],
    ["rib-knit-top", "tops", "توب تريكو مضلّع", "Rib Knit Top", PHOTOS.knitTops, 420, { compareAtPrice: 950, sold90: 24 }],
    ["striped-tank", "basics", "توب حمالات مقلّم", "Striped Tank Top", PHOTOS.tanks, 180, { compareAtPrice: 390, sold90: 70 }],
    ["rhinestone-shoulder-bag", "bags", "شنطة كتف بفصوص", "Rhinestone Shoulder Bag", PHOTOS.rhinestoneBag, 650, { compareAtPrice: 1450, inStock: false, sold90: 12 }],
    ["long-sleeve-basics", "basics", "تيشيرت كم طويل", "Long-Sleeve Tee", PHOTOS.basicsRail, 250, { compareAtPrice: 520, sold90: 46 }],
  ],
});

export const TASFYA = editionTemplate({
  key: TASFYA_KEY,
  version: 3,
  changelog: "Tasfya v3: categories, best sellers, reviews, section order",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("اللي اشتروا قالوا", "Shoppers say"), related: L("لحّق العروض", "Grab more deals") } },
  name: L("تصفية", "Tasfya"),
  description: L(
    "أوتلت موضة: الرفوف، لسه نازل، تسوق بالميزانية، بيخلص بسرعة، افتح قبل ما تدفع وآراء المشترين. أربع صفحات جاهزة.",
    "Fashion outlet: the rails, just dropped, shop by budget, selling fast, open before you pay and shopper reviews. Four ready pages.",
  ),
  category: "fashion",
  style: ["bold"],
  sortOrder: 530,
  palette: ["#ffffff", "#f1f1ee", "#ffe15d", "#d7263d"],
  colors: {
    primary: "#d7263d",
    secondary: "#f1f1ee",
    background: "#ffffff",
    foreground: "#141414",
    muted: "#55554f",
    border: "#e2e2dd",
    accent: "#ffe15d",
  },
  fonts: { heading: "Lalezar", body: "Cairo" },
  radius: 8,
  lib,
  look,
  // Every slot `look` reads.
  slots: [
    "announcement.0",
    "labels.search",
    "nav.0",
    "nav.1",
    "nav.2",
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "rows.0.title",
    "reviews",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "custom.phone",
    "custom.phone-digits",
    "custom.store-short",
    "custom.budget-1",
    "custom.budget-2",
    "custom.budget-3",
    "custom.open-box-1",
    "custom.open-box-2",
    "custom.reviews-city-2",
    "custom.reviews-city-3",
  ],
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
