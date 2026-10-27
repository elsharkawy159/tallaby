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
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

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

const header = lib("header-search", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن لوح، برطمان، كوباية…", "Search boards, jars, mugs…"),
    "وصل حديثًا": L("أدوات السفرة", "Tableware"),
    "الأكثر مبيعًا": L("التحضير", "Prep"),
    "العروض": L("التخزين", "Storage"),
    "هدايا": L("الطاسات والحلل", "Pans & pots"),
    "إكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
    "توصيل خلال ٤٨ ساعة": L("توصيل مجاني فوق ٨٠٠ · افتح قبل ما تدفع", "Free delivery over EGP 800 · Open before you pay"),
  },
  links: { "/products": [undefined, search("طقم"), search("لوح"), search("برطمان"), search("طاسة"), BEST] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مطبخ شوب. كل الحقوق محفوظة.", "© 2026 Matbakh Shop. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("بتطبخ إيه؟", "What are you cooking?"),
      "اكتب اسم المنتج": L("لوح، برطمان، كوباية، طاسة", "Board, jar, mug, pan"),
    },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.stackedPlates, PHOTOS.utensilPot, PHOTOS.pantry, PHOTOS.pans],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Departments"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("من السفرة للتحضير للدولاب.", "From the table to the prep counter to the cupboard."),
      "كل الأقسام": L("كل المنتجات", "All products"),
      "وصل حديثًا": L("أدوات السفرة", "Tableware"),
      "الأكثر مبيعًا": L("التحضير", "Prep"),
      "العروض": L("التخزين", "Storage"),
      "هدايا": L("الطاسات والحلل", "Pans & pots"),
    },
    links: { "/products": [SHOP, search("طقم"), search("لوح"), search("برطمان"), search("طاسة")] },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("الأسبوع ده", "This week"),
      "وصل جديد": L("وصل جديد", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
      "العروض": L("الأقل سعراً", "Lowest price"),
    },
    links: { "/products": [NEW, BEST, LOW] },
  }),
  lib("finder-budget", {
    text: {
      "ابدأ من الأوفر": L("مطبخ كامل على قد ميزانيتك", "A full kitchen on your budget"),
      "رتبنالك المنتجات من الأقل سعرًا. عايز تشوف الأغلى الأول؟ اختار من الزراير.": L(
        "من ٢٠٠ لـ ٢٥٠٠ ج.م: رتبنالك الأدوات من الأرخص. عايز الأطقم الكبيرة الأول؟ اختار من الزراير.",
        "From EGP 200 to 2,500: tools sorted from the lowest price. Want the big sets first? Use the buttons.",
      ),
    },
  }),
  lib("pay-open-box", {
    text: {
      "بنكلمك قبلها بساعة.": L("بنكلمك قبلها بساعة عشان تكون موجود.", "We call an hour ahead so you are home."),
      "جرّب المنتج قدام المندوب.": L("افتح العلبة واتأكد إن مفيش حاجة مكسورة.", "Open the box and check nothing is broken."),
      "لو فيه أي مشكلة رجّعه للمندوب ومتدفعش حاجة.": L("لو فيه طبق مشروخ رجّعه للمندوب ومتدفعش حاجة.", "If a plate is chipped, hand it back and pay nothing."),
    },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه إحنا", "Why us"),
      "تسوّق وأنت مطمئن": L("سهل وآمن وفي ميعاده", "Simple, safe, on time"),
      "توصيل سريع": L("توصيل ٢–٤ أيام", "2–4 day delivery"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("لكل المحافظات.", "To every governorate."),
      "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay at the door"),
      "أو ادفع بالبطاقة والمحفظة": L("كاش أو كارت لما يوصل.", "Cash or card when it arrives."),
      "استرجاع سهل": L("استرجاع ١٤ يوم", "14-day returns"),
      "١٤ يومًا لتغيّر رأيك": L("المقفول بيرجع من غير أسئلة.", "Unopened items, no questions."),
      "دعم على واتساب": L("تغليف بعناية", "Packed with care"),
      "أشخاص حقيقيون طوال الأسبوع": L("ببل وعلبة مقفولة.", "Bubble wrap and a sealed box."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مطبخ شوب", "About Matbakh Shop"), L("أدوات مطبخ حلوة بسعر معقول.", "Good kitchen tools at fair prices.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLay,
    alt: L("أطباق وكوبايات سيراميك من فوق", "Ceramic plates, bowls and mugs from above"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الأساسيات اللي بتطبخ بيها كل يوم", "The basics you cook with every day"),
    text: L(
      "بنختار أطباق وألواح وبرطمانات وطاسات بتستحمل الاستعمال اليومي، وبنجربها في مطبخنا قبل ما تنزل المحل.",
      "We pick plates, boards, jars and pans that stand up to daily use, and we try them in our own kitchen first.",
    ),
    more: L("والتوصيل لكل المحافظات، وتفتح الطلب قبل ما تدفع.", "We deliver to every governorate, and you open your order before you pay."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات مطبخ حلوة بسعر معقول.", "Good kitchen tools at fair prices."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.stackedPlates],
    ["prep", "التحضير", "Prep", PHOTOS.utensilPot],
    ["storage", "التخزين", "Storage", PHOTOS.pantry],
    ["cookware", "الطاسات والحلل", "Pans & pots", PHOTOS.pans],
    ["linen", "فوط ومفارش", "Linen", PHOTOS.towels],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم عشا ستون وير لـ٦ أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "tableware", "كوبايتين مرسومين", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { rating: 4.7, sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح زيتون ٣ قطع", "Olive Wood Board Set of 3", PHOTOS.boards, 690, { isFeatured: true, sold90: 104 }],
    ["beech-utensil-set", "prep", "طقم معالق زان ٥ قطع", "Beech Utensil Set of 5", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 61 }],
    ["glass-jar-set", "storage", "٦ برطمانات إزاز بغطا محكم", "Glass Jar Set of 6", PHOTOS.jarRack, 560, { sold90: 39 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة ٤ قطع", "Striped Tea Towels, Set of 4", PHOTOS.towels, 280, { sold90: 47 }],
    ["speckled-cup-set", "tableware", "طقم فناجين منقطة", "Speckled Cup & Saucer Set", PHOTOS.speckledCups, 780, { rating: 4.8, sold90: 52 }],
    ["steel-measuring-set", "prep", "طقم مكاييل ستانلس", "Steel Measuring Set", PHOTOS.measuring, 290, { sold90: 76 }],
    ["silicone-spatula-set", "prep", "طقم سباتولا سيليكون", "Silicone Spatula Set", PHOTOS.spatulas, 260, { compareAtPrice: 320, sold90: 95 }],
    ["frying-pan-set", "cookware", "طقم طاسات ٣ مقاسات", "Frying Pan Set of 3", PHOTOS.pans, 1850, { rating: 4.6, sold90: 34 }],
    ["granite-pot-set", "cookware", "طقم حلل جرانيت وردي", "Pink Granite Pot Set", PHOTOS.pinkPots, 2950, { compareAtPrice: 3400, inStock: false, sold90: 18 }],
  ],
});

export const MATBAKH = libraryTemplate({
  key: MATBAKH_KEY,
  version: 2,
  changelog: "Matbakh v2: product page",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للمطبخ", "Back to the kitchen"), reviews: L("رأي اللي طبخوا بيه", "From people who cook with it"), related: L("هتحتاجه كمان", "You may also need") } },
  name: L("مطبخ", "Matbakh"),
  description: L(
    "أساسيات مطبخ عصرية: بحث سريع، أقسام، شلف الأسبوع، على قد الميزانية وافتح قبل ما تدفع. أربع صفحات جاهزة.",
    "Modern kitchen basics: quick search, departments, this week's shelf, a budget shelf and open before you pay. Four ready pages.",
  ),
  category: "kitchen",
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
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن مطبخ شوب", "About Matbakh Shop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا على matbakh@matbakhshop.eg أو على واتساب.", "Write to matbakh@matbakhshop.eg or on WhatsApp."),
        heading: L("عن طلب أو منتج", "About an order or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("لو طبق وصل مكسور؟", "What if a plate arrives broken?"),
        answer: L("افتح الطلب قدام المندوب ورجّعه ومتدفعش، أو ابعتلنا صورة خلال ٤٨ ساعة ونبدّله.", "Open the order in front of the courier and hand it back unpaid, or send us a photo within 48 hours and we replace it."),
      }),
    },
  ],
  demo: DEMO,
});
