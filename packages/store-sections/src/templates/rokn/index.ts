/**
 * Rokn (template 80, decor and gifts; Claude Design "Storefront
 * Templates"): warm cream paper, a walnut brown for actions and a honey
 * highlight, Amiri headings over Noto Sans Arabic and 18px corners. A small
 * decor and gift studio: small things that finish a room, gifts by who they
 * are for, shop by budget, the five given most, a gift card and one
 * customer's words. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): stoneware vases, empty
 * frames, candles, macrame, throws, cushions and wrapped gift boxes. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ROKN_KEY = "rokn";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ROKN_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dottedVases: pexels(7119222),
  vaseShelf: pexels(8063882, 900),
  frameRoom: pexels(6373517, 900),
  candleCorner: pexels(16411135, 900),
  featherHanging: pexels(16176329, 900),
  woodTray: pexels(36089265),
  donutVase: pexels(4207892, 900),
  twoToneVases: pexels(33126633, 900),
  whiteAmphoras: pexels(19193216, 900),
  pinkVase: pexels(7572727, 900),
  oakFrame: pexels(4207785, 900),
  blackFrame: pexels(8490257, 900),
  woodFrame: pexels(7956938, 900),
  blackVaseTray: pexels(7670689, 900),
  candleJar: pexels(6311829, 900),
  macrame: pexels(13211211, 900),
  waffleThrow: pexels(4577654, 900),
  cushions: pexels(9290601, 900),
  giftBoxes: pexels(3873488, 900),
};

const NAME = L("ركن ستوديو", "Rokn Studio");

const header = lib("header-centered", {
  text: {
    "المتجر": L("الجديد", "New in"),
    "العروض": L("الأكثر إهداءً", "Most gifted"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("حاجات صغيرة بتكمّل الأوضة", "Small things that finish a room"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الستوديو", "The studio"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/faq" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ركن ستوديو. كل الحقوق محفوظة.", "© 2026 Rokn Studio. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("الستوديو", "The studio"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.dottedVases],
    text: {
      "كوليكشن الموسم": L("محل هدايا", "Gift shop"),
      "صوت أنقى، كل يوم": L("حاجات صغيرة وفرق كبير", "Small things, big difference"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "فازات وبراويز ومنسوجات متختارة تمشي مع بعض، ومتغلفة هدية ببلاش.",
        "Vases, frames and textiles chosen to work together, gift-wrapped for free.",
      ),
      "تسوق الآن": L("تسوق الديكور", "Shop decor"),
      "العروض": L("الأكثر إهداءً", "Most gifted"),
      "صورة الحملة": L("فازتين سيراميك منقوشين", "Two dotted ceramic vases"),
    },
    links: { "/products": [SHOP, BEST] },
  }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("هتزيّن إيه؟", "What are you decorating?") } }),
  lib("finder-price-bands", {
    text: {
      "حسب السعر": L("حسب السعر", "By price"),
      "تسوق حسب ميزانيتك": L("حسب ميزانيتك", "Shop by budget"),
      "أقل من ٦٠٠": L("أقل من ٥٠٠", "Under 500"),
      "٦٠٠ – ١٬٥٠٠": L("٥٠٠ – ٧٠٠", "500 – 700"),
      "أكتر من ١٬٥٠٠": L("أكتر من ٧٠٠", "Over 700"),
    },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("أحسن ٥", "Top 5"),
      "كل الإكسسوارات": L("الأكتر إهداءً", "Given most"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("الهدايا اللي الناس بترجع تطلبها لحبايبهم.", "The gifts people come back to order for the people they love."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«طلبت فازة وبرواز هدية بيت جديد، ووصلوا متغلفين بكارت مكتوب بخط الإيد. صاحبتي فرحت جداً.»",
        "“I ordered a vase and a frame as a housewarming gift; they arrived wrapped with a handwritten card. My friend loved it.”",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نادين س.", "Nadine S."),
      "القاهرة": L("مصر الجديدة", "Heliopolis"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الستوديو", "The studio"), L("ستوديو ديكور وهدايا صغير في المعادي.", "A small decor and gift studio in Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.woodTray,
    alt: L("صينية خشب عليها شمعة وقواعد أكواب", "A wooden tray with a candle jar and coasters"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("بنختار حاجات تمشي مع بعض", "We choose things that go together"),
    text: L("كل فازة وبرواز ومفرش في الستوديو متختار عشان يمشي مع الباقي، فتقدر تكمّل ركن كامل من مكان واحد.", "Every vase, frame and textile in the studio is chosen to go with the rest, so you can finish a whole corner in one place."),
    more: L("وكل طلب بيتغلف هدية ببلاش.", "And every order is gift-wrapped for free."),
    button: L("تسوق الديكور", "Shop decor"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("حاجات صغيرة بتكمّل الأوضة.", "Small things that finish a room."),
  categories: [
    ["vases", "فازات", "Vases", PHOTOS.vaseShelf],
    ["frames", "براويز", "Frames", PHOTOS.frameRoom],
    ["candles", "شموع", "Candles", PHOTOS.candleCorner],
    ["textiles", "منسوجات", "Textiles", PHOTOS.featherHanging],
  ],
  products: [
    ["donut-stoneware-vase", "vases", "فازة دونات ستون وير", "Stoneware Donut Vase", PHOTOS.donutVase, 450, { isFeatured: true, rating: 4.8, sold90: 140 }],
    ["two-tone-vases", "vases", "فازتين على صينية خشب", "Two-Tone Vase Pair", PHOTOS.twoToneVases, 590, { rating: 4.7, sold90: 88 }],
    ["white-amphora-pair", "vases", "زلعتين بيض", "White Amphora Pair", PHOTOS.whiteAmphoras, 650, { sold90: 46 }],
    ["pink-vase-tray", "vases", "فازة بينك على صينية", "Pink Vase on a Tray", PHOTOS.pinkVase, 480, { sold90: 52 }],
    ["oak-frame-vase-set", "frames", "برواز أرو وفازة", "Oak Frame & Vase Set", PHOTOS.oakFrame, 690, { isFeatured: true, sold90: 61 }],
    ["black-frame", "frames", "برواز أسود", "Black Frame", PHOTOS.blackFrame, 320, { sold90: 70 }],
    ["washed-wood-frame", "frames", "برواز خشب مغسول", "Washed Wood Frame", PHOTOS.woodFrame, 280, { sold90: 34 }],
    ["black-vase-candle-tray", "candles", "صينية شمع وفازة سودا", "Black Vase & Candle Tray", PHOTOS.blackVaseTray, 540, { sold90: 39 }],
    ["amber-candle-jar", "candles", "شمعة في برطمان عنبري", "Amber Candle Jar", PHOTOS.candleJar, 260, { sold90: 95 }],
    ["macrame-wall-hanging", "textiles", "معلقة مكرمية", "Macrame Wall Hanging", PHOTOS.macrame, 420, { inStock: false, sold90: 21 }],
    ["waffle-throw", "textiles", "بطانية وافل", "Waffle Throw", PHOTOS.waffleThrow, 890, { compareAtPrice: 1050, sold90: 40 }],
    ["cushion-set", "textiles", "طقم مخدات ألوان", "Cushion Set", PHOTOS.cushions, 650, { sold90: 22 }],
  ],
});

export const ROKN = libraryTemplate({
  key: ROKN_KEY,
  version: 3,
  changelog: "Rokn v3: categories, section order",
  productPage: { thumbs: "bottom", gallery: "end", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للركن", "Back to the corner"), reviews: L("كلمات عملائنا", "Customers' words"), related: L("هدايا صغيرة معاه", "Small gifts to go with it") } },
  name: L("ركن", "Rokn"),
  description: L(
    "ديكور وهدايا: هدايا حسب الشخص، حسب الميزانية، الأكتر إهداءً وكارت هدية. أربع صفحات جاهزة.",
    "Decor and gifts: gifts by person, by budget, given most and a gift card. Four ready pages.",
  ),
  category: "home",
  sortOrder: 800,
  palette: ["#faf6f1", "#f0e7dc", "#f2cc8f", "#7f5539"],
  colors: {
    primary: "#7f5539",
    secondary: "#f0e7dc",
    background: "#faf6f1",
    foreground: "#2a2420",
    muted: "#675c53",
    border: "#e3d6c6",
    accent: "#f2cc8f",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الستوديو", "The studio"), seo: { title: L("الستوديو", "The studio") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٧ شارع ٩، المعادي.", "7 Road 9, Maadi."),
        heading: L("اطلب كارت هدية أو اسأل عن هدية", "Order a gift card or ask about a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والتوصيل والاسترجاع.", "Gift wrap, delivery and returns."),
        question: L("ينفع أبعت الهدية لعنوان تاني؟", "Can I send the gift to another address?"),
        answer: L("أيوه، اكتب عنوان الشخص في الطلب ومش هنحط فاتورة جوه العلبة.", "Yes, add their address to the order and we leave the invoice out of the box."),
      }),
    },
  ],
  demo: DEMO,
});
