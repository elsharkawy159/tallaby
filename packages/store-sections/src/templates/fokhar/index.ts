/**
 * Fokhar (template 66, handmade ceramics; Claude Design "Storefront
 * Templates"): warm clay paper, a terracotta brown for actions and a
 * biscuit highlight, Reem Kufi headings over Almarai text and soft 20px
 * corners. A Fustat pottery: no two plates alike, this week's firing, clay
 * to table, the potters, double-boxed delivery and customers' tables. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): unglazed and glazed
 * plates, mugs, bowls and vases on workshop tables and shelves. No people,
 * no hands, no logos. The potters are shown by initials only.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const FOKHAR_KEY = "fokhar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FOKHAR_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  mugPair: pexels(7674564, 900),
  mugPairWide: pexels(7674564),
  dinnerSet: pexels(6213678, 900),
  rawPlates: pexels(6611494, 900),
  whitePlates: pexels(6611496, 900),
  bluePlates: pexels(10900768, 900),
  rawCups: pexels(4830752, 900),
  glazeTable: pexels(7375048, 900),
  firedMugs: pexels(6611187, 900),
  glazedMugs: pexels(27682102, 900),
  stonewareMugs: pexels(31452624, 900),
  footedBowl: pexels(14380628, 900),
  bowlVase: pexels(11232062, 900),
  jugShelf: pexels(6692149, 900),
  workshopShelf: pexels(15440777),
  windowsill: pexels(6909856, 900),
  lotusBowls: pexels(29312155, 900),
  whiteTable: pexels(7674562, 900),
  mugPile: pexels(33784550, 900),
  mugTray: pexels(7674544, 900),
};

const NAME = L("فخار الفسطاط", "Fokhar Fustat");

const header = lib("header-line", {
  text: {
    "م": L("ف", "F"),
    "اسم متجرك": NAME,
    "المتجر": L("الخزف", "Ceramics"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [SHOP, NEW, undefined, SHOP, NEW], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد الخزف.", "Subscribe for new ceramics."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("حكايتنا", "Our story"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فخار الفسطاط. كل الحقوق محفوظة.", "© 2026 Fokhar Fustat. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.mugPairWide],
    text: {
      "وصل جديد": L("أطباق وأكواب خزف", "Ceramic plates and mugs"),
      "صوت أنقى، كل يوم": L("خزف لكل سفرة", "Ceramics for every table"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "أطباق وأكواب وفناجين وأطقم سفرة من الخزف.",
        "Ceramic plates, mugs, cups and dinner sets.",
      ),
      "تسوق الآن": L("تسوق الخزف", "Shop ceramics"),
      "صورة الحملة": L("أكواب وأطباق خزف مرسومة يدويًا", "Hand-painted ceramic mugs and plates"),
      "٤٫٨": L("خزف", "Ceramic"),
      "تقييم العملاء": L("أطباق وأكواب", "plates and mugs"),
    },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("تسوّق حسب القسم", "Shop by category") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("الأكثر طلبًا", "Most ordered"), "منتجات يكثر الطلب عليها": L("وصل حديثًا", "New in") },
    links: { "/products": BEST },
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.rawPlates, PHOTOS.glazeTable, PHOTOS.firedMugs],
    text: {
      "كيف نعمل": L("كيف يُصنع الخزف", "How ceramics are made"),
      "من اختيارنا إلى طلبك": L("من الطين إلى السفرة", "Clay to table"),
      "نختار": L("تشكيل", "Throw"),
      "كل منتج بعناية.": L("يُشكَّل الطين على العجلة.", "Clay is shaped on the wheel."),
      "نراجع": L("تزجيج", "Glaze"),
      "تفاصيل كل منتج قبل عرضه.": L("تُغطّى القطعة بطبقة التزجيج.", "The piece is coated in glaze."),
      "نساعدك": L("حرق", "Fire"),
      "في أي سؤال عن منتجاتنا.": L("تُحرق القطعة في الفرن على حرارة عالية.", "It is fired in a hot kiln."),
    },
  }),
  lib("pay-promise", {
    text: {
      "اطلب قبل ٢ ظهرًا ليصلك غدًا": L("خطوات طلبك", "Your order, step by step"),
      "٢:٠٠ م": L("الخطوة ١", "Step 1"),
      "تطلب اليوم": L("تأكيد الطلب", "Order confirmed"),
      "٦:٠٠ م": L("الخطوة ٢", "Step 2"),
      "يُشحن": L("الشحن", "Shipping"),
      "غدًا": L("الخطوة ٣", "Step 3"),
      "يصلك": L("الاستلام", "Delivery"),
      "مواعيد التوصيل": L("مراحل الطلب", "Order stages"),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.windowsill, PHOTOS.lotusBowls, PHOTOS.whiteTable, PHOTOS.mugPile, PHOTOS.mugTray],
    text: {
      "عملاؤنا": L("من عملائنا", "From our customers"),
      "أرسل لنا صورتك": L("أرسل لنا صورتك", "Send us your photo"),
      "مريم": handle("@nour.cooks"),
      "عمر": handle("@coffee.dokki"),
      "نور": handle("@salma.home"),
      "يوسف": handle("@fridaylunch"),
      "سلمى": handle("@zamalek.table"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فخار الفسطاط", "About Fokhar Fustat"), L("أطباق وأكواب من الخزف.", "Ceramic plates and mugs.")),
  aboutStory(lib, {
    photo: PHOTOS.workshopShelf,
    alt: L("قطع فخار على رف", "Clay pieces on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("خزف للاستخدام اليومي", "Ceramics for everyday use"),
    text: L(
      "نختار أطباقًا وأكوابًا وأطقم سفرة من الخزف، ونعرض المقاس وطريقة العناية لكل قطعة.",
      "We pick ceramic plates, mugs and dinner sets, with the size and care of every piece.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أطباق وأكواب من الخزف.", "Ceramic plates and mugs."),
  categories: [
    ["plates", "أطباق", "Plates", PHOTOS.whitePlates],
    ["mugs", "أكواب", "Mugs", PHOTOS.glazedMugs],
    ["bowls-vases", "أوعية ومزهريات", "Bowls & vases", PHOTOS.jugShelf],
    ["cups", "فناجين", "Cups", PHOTOS.rawCups],
    ["dinner-sets", "أطقم سفرة", "Dinner sets", PHOTOS.dinnerSet],
  ],
  products: [
    ["stoneware-dinner-set", "dinner-sets", "طقم عشاء حجري لستة أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "mugs", "كوبان مرسومان يدويًا", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { isFeatured: true, rating: 4.9, sold90: 88 }],
    ["white-plate-set", "plates", "طقم أطباق بيضاء ٦ قطع", "White Plate Set of 6", PHOTOS.whitePlates, 1250, { sold90: 64 }],
    ["blue-glaze-plates", "plates", "أطباق مزججة زرقاء", "Blue-Glaze Plates", PHOTOS.bluePlates, 1450, { compareAtPrice: 1700, sold90: 41 }],
    ["raw-clay-cups", "cups", "٤ فناجين طين خام", "Raw Clay Cups, Set of 4", PHOTOS.rawCups, 380, { sold90: 70 }],
    ["glazed-mug-set", "mugs", "طقم أكواب مزججة", "Glazed Mug Set", PHOTOS.glazedMugs, 640, { rating: 4.8, sold90: 57 }],
    ["stoneware-mugs", "mugs", "أكواب حجرية مدخنة", "Smoked Stoneware Mugs", PHOTOS.stonewareMugs, 520, { sold90: 46 }],
    ["footed-bowl", "bowls-vases", "طبق تقديم بقاعدة", "Footed Serving Bowl", PHOTOS.footedBowl, 560, { sold90: 33 }],
    ["bowl-and-vase", "bowls-vases", "وعاء ومزهرية", "Bowl & Vase Pair", PHOTOS.bowlVase, 890, { sold90: 28 }],
    ["clay-jug", "bowls-vases", "إبريق فخار", "Clay Jug", PHOTOS.jugShelf, 740, { inStock: false, sold90: 19 }],
  ],
});

export const FOKHAR = libraryTemplate({
  key: FOKHAR_KEY,
  version: 3,
  changelog: "Fokhar v3: categories, section order",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قطع أخرى قد تعجبك", "More pieces you may like") } },
  name: L("فخار", "Fokhar"),
  description: L(
    "خزف يدوي: الجديد، من الطين إلى السفرة، مراحل الطلب وصور العملاء. أربع صفحات جاهزة.",
    "Handmade ceramics: new in, clay to table, order stages and customer photos. Four ready pages.",
  ),
  category: "handmade",
  style: ["warm"],
  sortOrder: 660,
  palette: ["#f7f1ea", "#ecdfd0", "#e8b98a", "#a4502a"],
  colors: {
    primary: "#a4502a",
    secondary: "#ecdfd0",
    background: "#ffffff",
    foreground: "#2b1d14",
    muted: "#6c5a4c",
    border: "#dfcdb8",
    accent: "#e8b98a",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("عن فخار الفسطاط", "About Fokhar Fustat") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن قطعة أو طلب.", "Contact us with any question about a piece or an order."),
        heading: L("اسأل عن مقاس أو قطعة", "Ask about a size or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والاستخدام والطلب.", "Care, use and ordering."),
        question: L("هل يناسب الخزف غسالة الأطباق والميكروويف؟", "Is it dishwasher and microwave safe?"),
        answer: L("طريقة العناية واستخدام غسالة الأطباق والميكروويف مذكورة في وصف كل قطعة.", "Each piece's description says whether it suits the dishwasher and microwave."),
      }),
    },
  ],
  demo: DEMO,
});
