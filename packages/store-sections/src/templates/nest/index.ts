/**
 * Nest (template 13, modern home living; Claude Design "Storefront
 * Templates"): warm stone paper, terracotta actions and a sand highlight,
 * Reem Kufi headings over Noto Sans Arabic and small 6px corners. A
 * room-led store: department tabs, a bento opening with the lead piece,
 * departments, how it is made, new in, a client quote and the makers.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): vases, linen, lamps,
 * candles, tableware and calm rooms. No people, bodies or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const NEST_KEY = "nest";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NEST_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  livingRoom: pexels(12281845),
  pottery: pexels(8063803, 900),
  linen: pexels(30618181, 900),
  vaseCandles: pexels(8217492, 900),
  ringVase: pexels(4207892, 900),
  stoneVases: pexels(17619624, 900),
  vaseFamily: pexels(27180805, 900),
  blueVase: pexels(15791100, 900),
  tableware: pexels(3847434, 900),
  tablewareMix: pexels(3847451, 900),
  runner: pexels(20428215, 900),
  jarCandles: pexels(28750459, 900),
  pillarCandles: pexels(5933684, 900),
  bed: pexels(28536693, 900),
  bedRumpled: pexels(3847546, 900),
  throw: pexels(30755772, 900),
  linenLamp: pexels(17994856, 900),
  bulbLamp: pexels(40103210, 900),
  arch: pexels(7195042, 900),
};

const NAME = L("سكن هوم", "Sakan Home");

const header = lib("header-departments", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "نساء": L("المعيشة", "Living"),
    "رجال": L("السفرة", "Table"),
    "أطفال": L("النوم", "Bedroom"),
    "ملابس": L("فازات وخزف", "Vases & ceramics"),
    "أحذية": L("مفارش", "Bedding"),
    "شنط": L("إضاءة", "Lighting"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [SHOP, SHOP, SHOP, undefined, NEW, SHOP, SHOP, SHOP, RATED] },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("قطع جديدة من الورش كل شهر، للمشتركين الأول.", "New pieces from the workshops every month, for subscribers first."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سكن هوم. كل الحقوق محفوظة.", "© 2026 Sakan Home. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("صنّاعنا", "Our makers"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.livingRoom],
    text: {
      "وصل جديد": L("الخريف في البيت", "Autumn at home"),
      "صوت أنقى، كل يوم": L("قطع بتكمّل شكل الأوضة", "Pieces that make a room feel finished"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "خزف وكتان وإضاءة، بكميات صغيرة من ورش مصرية.",
        "Ceramics, linen and light, made in small runs by Egyptian workshops.",
      ),
      "تسوق الآن": L("تسوقي المجموعة", "Shop the edit"),
      "صورة الحملة": L("أوضة معيشة هادية بكنبة فاتحة", "A calm living room with a pale sofa"),
      "من ١٢ ألف تقييم": L("من أكتر من ٤٠٠ تقييم", "from 400+ reviews"),
    },
  }),
  lib("categories-feature-list", {
    text: { "الأقسام": L("الأقسام", "Departments"), "كل الأقسام": L("كل الأقسام", "All departments") },
  }),
  lib("about-rows", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.pottery, PHOTOS.linen, PHOTOS.vaseCandles],
    text: {
      "نختار": L("متشكّل باليد في الفسطاط", "Thrown by hand in Fustat"),
      "نشتري من الموزعين المعتمدين فقط، ونرفض أي منتج مشكوك فيه.": L(
        "كل فازة وطبق بيبدأ على دولاب الفخراني، عشان كده مفيش اتنين زي بعض.",
        "Every vase and bowl starts on a potter’s wheel, so no two are quite the same.",
      ),
      "نجرّب": L("كتان منسوج في المحلة", "Linen woven in Mahalla"),
      "كل منتج يُفتح ويُجرَّب قبل أن يُعرض في المتجر.": L("بنغسل كل لفة مرتين عشان تبقى ناعمة من أول ليلة.", "We wash every bolt twice so it is soft from the first night."),
      "نغلّف": L("متغلّفة عشان توصل سليمة", "Packed to arrive whole"),
      "تغليف محكم ومعه الفاتورة والضمان.": L("الخزف بيتشحن في عبوات ورق مضغوط. ولو حاجة اتكسرت بنبدّلها.", "Ceramics travel in moulded paper pulp. If anything breaks, we replace it."),
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("وصل جديد", "New in"), "اختيار الأسبوع": L("قطعة الشهر", "Piece of the month") },
  }),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«الفازة وصلت متغلفة بطريقة محتاجة مقص وصبر. ولا خدش. شكلها على الحقيقة أحلى.»",
        "“The vase arrived in so much padding I needed scissors and patience. Not a single chip. It looks even better in person.”",
      ),
      "م": L("د", "D"),
      "مريم أ.": L("داليا ف.", "Dalia F."),
    },
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.ringVase],
    text: {
      "صورة المتجر": L("فازة خزف بيضا بفتحة دائرية", "A white ring vase in ceramic"),
      "من داخل المتجر": L("صنّاعنا", "Our makers"),
      "بدأنا من محل صغير": L("ست ورش ومعيار واحد", "Six workshops, one standard"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "بنشتغل مع ست ورش عائلية في مصر وبنزور كل واحدة كل موسم.",
        "We work with six family workshops across Egypt and visit each one every season.",
      ),
      "اعرف أكثر": L("اتعرفي على الصنّاع", "Meet the makers"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("صنّاعنا", "Our makers"), L("سكن هوم بتشتغل مع ورش عائلية في الفسطاط والمحلة وأخميم.", "Sakan Home works with family workshops in Fustat, Mahalla and Akhmim.")),
  aboutStory(lib, {
    photo: PHOTOS.pottery,
    alt: L("مجات خزف على رف الورشة", "Ceramic mugs on a workshop shelf"),
    eyebrow: L("من ٢٠٢٠", "Since 2020"),
    title: L("كميات صغيرة على مهل", "Small runs, made slowly"),
    text: L("كل قطعة متعملة باليد بكميات بالعشرات، في ورش بنعرف أصحابها بالاسم.", "Each piece is made by hand in runs of a few dozen, in workshops whose owners we know by name."),
    more: L("ولو قطعة وصلت مكسورة، بنبدّلها.", "And if a piece arrives broken, we replace it."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع مصنوعة على مهل لبيت هادي.", "Slow-made pieces for calm rooms."),
  categories: [
    ["vases", "فازات وخزف", "Vases & ceramics", PHOTOS.vaseFamily],
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.tablewareMix],
    ["candles", "شموع", "Candles", PHOTOS.pillarCandles],
    ["bedding", "مفارش", "Bedding", PHOTOS.bedRumpled],
    ["lighting", "أباجورات", "Lamps", PHOTOS.bulbLamp],
    ["decor", "ديكور", "Decor", PHOTOS.vaseCandles],
  ],
  products: [
    ["washed-linen-duvet-set", "bedding", "طقم لحاف كتان مغسول", "Washed Linen Duvet Set", PHOTOS.bed, 2900, { isFeatured: true, rating: 4.9, sold90: 36 }],
    ["ribbed-stoneware-vases", "vases", "فازتين حجري مضلّعين", "Ribbed Stoneware Vases", PHOTOS.stoneVases, 850, { rating: 4.9, sold90: 73 }],
    ["pastel-vase-family", "vases", "عيلة فازات باستيل", "Pastel Vase Family", PHOTOS.vaseFamily, 1250, { compareAtPrice: 1450, sold90: 34 }],
    ["ring-vase", "vases", "فازة الحلقة", "Ring Vase", PHOTOS.blueVase, 690, { sold90: 19 }],
    ["hand-glazed-tableware", "tableware", "طقم سفرة مطلي يدوي", "Hand-Glazed Tableware Set", PHOTOS.tableware, 980, { rating: 4.8, sold90: 41 }],
    ["linen-table-runner", "tableware", "رانر كتان للسفرة", "Linen Table Runner", PHOTOS.runner, 540, { sold90: 22 }],
    ["jar-candle-pair", "candles", "زوج شمع في برطمان", "Jar Candle Pair", PHOTOS.jarCandles, 380, { rating: 4.7, sold90: 88 }],
    ["waffle-knit-throw", "bedding", "بطانية تريكو", "Waffle Knit Throw", PHOTOS.throw, 1350, { compareAtPrice: 1600, sold90: 47 }],
    ["linen-shade-lamp", "lighting", "أباجورة بغطا كتان", "Linen Shade Lamp", PHOTOS.linenLamp, 1750, { sold90: 12 }],
    ["arch-sculpture-set", "decor", "طقم قوس وشمعدان", "Arch Sculpture Set", PHOTOS.arch, 760, { inStock: false, sold90: 9 }],
  ],
});

export const NEST = libraryTemplate({
  key: NEST_KEY,
  version: 2,
  name: L("نِست", "Nest"),
  description: L(
    "ديكور البيت: أقسام حسب الأوضة، بتتعمل إزاي، الجديد وحكاية الصنّاع. أربع صفحات جاهزة.",
    "Modern home living: shop by room, how it is made, new in and the makers. Four ready pages.",
  ),
  category: "home",
  sortOrder: 130,
  palette: ["#f3ede3", "#e3d6c2", "#b65a3a", "#3d4030"],
  colors: {
    primary: "#b65a3a",
    secondary: "#e3d6c2",
    background: "#f3ede3",
    foreground: "#2b2c24",
    muted: "#625f52",
    border: "#d8ccb9",
    accent: "#e8d3b5",
  },
  fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("صنّاعنا", "Our makers"), seo: { title: L("صنّاعنا", "Our makers") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("٥ شارع ٢٥٤، دجلة، المعادي، القاهرة.", "5 Street 254, Degla, Maadi, Cairo."),
        heading: L("عن قطعة أو مقاس أو طلب", "About a piece, a size or an order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والتوصيل والاسترجاع.", "Packing, delivery and returns."),
        question: L("لو قطعة خزف وصلت مكسورة؟", "What if a ceramic piece arrives broken?"),
        answer: L(
          "صوّريها أول ما تفتحي العلبة وابعتيلنا خلال ٤٨ ساعة، ونبعتلك واحدة جديدة ببلاش.",
          "Take a photo when you open the box and message us within 48 hours; we send a new one free of charge.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
