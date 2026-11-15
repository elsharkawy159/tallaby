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
    "العروض": L("إطارات ملاكي", "Car tyres"),
    "هدايا": L("إطارات دفع رباعي", "4x4 tyres"),
    "إكسسوارات": L("منفاخ وعُدد", "Pumps & tools"),
    "صور ومواصفات لكل منتج": L("مقاسات ومواصفات واضحة لكل إطار", "Clear sizes and specs for every tyre"),
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
      "عمّ تبحث اليوم؟": L("ما مقاس إطاراتك؟", "What size are your tyres?"),
      "اكتب اسم المنتج": L("مثلاً 205/55 R16", "e.g. 205/55 R16"),
    },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("الإطارات وأدواتها", "Tyres and kit"), "كل الأقسام": L("كل المنتجات", "All products") } }),
  lib("products-rows", {
    text: { "إكسسوارات بأسعار مناسبة": L("الأكثر طلبًا", "Most ordered") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("service-booking", {
    text: {
      "احجز موعد الفني": L("احجز تركيب", "Book fitting"),
      "تركيب شاشة · حوالي ساعة": L("تركيب الإطارات على عنوانك · ٤٥ دقيقة", "Tyre fitting at your address · 45 minutes"),
      "مواعيد الزيارات": L("مواعيد التركيب", "Fitting times"),
      "من السبت إلى الخميس": L("يوميًا عدا الجمعة", "Every day except Friday"),
    },
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط الطقم", "Pay for the set monthly"),
      "بدون فوائد ولا مقدّم مع شركات التقسيط.": L(
        "قسّط طقم الإطارات بدون فوائد ولا مقدّم.",
        "Pay for the tyre set with no interest and no down payment.",
      ),
    },
    lists: [{ source: "featured" }],
  }),
  lib("service-support", {
    text: {
      "الدعم": L("مساعدة", "Help"),
      "هل تحتاج إلى مساعدة؟": L("لا تعرف المقاس؟", "Not sure of your size?"),
      "نرد خلال أقل من ساعة": L("أرسل صورة لجانب الإطار", "Send a photo of the tyre sidewall"),
      "زُر أحد فروعنا": L("زُر المركز", "Visit the centre"),
      "٣ فروع في القاهرة": L("التجمع الخامس، القاهرة الجديدة", "Fifth Settlement, New Cairo"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مركز كاوتش", "About Kawetch Center"), L("إطارات وأدوات ضغط وإكسسوارات للسيارات.", "Tyres, pressure tools and car accessories.")),
  aboutStory(lib, {
    photo: PHOTOS.stacksWide,
    alt: L("رصّات إطارات في مخزن", "Stacks of tyres in a store room"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الإطار المناسب لسيارتك", "The right tyre for your car"),
    text: L("نختار إطارات بمقاسات مختلفة وأدوات للعناية بها، ونكتب المقاس والمواصفات في صفحة كل منتج.", "We choose tyres in many sizes and the tools to care for them, and list the size and specs on every product page."),
    more: L("تواصل معنا لأي سؤال عن المقاس المناسب.", "Contact us with any question about the right size."),
    button: L("ابحث بالمقاس", "Search by size"),
    href: search("R16"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إطارات وأدوات ضغط وإكسسوارات للسيارات.", "Tyres, pressure tools and car accessories."),
  categories: [
    ["tyres", "إطارات", "Tyres", PHOTOS.allTerrain],
    ["tools", "منفاخ وعُدد", "Pumps & tools", PHOTOS.inflator],
    ["extras", "إضافات", "Add-ons", PHOTOS.floorMat],
    ["sets", "أطقم إطارات", "Tyre sets", PHOTOS.stacks],
    ["electronics", "إلكترونيات", "Electronics", PHOTOS.camera],
  ],
  products: [
    ["all-terrain-265-70-r16", "tyres", "إطار للطرق الوعرة 265/70 R16", "All-Terrain Tyre 265/70 R16", PHOTOS.allTerrain, 5400, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["touring-205-55-r16", "tyres", "إطار ملاكي 205/55 R16", "Touring Tyre 205/55 R16", PHOTOS.tread, 3600, { compareAtPrice: 3950, rating: 4.7, sold90: 210 }],
    ["set-of-four-195-65-r15", "sets", "طقم ٤ إطارات 195/65 R15", "Set of Four 195/65 R15", PHOTOS.stacks, 12800, { isFeatured: true, sold90: 74 }],
    ["sport-225-45-r17", "tyres", "إطار رياضي 225/45 R17", "Sport Tyre 225/45 R17", PHOTOS.rows, 4700, { rating: 4.6, sold90: 52 }],
    ["portable-inflator", "tools", "منفاخ إطارات محمول", "Portable Tyre Inflator", PHOTOS.inflator, 1150, { rating: 4.7, sold90: 160 }],
    ["pressure-gauge", "tools", "مقياس ضغط الهواء", "Tyre Pressure Gauge", PHOTOS.gauge, 320, { sold90: 140 }],
    ["rubber-floor-mats", "extras", "دواسات مطاطية", "Rubber Floor Mats", PHOTOS.floorMat, 950, { compareAtPrice: 1100, sold90: 120 }],
    ["dash-camera", "electronics", "كاميرا لوحة القيادة", "Dash Camera", PHOTOS.camera, 2400, { sold90: 41 }],
    ["jump-power-bank", "electronics", "شاحن متنقل للسيارة", "Car Power Bank", PHOTOS.powerBank, 790, { inStock: false, sold90: 36 }],
  ],
});

export const TYRE = libraryTemplate({
  key: TYRE_KEY,
  version: 3,
  changelog: "Tyre v3: categories after the search, tyres before fitting, one service block",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("إضافات لسيارتك", "Add-ons for your car") } },
  name: L("إطارات", "Kawetch"),
  description: L(
    "إطارات وتركيب: بحث بالمقاس، تركيب في العنوان، حجز موعد، تقسيط ومساعدة في المقاس. أربع صفحات جاهزة.",
    "Tyres and fitting: search by size, home fitting, booking, instalments and help with sizes. Four ready pages.",
  ),
  category: "auto",
  style: ["bold"],
  sortOrder: 960,
  palette: ["#f4f4f4", "#e4e4e4", "#fde68a", "#f59e0b"],
  colors: {
    primary: "#f59e0b",
    secondary: "#e4e4e4",
    background: "#ffffff",
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
        heading: L("أرسل مقاسك أو صورة الإطار", "Send your size or a photo of your tyre"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والطلبات والدفع.", "Sizes, orders and payment."),
        question: L("أين أجد مقاس الإطار؟", "Where do I find my tyre size?"),
        answer: L("مكتوب على جانب الإطار، مثل 205/55 R16. تواصل معنا إن لم تكن متأكدًا.", "It is printed on the sidewall, like 205/55 R16. Contact us if you are not sure."),
      }),
    },
  ],
  demo: DEMO,
});
