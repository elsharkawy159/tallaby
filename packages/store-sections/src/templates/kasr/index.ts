/**
 * Kasr (template 04, editorial fashion; Claude Design "Storefront
 * Templates"): bone paper, oxblood actions and a warm sand highlight,
 * Amiri display type over Noto Sans Arabic and square corners. Built from
 * section library designs (`fromLibrary`), so every element is a tree node
 * the seller can select, restyle and move.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Kasr itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`, `kasr.v4.json`), so the version stays 4.
 *
 * Photos: Pexels, each checked by eye (2026-10-20): coats, jackets and
 * linen on rails, flat lays, leather bags and fabric. No people, bodies or
 * mannequins (owner rule).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const KASR_KEY = "kasr";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KASR_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  camelCoat: pexels(36180262),
  neutralRack: pexels(5706273),
  teddyCoat: pexels(16008693, 900),
  jackets: pexels(6051248, 900),
  shirts: pexels(7671168, 900),
  corduroy: pexels(12956068, 900),
  leatherJacket: pexels(8113002, 900),
  flatLay: pexels(8408556, 900),
  bagShelf: pexels(9327162, 900),
  cardigan: pexels(31078828, 900),
  fabricStack: pexels(6766360),
  blazer: pexels(7671167, 900),
  floralDress: pexels(8536187, 900),
  sweatshirts: pexels(9594422, 900),
  terracottaTote: pexels(5706278, 900),
  crocBags: pexels(22434771, 900),
  fabricRolls: pexels(4614236),
  heroCoat: pexels(36180262, 1600),
  heroRack: pexels(5706273, 1600),
  heroCloset: pexels(6461398, 1600),
};

const NAME = L("قصر ستوديو", "Kasr Studio");

/** Kasr's own content: every string and photo that names the trade or the demo store. */
const DEFAULT_CONTENT: LookDefaults = {
  labels: { about: L("الاستوديو", "The studio") },
  // Header links a trade names (the header keeps its own routes).
  nav: [
    { label: L("حريمي", "Women"), href: SHOP },
    { label: L("رجالي", "Men"), href: SHOP },
    { label: L("المجلة", "Journal"), href: "/blog" },
    { label: L("فساتين", "Dresses"), href: NEW },
    { label: L("جواكت", "Jackets"), href: SHOP },
  ],
  hero: {
    alt: L("بالطو جملي وكوفية صوف من حملة الخريف", "Camel coat and wool scarf from the autumn campaign"),
    eyebrow: L("حملة الخريف", "The autumn campaign"),
    title: L("الخريف، متفصّل في القاهرة", "Autumn, cut in Cairo"),
    line: L("بالطو وكوفية صوف وطبقات هادية، ٥٠ قطعة من كل موديل.", "Coats, wool scarves and quiet layers, fifty pieces of each style."),
    cta: L("تسوق الجديد", "Shop new in"),
  },
  products: {
    primary: {
      eyebrow: L("وصل جديد", "New in"),
      title: L("وصل الأسبوع ده", "This week’s arrivals"),
      line: L("كميات صغيرة متفصلة في استوديو الزمالك.", "Small runs, cut in our Zamalek studio."),
    },
  },
  look: { eyebrow: L("تسوق المجموعة", "Shop the edit"), title: L("لوك لكل يوم", "A look for every day") },
  trust: [
    { title: L("توصيل لكل المحافظات", "Delivery across Egypt") },
    { title: L("تبديل مقاس ببلاش", "Free size exchange") },
    { title: L("متفصل في القاهرة", "Cut in Cairo") },
    { title: L("ادفع عند الاستلام", "Pay on delivery") },
  ],
  about: {
    line: L("استوديو تصميم صغير في الزمالك بيفصّل كميات ٥٠ قطعة.", "A small design studio in Zamalek cutting clothes in runs of fifty."),
    alt: L("لفات قماش على ترابيزة الورشة", "Fabric rolls on the workshop table"),
    eyebrow: L("من الزمالك", "From Zamalek"),
    title: L("هدوم متفصلة في القاهرة لكل يوم", "Clothes cut in Cairo, styled for every day"),
    text: L(
      "بنختار القماش بنفسنا ونفصّل كل موديل ٥٠ قطعة بس، عشان كل قطعة تفضل مميزة.",
      "We pick every fabric ourselves and cut each style in runs of fifty, so every piece stays special.",
    ),
    more: L("وتبديل المقاس عندنا ببلاش، دايماً.", "And size exchanges are always free."),
    cta: L("تسوق الجديد", "Shop new in"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("٥ شارع البرازيل، الزمالك، القاهرة.", "5 Brazil St, Zamalek, Cairo."),
    heading: L("عن مقاس أو طلب أو قطعة", "About a size, an order or a piece"),
  },
  faq: {
    line: L("المقاسات والتوصيل والتبديل.", "Sizes, delivery and exchanges."),
    question: L("إزاي أبدّل المقاس؟", "How do I exchange a size?"),
    answer: L("تبديل المقاس ببلاش خلال ١٤ يوم لأي قطعة بالتيكت بتاعها.", "Size exchanges are free within 14 days for any piece with its tags on."),
  },
  reviews: {
    title: L("اتلبست واتقيّمت", "Worn and reviewed"),
    items: [
      { quote: L("البليزر لابساني كأنه متفصل عليا. لبسته في ٣ أفراح لحد دلوقتي.", "The blazer fits like it was made for me. I have worn it to three weddings already."), name: L("نور ع.", "Nour A.") },
      { quote: L("القماش استحمل الغسالة ولسه زي الجديد.", "The fabric survived the washing machine and still looks new."), name: L("هنا م.", "Hana M.") },
      { quote: L("أوفر شيرت حلو، الكم طويل شوية.", "Great overshirt, sleeves are a little long."), name: L("عمر ف.", "Omar F.") },
      { quote: L("أحسن سويت شيرت عندي. اشتريته بلونين.", "Best sweatshirt I own. I bought it in two colours."), name: L("يارا س.", "Yara S.") },
    ],
  },
  custom: {
    // The hero carousel's second and third slides (the first is `hero`).
    "slide-2-eyebrow": L("الأكثر طلباً", "Most wanted"),
    "slide-2-title": L("القطع اللي بترجعوا لها", "The pieces you come back for"),
    "slide-2-line": L("بليزر رملي، فستان زيتي وسويت شيرت باستيل.", "A sand blazer, an olive dress and a pastel sweatshirt."),
    "slide-2-cta": L("شوف الأكثر طلباً", "See the favourites"),
    "slide-2-alt": L("هدوم بألوان ترابية على راك", "Earth-toned clothes on a rail"),
    "slide-3-eyebrow": L("الأساسيات", "The basics"),
    "slide-3-title": L("طبقات لكل يوم", "Layers for every day"),
    "slide-3-line": L("قطع بتتنسّق مع بعض من الصبح لبالليل.", "Pieces that work together from morning to night."),
    "slide-3-cta": L("تسوق الأساسيات", "Shop the basics"),
    "slide-3-alt": L("جواكت وقمصان متعلقة في دولاب خشب", "Jackets and shirts hanging in a wooden closet"),
    // The lookbook's six captions: a title, and a line under the first four.
    "gallery-1-title": L("المكتب", "The office"),
    "gallery-1-line": L("بدل وأطقم", "Suits & sets"),
    "gallery-2-title": L("الويك إند", "The weekend"),
    "gallery-2-line": L("فساتين", "Dresses"),
    "gallery-3-title": L("المشوار", "The commute"),
    "gallery-3-line": L("جواكت", "Jackets"),
    "gallery-4-title": L("كل يوم", "Every day"),
    "gallery-4-line": L("أساسيات", "Basics"),
    "gallery-5-title": L("السهرة", "Evenings"),
    "gallery-6-title": L("طبقات", "Layers"),
    // The styling video: its title and its label.
    "video-title": L("بدلة واحدة بخمس طرق", "One suit, five ways"),
    "video-alt": L("فيديو: بدلة واحدة بخمس طرق", "Video: one suit, five ways"),
    // The reviewed pieces (one per quote) and the buyers' cities (the third has none).
    "reviews-piece-1": L("بليزر رملي مفصّل", "Sand Tailored Blazer"),
    "reviews-piece-2": L("فستان زيتي مشجّر", "Olive Floral Dress"),
    "reviews-piece-3": L("أوفر شيرت لونين", "Two-Tone Overshirt"),
    "reviews-piece-4": L("سويت شيرت باستيل", "Pastel Crew Sweatshirt"),
    "reviews-city-1": L("الزمالك", "Zamalek"),
    "reviews-city-2": L("المعادي", "Maadi"),
    "reviews-city-4": L("القاهرة", "Cairo"),
  },
  photos: {
    hero: { wide: PHOTOS.heroCoat },
    about: PHOTOS.fabricRolls,
    custom: {
      "slide-2": PHOTOS.heroRack,
      "slide-3": PHOTOS.heroCloset,
      "gallery-1": PHOTOS.shirts,
      "gallery-2": PHOTOS.corduroy,
      "gallery-3": PHOTOS.leatherJacket,
      "gallery-4": PHOTOS.flatLay,
      "gallery-5": PHOTOS.bagShelf,
      "gallery-6": PHOTOS.cardigan,
      "video-poster": PHOTOS.fabricStack,
      "reviews-1": PHOTOS.blazer,
      "reviews-2": PHOTOS.floralDress,
      "reviews-3": PHOTOS.shirts,
      "reviews-4": PHOTOS.sweatshirts,
    },
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const p = c.photos.custom;
  // Buyer quotes are optional (a pack holds no invented reviews): without them the section is not built.
  const r = c.reviews?.items;

  const header = lib("header-departments", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "نساء": c.nav[0]!.label,
      "رجال": c.nav[1]!.label,
      "أطفال": c.nav[2]!.label,
      "ملابس": c.nav[3]!.label,
      "أحذية": c.nav[4]!.label,
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [SHOP, SHOP, "/blog", undefined, NEW, SHOP, SHOP, SHOP, RATED] },
  });

  const footer = lib("footer-links", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "من نحن": c.labels.about,
    },
    links: { "/products": [undefined, NEW, BEST] },
  });

  /**
   * Home (v4, template-rules §2a): the autumn campaign as a three-slide hero,
   * the categories in big type, then the fashion journey: new in, the looks,
   * the styling video, the studio's promises and worn-and-reviewed to close.
   */
  const home: Design[] = [
    lib("hero-carousel", {
      photo: [c.photos.hero.wide, p["slide-2"]!, p["slide-3"]!],
      text: {
        "وصل حديثًا": c.hero.eyebrow,
        "الموسم الجديد وصل": c.hero.title,
        "قطع مختارة بعناية، وتوصيل لحد باب البيت.": c.hero.line,
        "تسوّق الجديد": c.hero.cta,
        "صورة الحملة الأولى": c.hero.alt,
        "الأكثر مبيعًا": x["slide-2-eyebrow"]!,
        "المفضّلة عند عملائنا": x["slide-2-title"]!,
        "القطع اللي بترجع لها كل مرة.": x["slide-2-line"]!,
        "شوف الأكثر مبيعًا": x["slide-2-cta"]!,
        "صورة الحملة الثانية": x["slide-2-alt"]!,
        "عروض الأسبوع": x["slide-3-eyebrow"]!,
        "خصومات لفترة محدودة": x["slide-3-title"]!,
        "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": x["slide-3-line"]!,
        "تسوّق العروض": x["slide-3-cta"]!,
        "صورة الحملة الثالثة": x["slide-3-alt"]!,
      },
      links: { "/products": [NEW, BEST, SHOP] },
    }),
    lib("categories-big-type", {}),
    lib("products-panel-rail", {
      text: {
        "هدايا": c.products.primary.eyebrow,
        "هدايا تحت ١٠٠٠ جنيه": c.products.primary.title,
        "اختيارات مضمونة لأي مناسبة.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    lib("gallery-captioned", {
      photo: [p["gallery-1"]!, p["gallery-2"]!, p["gallery-3"]!, p["gallery-4"]!, p["gallery-5"]!, p["gallery-6"]!],
      text: {
        "لوك بوك": c.look.eyebrow,
        "كل يوم بشكل": c.look.title,
        "إطلالة الشغل": x["gallery-1-title"]!,
        "٣ منتجات": x["gallery-1-line"]!,
        "المشوار": x["gallery-2-title"]!,
        "٤ منتجات": x["gallery-2-line"]!,
        "الويكند": x["gallery-3-title"]!,
        "٢ منتج": x["gallery-3-line"]!,
        "السفر": x["gallery-4-title"]!,
        "٥ منتجات": x["gallery-4-line"]!,
        "الجيم": x["gallery-5-title"]!,
        "السهرة": x["gallery-6-title"]!,
      },
      links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP, BEST] },
    }),
    lib("video-shop", {
      photo: [undefined, p["video-poster"]!],
      text: {
        "كل اللي في الفيديو": x["video-title"]!,
        "فيديو المنتجات": x["video-alt"]!,
      },
    }),
    lib("features-ticker", {
      text: {
        "توصيل سريع": c.trust[0]!.title,
        "استرجاع سهل": c.trust[1]!.title,
        "دعم على واتساب": c.trust[2]!.title,
        "الدفع عند الاستلام": c.trust[3]!.title,
      },
    }),
  ];
  if (r) {
    home.push(lib("testimonials-products", {
      photo: [p["reviews-1"]!, p["reviews-2"]!, p["reviews-3"]!, p["reviews-4"]!],
      text: {
        "تقييمات": L("التقييمات", "Reviews"),
        "تقييمات على منتجات حقيقية": c.reviews.title,
        "الطقم الكلاسيك": x["reviews-piece-1"]!,
        "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": r[0]!.quote,
        "م": initialOf(r[0]!.name),
        "مريم أ.": r[0]!.name,
        "القاهرة": x["reviews-city-1"]!,
        "الحقيبة اليومية": x["reviews-piece-2"]!,
        "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": r[1]!.quote,
        "ع": initialOf(r[1]!.name),
        "عمر ك.": r[1]!.name,
        "الإسكندرية": x["reviews-city-2"]!,
        "العلبة الهدية": x["reviews-piece-3"]!,
        "أسعار معقولة وجودة أفضل مما توقعت.": r[2]!.quote,
        "ن": initialOf(r[2]!.name),
        "نور ح.": r[2]!.name,
        "الإصدار الجديد": x["reviews-piece-4"]!,
        "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": r[3]!.quote,
        "ي": initialOf(r[3]!.name),
        "يوسف م.": r[3]!.name,
        "المنصورة": x["reviews-city-4"]!,
      },
      links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP] },
    }));
  }

  const about: Design[] = [
    pageHeader(lib, "about-header", c.labels.about, c.about.line),
    aboutStory(lib, {
      photo: c.photos.about,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: NEW,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      {
        slug: "about",
        name: L("الاستوديو", "Studio"),
        seo: { title: c.labels.about, description: L("استوديو تصميم صغير في الزمالك.", "A small design studio in Zamalek.") },
        sections: about,
      },
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
  description: L("هدوم متفصلة في القاهرة لكل يوم.", "Clothes cut in Cairo, styled for every day."),
  categories: [
    ["sets", "بدل وأطقم", "Suits & sets", PHOTOS.neutralRack],
    ["dresses", "فساتين", "Dresses", PHOTOS.floralDress],
    ["jackets", "جواكت", "Jackets", PHOTOS.jackets],
    ["basics", "أساسيات", "Basics", PHOTOS.flatLay],
    ["bags", "شنط", "Bags", PHOTOS.bagShelf],
    ["coats", "بالطوهات", "Coats", PHOTOS.camelCoat],
  ],
  products: [
    ["sand-tailored-blazer", "sets", "بليزر رملي مفصّل", "Sand Tailored Blazer", PHOTOS.blazer, 3450, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["olive-floral-dress", "dresses", "فستان زيتي مشجّر", "Olive Floral Dress", PHOTOS.floralDress, 2250, { isFeatured: true, rating: 4.8, sold90: 58 }],
    ["two-tone-overshirt", "jackets", "أوفر شيرت لونين", "Two-Tone Overshirt", PHOTOS.shirts, 2650, { sold90: 31 }],
    ["teddy-coat", "coats", "بالطو تيدي", "Teddy Coat", PHOTOS.teddyCoat, 3900, { isFeatured: true, sold90: 22 }],
    ["shearling-leather-jacket", "jackets", "جاكت جلد بفرو", "Shearling Leather Jacket", PHOTOS.leatherJacket, 4800, { compareAtPrice: 5600, sold90: 12 }],
    ["pastel-crew-sweatshirt", "basics", "سويت شيرت باستيل", "Pastel Crew Sweatshirt", PHOTOS.sweatshirts, 590, { rating: 4.7, sold90: 210 }],
    ["corduroy-overshirt", "basics", "قميص قطيفة", "Corduroy Overshirt", PHOTOS.corduroy, 1450, { sold90: 27 }],
    ["chunky-knit-cardigan", "basics", "كارديجان تريكو تقيل", "Chunky Knit Cardigan", PHOTOS.cardigan, 890, { compareAtPrice: 1090, sold90: 27 }],
    ["terracotta-mini-tote", "bags", "شنطة توت طوبي صغيرة", "Terracotta Mini Tote", PHOTOS.terracottaTote, 1950, { isFeatured: true, sold90: 44 }],
    ["croc-shoulder-bag", "bags", "شنطة كتف كروكو", "Croc-Effect Shoulder Bag", PHOTOS.crocBags, 1700, { compareAtPrice: 1990, sold90: 36 }],
  ],
});

export const KASR = editionTemplate({
  key: KASR_KEY,
  version: 4,
  changelog: "Kasr v4: hero, categories, section order",
  name: L("قصر", "Kasr"),
  description: L(
    "موضة تحريرية: حملة بالشرائح، لوك بوك وفيديو وتقييمات على المنتجات، بخط كلاسيكي وزوايا حادة. أربع صفحات جاهزة.",
    "Editorial fashion: a campaign slideshow, a lookbook, a video and product reviews, with classic type and square corners. Four ready pages.",
  ),
  category: "fashion",
  style: ["luxe", "classic"],
  sortOrder: 40,
  palette: ["#f4f1ec", "#e8e2d8", "#a3472b", "#1c1b19"],
  colors: {
    primary: "#a3472b",
    secondary: "#e8e2d8",
    background: "#ffffff",
    foreground: "#1c1b19",
    muted: "#615c54",
    border: "#dcd5c9",
    accent: "#e8c9a8",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 0,
  lib,
  look,
  slots: [
    "labels.about",
    "nav.0",
    "nav.1",
    "nav.2",
    "nav.3",
    "nav.4",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "products.primary.eyebrow",
    "products.primary.title",
    "products.primary.line",
    "look.eyebrow",
    "look.title",
    "trust.0.title",
    "trust.1.title",
    "trust.2.title",
    "trust.3.title",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.about",
    "custom.slide-2-eyebrow",
    "custom.slide-2-title",
    "custom.slide-2-line",
    "custom.slide-2-cta",
    "custom.slide-2-alt",
    "custom.slide-3-eyebrow",
    "custom.slide-3-title",
    "custom.slide-3-line",
    "custom.slide-3-cta",
    "custom.slide-3-alt",
    "custom.gallery-1-title",
    "custom.gallery-1-line",
    "custom.gallery-2-title",
    "custom.gallery-2-line",
    "custom.gallery-3-title",
    "custom.gallery-3-line",
    "custom.gallery-4-title",
    "custom.gallery-4-line",
    "custom.gallery-5-title",
    "custom.gallery-6-title",
    "custom.video-title",
    "custom.video-alt",
    "photos.custom.slide-2",
    "photos.custom.slide-3",
    "photos.custom.gallery-1",
    "photos.custom.gallery-2",
    "photos.custom.gallery-3",
    "photos.custom.gallery-4",
    "photos.custom.gallery-5",
    "photos.custom.gallery-6",
    "photos.custom.video-poster",
  ],
  // Buyer quotes and their pieces, cities and photos: the reviews section is built only with them.
  optional: [
    "reviews",
    "custom.reviews-piece-1",
    "custom.reviews-piece-2",
    "custom.reviews-piece-3",
    "custom.reviews-piece-4",
    "custom.reviews-city-1",
    "custom.reviews-city-2",
    "custom.reviews-city-4",
    "photos.custom.reviews-1",
    "photos.custom.reviews-2",
    "photos.custom.reviews-3",
    "photos.custom.reviews-4",
  ],
  // New in as the main rail; no category rows.
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { thumbs: "side", band: "paper", copy: { reviews: L("كلمة من جرّبوها", "A word from those who wear it"), related: L("قطع تُلبَس معها", "Pieces to wear with it") } },
});
