/**
 * Kawetch (template 96, tyres and fitting; Claude Design "Storefront
 * Templates"): light grey paper, near-black type and an amber for actions,
 * Changa headings over Cairo text and tight 6px corners. A tyre centre:
 * search by size, fitting at home or at the centre, book a fitting slot,
 * pay in instalments, add-ons while the van is there, and help finding your
 * size. Built from section library designs (`fromLibrary`).
 *
 * The design has no tyre-size filter: sizes are searched as text, so every
 * demo tyre carries its size in its name.
 *
 * Photos: Pexels, each checked by eye (2026-10-21): tyre stacks and treads,
 * a portable inflator, a pressure gauge, rubber floor mats, an action camera
 * and a power bank. No people, no hands, no wheel badges or tyre brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TYRE_KEY = "tyre";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TYRE_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  allTerrain: pexels(36353556, 900),
  tread: pexels(34357288, 900),
  stacks: pexels(11790285, 900),
  stacksWide: pexels(11790285),
  rows: pexels(15392185, 900),
  inflator: pexels(12996982, 900),
  gauge: pexels(39649976, 900),
  floorMat: pexels(28055130, 900),
  camera: pexels(2294894, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("مركز كاوتش", "Kawetch Center");

const header = lib("header-search", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث بالمقاس، مثلاً 205/55 R16", "Search size, e.g. 205/55 R16"),
    "العروض": L("كاوتش ملاكي", "Car tyres"),
    "هدايا": L("دفع رباعي", "4x4 tyres"),
    "إكسسوارات": L("منفاخ وعدة", "Pumps & tools"),
    "توصيل خلال ٤٨ ساعة": L("تركيب وترصيص ببلاش · قسّط على ٦ شهور", "Free fitting and balancing · Pay over 6 months"),
  },
  links: { "/products": [undefined, NEW, BEST, search("كاوتش"), search("دفع رباعي"), search("منفاخ")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مركز كاوتش. كل الحقوق محفوظة.", "© 2026 Kawetch Center. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("مقاس الكاوتش كام؟", "What size are your tyres?"),
      "اكتب اسم المنتج": L("مثلاً 205/55 R16", "e.g. 205/55 R16"),
      "وصل حديثًا": "205/55 R16",
      "الأكثر مبيعًا": "195/65 R15",
      "هدايا": "265/70 R16",
      "العروض": L("منفاخ", "Inflator"),
    },
    links: { "/products": [SHOP, search("205/55 R16"), search("195/65 R15"), search("265/70 R16"), search("منفاخ")] },
  }),
  lib("service-cards", {
    text: {
      "خدمات بعد البيع": L("في البيت أو في المركز", "At home or at the centre"),
      "عشان جهازك يفضل شغال زي الجديد.": L("اختار تركّب فين، والترصيص علينا.", "Choose where to fit; balancing is on us."),
      "تركيب في البيت": L("تركيب في البيت", "Home fitting"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("عربيتنا بتيجي لحد عندك بكل العدة.", "Our van comes to you with all the kit."),
      "من ٢٥٠ ج.م": L("ببلاش فوق ٣٠٠٠ ج.م", "Free over EGP 3,000"),
      "صيانة وإصلاح": L("ترصيص", "Balancing"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("ببلاش مع الكاوتش الجديد.", "Free with new tyres."),
      "من ١٥٠ ج.م": L("مع كل طقم", "With every set"),
      "استبدل القديم": L("ضبط زوايا", "Alignment"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("ضبط بالكمبيوتر في المركز.", "Computer alignment at the centre."),
      "مجانًا": L("من ٣٠٠ ج.م", "From EGP 300"),
      "مد الضمان": L("بدّل القديم", "Trade in old tyres"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("هات الكاوتش القديم وخد خصم على الجديد.", "Bring your old tyres and get money off new ones."),
      "من ١٩٩ ج.م": L("خصم لحد ٤٠٠ ج.م", "Up to EGP 400 off"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز تركيب", "Book fitting"),
      "تركيب شاشة · حوالي ساعة": L("تركيب كاوتش على عنوانك · ٤٥ دقيقة", "Tyre fitting at your address · 45 minutes"),
      "مواعيد الزيارات": L("مواعيد التركيب", "Fitting times"),
      "من السبت للخميس": L("كل يوم ما عدا الجمعة", "Every day except Friday"),
    },
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط الطقم", "Pay for the set monthly"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L(
        "الطقم كامل بالتركيب والترصيص، من غير فوايد ولا مقدم.",
        "The full set with fitting and balancing, no interest and no down payment.",
      ),
    },
    lists: [{ source: "featured" }],
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("وإحنا هناك", "While we are there") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("service-support", {
    text: {
      "الدعم": L("مساعدة", "Help"),
      "محتاج مساعدة؟": L("مش عارف المقاس؟", "Not sure of your size?"),
      "بنرد في أقل من ساعة": L("ابعت صورة جنب الكاوتش", "Send a photo of the tyre sidewall"),
      "زور فرع": L("زور المركز", "Visit the centre"),
      "٣ فروع في القاهرة": L("التجمع الخامس، القاهرة الجديدة", "Fifth Settlement, New Cairo"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مركز كاوتش", "About Kawetch Center"), L("كاوتش بيتركب في البيت أو في المركز.", "Tyres fitted at home or at our centre.")),
  aboutStory(lib, {
    photo: PHOTOS.stacksWide,
    alt: L("رصّات كاوتش في مخزن المركز", "Stacks of tyres in the centre’s store"),
    eyebrow: L("التجمع الخامس", "Fifth Settlement"),
    title: L("الكاوتش الصح، متركب صح", "The right tyre, fitted right"),
    text: L("بدأنا ورشة كاوتش صغيرة، وبعدين جبنا عربية تركيب عشان نوفّر عليك اللف والانتظار.", "We started as a small tyre shop, then added a fitting van to save you the trip and the wait."),
    more: L("كل طقم بيتركب ويترصص ببلاش، وبنقولك المقاس الصح من صورة واحدة.", "Every set is fitted and balanced free, and one photo is enough for us to find your size."),
    button: L("دوّر بالمقاس", "Search by size"),
    href: search("R16"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كاوتش بيتركب في البيت أو في المركز.", "Tyres fitted at home or at our centre."),
  categories: [
    ["tyres", "كاوتش", "Tyres", PHOTOS.allTerrain],
    ["tools", "منفاخ وعدة", "Pumps & tools", PHOTOS.inflator],
    ["extras", "إضافات", "Add-ons", PHOTOS.floorMat],
  ],
  products: [
    ["all-terrain-265-70-r16", "tyres", "كاوتش أوف رود 265/70 R16", "All-Terrain Tyre 265/70 R16", PHOTOS.allTerrain, 5400, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["touring-205-55-r16", "tyres", "كاوتش ملاكي 205/55 R16", "Touring Tyre 205/55 R16", PHOTOS.tread, 3600, { compareAtPrice: 3950, rating: 4.7, sold90: 210 }],
    ["set-of-four-195-65-r15", "tyres", "طقم ٤ كاوتش 195/65 R15", "Set of Four 195/65 R15", PHOTOS.stacks, 12800, { isFeatured: true, sold90: 74 }],
    ["sport-225-45-r17", "tyres", "كاوتش سبور 225/45 R17", "Sport Tyre 225/45 R17", PHOTOS.rows, 4700, { rating: 4.6, sold90: 52 }],
    ["portable-inflator", "tools", "منفاخ كاوتش محمول", "Portable Tyre Inflator", PHOTOS.inflator, 1150, { rating: 4.7, sold90: 160 }],
    ["pressure-gauge", "tools", "عداد ضغط هوا", "Tyre Pressure Gauge", PHOTOS.gauge, 320, { sold90: 140 }],
    ["rubber-floor-mats", "extras", "دواسات كاوتش", "Rubber Floor Mats", PHOTOS.floorMat, 950, { compareAtPrice: 1100, sold90: 120 }],
    ["dash-camera", "extras", "كاميرا تابلوه", "Dash Camera", PHOTOS.camera, 2400, { sold90: 41 }],
    ["jump-power-bank", "extras", "باور بانك للعربية", "Car Power Bank", PHOTOS.powerBank, 790, { inStock: false, sold90: 36 }],
  ],
});

export const TYRE = libraryTemplate({
  key: TYRE_KEY,
  version: 1,
  name: L("كاوتش", "Kawetch"),
  description: L(
    "كاوتش وتركيب: بحث بالمقاس، تركيب في البيت، حجز معاد، تقسيط ومساعدة في المقاس. أربع صفحات جاهزة.",
    "Tyres and fitting: search by size, home fitting, booking, instalments and help with sizes. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 960,
  palette: ["#f4f4f4", "#e4e4e4", "#fde68a", "#f59e0b"],
  colors: {
    primary: "#f59e0b",
    secondary: "#e4e4e4",
    background: "#f4f4f4",
    foreground: "#141414",
    muted: "#555555",
    border: "#d1d1d1",
    accent: "#fde68a",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مركز كاوتش", "About"), seo: { title: L("عن مركز كاوتش", "About Kawetch Center") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("التجمع الخامس، القاهرة الجديدة.", "Fifth Settlement, New Cairo."),
        heading: L("ابعت مقاسك أو صورة الكاوتش", "Send your size or a photo of your tyre"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتركيب والتقسيط.", "Sizes, fitting and instalments."),
        question: L("أعرف مقاس الكاوتش منين؟", "Where do I find my tyre size?"),
        answer: L("مكتوب على جنب الكاوتش، زي 205/55 R16. صوّره وابعتهولنا لو مش متأكد.", "It is printed on the sidewall, like 205/55 R16. Send us a photo if you are not sure."),
      }),
    },
  ],
  demo: DEMO,
});
