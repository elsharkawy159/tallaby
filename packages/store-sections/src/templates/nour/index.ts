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
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

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

const header = lib("header-brand-bar", {
  text: { "م": L("ن", "N"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن أباجورة، نجفة، شمعة…", "Search lamps, pendants, candles…") },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("أباجورات بتدفّي الأوضة، ولمبة ببلاش مع كل أباجورة.", "Lamps that make a room feel warm, with a free bulb in every box."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نور لايتنج. كل الحقوق محفوظة.", "© 2026 Nour Lighting. All rights reserved."),
    "من نحن": L("عن نور", "About Nour"),
  },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("نور", "LIGHT"), "اطلبها": L("نوّر بيتك", "Light your home") } }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("نوّر كل أوضة", "Light every room") } }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر نوراً", "Most lit"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("service-cards", {
    text: {
      "الخدمات": L("الخدمات", "Services"),
      "خدمات بعد البيع": L("بنعلقهالك", "We hang it for you"),
      "عشان جهازك يفضل شغال زي الجديد.": L("فني كهربا من عندنا بيركّب ويظبط، في القاهرة والجيزة.", "Our own electrician installs and sets it up, in Cairo and Giza."),
      "تركيب في البيت": L("تركيب سقف", "Ceiling installation"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("نجف ومعلقات، ومعاها تثبيت السقف.", "Pendants and chandeliers, ceiling fixing included."),
      "من ٢٥٠ ج.م": L("من ٢٥٠ ج.م", "From EGP 250"),
      "صيانة وإصلاح": L("أباليك حيطة", "Wall lights"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("تركيب ابليك وتوصيله من غير تكسير الحيطة.", "Fitting and wiring a wall light without breaking the wall."),
      "من ١٥٠ ج.م": L("من ١٥٠ ج.م", "From EGP 150"),
      "استبدل القديم": L("خطة إضاءة", "Lighting plan"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("ابعت صور الأوض ونرجعلك بخطة لكل أوضة.", "Send photos of your rooms and get a room-by-room plan."),
      "مجانًا": L("ببلاش", "Free"),
      "مد الضمان": L("دِمر للإضاءة", "Dimmer fitting"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("نركّب مفتاح دِمر عشان تتحكم في النور.", "We fit a dimmer switch so you control the glow."),
      "من ١٩٩ ج.م": L("من ١٩٩ ج.م", "From EGP 199"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("في بيوتهم", "In their homes"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الأباجورة الأرضي غيّرت الليفنج خالص. نورها دافي ومش بيزغلل.",
        "The floor lamp changed the living room completely. Warm light, never glaring.",
      ),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "الفني ركّب النجفة في نص ساعة ونضّف وراه.",
        "The electrician hung the pendant in half an hour and cleaned up after himself.",
      ),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("بعتلهم صور الشقة ورجعولي بخطة إضاءة لكل أوضة ببلاش.", "I sent photos of my flat and got a free lighting plan for every room."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نور", "About Nour"), L("محل إضاءة في الزمالك من ٢٠١٥.", "A lighting shop in Zamalek since 2015.")),
  aboutStory(lib, {
    photo: PHOTOS.lampDisplay,
    alt: L("أباجورات منورة في أوضة فاضية", "Lit lamps in an empty room"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("النور بيعمل الأوضة", "Light makes the room"),
    text: L("بنختار أباجورات بنور دافي، وكل واحدة معاها لمبة ببلاش ونقدر نركبهالك.", "We pick lamps with warm light; each comes with a free bulb and we can install it for you."),
    more: L("وابعتلنا صور بيتك ونعملك خطة إضاءة ببلاش.", "Send us photos of your home for a free lighting plan."),
    button: L("تسوق الإضاءة", "Shop lighting"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أباجورات بتدفّي الأوضة.", "Lamps that make a room feel warm."),
  categories: [
    ["floor", "أباجورات أرضي", "Floor lamps", PHOTOS.floorRoom],
    ["table", "أباجورات مكتب", "Table lamps", PHOTOS.classicTable],
    ["ceiling", "نجف ومعلقات", "Pendants", PHOTOS.wovenPendants],
    ["decor", "ديكور", "Decor", PHOTOS.vaseCandles],
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
    ["mosaic-lamp", "decor", "أباجورة موزاييك", "Mosaic Lamp", PHOTOS.mosaicLamps, 1450, { sold90: 36 }],
    ["vase-candle-trio", "decor", "فازة وشموع", "Vase & Candle Trio", PHOTOS.vaseCandles, 690, { rating: 4.9, sold90: 120 }],
  ],
});

export const NOUR = libraryTemplate({
  key: NOUR_KEY,
  version: 3,
  changelog: "Nour v3: categories, wide hero photo, one service block",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للإضاءة", "Back to the lights"), reviews: L("من بيوت منوّرة", "From lit-up homes"), related: L("إضاءة تكمّل المكان", "Lighting to finish the room") } },
  name: L("نور", "Nour"),
  description: L(
    "محل إضاءة بصفحة رئيسية غامقة: كلمة كبيرة، الأكتر نوراً، خدمة التركيب والتقسيط. أربع صفحات جاهزة.",
    "Lighting shop with a dark home page: one big word, most lit, installation services and instalments. Four ready pages.",
  ),
  category: "home",
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
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نور", "About"), seo: { title: L("عن نور", "About Nour") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٤ شارع البرازيل، الزمالك.", "14 Brazil St, Zamalek."),
        heading: L("احجز فني تركيب", "Book an installer"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("اللمبات والتركيب والتوصيل.", "Bulbs, installation and delivery."),
        question: L("اللمبة بتيجي مع الأباجورة؟", "Does the lamp come with a bulb?"),
        answer: L("أيوه، كل أباجورة معاها لمبة ليد دافية ببلاش.", "Yes, every lamp comes with a free warm LED bulb."),
      }),
    },
  ],
  demo: DEMO,
});
