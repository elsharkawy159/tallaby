/**
 * Sufra (template 41, tableware led by delivery and payment; Claude Design
 * "Storefront Templates"): warm cream paper, a sand-gold highlight and a
 * deep green for actions, Reem Kufi headings on Almarai and 10px corners.
 * A family tableware shop: order by 2 pm for tomorrow, feast season, the
 * Friday lunch set, shop by budget, ways to pay, open before you pay, a
 * kitchen kit and delivery and payment questions. Built from section
 * library designs (`fromLibrary`).
 *
 * "Price drop band" (`bundle-price-drop`) fails the render check, so the
 * kitchen kit is a second Plus row (`bundle-plus`, as Lahma and Madrasa).
 * Bundle savings are display only (typed totals; the cart adds items at
 * full price). The Friday set lists the three newest products and the
 * kitchen kit the three best sellers.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a laid table of mixed
 * plates and bowls from above, stoneware on a wooden counter with boards,
 * painted mugs and plates, wooden boards, wooden spoons on a board, jar
 * shelves, a shelf of jars over white tiles, candles on a linen cloth,
 * striped tea towels on a stool and stacked colour plates. No people, no
 * hands and no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SUFRA_KEY = "sufra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SUFRA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const TABLEWARE = search("أطباق");

const PHOTOS = {
  tableFlatLay: pexels(3847465),
  counter: pexels(6213678),
  dinnerSet: pexels(6213678, 900),
  mugPair: pexels(7674564, 900),
  boards: pexels(6208155, 900),
  utensils: pexels(6692134, 900),
  pantry: pexels(4440173, 900),
  shelfJars: pexels(6654122, 900),
  linenCloth: pexels(10610004, 900),
  teaTowels: pexels(4794849, 900),
  colourPlates: pexels(8903358, 900),
};

const NAME = L("سفرة تيتا", "Sufret Teta");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("افتح الطلب قبل ما تدفع", "Open your order before you pay"),
    "الكود: SAVE10": L("التوصيل تاني يوم في القاهرة", "Next-day delivery in Cairo"),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("أدوات السفرة", "Tableware"),
    "المدونة": L("التحضير", "Prep"),
  },
  links: { "/products": [SHOP, TABLEWARE, undefined, SHOP, TABLEWARE], "/blog": search("خشب") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("وصفات وقطع جديدة", "Recipes and new pieces"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("إيميل واحد قبل كل موسم عزايم.", "One email before every feast season."),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سفرة تيتا. كل الحقوق محفوظة.", "© 2026 Sufret Teta. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("pay-promise", {
    text: {
      "اطلب قبل ٢ الضهر، يوصلك بكره": L("اطلب قبل ٢ الضهر، يوصل سفرتك بكره", "Order by 2 pm, on your table tomorrow"),
      "بيتشحن": L("بنغلف ونشحن", "We pack and ship"),
    },
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.tableFlatLay],
    text: {
      "إزاي بنشتغل": L("موسم العزايم", "Feast season"),
      "كل منتج بيتراجع قبل ما يوصلك": L("جهّز السفرة لـ١٢", "Set the table for twelve"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "ستون وير بيدخل الفرن ويطلع على السفرة، وكتان بيستحمل الغسيل.",
        "Stoneware that goes from oven to table, and linen that survives the wash.",
      ),
      "اعرف أكتر": L("تسوق أدوات السفرة", "Shop tableware"),
      "صورة المتجر": L("سفرة متجهزة بأطباق وسلطانيات", "A laid table of plates and bowls"),
    },
    links: { "/about": TABLEWARE },
  }),
  lib("bundle-plus", {
    text: {
      "اشتريهم مع بعض ووفّر": L("طقم غدا الجمعة", "The Friday lunch set"),
      "١٬٢٧٠ ج.م": L("٢٬٩٢٠ ج.م", "EGP 2,920"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٣٬٣٢٠ ج.م", "Instead of EGP 3,320"),
      "وفّر ٢٢٠ ج.م": L("وفّر ٤٠٠ ج.م", "Save EGP 400"),
    },
  }),
  lib("finder-budget"),
  lib("pay-methods"),
  lib("pay-open-box"),
  lib("bundle-plus", {
    as: "kitchen-kit",
    name: L("طقم المطبخ", "Kitchen kit"),
    text: {
      "باقة": L("وفّر ١٥٪", "Save 15%"),
      "اشتريهم مع بعض ووفّر": L("طقم المطبخ", "The kitchen kit"),
      "١٬٢٧٠ ج.م": L("١٬٣٥٠ ج.م", "EGP 1,350"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٥٩٠ ج.م", "Instead of EGP 1,590"),
      "وفّر ٢٢٠ ج.م": L("وفّر ٢٤٠ ج.م", "Save EGP 240"),
      "اطلب الباقة": L("اشتري طقم المطبخ", "Get the kitchen kit"),
    },
    lists: [{ source: "best-sellers" }],
  }),
  lib("faq-columns", { as: "faq-home", text: { "أسئلة شائعة": L("التوصيل والدفع", "Delivery and payment") } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سفرة تيتا", "About Sufret Teta"), L("أدوات سفرة بتختارها عيلة بتعزم كل جمعة.", "Tableware chosen by a family that hosts every Friday.")),
  aboutStory(lib, {
    photo: PHOTOS.counter,
    alt: L("ستون وير وألواح خشب على رخامة المطبخ", "Stoneware and wooden boards on a kitchen counter"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("عيلة بتعزم كل جمعة", "A family that hosts every Friday"),
    text: L("بنختار الأطباق اللي بتستحمل عزومة ١٢ نفر والغسيل بعدها، والكتان اللي بيعيش سنين.", "We pick plates that survive lunch for twelve and the washing-up after, and linen that lasts for years."),
    more: L("بنوصل تاني يوم في القاهرة، وتفتح الطلب قدام المندوب قبل ما تدفع.", "We deliver next day in Cairo, and you open the order in front of the courier before you pay."),
    button: L("كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات سفرة للعزومات الكبيرة.", "Tableware for big family lunches."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.colourPlates],
    ["prep", "ألواح وتحضير", "Boards & prep", PHOTOS.boards],
    ["storage", "التخزين", "Storage", PHOTOS.pantry],
    ["linen", "مفارش", "Table linen", PHOTOS.linenCloth],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم أطباق عشا ستون وير لـ٦", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["linen-tablecloth", "linen", "مفرش سفرة كتان", "Linen Tablecloth", PHOTOS.linenCloth, 450, { sold90: 47 }],
    ["hand-painted-mug-pair", "tableware", "كوبايتين مرسومين باليد", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح خشب زيتون", "Olive Wood Board Set", PHOTOS.boards, 690, { sold90: 300 }],
    ["beech-utensil-set", "prep", "طقم معالق خشب زان", "Beech Utensil Set", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 280 }],
    ["glass-jar-set", "storage", "٦ برطمانات إزاز", "Glass Jar Set of 6", PHOTOS.pantry, 560, { sold90: 260 }],
    ["shelf-jar-pair", "storage", "برطمانات للرف", "Shelf Jars", PHOTOS.shelfJars, 380, { sold90: 22 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة", "Striped Tea Towels", PHOTOS.teaTowels, 260, { sold90: 64 }],
    ["colour-stoneware-plates", "tableware", "أطباق ستون وير ملونة", "Colour Stoneware Plates", PHOTOS.colourPlates, 1150, { sold90: 76 }],
  ],
});

export const SUFRA = libraryTemplate({
  key: SUFRA_KEY,
  version: 2,
  changelog: "Sufra v2: product page",
  productPage: { surface: "card", thumbs: "side", band: "paper", extras: ["product-perks"], copy: { back: L("رجوع للسفرة", "Back to the table"), reviews: L("رأي اللي جرّبوا السفرة", "From tables like yours"), related: L("يكمّل السفرة", "Set the rest of the table") } },
  name: L("سفرة", "Sufra"),
  description: L(
    "أدوات سفرة بتركيز على التوصيل والدفع: يوصل بكره، موسم العزايم، طقم الجمعة، حسب ميزانيتك، طرق الدفع، افتح قبل ما تدفع وطقم المطبخ. أربع صفحات جاهزة.",
    "Tableware led by delivery and payment: tomorrow delivery, feast season, the Friday set, shop by budget, ways to pay, open before you pay and a kitchen kit. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 410,
  palette: ["#f8f4ec", "#ece3d2", "#f0c987", "#2f5d50"],
  colors: {
    primary: "#2f5d50",
    secondary: "#ece3d2",
    background: "#f8f4ec",
    foreground: "#1f2a26",
    muted: "#5d655f",
    border: "#e0d6c4",
    accent: "#f0c987",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن سفرة تيتا", "About"), seo: { title: L("عن سفرة تيتا", "About Sufret Teta") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ميدان الجامع، مصر الجديدة.", "Midan El Gamea, Heliopolis."),
        heading: L("اسأل عن طلبك أو عن قطعة", "Ask about your order or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("لو طبق وصل مكسور؟", "What if a plate arrives chipped?"),
        answer: L("افتح العلبة قدام المندوب. لو فيه حاجة مكسورة رجّعها معاه وبنبدلها تاني يوم.", "Open the box in front of the courier. If anything is chipped, send it back with him and we replace it the next day."),
      }),
    },
  ],
  demo: DEMO,
});
