/**
 * Oak (template 23, decor and small furniture; Claude Design "Storefront
 * Templates"): warm paper, a terracotta for actions and a sand highlight,
 * Noto Naskh Arabic headings over IBM Plex Sans Arabic and square corners.
 * A curated decor shop: an editorial collage, categories in big type, just
 * in, ask a stylist, most loved, a customer story and the newsletter.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): chairs, vases, throws,
 * cushions, frames and calm rooms. No people.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const OAK_KEY = "oak";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(OAK_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  blackChair: pexels(32553376, 900),
  redChair: pexels(6078545, 900),
  throw: pexels(30755772, 900),
  ringVase: pexels(4207892, 900),
  stoneVases: pexels(17619624, 900),
  vaseTrio: pexels(8217492, 900),
  cushionSofa: pexels(6758245, 900),
  driedPalm: pexels(6963598, 900),
  frames: pexels(7445084, 900),
  marbleSide: pexels(15253318, 900),
  woodTable: pexels(7607461, 900),
  cosyRoom: pexels(2079246),
  newsletter: pexels(8217492),
};

const NAME = L("ركن ديكور", "Rokn Decor");

const header = lib("header-ruled", {
  text: { "م": L("ر", "R"), "اسم متجرك": NAME, "المتجر": L("كل المنتجات", "Shop all"), "العروض": L("الأكثر حباً", "Most loved") },
  links: { "/products": [SHOP, BEST, undefined, undefined] },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ر", "R"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ركن ديكور. كل الحقوق محفوظة.", "© 2026 Rokn Decor. All rights reserved."),
    "من نحن": L("عن ركن", "About Rokn"),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-collage", {
    photo: [PHOTOS.blackChair, PHOTOS.throw, PHOTOS.ringVase],
    text: {
      "حكاية الموسم": L("مجموعة الخريف", "The autumn edit"),
      "٣ قطع تكفي أسبوعًا كاملًا": L("٣ قطع وأوضة جديدة", "Three pieces, a new room"),
      "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.": L(
        "كرسي وبطانية وفازة. غالباً ده كل اللي الأوضة محتاجاه.",
        "A chair, a throw and a vase. That is often all a room needs.",
      ),
      "تسوّق اللوك": L("تسوق المجموعة", "Shop the edit"),
      "القطعة الأولى": L("كرسي ليفنج", "Lounge chair"),
      "القطعة الثانية": L("بطانية تريكو", "Knit throw"),
      "القطعة الثالثة": L("فازة الحلقة", "Ring vase"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-big-type", {}),
  lib("products-rail", {
    as: "just-in",
    text: { "بيحبوها": L("جديد", "New"), "الأكثر مبيعًا": L("وصل حالاً", "Just in") },
    links: { "/products": NEW },
    lists: [{ source: "newest" }],
  }),
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.cosyRoom],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("اسأل ستايلست", "Ask a stylist"),
      "صورة المتجر": L("ركن قراية دافي بكراسي ورفوف", "A warm reading corner with chairs and shelves"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "ابعتلنا صورة أوضتك وفريقنا يقترح ٣ قطع ببلاش.",
        "Send us a photo of your room and our stylists suggest three pieces, free.",
      ),
      "شوف إزاي بنشتغل": L("ابعت صورة أوضتك", "Send your room"),
    },
    links: { "/about": "/contact" },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("الكتالوج", "Catalogue"),
      "كل الإكسسوارات": L("الأكثر حباً", "Most loved"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("القطع اللي العملاء بيشتروها تاني كهدايا.", "The pieces customers buy again as gifts."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«قطع ركن خلّت شقتنا الإيجار تحس إنها بتاعتنا، والفازة أحلى من الصور.»",
        "“Rokn pieces made our rented flat feel like ours, and the vase is nicer than in the photos.”",
      ),
      "م": L("س", "S"),
      "مريم أ.": L("سلمى ح.", "Salma H."),
    },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("فازات وشمعة على صينية", "Vases and a candle on a tray"),
      "للمشتركين": L("النشرة", "Newsletter"),
      "خد ١٠٪ خصم على أول طلب": L("قطع جديدة كل شهر", "New pieces every month"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L("المشتركين بيعرفوا بالجديد الأول.", "Subscribers hear about new arrivals first."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ركن", "About Rokn"), L("محل ديكور صغير في وسط البلد.", "A small decor shop in Downtown Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.stoneVases,
    alt: L("فازتين حجري على رخامة", "Two stoneware vases on marble"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("قطع صغيرة بتغيّر الأوضة", "Small pieces that change a room"),
    text: L("بنختار كل فازة وبطانية وكرسي من ورش مصرية، وبنساعدك تنسّقهم في بيتك.", "We pick every vase, throw and chair from Egyptian workshops and help you style them at home."),
    more: L("والتغليف الهدية ببلاش لو طلبته.", "And gift wrap is free on request."),
    button: L("تسوق الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع صغيرة بتغيّر الأوضة.", "Small pieces that change a room."),
  categories: [
    ["chairs", "كراسي وترابيزات", "Chairs & tables", PHOTOS.blackChair],
    ["decor", "فازات وتحف", "Vases & objects", PHOTOS.stoneVases],
    ["textiles", "بطاطين ومخدات", "Throws & cushions", PHOTOS.throw],
    ["frames", "براويز ولوحات", "Frames & art", PHOTOS.frames],
  ],
  products: [
    ["lounge-chair-lamp", "chairs", "كرسي ليفنج وأباجورة", "Lounge Chair & Lamp", PHOTOS.blackChair, 9400, { isFeatured: true, rating: 4.8, sold90: 44 }],
    ["velvet-wing-chair", "chairs", "كرسي قطيفة نبيتي", "Burgundy Velvet Chair", PHOTOS.redChair, 7800, { sold90: 21 }],
    ["marble-side-tables", "chairs", "ترابيزتين رخام", "Marble Side Table Pair", PHOTOS.marbleSide, 6400, { compareAtPrice: 7200, sold90: 12 }],
    ["ring-vase", "decor", "فازة الحلقة", "Ring Vase", PHOTOS.ringVase, 850, { rating: 4.9, sold90: 73 }],
    ["vase-candle-trio", "decor", "طقم فازتين وشمعة", "Vase & Candle Trio", PHOTOS.vaseTrio, 1250, { compareAtPrice: 1450, sold90: 34 }],
    ["dried-palm-vase", "decor", "فازة بنخيل مجفف", "Dried Palm Vase", PHOTOS.driedPalm, 690, { sold90: 28 }],
    ["chunky-knit-throw", "textiles", "بطانية تريكو تقيلة", "Chunky Knit Throw", PHOTOS.throw, 1350, { rating: 4.8, sold90: 47 }],
    ["cushion-set", "textiles", "طقم مخدات", "Cushion Set", PHOTOS.cushionSofa, 690, { sold90: 21 }],
    ["oak-frame-pair", "frames", "زوج براويز بلوط", "Oak Frame Pair", PHOTOS.frames, 760, { isFeatured: true, sold90: 12 }],
    ["round-wood-table", "chairs", "ترابيزة خشب مدورة", "Round Wood Table", PHOTOS.woodTable, 3900, { inStock: false, sold90: 9 }],
  ],
});

export const OAK = libraryTemplate({
  key: OAK_KEY,
  version: 2,
  name: L("أوك", "Oak"),
  description: L(
    "ديكور وأثاث صغير: كولاج، أقسام بخط كبير، اسأل ستايلست والأكثر حباً. أربع صفحات جاهزة.",
    "Decor and small furniture: a collage, categories in big type, ask a stylist and most loved. Four ready pages.",
  ),
  category: "home",
  sortOrder: 230,
  palette: ["#faf7f1", "#efe8db", "#9b4d2c", "#2c2a24"],
  colors: {
    primary: "#9b4d2c",
    secondary: "#efe8db",
    background: "#faf7f1",
    foreground: "#2c2a24",
    muted: "#665f53",
    border: "#e2d9c8",
    accent: "#e7d3b8",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "IBM Plex Sans Arabic" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ركن", "About"), seo: { title: L("عن ركن", "About Rokn") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("اسأل ستايلست", "Ask a stylist"),
        text: L("٢٢ شارع محمد محمود، وسط البلد، القاهرة.", "22 Mohamed Mahmoud St, Downtown, Cairo."),
        heading: L("ابعتلنا صورة أوضتك", "Send us a photo of your room"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والتوصيل والاسترجاع.", "Wrapping, delivery and returns."),
        question: L("في تغليف هدية؟", "Do you gift wrap?"),
        answer: L("أيوه، ببلاش. اكتب في ملاحظات الطلب ونحط كارت بإسمك.", "Yes, free of charge. Note it on your order and we add a card with your name."),
      }),
    },
  ],
  demo: DEMO,
});
