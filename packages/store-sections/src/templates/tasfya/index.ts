/**
 * Tasfya (template 53, fashion outlet; Claude Design "Storefront Templates"):
 * white paper, black ink, a loud red for actions and a yellow highlight,
 * Lalezar headings over Cairo text and 8px corners. An outlet that shouts:
 * offer ticker, 60% off last season, just dropped, tonight's deal, shop by
 * budget, spend more save more and open before you pay. Built from section
 * library designs (`fromLibrary`).
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
import { demoStore, libraryTemplate, pexels } from "../library-template";

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
const PHONE = L("٠١٠٠ ٢٢٣ ٣٤٤٠", "+20 100 223 3440");

const header = lib("header-search", {
  text: {
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن ماركة أو قطعة…", "Search brands and pieces…"),
    "وصل حديثًا": L("لسه نازل", "Just dropped"),
    "العروض": L("فساتين", "Dresses"),
    "هدايا": L("قمصان وجواكت", "Shirts & jackets"),
    "إكسسوارات": L("شنط", "Bags"),
    "توصيل خلال ٤٨ ساعة": L("خصم لحد ٦٠٪", "Up to 60% off"),
  },
  links: { "/products": [undefined, NEW, BEST, search("فستان"), search("جاكيت"), search("شنطة")] },
});

const footer = lib("footer-help", {
  text: {
    "٠١٠٠ ١٢٣ ٤٥٦٧": PHONE,
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تصفية أوتلت. كل الحقوق محفوظة.", "© 2026 Tasfya Outlet. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": "https://wa.me/201002233440",
    "tel:+201001234567": "tel:+201002233440",
    "/products": [undefined, NEW, BEST, RATED],
  },
});

const home: Design[] = [
  lib("promo-ticker", {
    text: {
      "الكود: SAVE10": L("خصم إضافي ١٠٪: OUT10", "Extra 10% off: OUT10"),
      "توصيل مجاني فوق ١٥٠٠ ج.م": L("خصم لحد ٦٠٪", "Up to 60% off"),
      "خصم ١٥٪ على المجموعات": L("قطع جديدة كل خميس", "New drops every Thursday"),
      "استرجاع خلال ١٤ يومًا": L("تبديل ببلاش خلال ٧ أيام", "Free exchange in 7 days"),
      "الدفع عند الاستلام": L("توصيل مجاني فوق ٨٠٠ ج.م", "Free delivery over EGP 800"),
    },
  }),
  lib("promo-percent", {
    text: {
      "٣٠٪": L("٦٠٪", "60%"),
      "خصم": L("لحد", "Up to"),
      "على كل المنتجات": L("خصم على الموسم اللي فات", "off last season"),
      "لحد آخر الشهر أو لحد ما الكمية تخلص.": L("قطع حقيقية من محلات حقيقية، بأسعار تصفية.", "Real pieces from real shops, priced to clear."),
      "تسوق العرض": L("تسوق الأوتلت", "Shop the outlet"),
    },
  }),
  lib("products-tabbed", {
    text: {
      "المتجر": L("الأوتلت", "Outlet"),
      "منتجاتنا": L("لسه نازل", "Just dropped"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("promo-deal", {
    photo: [undefined, undefined, undefined, PHOTOS.polkaDresses],
    text: {
      "صورة العرض": L("فستانين بولكا ميدي على شماعة خشب", "Two polka midi dresses on wooden hangers"),
      "اسم العرض أو المنتج هنا": L("فستان بولكا ميدي بـ٩٩٠ ج.م", "Polka midi dress for EGP 990"),
      "اكتب سبب العرض وما يحصل عليه العميل في سطر واحد.": L("كان في المحل بـ٢٤٠٠ ج.م، وفاضل منه مقاسات قليلة.", "It was EGP 2,400 in store, and only a few sizes are left."),
      "وفّر ٢٥٪": L("وفّر ٥٩٪", "Save 59%"),
      "ينتهي العرض": L("بينتهي النهارده", "Ends tonight"),
      "الحق العرض": L("الحق العرض", "Grab the deal"),
    },
    links: { "/products": search("فستان") },
  }),
  lib("finder-price-bands", {
    text: {
      "أقل من ٦٠٠": L("أقل من ٥٠٠", "Under 500"),
      "٦٠٠ – ١٬٥٠٠": L("٥٠٠ – ١٬٠٠٠", "500 – 1,000"),
      "أكتر من ١٬٥٠٠": L("أكتر من ١٬٠٠٠", "Over 1,000"),
    },
  }),
  lib("promo-tiers", {
    text: {
      "عرض الشهر": L("جمّع", "Stack it"),
      "كل ما تزود، توفّر أكتر": L("كل ما تزود توفّر أكتر", "Spend more, save more"),
      "١٠٠٠ ج.م": L("٨٠٠ ج.م", "EGP 800"),
      "١٠٠ ج.م": L("٨٠ ج.م", "EGP 80"),
      "٢٠٠٠ ج.م": L("١٥٠٠ ج.م", "EGP 1,500"),
      "٢٥٠ ج.م": L("٢٠٠ ج.م", "EGP 200"),
      "٣٥٠٠ ج.م": L("٢٥٠٠ ج.م", "EGP 2,500"),
      "٥٠٠ ج.م": L("٤٠٠ ج.م", "EGP 400"),
    },
  }),
  lib("pay-open-box", {
    text: {
      "جرّب المنتج قدام المندوب.": L("قيس القطعة وشوفها قدام المندوب.", "Check the piece and try it on in front of the courier."),
      "لو فيه أي مشكلة رجّعه للمندوب ومتدفعش حاجة.": L("لو المقاس مش مظبوط رجّعه للمندوب ومتدفعش حاجة.", "If the size is wrong, hand it back and pay nothing."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تصفية", "About Tasfya"), L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices.")),
  aboutStory(lib, {
    photo: PHOTOS.saleWindow,
    alt: L("فترينة محل فيها رفوف لبس ولافتات تخفيضات", "A shop window with clothing rails and sale signs"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("الموسم اللي فات، بنص التمن", "Last season, at half the price"),
    text: L("بنشتري الكميات اللي فضلت عند المحلات آخر الموسم، ونبيعها بأسعار تصفية.", "We buy what shops have left at the end of each season and sell it at clearance prices."),
    more: L("كل قطعة بتتفحص، ولو فيها علامة صغيرة بنكتبها في الوصف.", "Every piece is checked, and any small mark is written in the description."),
    button: L("تسوق الأوتلت", "Shop the outlet"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices."),
  categories: [
    ["women", "حريمي", "Women", PHOTOS.womenRail],
    ["men", "رجالي", "Men", PHOTOS.jacketRail],
    ["bags", "شنط", "Bags", PHOTOS.shimmerClutch],
    ["basics", "أساسيات", "Basics", PHOTOS.sweaterRails],
  ],
  products: [
    ["polka-midi-dress", "women", "فستان بولكا ميدي", "Polka Midi Dress", PHOTOS.polkaDresses, 990, { compareAtPrice: 2400, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["corduroy-jacket", "men", "جاكيت قطيفة", "Corduroy Jacket", PHOTOS.jacketRail, 890, { compareAtPrice: 1990, sold90: 88 }],
    ["shimmer-clutch", "bags", "كلاتش لامع", "Shimmer Flap Clutch", PHOTOS.shimmerClutch, 790, { compareAtPrice: 1850, sold90: 52 }],
    ["heavy-tee", "basics", "تيشيرت تقيل", "Heavy Tee", PHOTOS.teeRail, 220, { compareAtPrice: 450, rating: 4.7, sold90: 300 }],
    ["printed-blouse", "women", "بلوزة مطبوعة", "Printed Blouse", PHOTOS.blouses, 490, { compareAtPrice: 1100, sold90: 64 }],
    ["rib-knit-top", "women", "توب تريكو مضلّع", "Rib Knit Top", PHOTOS.knitTops, 420, { compareAtPrice: 950, sold90: 24 }],
    ["striped-tank", "basics", "توب حمالات مقلّم", "Striped Tank Top", PHOTOS.tanks, 180, { compareAtPrice: 390, sold90: 70 }],
    ["rhinestone-shoulder-bag", "bags", "شنطة كتف بفصوص", "Rhinestone Shoulder Bag", PHOTOS.rhinestoneBag, 650, { compareAtPrice: 1450, inStock: false, sold90: 12 }],
    ["long-sleeve-basics", "basics", "تيشيرت كم طويل", "Long-Sleeve Tee", PHOTOS.basicsRail, 250, { compareAtPrice: 520, sold90: 46 }],
  ],
});

export const TASFYA = libraryTemplate({
  key: TASFYA_KEY,
  version: 1,
  name: L("تصفية", "Tasfya"),
  description: L(
    "أوتلت موضة: شريط العروض، خصم ٦٠٪، لسه نازل، عرض النهارده، تسوق بالميزانية، كل ما تزود توفّر وافتح قبل ما تدفع. أربع صفحات جاهزة.",
    "Fashion outlet: offer ticker, 60% off, just dropped, tonight's deal, shop by budget, spend tiers and open before you pay. Four ready pages.",
  ),
  category: "fashion",
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
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تصفية", "About"), seo: { title: L("عن تصفية", "About Tasfya") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("كل يوم من ١٢ الضهر لـ ١١ بالليل، على واتساب أو الإيميل.", "Every day, 12 pm to 11 pm, on WhatsApp or by email."),
        heading: L("اسأل عن مقاس أو قطعة", "Ask about a size or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الكود والتبديل والتوصيل.", "The code, exchanges and delivery."),
        question: L("ينفع أبدّل قطعة من الأوتلت؟", "Can I exchange an outlet piece?"),
        answer: L("أيوه، خلال ٧ أيام لو بالتيكت بتاعها، ما عدا قطع العينة.", "Yes, within 7 days with its tags on, except sample pieces."),
      }),
    },
  ],
  demo: DEMO,
});
