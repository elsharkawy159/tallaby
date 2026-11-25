/**
 * Halawa (template 72, oriental sweets; Claude Design "Storefront
 * Templates"): warm ivory paper, a caramel brown for actions and a honey
 * yellow highlight, Lalezar headings over Tajawal text and round 20px
 * corners. A family sweets shop since 1975: campaign tickets, what are you
 * craving, gifts for every visit, the most ordered, fifty years of trays
 * and questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): pistachio basbousa,
 * konafa, konafa nests, a qatayef platter, maamoul, butter cookies in a tin,
 * meshabek, syrup balls, dates, a pudding bowl and a tea pot on a mat. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HALAWA_KEY = "halawa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HALAWA_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  basbousa: pexels(10395259, 900),
  basbousaWide: pexels(10395259),
  konafa: pexels(36691304, 900),
  nests: pexels(25810607, 900),
  qatayef: pexels(36355419, 900),
  maamoul: pexels(17255896, 900),
  cookies: pexels(5985991, 900),
  meshabek: pexels(39852669, 900),
  syrupBalls: pexels(15014918, 900),
  dates: pexels(36094809, 900),
  pudding: pexels(29177191, 900),
  teaWide: pexels(32148345),
};

const NAME = L("حلاوة زمان", "Halawet Zaman");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("الحلويات", "Sweets"),
    "العروض": L("علب الهدايا", "Gift boxes"),
    "المدونة": L("حكايتنا", "Our story"),
  },
  links: { "/products": [SHOP, search("بوكس")], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "اشترك في النشرة": L("حلويات المواسم أولًا بأول", "Seasonal sweets as they arrive"),
    "منتجات جديدة وأخبار المتجر.": L("علب حلويات رمضان والعيد وأصناف الموسم.", "Ramadan and Eid sweet boxes and seasonal items."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حلاوة زمان. كل الحقوق محفوظة.", "© 2026 Halawet Zaman. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QA = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("متى تُحضَّر الحلويات؟", "When are the sweets made?"),
  "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": L(
    "تُحضَّر الحلويات على دفعات طازجة، وتفاصيل كل صنف في صفحته.",
    "Sweets are made in fresh batches, with each item’s details on its page.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("كم مدة حفظ الحلويات؟", "How long do they keep?"),
  "تواصل معنا في أقرب وقت لنراجع طلبك.": L(
    "البسبوسة والكنافة ٣ أيام في الثلاجة، والغريبة والكحك أسبوعان في علبة مغلقة.",
    "Basbousa and konafa 3 days in the fridge; ghorayeba and kahk two weeks in a closed tin.",
  ),
  "كم يستغرق التوصيل؟": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
  "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": L(
    "تظهر تكلفة الشحن ومدته عند إتمام الطلب.",
    "Shipping cost and time are shown at checkout.",
  ),
  "إلى أين يتوفر التوصيل؟": L("إلى أين يتوفر التوصيل؟", "Where do you deliver?"),
  "تظهر مناطق التوصيل المتاحة عند إتمام الطلب.": L("تظهر مناطق التوصيل المتاحة عند إتمام الطلب.", "Delivery areas are shown at checkout."),
  "ما طرق الدفع المتاحة؟": L("هل يمكنني إضافة ملاحظة على الطلب؟", "Can I add a note to my order?"),
  "تظهر طرق الدفع المتاحة عند إتمام الطلب.": L(
    "نعم، اكتب ملاحظتك في خانة ملاحظات الطلب عند إتمامه.",
    "Yes, write it in the order notes at checkout.",
  ),
} as const;

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.basbousaWide, PHOTOS.qatayef, PHOTOS.dates],
    text: {
      "صورة الحملة": L("صينية بسبوسة بالفستق", "A tray of pistachio basbousa"),
      "مجموعة الخريف": L("حلويات شرقية", "Oriental sweets"),
      "ألوان هادئة لأيام أطول": L("بسبوسة وكنافة وكحك", "Basbousa, konafa and kahk"),
      "تسوّق المجموعة": L("تسوق الصواني", "Shop trays"),
      "مختارات الأسبوع": L("علب حلويات لكل زيارة", "Boxes for every visit"),
      "هدايا مختارة": L("بلح وكحك رمضان", "Ramadan dates and kahk"),
    },
    links: { "/products": [search("صينية"), search("بوكس"), search("رمضان")] },
  }),
  lib("categories-stories", {
    photo: [PHOTOS.basbousa, PHOTOS.konafa, PHOTOS.qatayef, PHOTOS.maamoul, PHOTOS.cookies, PHOTOS.meshabek, PHOTOS.syrupBalls, PHOTOS.dates],
    text: {
      "الأقسام": L("ماذا تشتهي؟", "What are you craving?"),
      "الكل": L("كل الحلويات", "All sweets"),
      "وصل حديثًا": L("بسبوسة", "Basbousa"),
      "الأكثر مبيعًا": L("كنافة", "Konafa"),
      "العروض": L("قطايف", "Qatayef"),
      "هدايا": L("كحك ومعمول", "Kahk & maamoul"),
      "إكسسوارات": L("غريبة", "Ghorayeba"),
      "أساسيات": L("مشبك", "Meshabek"),
      "مجموعات": L("لقمة القاضي", "Luqmet el adi"),
      "الموسم الجديد": L("بلح", "Dates"),
    },
    links: {
      "/products": [SHOP, search("بسبوسة"), search("كنافة"), search("قطايف"), search("كحك"), search("غريبة"), search("مشبك"), search("لقمة"), search("بلح")],
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر طلبًا", "Most ordered"),
      "أحدث المنتجات في المتجر.": L("الصواني التي يعود إليها عملاؤنا.", "The trays our customers come back for."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("team-timeline", {
    text: {
      "رحلتنا": L("قصتنا", "Our story"),
      "من ٢٠١٩ حتى اليوم": L("حكاية صوانينا", "The story of our trays"),
      "٢٠١٩": L("١٩٧٥", "1975"),
      "أول ١٠ طلبات": L("أول محل في شبرا", "First shop in Shubra"),
      "٢٠٢١": L("١٩٩٨", "1998"),
      "أول مخزن": L("فرن ثانٍ", "A second oven"),
      "٢٠٢٣": L("٢٠٢٠", "2020"),
      "أقسام جديدة وتشكيلة أوسع": L("تشكيلة أوسع", "A wider range"),
      "متجرنا الإلكتروني الجديد": L("متجر إلكتروني", "Online store"),
    },
  }),
  // v3 (2026-11-25, owner): the store's 1st category as a carousel after the story.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("faq-columns", { as: "faq-home", text: { "أسئلة شائعة": L("أسئلة", "Questions"), ...QA } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن حلاوة زمان", "About Halawet Zaman"), L("حلويات شرقية: بسبوسة وكنافة وكحك.", "Oriental sweets: basbousa, konafa and kahk.")),
  aboutStory(lib, {
    photo: PHOTOS.teaWide,
    alt: L("براد شاي على مفرش خوص", "A tea pot on a woven mat"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("وصفات الحلويات الشرقية", "Classic oriental recipes"),
    text: L("بسبوسة وكنافة وغريبة وكحك بالسمن البلدي، في صوانٍ وعلب بأحجام مختلفة.", "Basbousa, konafa, ghorayeba and kahk made with ghee, in trays and boxes of several sizes."),
    more: L("تواصل معنا لأي سؤال عن أصنافنا.", "Contact us with any question about our sweets."),
    button: L("تسوق الصواني", "Shop trays"),
    href: search("صينية"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بسبوسة وكنافة وغريبة وكحك.", "Basbousa, konafa, ghorayeba and kahk."),
  categories: [
    ["trays", "صواني", "Trays", PHOTOS.basbousa],
    ["boxes", "علب هدايا", "Gift boxes", PHOTOS.qatayef],
    ["bakes", "مخبوزات", "Bakes", PHOTOS.cookies],
  ],
  products: [
    ["basbousa-tray", "trays", "صينية بسبوسة بالفستق", "Pistachio Basbousa Tray", PHOTOS.basbousa, 280, { isFeatured: true, rating: 4.9, sold90: 300 }],
    ["mixed-sweets-box", "boxes", "علبة حلويات مشكلة", "Mixed Sweets Box", PHOTOS.qatayef, 450, { sold90: 180 }],
    ["ghorayeba-500g", "bakes", "غريبة، ٥٠٠ جم", "Ghorayeba, 500 g", PHOTOS.cookies, 190, { sold90: 140 }],
    ["konafa-cream", "trays", "كنافة بالقشطة", "Konafa with Cream", PHOTOS.konafa, 340, { compareAtPrice: 390, sold90: 96 }],
    ["ramadan-box", "boxes", "علبة رمضان", "Ramadan Box", PHOTOS.dates, 890, { isFeatured: true, sold90: 61 }],
    ["konafa-nests", "trays", "عش البلبل بالفستق", "Pistachio Konafa Nests", PHOTOS.nests, 360, { rating: 4.8, sold90: 88 }],
    ["maamoul-kahk", "bakes", "كحك ومعمول، ١ كجم", "Kahk & Maamoul, 1 kg", PHOTOS.maamoul, 320, { sold90: 120 }],
    ["meshabek", "bakes", "مشبك، ٥٠٠ جم", "Meshabek, 500 g", PHOTOS.meshabek, 120, { sold90: 70 }],
    ["luqmet-el-adi", "trays", "لقمة القاضي", "Luqmet el Adi", PHOTOS.syrupBalls, 150, { sold90: 64 }],
    ["om-ali", "trays", "أم علي بالمكسرات", "Om Ali with Nuts", PHOTOS.pudding, 210, { inStock: false, sold90: 40 }],
  ],
});

export const HALAWA = libraryTemplate({
  key: HALAWA_KEY,
  version: 3,
  changelog: "Halawa v3: products by category as a carousel on the home",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل طلبك", "Complete your order") } },
  name: L("حلاوة", "Halawa"),
  description: L(
    "حلويات شرقية: حملات الموسم، الأصناف، هدايا لكل زيارة، الأكثر طلبًا وحكاية المتجر. أربع صفحات جاهزة.",
    "Oriental sweets: seasonal campaigns, what are you craving, gifts for every visit, the most ordered and the shop’s story. Four ready pages.",
  ),
  category: "sweets",
  style: ["classic", "warm"],
  sortOrder: 720,
  palette: ["#fff9f0", "#fbe9cf", "#f9c74f", "#b45309"],
  colors: {
    primary: "#b45309",
    secondary: "#fbe9cf",
    background: "#ffffff",
    foreground: "#2e1a0c",
    muted: "#6b5440",
    border: "#f0d7b2",
    accent: "#f9c74f",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن حلاوة زمان", "About"), seo: { title: L("عن حلاوة زمان", "About Halawet Zaman") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٧ شارع شبرا، القاهرة.", "7 Shubra St, Cairo."),
        heading: L("اطلب صينية لمناسبة", "Order a tray for an occasion"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطزاجة والحفظ والهدايا.", "Freshness, storage and gifts."),
        question: L("هل يمكن إرجاع الحلويات؟", "Can sweets be returned?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
