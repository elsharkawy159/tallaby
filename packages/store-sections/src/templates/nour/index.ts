/**
 * Nour (template 78, lighting; Claude Design "Storefront Templates"): a dark
 * home page in warm charcoal, an amber brand colour and a soft gold
 * highlight, Readex Pro throughout and 16px corners. A lamp shop: one big
 * word, lamps by room, the most lit lamps, we hang it for you and
 * reviews from customers' homes. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): floor, table and desk
 * lamps, pendants, mosaic lamps and a candle trio. No people, no hands, no
 * logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Nour Lighting itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const NOUR_KEY = "nour";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NOUR_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";

const PHOTOS = {
  lampDisplay: pexels(10821415),
  floorRoom: pexels(12648787, 900),
  classicTable: pexels(35392792, 900),
  wovenPendants: pexels(36265889, 900),
  vaseCandles: pexels(8217492, 900),
  swingFloor: pexels(26346242, 900),
  pleatedFloor: pexels(1612726, 1600),
  ceramicTable: pexels(18280834, 900),
  brassTable: pexels(14540915, 900),
  deskLamps: pexels(7439756, 900),
  rattanPendants: pexels(17299918, 900),
  glassPendant: pexels(2123426, 900),
  conePendants: pexels(13108827, 900),
  mosaicLamps: pexels(38669981, 900),
};

const NAME = L("نور لايتنج", "Nour Lighting");

/**
 * Nour Lighting's own content: what the look is built with when no edition
 * is applied (the template `nour` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن أباجورة، نجفة، شمعة…", "Search lamps, pendants, candles…") },
  // Only the button of the hero's product (it adds the first featured product to the cart): two or three words.
  hero: { cta: L("نوّر بيتك", "Light your home") },
  categories: { title: L("نوّر كل أوضة", "Light every room") },
  // One featured product large, with four of what `journey.primary` shows beside it.
  products: { primary: { title: L("الأكتر نوراً", "Most lit") } },
  // Optional: three buyer quotes. The design keeps its own names and cities under them (Mariam A., Omar K., Nour H.), so only `title` and each `quote` are read.
  reviews: {
    title: L("في بيوتهم", "In their homes"),
    items: [
      { quote: L("الأباجورة الأرضي غيّرت الليفنج خالص. نورها دافي ومش بيزغلل.", "The floor lamp changed the living room completely. Warm light, never glaring.") },
      { quote: L("الفني ركّب النجفة في نص ساعة ونضّف وراه.", "The electrician hung the pendant in half an hour and cleaned up after himself.") },
      { quote: L("بعتلهم صور الشقة ورجعولي بخطة إضاءة لكل أوضة ببلاش.", "I sent photos of my flat and got a free lighting plan for every room.") },
    ],
  },
  footer: { line: L("أباجورات بتدفّي الأوضة، ولمبة ببلاش مع كل أباجورة.", "Lamps that make a room feel warm, with a free bulb in every box.") },
  about: {
    line: L("محل إضاءة في الزمالك من ٢٠١٥.", "A lighting shop in Zamalek since 2015."),
    alt: L("أباجورات منورة في أوضة فاضية", "Lit lamps in an empty room"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("النور بيعمل الأوضة", "Light makes the room"),
    text: L("بنختار أباجورات بنور دافي، وكل واحدة معاها لمبة ببلاش ونقدر نركبهالك.", "We pick lamps with warm light; each comes with a free bulb and we can install it for you."),
    more: L("وابعتلنا صور بيتك ونعملك خطة إضاءة ببلاش.", "Send us photos of your home for a free lighting plan."),
    // Goes to the whole catalog.
    cta: L("تسوق الإضاءة", "Shop lighting"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("١٤ شارع البرازيل، الزمالك.", "14 Brazil St, Zamalek."),
    heading: L("احجز فني تركيب", "Book an installer"),
  },
  faq: {
    line: L("اللمبات والتركيب والتوصيل.", "Bulbs, installation and delivery."),
    question: L("اللمبة بتيجي مع الأباجورة؟", "Does the lamp come with a bulb?"),
    answer: L("أيوه، كل أباجورة معاها لمبة ليد دافية ببلاش.", "Yes, every lamp comes with a free warm LED bulb."),
  },
  custom: {
    // The store's short name, as it reads inside a sentence: "About Nour" (the footer link, the about page's title and its SEO title).
    "store-short": L("نور", "Nour"),
    // The hero's giant word behind the store's first featured product: ONE short word (Latin capitals in English), never a phrase.
    "hero-word": L("نور", "LIGHT"),
    // The services block: a title of two to four words and one line saying who does the work and where.
    "service-title": L("بنعلقهالك", "We hang it for you"),
    "service-line": L("فني كهربا من عندنا بيركّب ويظبط، في القاهرة والجيزة.", "Our own electrician installs and sets it up, in Cairo and Giza."),
    // Four service cards: a name of two or three words, one line, and a price as the store really charges it ("From EGP 250", "Free").
    "service-1-title": L("تركيب سقف", "Ceiling installation"),
    "service-1-line": L("نجف ومعلقات، ومعاها تثبيت السقف.", "Pendants and chandeliers, ceiling fixing included."),
    "service-1-price": L("من ٢٥٠ ج.م", "From EGP 250"),
    "service-2-title": L("أباليك حيطة", "Wall lights"),
    "service-2-line": L("تركيب ابليك وتوصيله من غير تكسير الحيطة.", "Fitting and wiring a wall light without breaking the wall."),
    "service-2-price": L("من ١٥٠ ج.م", "From EGP 150"),
    "service-3-title": L("خطة إضاءة", "Lighting plan"),
    "service-3-line": L("ابعت صور الأوض ونرجعلك بخطة لكل أوضة.", "Send photos of your rooms and get a room-by-room plan."),
    "service-3-price": L("ببلاش", "Free"),
    "service-4-title": L("دِمر للإضاءة", "Dimmer fitting"),
    "service-4-line": L("نركّب مفتاح دِمر عشان تتحكم في النور.", "We fit a dimmer switch so you control the glow."),
    "service-4-price": L("من ١٩٩ ج.م", "From EGP 199"),
  },
  // The look's only photo block is the about page's (4:5), on a dark page. The hero shows the first featured product's own photo.
  photos: { story: PHOTOS.lampDisplay },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Best seller, Services, Reviews) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const short = c.custom["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  const s = (key: string) => c.custom[`service-${key}`]!;

  const header = lib("header-brand-bar", {
    text: { "م": initialOf(name), "اسم متجرك": name, "ابحث في المتجر": c.labels.search },
  });

  const footer = lib("footer-centered", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "من نحن": aboutName,
    },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const home: Design[] = [
    lib("hero-big-word", { text: { "جديد": c.custom["hero-word"]!, "اطلبها": c.hero.cta } }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    lib("products-feature", {
      text: { "اختيارنا ليك": c.products.primary.title, "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
      lists: [undefined, { source: journey.primary }],
    }),
    lib("service-cards", {
      text: {
        "الخدمات": L("الخدمات", "Services"),
        "خدمات بعد البيع": s("title"),
        "عشان جهازك يفضل شغال زي الجديد.": s("line"),
        "تركيب في البيت": s("1-title"),
        "نركّب الشاشة أو الرسيفر ونظبط القنوات.": s("1-line"),
        "من ٢٥٠ ج.م": s("1-price"),
        "صيانة وإصلاح": s("2-title"),
        "تغيير بطارية أو شاشة في نفس اليوم.": s("2-line"),
        "من ١٥٠ ج.م": s("2-price"),
        "استبدل القديم": s("3-title"),
        "جيب جهازك القديم وخد خصم على الجديد.": s("3-line"),
        "مجانًا": s("3-price"),
        "مد الضمان": s("4-title"),
        "سنة أو سنتين زيادة على ضمان الوكيل.": s("4-line"),
        "من ١٩٩ ج.م": s("4-price"),
      },
    }),
    ...(reviews
      ? [
          lib("testimonials-ruled", {
            text: {
              "آراء العملاء": L("الآراء", "Reviews"),
              "قالوا عننا": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews.items[1]!.quote,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
            },
          }),
        ]
      : []),
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
      href: SHOP,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
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
  description: L("أباجورات بتدفّي الأوضة.", "Lamps that make a room feel warm."),
  categories: [
    ["floor", "أباجورات أرضي", "Floor lamps", PHOTOS.floorRoom],
    ["table", "أباجورات مكتب", "Table lamps", PHOTOS.classicTable],
    ["ceiling", "نجف ومعلقات", "Pendants", PHOTOS.wovenPendants],
    ["decor", "ديكور", "Decor", PHOTOS.vaseCandles],
    ["mosaic", "لمبات موزاييك", "Mosaic lamps", PHOTOS.mosaicLamps],
  ],
  products: [
    ["linen-floor-lamp", "floor", "أباجورة كتان أرضي", "Linen Floor Lamp", PHOTOS.swingFloor, 2600, { rating: 4.8, sold90: 96 }],
    ["pleated-floor-lamp", "floor", "أباجورة أرضي بليسيه", "Pleated Floor Lamp", PHOTOS.pleatedFloor, 4800, { compareAtPrice: 5400, isFeatured: true, sold90: 21 }],
    ["ceramic-table-lamp", "table", "أباجورة قاعدة سيراميك", "Ceramic Table Lamp", PHOTOS.ceramicTable, 1900, { rating: 4.7, sold90: 44 }],
    ["brass-table-lamp", "table", "أباجورة نحاس", "Brass Table Lamp", PHOTOS.brassTable, 2200, { sold90: 33 }],
    ["desk-lamp", "table", "لمبة مكتب سودا", "Black Desk Lamp", PHOTOS.deskLamps, 950, { sold90: 58 }],
    ["rattan-pendant-trio", "ceiling", "٣ معلقات خوص", "Rattan Pendant Trio", PHOTOS.rattanPendants, 3400, { sold90: 27 }],
    ["glass-pendant", "ceiling", "معلقة إزاز", "Glass Pendant", PHOTOS.glassPendant, 1250, { sold90: 40 }],
    ["cone-pendant-set", "ceiling", "طقم معلقات مخروط", "Cone Pendant Set", PHOTOS.conePendants, 2800, { inStock: false, sold90: 12 }],
    ["mosaic-lamp", "mosaic", "أباجورة موزاييك", "Mosaic Lamp", PHOTOS.mosaicLamps, 1450, { sold90: 36 }],
    ["vase-candle-trio", "decor", "فازة وشموع", "Vase & Candle Trio", PHOTOS.vaseCandles, 690, { rating: 4.9, sold90: 120 }],
  ],
});

export const NOUR = editionTemplate({
  key: NOUR_KEY,
  version: 3,
  changelog: "Nour v3: categories, wide hero photo, one service block",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-perks"], copy: { reviews: L("من بيوت منوّرة", "From lit-up homes"), related: L("إضاءة تكمّل المكان", "Lighting to finish the room") } },
  name: L("نور", "Nour"),
  description: L(
    "محل إضاءة بصفحة رئيسية غامقة: كلمة كبيرة، الأكتر نوراً، خدمة التركيب والتقسيط. أربع صفحات جاهزة.",
    "Lighting shop with a dark home page: one big word, most lit, installation services and instalments. Four ready pages.",
  ),
  category: "home",
  style: ["luxe", "bold"],
  sortOrder: 780,
  palette: ["#1a1714", "#24201c", "#f5d38a", "#e0a33c"],
  colors: {
    primary: "#e0a33c",
    secondary: "#24201c",
    background: "#1a1714",
    foreground: "#f6efe4",
    muted: "#c2b6a6",
    border: "#36302a",
    accent: "#f5d38a",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 16,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "footer.line",
    "about",
    "contact",
    "faq",
    "custom.store-short",
    "custom.hero-word",
    "custom.service-title",
    "custom.service-line",
    "custom.service-1-title",
    "custom.service-1-line",
    "custom.service-1-price",
    "custom.service-2-title",
    "custom.service-2-line",
    "custom.service-2-price",
    "custom.service-3-title",
    "custom.service-3-line",
    "custom.service-3-price",
    "custom.service-4-title",
    "custom.service-4-line",
    "custom.service-4-price",
    "photos.story",
  ],
  // Buyer quotes are demo claims: a pack writes real ones or leaves the group out (the section is then not built).
  optional: ["reviews"],
  // The page is dark: an edition's `photos.dark` replaces its light photos.
  dark: true,
  // One featured product, then four best sellers beside it; no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
