/**
 * Sabaha (template 94, swim and beach; Claude Design "Storefront
 * Templates"): pale pool-water paper, a deep teal for actions and a sand
 * yellow highlight, Alexandria throughout and round 20px corners. A summer
 * shop: a big word over the featured piece, delivery to the beach, the
 * shelf, the beach bag bundle, a first-order coupon and summer reviews.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): swimsuits laid flat,
 * goggles on sand, snorkel sets and fins, towels, straw bags, beach
 * umbrellas and empty pool lanes. No people, no bodies, no brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SABAHA_KEY = "sabaha";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SABAHA_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  goggles: pexels(29266554, 900),
  snorkelSet: pexels(21630945, 900),
  fins: pexels(91474, 900),
  laceSwimsuit: pexels(8371478, 900),
  blueSwimsuit: pexels(4271771, 900),
  swimwearFlatLay: pexels(3998649, 900),
  stripedTowel: pexels(30982093, 900),
  pinkTowel: pexels(11664691, 900),
  strawBag: pexels(20817636, 900),
  basketBag: pexels(9071044, 900),
  strawUmbrella: pexels(39123308, 900),
  pool: pexels(9030294),
};

const NAME = L("سباحة سويم", "Sabaha Swim");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("المايوهات", "Swimwear"), "العروض": L("أدوات البحر", "Beach gear"), "المدونة": L("الأسئلة", "FAQ") },
  links: { "/products": [SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سباحة سويم. كل الحقوق محفوظة.", "© 2026 Sabaha Swim. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.pool],
    text: {
      "المجموعة الجديدة": L("صيف ٢٠٢٦", "Summer 2026"),
      "صُنعت لتدوم معك": L("جاهز للمية؟", "Ready for the water?"),
      "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": L(
        "مايوهات ونضارات وفوط وشنط بحر، توصل الشاليه أو البيت.",
        "Swimwear, goggles, towels and beach bags, delivered to your chalet or home.",
      ),
      "تسوّق الآن": L("تسوق الصيف", "Shop summer"),
      "شوف الجديد": L("وصل جديد", "New in"),
      "صورة الواجهة": L("حمام سباحة أزرق في الشمس", "A blue swimming pool in the sun"),
    },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("رايح فين؟", "Where are you heading?") } }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("المتجر", "Shop"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("pay-zones", {
    text: {
      "التوصيل": L("التوصيل", "Delivery"),
      "بنوصل لكل مصر": L("بنوصل للبحر", "We deliver to the beach"),
      "المدة والمصاريف حسب محافظتك.": L("للشاليه أو الفندق أو البيت، حسب المكان.", "To your chalet, hotel or home, depending on where you are."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للساحل فوق ٨٠٠ ج.م", "Free delivery to the North Coast over EGP 800"),
      "القاهرة والجيزة": L("القاهرة والجيزة", "Cairo & Giza"),
      "١–٢ يوم": L("نفس اليوم", "Same day"),
      "٥٠ ج.م": L("٤٠ ج.م", "EGP 40"),
      "الإسكندرية والدلتا": L("الساحل الشمالي", "North Coast"),
      "٢–٣ أيام": L("تاني يوم", "Next day"),
      "٦٥ ج.م": L("٦٠ ج.م", "EGP 60"),
      "مدن القناة": L("العين السخنة", "Ain Sokhna"),
      "الصعيد": L("الإسكندرية", "Alexandria"),
      "٣–٥ أيام": L("١–٢ يوم", "1–2 days"),
      "٨٠ ج.م": L("٥٠ ج.م", "EGP 50"),
      "البحر الأحمر وسيناء": L("الغردقة والجونة", "Hurghada & El Gouna"),
      "٤–٦ أيام": L("٢–٣ أيام", "2–3 days"),
      "٩٥ ج.م": L("٧٥ ج.م", "EGP 75"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء الصيف", "Summer reviews"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "طلبت المايوه الصبح ووصلني الشاليه تاني يوم في الساحل.",
        "Ordered the swimsuit in the morning and it reached our chalet on the North Coast the next day.",
      ),
      "مريم أ.": L("منة ع.", "Menna A."),
      "القاهرة": L("الساحل", "North Coast"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "النضارة مش بتشبّر ولا بتدخلها مية، حتى في التمرين الطويل.",
        "The goggles do not fog or leak, even in long sessions.",
      ),
      "يوسف م.": L("ياسين ح.", "Yassin H."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بدّلت مقاس المايوه بسهولة، وردوا عليا في دقايق.",
        "Swapped the swimsuit size easily, and they replied in minutes.",
      ),
      "عمر ك.": L("عمر ف.", "Omar F."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("الشمسية الخوص وصلت الغردقة في يومين.", "The straw umbrella reached Hurghada in two days."),
      "سلمى ر.": L("سارة م.", "Sara M."),
      "أسيوط": L("الغردقة", "Hurghada"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الفوطة كبيرة وبتنشف بسرعة، والألوان ما بهتتش.", "The towel is big and dries fast, and the colours did not fade."),
      "نور ح.": L("نادين ك.", "Nadine K."),
      "الجيزة": L("السخنة", "Sokhna"),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار مقاس الزعانف لابني.", "They helped me pick the right fin size for my son."),
      "كريم ع.": L("كريم ص.", "Karim S."),
      "طنطا": L("الشيخ زايد", "Sheikh Zayed"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سباحة سويم", "About Sabaha Swim"), L("مايوهات ونضارات وأدوات بحر للصيف.", "Swimwear, goggles and beach gear for summer.")),
  aboutStory(lib, {
    photo: PHOTOS.pool,
    alt: L("حمام سباحة فاضي بحبال الحارات", "An empty pool with lane ropes"),
    eyebrow: L("من النادي للبحر", "From the club pool to the sea"),
    title: L("بدأنا من حمام السباحة", "It started at the pool"),
    text: L(
      "كنا بندرّب سباحة في النادي، والأهالي دايمًا بيسألوا نجيب منين نضارات ومايوهات كويسة.",
      "We coached swimming at the club, and parents always asked where to find good goggles and swimsuits.",
    ),
    more: L("النهارده بنوصل كل الصيف للساحل والسخنة والغردقة.", "Today we deliver all summer to the North Coast, Sokhna and Hurghada."),
    button: L("تسوق المايوهات", "Shop swimwear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مايوهات ونضارات وأدوات بحر للصيف.", "Swimwear, goggles and beach gear for summer."),
  categories: [
    ["swim-gear", "أدوات سباحة", "Swim gear", PHOTOS.goggles],
    ["swimwear", "مايوهات", "Swimwear", PHOTOS.blueSwimsuit],
    ["beach", "البحر", "Beach", PHOTOS.strawUmbrella],
  ],
  products: [
    ["mirror-goggles", "swim-gear", "نضارة سباحة مرايا", "Mirrored Swim Goggles", PHOTOS.goggles, 450, { sold90: 230 }],
    ["snorkel-fins-set", "swim-gear", "طقم سنوركل وزعانف", "Snorkel and Fins Set", PHOTOS.snorkelSet, 1250, { rating: 4.8, sold90: 88 }],
    ["striped-beach-towel", "beach", "فوطة بحر مقلمة", "Striped Beach Towel", PHOTOS.stripedTowel, 390, { sold90: 160 }],
    ["lace-swimsuit", "swimwear", "مايوه دانتيل أبيض", "White Lace Swimsuit", PHOTOS.laceSwimsuit, 1150, { isFeatured: true, rating: 4.9, sold90: 72 }],
    ["blue-frill-swimsuit", "swimwear", "مايوه أزرق بكرانيش", "Blue Frill Swimsuit", PHOTOS.blueSwimsuit, 990, { compareAtPrice: 1190, sold90: 64 }],
    ["mix-bikini-set", "swimwear", "طقم بكيني ملوّن", "Colourful Bikini Set", PHOTOS.swimwearFlatLay, 850, { sold90: 50 }],
    ["short-fins", "swim-gear", "زعانف قصيرة", "Short Swim Fins", PHOTOS.fins, 690, { sold90: 34 }],
    ["pink-towel-hat", "beach", "فوطة وبرنيطة خوص", "Towel and Straw Hat", PHOTOS.pinkTowel, 640, { sold90: 40 }],
    ["straw-tote", "beach", "شنطة بحر خوص", "Straw Beach Tote", PHOTOS.strawBag, 720, { sold90: 58 }],
    ["basket-bag", "beach", "شنطة سلة", "Basket Bag", PHOTOS.basketBag, 560, { compareAtPrice: 650, sold90: 30 }],
    ["straw-umbrella", "beach", "شمسية بحر خوص", "Straw Beach Umbrella", PHOTOS.strawUmbrella, 1850, { inStock: false, sold90: 12 }],
  ],
});

export const SABAHA = libraryTemplate({
  key: SABAHA_KEY,
  version: 3,
  changelog: "Sabaha v3: wide pool hero, categories, no coupon, section order",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { back: L("رجوع لعالم الصيف", "Back to the summer shop"), reviews: L("رأي الصيف", "Summer reviews"), related: L("خد معاه على البحر", "Take along to the beach") } },
  name: L("سباحة", "Sabaha"),
  description: L(
    "سباحة وبحر: حمام سباحة بعرض الشاشة، الأقسام، الرف، بنوصل للبحر وآراء الصيف. أربع صفحات جاهزة.",
    "Swim and beach: a full-width pool, categories, the shelf, delivery to the beach and summer reviews. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 940,
  palette: ["#f4fbfc", "#dff3f6", "#fde68a", "#0e7490"],
  colors: {
    primary: "#0e7490",
    secondary: "#dff3f6",
    background: "#f4fbfc",
    foreground: "#0b2a33",
    muted: "#4a6870",
    border: "#c4e6ec",
    accent: "#fde68a",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن سباحة", "About"), seo: { title: L("عن سباحة سويم", "About Sabaha Swim") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا مكانك في الساحل أو السخنة وهنقولك معاد التوصيل.", "Send us where you are on the coast and we will tell you the delivery time."),
        heading: L("اسأل عن مقاس أو توصيل", "Ask about a size or delivery"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتوصيل للبحر والاسترجاع.", "Sizes, beach delivery and returns."),
        question: L("ينفع أرجّع المايوه؟", "Can I return a swimsuit?"),
        answer: L("أيوه، خلال ١٤ يوم لو بالتيكت والبطانة الصحية لسه عليه.", "Yes, within 14 days with its tag and hygiene liner still on."),
      }),
    },
  ],
  demo: DEMO,
});
