/**
 * Moto (template 38, motorcycle riding gear; Claude Design "Storefront
 * Templates"): warm grey paper, near-black type and a racing red for
 * actions, Changa throughout and tight 4px corners. A riders' shop: a split hero
 * on a helmet, the garage's categories, riders' favourites, why certified
 * only, most ordered, certified brands, the bike's own kit as a carousel
 * (the store's 3rd category) and good to know. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): helmets resting on
 * seats, gloves, a leather jacket on a hook, grips and a rear wheel. No
 * riders, no hands and no motorcycle badges.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MOTO_KEY = "moto";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MOTO_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  openHelmet: pexels(17533722, 900),
  whiteHelmet: pexels(30817488, 900),
  whiteHelmetWide: pexels(30817488),
  glovesSeat: pexels(18171625, 900),
  glovesMono: pexels(33582592, 900),
  jacket: pexels(8113002, 900),
  grips: pexels(20522567, 900),
  rearWheel: pexels(32683778, 900),
  twoBikes: pexels(19376383, 900),
  ventMount: pexels(13536013, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("موتو كلوب", "Moto Club");

const BRANDS = ["Apex Helmets", "Ridgeline", "Nile Moto", "Torq Gear"];

const header = lib("header-search", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن خوذة، قفازات، سترة…", "Search helmets, gloves, jackets…"),
    "العروض": L("خوذ", "Helmets"),
    "هدايا": L("قفازات", "Gloves"),
    "إكسسوارات": L("سترات", "Jackets"),
    "صور ومواصفات لكل منتج": L("خوذ وقفازات وسترات للركوب", "Helmets, gloves and riding jackets"),
  },
  links: { "/products": [undefined, NEW, BEST, search("خوذة"), search("جوانتي"), search("جاكيت")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ موتو كلوب. كل الحقوق محفوظة.", "© 2026 Moto Club. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QUESTIONS = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("كيف أعرف مقاس الخوذة؟", "How do I find my helmet size?"),
  "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": L(
    "استخدم شريط قياس وقارن المقاس بجدول المقاسات في صفحة المنتج.",
    "Measure with a tape and match the size chart on the product page.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("هل يمكنني تعديل طلبي أو إلغاؤه؟", "Can I change or cancel my order?"),
  "تواصل معنا في أقرب وقت لنراجع طلبك.": L("تواصل معنا في أقرب وقت لنراجع طلبك.", "Contact us as soon as possible so we can review your order."),
  "كم يستغرق التوصيل؟": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
  "إلى أين يتوفر التوصيل؟": L("هل الخوذ معتمدة؟", "Are the helmets certified?"),
  "تظهر مناطق التوصيل المتاحة عند إتمام الطلب.": L("يُذكر معيار الاعتماد مثل ECE أو DOT في تفاصيل الخوذة إن وُجد.", "Any certification such as ECE or DOT is listed in the helmet’s details."),
} as const;

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.whiteHelmetWide],
    text: {
      "صورة الواجهة": L("خوذة بيضاء على دراجة نارية في مرآب", "A white helmet on a motorcycle in a garage"),
      "المجموعة الجديدة": L("خوذ وأدوات ركوب", "Helmets and riding gear"),
      "مختارة بعناية": L("أدوات ركوب الدراجات النارية", "Motorcycle riding gear"),
      "قطع مختارة بعناية، لكل قطعة تفاصيلها المميزة.": L(
        "خوذ وقفازات وسترات ركوب بمقاسات واضحة.",
        "Helmets, gloves and riding jackets with clear sizing.",
      ),
      "تسوّق المجموعة": L("تسوق الخوذ", "Shop helmets"),
      "حكايتنا": L("من نحن", "About us"),
    },
    links: { "/products": search("خوذة") },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("الأقسام", "Categories"), "تسوق بالقسم": L("جهّز نفسك", "Gear up") } }),
  lib("products-feature", {
    text: { "اختيارنا لك": L("اختيارات الراكبين", "Riders’ favourites"), "اختيار الأسبوع": L("اختيار الشهر", "Pick of the month") },
  }),
  lib("text-lead", {
    text: {
      "بدأنا المتجر لنجمع منتجات جيدة بسعر عادل في مكان واحد.": L(
        "نختار خوذًا وأدوات ركوب بمواصفات واضحة.",
        "We choose helmets and riding gear with clear specs.",
      ),
      "نختار كل منتج بعناية، ونعرض تفاصيله ومقاساته بوضوح.": L(
        "ونعرض لكل خوذة مقاساتها ومواصفاتها.",
        "Each helmet lists its sizes and specs.",
      ),
      "وإذا كان لديك أي سؤال، تواصل معنا.": L(
        "وسترات وقفازات ركوب بطبقات حماية.",
        "And riding jackets and gloves with protective padding.",
      ),
    },
  }),
  lib("products-rail", {
    text: { "المفضلة لدى العملاء": L("المفضلة لدى العملاء", "Customer favourites"), "الأكثر مبيعًا": L("الأكثر طلبًا", "Most ordered") },
    links: { "/products": BEST },
  }),
  lib("brands-cards", {
    text: {
      "الماركات": L("ماركات مختارة", "Chosen brands"),
      "تسوّق حسب الماركة": L("تسوق بالماركة", "Shop by brand"),
      "فولتا": BRANDS[0]!,
      "٤٢": L("٢٤", "24"),
      "نورو": BRANDS[1]!,
      "١٨": L("١٦", "16"),
      "كيان": BRANDS[2]!,
      "٢٧": L("٣١", "31"),
      "ساحل": BRANDS[3]!,
      "٩": L("١١", "11"),
    },
    links: { "/products": [undefined, ...BRANDS.map(search)] },
  }),
  // The store's 3rd category (for the bike, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [{ offset: 2 }, { categoryIndex: 3, limit: 4 }] }),
  lib("faq-numbered", {
    text: {
      "قبل أن تطلب": L("قبل أن تطلب", "Before you order"),
      "أسئلة مهمة": L("أسئلة مهمة", "Good to know"),
      ...QUESTIONS,
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن موتو كلوب", "About Moto Club"), L("خوذ وأدوات ركوب للدراجات النارية.", "Helmets and riding gear for motorcycles.")),
  aboutStory(lib, {
    photo: PHOTOS.whiteHelmetWide,
    alt: L("خوذة بيضاء على دراجة نارية في مرآب", "A white helmet on a motorcycle in a garage"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات ركوب مختارة", "Chosen riding gear"),
    text: L("خوذ وقفازات وسترات وقطع للدراجة، بمقاسات ومواصفات واضحة.", "Helmets, gloves, jackets and bike parts with clear sizes and specs."),
    more: L("تواصل معنا لأي سؤال عن المقاس أو الموديل.", "Contact us with any question about size or model."),
    button: L("تسوق الخوذ", "Shop helmets"),
    href: search("خوذة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خوذ وأدوات ركوب للدراجات النارية.", "Helmets and motorcycle riding gear."),
  categories: [
    ["helmets", "خوذ", "Helmets", PHOTOS.openHelmet],
    ["gloves-jackets", "قفازات وسترات", "Gloves & jackets", PHOTOS.glovesSeat],
    ["bike", "للدراجة", "For the bike", PHOTOS.grips],
    ["jackets", "سترات", "Jackets", PHOTOS.jacket],
    ["parts", "قطع غيار", "Parts", PHOTOS.rearWheel],
    ["mounts", "حوامل هواتف", "Phone mounts", PHOTOS.ventMount],
    ["power", "بطاريات وشواحن", "Charging", PHOTOS.powerBank],
    ["riding-sets", "أطقم ركوب", "Riding sets", PHOTOS.twoBikes],
  ],
  products: [
    ["retro-open-helmet", "helmets", "خوذة ريترو مفتوحة", "Retro Open-Face Helmet", PHOTOS.openHelmet, 3400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["white-full-face-helmet", "helmets", "خوذة كاملة بيضاء", "White Full-Face Helmet", PHOTOS.whiteHelmet, 4900, { compareAtPrice: 5750, rating: 4.9, sold90: 88 }],
    ["leather-riding-gloves", "gloves-jackets", "قفازات ركوب جلد", "Leather Riding Gloves", PHOTOS.glovesSeat, 950, { sold90: 170 }],
    ["armoured-gloves", "gloves-jackets", "قفازات ركوب مدعّمة", "Armoured Riding Gloves", PHOTOS.glovesMono, 1250, { isFeatured: true, sold90: 104 }],
    ["shearling-riding-jacket", "jackets", "سترة جلد بفرو", "Shearling Riding Jacket", PHOTOS.jacket, 6800, { rating: 4.7, sold90: 32 }],
    ["comfort-grips", "bike", "مقابض مريحة", "Comfort Grips", PHOTOS.grips, 420, { sold90: 140 }],
    ["brake-disc-set", "parts", "طقم أقراص فرامل", "Brake Disc Set", PHOTOS.rearWheel, 2100, { inStock: false, sold90: 26 }],
    ["handlebar-phone-mount", "mounts", "حامل هاتف للمقود", "Handlebar Phone Mount", PHOTOS.ventMount, 480, { sold90: 210 }],
    ["ride-power-bank", "power", "بطارية متنقلة للرحلات", "Ride Power Bank", PHOTOS.powerBank, 790, { compareAtPrice: 890, sold90: 64 }],
    ["new-rider-set", "riding-sets", "طقم الراكب الجديد", "New Rider Set", PHOTOS.whiteHelmetWide, 6200, { compareAtPrice: 7100, sold90: 24 }],
    // Three more for the bike, so its carousel fills a row of four (v5).
    ["rear-brake-disc", "bike", "قرص فرامل خلفي", "Rear Brake Disc", PHOTOS.rearWheel, 1250, { sold90: 18 }],
    ["quick-release-phone-mount", "bike", "حامل هاتف سريع الفك", "Quick-Release Phone Mount", PHOTOS.ventMount, 560, { sold90: 16 }],
    ["compact-power-bank", "bike", "بطارية متنقلة صغيرة", "Compact Power Bank", PHOTOS.powerBank, 650, { sold90: 14 }],
  ],
});

export const MOTO = libraryTemplate({
  key: MOTO_KEY,
  version: 6,
  changelog: "Moto v5: a carousel of the bike's own kit (the store's 3rd category) on the home",
  name: L("موتو", "Moto"),
  description: L(
    "أدوات ركوب الدراجات النارية: خوذ، اختيارات الراكبين وماركات مختارة. أربع صفحات جاهزة.",
    "Motorcycle riding gear: helmets, riders' picks and chosen brands. Four ready pages.",
  ),
  category: "auto",
  style: ["bold"],
  sortOrder: 380,
  palette: ["#f1f0ee", "#e2e0dc", "#e23d28", "#141414"],
  colors: {
    primary: "#e23d28",
    secondary: "#e2e0dc",
    background: "#ffffff",
    foreground: "#141414",
    muted: "#5c5a57",
    border: "#d6d3ce",
    accent: "#f9d3cc",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن موتو كلوب", "About"), seo: { title: L("عن موتو كلوب", "About Moto Club") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or order."),
        heading: L("اسأل عن مقاس أو موديل", "Ask about a size or model"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والمواصفات والطلبات.", "Sizes, specs and orders."),
        question: L("هل يمكنني استبدال مقاس الخوذة؟", "Can I swap a helmet size?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", headingCase: "upper", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء الراكبين", "Riders' reviews"), related: L("جهّز قبل الطريق", "Gear up before the ride") } },
});
