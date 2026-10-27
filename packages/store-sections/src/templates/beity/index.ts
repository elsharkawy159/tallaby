/**
 * Beity (template 104, home and kitchen store; Claude Design "Storefront
 * Templates"): warm white paper, a sand shelf, a terracotta for actions and
 * a marigold highlight, Readex Pro throughout and 12px corners. Everything
 * the kitchen needs: banners for tableware, prep and storage, departments,
 * this week's tabbed shelf, a budget shelf, the week's offers, open before
 * you pay and simple promises. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): stoneware and boards
 * on a shelf, olive wood boards, silicone spatulas in a drawer, jar
 * shelves, painted mugs, a wooden spoon, stacked plates, a utensil pot, a
 * linen tablecloth, speckled cups, tea towels and a tableware flat lay. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BEITY_KEY = "beity";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BEITY_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  tablewareBanner: pexels(6213678),
  prepBanner: pexels(3722564),
  storageBanner: pexels(4440173),
  dinnerSet: pexels(6213678, 900),
  mugPair: pexels(7674564, 900),
  boards: pexels(6208155, 900),
  utensils: pexels(6692134, 900),
  jarShelves: pexels(4440173, 900),
  jarRack: pexels(10252345, 900),
  tablecloth: pexels(10610004, 900),
  stackedPlates: pexels(8903358, 900),
  utensilPot: pexels(7303732, 900),
  speckledCups: pexels(4259833, 900),
  towels: pexels(4794849, 900),
  spatulas: pexels(3722564, 900),
  flatLay: pexels(3847465),
};

const NAME = L("بيتي", "Beity");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل مجاني فوق ٩٠٠ ج.م", "Free delivery over EGP 900"),
    "الدفع عند الاستلام": L("افتح قبل ما تدفع", "Open before you pay"),
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن بيتي", "About"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("اشترك وخد عروض الأسبوع قبل أي حد.", "Subscribe and get the week's offers first."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيتي. كل الحقوق محفوظة.", "© 2026 Beity. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.tablewareBanner, PHOTOS.prepBanner, PHOTOS.storageBanner],
    text: {
      "وصل حديثًا": L("أدوات السفرة", "Tableware"),
      "الموسم الجديد وصل": L("جهّز السفرة للكل", "Set the table for everyone"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("أطباق وبولات وكوبايات أطقم أو بالقطعة.", "Plates, bowls and glasses as sets or singles."),
      "تسوّق الجديد": L("تسوق أدوات السفرة", "Shop tableware"),
      "صورة الحملة الأولى": L("أطباق ستون وير وألواح خشب على رف", "Stoneware and wooden boards on a shelf"),
      "الأكثر مبيعًا": L("تحضير الأكل", "Cooking"),
      "المفضّلة عند عملائنا": L("أدوات بتخلي الطبخ أسرع", "Tools that make cooking quicker"),
      "القطع اللي بترجع لها كل مرة.": L("سباتولات وألواح ومعالق للطبخ اليومي.", "Spatulas, boards and spoons for daily cooking."),
      "شوف الأكثر مبيعًا": L("تسوق التحضير", "Shop prep"),
      "صورة الحملة الثانية": L("سباتولات سيليكون ملونة في درج المطبخ", "Colourful silicone spatulas in a kitchen drawer"),
      "عروض الأسبوع": L("التخزين", "Storage"),
      "خصومات لفترة محدودة": L("مكان لكل حاجة", "A place for everything"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("برطمانات وعلب بتترص فوق بعض.", "Jars and boxes that stack neatly."),
      "تسوّق العروض": L("تسوق التخزين", "Shop storage"),
      "صورة الحملة الثالثة": L("برطمانات إزاز على رفوف بيضا", "Glass jars on white shelves"),
    },
    links: { "/products": [search("طقم"), search("لوح"), search("برطمان")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.stackedPlates, PHOTOS.utensilPot, PHOTOS.jarRack, PHOTOS.tablecloth],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Departments"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("من السفرة للتحضير للدولاب.", "From the table to the prep counter to the cupboard."),
      "كل الأقسام": L("كل المنتجات", "All products"),
      "وصل حديثًا": L("أدوات السفرة", "Tableware"),
      "الأكثر مبيعًا": L("التحضير", "Prep"),
      "العروض": L("التخزين", "Storage"),
      "هدايا": L("مفارش", "Linen"),
    },
    links: { "/products": [SHOP, search("طقم"), search("لوح"), search("برطمان"), search("مفرش")] },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("الأسبوع ده", "This week"),
      "وصل جديد": L("وصل جديد", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
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
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد الأول": L("جديد المطبخ", "New for the kitchen"),
      "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": L("أطقم وأدوات جديدة، رسالة واحدة كل أسبوع.", "New sets and tools, one email a week."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيتي", "About Beity"), L("كل اللي المطبخ محتاجه في مكان واحد.", "Everything the kitchen needs, in one place.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLay,
    alt: L("أطباق وكوبايات سيراميك من فوق", "Ceramic plates, bowls and mugs from above"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("بيت مرتب بيبدأ من المطبخ", "A tidy home starts in the kitchen"),
    text: L("بنختار أطقم سفرة وألواح وبرطمانات ومفارش بتستحمل الاستعمال اليومي، بأسعار معقولة.", "We pick tableware, boards, jars and linen that stand up to daily use, at fair prices."),
    more: L("والتوصيل لكل المحافظات، وتفتح الطلب قبل ما تدفع.", "We deliver to every governorate, and you open your order before you pay."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كل اللي المطبخ محتاجه في مكان واحد.", "Everything the kitchen needs, in one place."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.stackedPlates],
    ["prep", "التحضير", "Prep", PHOTOS.utensilPot],
    ["storage", "التخزين", "Storage", PHOTOS.jarRack],
    ["linen", "مفارش", "Linen", PHOTOS.towels],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم عشا ستون وير لـ٦ أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "tableware", "كوبايتين مرسومين", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { rating: 4.7, sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح زيتون ٣ قطع", "Olive Wood Board Set of 3", PHOTOS.boards, 690, { sold90: 104 }],
    ["beech-utensil-set", "prep", "طقم معالق زان ٥ قطع", "Beech Utensil Set of 5", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 61 }],
    ["glass-jar-set", "storage", "٦ برطمانات إزاز بغطا محكم", "Glass Jar Set of 6", PHOTOS.jarShelves, 560, { sold90: 39 }],
    ["linen-tablecloth", "linen", "مفرش ترابيزة كتان", "Linen Tablecloth", PHOTOS.tablecloth, 450, { sold90: 47 }],
    ["speckled-cup-set", "tableware", "طقم فناجين منقطة", "Speckled Cup & Saucer Set", PHOTOS.speckledCups, 780, { sold90: 52 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة ٤ قطع", "Striped Tea Towels, Set of 4", PHOTOS.towels, 280, { sold90: 70 }],
    ["silicone-spatula-set", "prep", "طقم سباتولا سيليكون", "Silicone Spatula Set", PHOTOS.spatulas, 260, { compareAtPrice: 320, inStock: false, sold90: 95 }],
  ],
});

export const BEITY = libraryTemplate({
  key: BEITY_KEY,
  version: 3,
  changelog: "Beity v3: one trust block, no budget finder, newsletter close",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للمطبخ", "Back to the kitchen"), reviews: L("جربوه في بيوتهم", "Tried in their homes"), related: L("حاجات للمطبخ كمان", "More for your kitchen") } },
  name: L("بيتي", "Beity"),
  description: L(
    "متجر البيت والمطبخ: بانرات متحركة، الأقسام، رف الأسبوع، وعدنا وجديد المطبخ. أربع صفحات جاهزة.",
    "Home and kitchen store: a banner carousel, departments, this week's shelf, our promises and kitchen news. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 1040,
  palette: ["#f8f6f2", "#ede8df", "#f2c14e", "#b4532a"],
  colors: {
    primary: "#b4532a",
    secondary: "#ede8df",
    background: "#f8f6f2",
    foreground: "#232220",
    muted: "#67625a",
    border: "#ddd5c8",
    accent: "#f2c14e",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بيتي", "About"), seo: { title: L("عن بيتي", "About Beity") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا على beity@beity.eg أو على واتساب.", "Write to beity@beity.eg or on WhatsApp."),
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
