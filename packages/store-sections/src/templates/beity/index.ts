/**
 * Beity (template 104, home and kitchen store; Claude Design "Storefront
 * Templates"): warm white paper, a sand shelf, a terracotta for actions and
 * a marigold highlight, Readex Pro throughout and 12px corners. Everything
 * the kitchen needs: banners for tableware, prep and storage, departments,
 * this week's tabbed shelf, a budget shelf, the week's offers, open before
 * you pay, simple promises and the tableware as a carousel (the store's
 * 1st category). Built from section library designs
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
    "تشكيلة الموسم الجديد وصلت": L("أدوات السفرة والمطبخ والتخزين", "Tableware, kitchen and storage"),
    "الدفع عند الاستلام": L("تفاصيل واضحة لكل منتج", "Clear details for every product"),
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
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد المطبخ.", "Subscribe for new kitchen products."),
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
      "الموسم الجديد وصل": L("أطباق وأطقم للسفرة", "Plates and sets for the table"),
      "قطع مختارة بعناية لكل يوم.": L("أطباق وأوعية وأكواب، أطقم أو بالقطعة.", "Plates, bowls and glasses, as sets or singles."),
      "تسوّق الجديد": L("تسوق أدوات السفرة", "Shop tableware"),
      "صورة الحملة الأولى": L("أطباق حجرية وألواح خشبية على رف", "Stoneware and wooden boards on a shelf"),
      "الأكثر مبيعًا": L("تحضير الأكل", "Cooking"),
      "المفضّلة عند عملائنا": L("أدوات للطبخ اليومي", "Tools for daily cooking"),
      "القطع الأكثر طلبًا في المتجر.": L("مغارف سيليكون وألواح تقطيع وملاعق.", "Silicone spatulas, chopping boards and spoons."),
      "تصفّح الأكثر مبيعًا": L("تسوق التحضير", "Shop prep"),
      "صورة الحملة الثانية": L("مغارف سيليكون ملونة في درج المطبخ", "Colourful silicone spatulas in a kitchen drawer"),
      "مختارات الأسبوع": L("التخزين", "Storage"),
      "قطع مختارة لهذا الأسبوع": L("برطمانات وعلب للتخزين", "Jars and boxes for storage"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("برطمانات وعلب يمكن رصّها فوق بعضها.", "Jars and boxes that stack neatly."),
      "تسوّق المختارات": L("تسوق التخزين", "Shop storage"),
      "صورة الحملة الثالثة": L("برطمانات زجاجية على رفوف بيضاء", "Glass jars on white shelves"),
    },
    links: { "/products": [search("طقم"), search("لوح"), search("برطمان")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.stackedPlates, PHOTOS.utensilPot, PHOTOS.jarRack, PHOTOS.tablecloth],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Departments"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("من السفرة إلى التحضير والتخزين.", "From the table to prep and storage."),
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
      "منتجاتنا": L("هذا الأسبوع", "This week"),
      "وصل جديد": L("وصل جديد", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("لماذا نحن", "Why us"),
      "تسوّق وأنت مطمئن": L("ما يميز منتجاتنا", "What sets our products apart"),
      "الشحن": L("خامات واضحة", "Clear materials"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("الخامة مذكورة لكل منتج.", "Every product lists its material."),
      "الدفع عند الاستلام": L("مقاسات واضحة", "Clear sizes"),
      "أو بطرق الدفع المتاحة عند الطلب": L("المقاس والسعة لكل قطعة.", "Size and capacity for every piece."),
      "الاستبدال والاسترجاع": L("تشكيلة متنوعة", "A wide range"),
      "التفاصيل في صفحة السياسات": L("للسفرة والتحضير والتخزين.", "For the table, prep and storage."),
      "تواصل معنا": L("تواصل معنا", "Contact us"),
      "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن منتج.", "With any question about a product."),
    },
  }),
  // The store's 1st category (tableware, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد أولًا": L("جديد المطبخ", "New for the kitchen"),
      "أحدث المجموعات في بريدك الإلكتروني.": L("أطقم وأدوات جديدة في بريدك الإلكتروني.", "New sets and tools in your inbox."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيتي", "About Beity"), L("كل ما يحتاجه المطبخ في مكان واحد.", "Everything the kitchen needs, in one place.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLay,
    alt: L("أطباق وأكواب سيراميك من أعلى", "Ceramic plates, bowls and mugs from above"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات مطبخ لكل يوم", "Kitchen tools for every day"),
    text: L("نختار أطقم سفرة وألواحًا وبرطمانات ومفارش تتحمّل الاستخدام اليومي.", "We pick tableware, boards, jars and linen made for daily use."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كل ما يحتاجه المطبخ في مكان واحد.", "Everything the kitchen needs, in one place."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.stackedPlates],
    ["prep", "التحضير", "Prep", PHOTOS.utensilPot],
    ["storage", "التخزين", "Storage", PHOTOS.jarRack],
    ["linen", "مفارش", "Linen", PHOTOS.towels],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم عشاء حجري لستة أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "tableware", "كوبان مرسومان يدويًا", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { rating: 4.7, sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح زيتون ٣ قطع", "Olive Wood Board Set of 3", PHOTOS.boards, 690, { sold90: 104 }],
    ["beech-utensil-set", "prep", "طقم معالق زان ٥ قطع", "Beech Utensil Set of 5", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 61 }],
    ["glass-jar-set", "storage", "٦ برطمانات زجاجية بغطاء محكم", "Glass Jar Set of 6", PHOTOS.jarShelves, 560, { sold90: 39 }],
    ["linen-tablecloth", "linen", "مفرش طاولة كتان", "Linen Tablecloth", PHOTOS.tablecloth, 450, { sold90: 47 }],
    ["speckled-cup-set", "tableware", "طقم فناجين منقطة", "Speckled Cup & Saucer Set", PHOTOS.speckledCups, 780, { sold90: 52 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة ٤ قطع", "Striped Tea Towels, Set of 4", PHOTOS.towels, 280, { sold90: 70 }],
    ["silicone-spatula-set", "prep", "طقم مغارف سيليكون", "Silicone Spatula Set", PHOTOS.spatulas, 260, { compareAtPrice: 320, inStock: false, sold90: 95 }],
    // The fourth tableware piece, so the tableware carousel fills its row of four (v4).
    ["stoneware-plate-stack", "tableware", "أطباق حجرية ٤ قطع", "Stoneware Plates, Set of 4", PHOTOS.stackedPlates, 690, { sold90: 18 }],
  ],
});

export const BEITY = libraryTemplate({
  key: BEITY_KEY,
  version: 5,
  changelog: "Beity v4: a tableware carousel (the store's 1st category) on the home",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء المشترين", "Buyer reviews"), related: L("منتجات أخرى للمطبخ", "More for your kitchen") } },
  name: L("بيتي", "Beity"),
  description: L(
    "متجر البيت والمطبخ: لافتات متحركة، الأقسام، رف الأسبوع، ما يميزنا وجديد المطبخ. أربع صفحات جاهزة.",
    "Home and kitchen store: a banner carousel, departments, this week's shelf, our promises and kitchen news. Four ready pages.",
  ),
  category: "kitchen",
  style: ["classic"],
  sortOrder: 1040,
  palette: ["#f8f6f2", "#ede8df", "#f2c14e", "#b4532a"],
  colors: {
    primary: "#b4532a",
    secondary: "#ede8df",
    background: "#ffffff",
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
        text: L("راسلنا على beity@beity.eg.", "Write to beity@beity.eg."),
        heading: L("عن طلب أو منتج", "About an order or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("ماذا لو وصل طبق مكسور؟", "What if a plate arrives broken?"),
        answer: L("تواصل معنا، وراجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "Contact us, and see the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
