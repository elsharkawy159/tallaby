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
      "صُنعت لتدوم معك": L("ملابس سباحة وأدوات بحر", "Swimwear and beach gear"),
      "خامات مختارة وتفاصيل هادئة لكل يوم.": L(
        "مايوهات ونظارات سباحة ومناشف وحقائب بحر.",
        "Swimwear, goggles, towels and beach bags.",
      ),
      "تسوّق الآن": L("تسوق الصيف", "Shop summer"),
      "اكتشف الجديد": L("وصل جديد", "New in"),
      "صورة الواجهة": L("حمام سباحة أزرق في الشمس", "A blue swimming pool in the sun"),
    },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("عمّ تبحث؟", "What are you looking for?") } }),
  lib("products-shelf", {
    text: { "تسوّق حسب اختيارك": L("المتجر", "Shop"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("pay-zones", {
    text: {
      "التوصيل": L("التوصيل", "Delivery"),
      "نوصّل إلى كل مصر": L("التوصيل إلى الساحل", "Delivery to the coast"),
      "المدة والمصاريف حسب محافظتك.": L("المدة والمصاريف حسب منطقتك.", "Time and cost depend on your area."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للساحل فوق ٨٠٠ ج.م", "Free delivery to the North Coast over EGP 800"),
      "القاهرة والجيزة": L("القاهرة والجيزة", "Cairo & Giza"),
      "١–٢ يوم": L("نفس اليوم", "Same day"),
      "٥٠ ج.م": L("٤٠ ج.م", "EGP 40"),
      "الإسكندرية والدلتا": L("الساحل الشمالي", "North Coast"),
      "٢–٣ أيام": L("اليوم التالي", "Next day"),
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
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 2nd category.
  // 2 across: the demo's category holds 2 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 1 }, { categoryIndex: 2, limit: 2 }], nodes: { "منتجات القسم": { style: { columns: 2 }, tablet: { columns: 2 } } } }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء الصيف", "Summer reviews"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "المايوه كما في الصور تمامًا، والخامة ممتازة.",
        "The swimsuit is just like the photos, and the fabric is excellent.",
      ),
      "مريم أ.": L("منة ع.", "Menna A."),
      "القاهرة": L("الساحل", "North Coast"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "النظارة لا يتسرب إليها الماء، حتى في التمرين الطويل.",
        "The goggles do not leak, even in long sessions.",
      ),
      "يوسف م.": L("ياسين ح.", "Yassin H."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "جدول المقاسات كان واضحًا، واخترت المقاس المناسب من أول مرة.",
        "The size chart was clear, and I picked the right size first time.",
      ),
      "عمر ك.": L("عمر ف.", "Omar F."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("مظلة الخوص متينة وتصميمها جميل.", "The straw umbrella is sturdy and looks lovely."),
      "سلمى ر.": L("سارة م.", "Sara M."),
      "أسيوط": L("الغردقة", "Hurghada"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المنشفة كبيرة وتجف بسرعة، وألوانها ثابتة.", "The towel is big and dries fast, and the colours hold."),
      "نور ح.": L("نادين ك.", "Nadine K."),
      "الجيزة": L("السخنة", "Sokhna"),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("مقاسات الزعانف مكتوبة بوضوح في صفحة المنتج.", "Fin sizes are clearly listed on the product page."),
      "كريم ع.": L("كريم ص.", "Karim S."),
      "طنطا": L("الشيخ زايد", "Sheikh Zayed"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سباحة سويم", "About Sabaha Swim"), L("مايوهات ونضارات وأدوات بحر للصيف.", "Swimwear, goggles and beach gear for summer.")),
  aboutStory(lib, {
    photo: PHOTOS.pool,
    alt: L("حمام سباحة خالٍ بحبال الحارات", "An empty pool with lane ropes"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("لوازم السباحة والبحر", "Swim and beach essentials"),
    text: L(
      "نختار مايوهات ونظارات وأدوات سباحة وبحر، ونعرض تفاصيل ومقاسات كل منتج بوضوح.",
      "We choose swimwear, goggles and swim and beach gear, and show every product's details and sizes clearly.",
    ),
    more: L("تواصل معنا لأي سؤال عن مقاس أو منتج.", "Contact us with any question about a size or a product."),
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
    ["beach", "الشاطئ", "Beach", PHOTOS.strawUmbrella],
    ["bikinis", "بكيني", "Bikinis", PHOTOS.swimwearFlatLay],
    ["snorkel", "أدوات الغطس", "Snorkelling", PHOTOS.snorkelSet],
    ["fins", "زعانف", "Fins", PHOTOS.fins],
    ["towels", "مناشف", "Towels", PHOTOS.stripedTowel],
    ["bags", "حقائب بحر", "Beach bags", PHOTOS.strawBag],
  ],
  products: [
    ["mirror-goggles", "swim-gear", "نظارة سباحة عاكسة", "Mirrored Swim Goggles", PHOTOS.goggles, 450, { sold90: 230 }],
    ["snorkel-fins-set", "snorkel", "طقم غطس وزعانف", "Snorkel and Fins Set", PHOTOS.snorkelSet, 1250, { rating: 4.8, sold90: 88 }],
    ["striped-beach-towel", "towels", "منشفة بحر مخططة", "Striped Beach Towel", PHOTOS.stripedTowel, 390, { sold90: 160 }],
    ["lace-swimsuit", "swimwear", "مايوه دانتيل أبيض", "White Lace Swimsuit", PHOTOS.laceSwimsuit, 1150, { isFeatured: true, rating: 4.9, sold90: 72 }],
    ["blue-frill-swimsuit", "swimwear", "مايوه أزرق بكرانيش", "Blue Frill Swimsuit", PHOTOS.blueSwimsuit, 990, { compareAtPrice: 1190, sold90: 64 }],
    ["mix-bikini-set", "bikinis", "طقم بكيني ملوّن", "Colourful Bikini Set", PHOTOS.swimwearFlatLay, 850, { sold90: 50 }],
    ["short-fins", "fins", "زعانف قصيرة", "Short Swim Fins", PHOTOS.fins, 690, { sold90: 34 }],
    ["pink-towel-hat", "towels", "منشفة وقبعة خوص", "Towel and Straw Hat", PHOTOS.pinkTowel, 640, { sold90: 40 }],
    ["straw-tote", "bags", "حقيبة بحر خوص", "Straw Beach Tote", PHOTOS.strawBag, 720, { sold90: 58 }],
    ["basket-bag", "bags", "حقيبة سلة", "Basket Bag", PHOTOS.basketBag, 560, { compareAtPrice: 650, sold90: 30 }],
    ["straw-umbrella", "beach", "مظلة شاطئ خوص", "Straw Beach Umbrella", PHOTOS.strawUmbrella, 1850, { inStock: false, sold90: 12 }],
  ],
});

export const SABAHA = libraryTemplate({
  key: SABAHA_KEY,
  version: 5,
  changelog: "Sabaha v4: products by category in a swipe row on the home",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("منتجات أخرى للشاطئ", "More for the beach") } },
  name: L("سباحة", "Sabaha"),
  description: L(
    "سباحة وبحر: حمام سباحة بعرض الشاشة، الأقسام، الرف، مناطق التوصيل وآراء الصيف. أربع صفحات جاهزة.",
    "Swim and beach: a full-width pool, categories, the shelf, delivery zones and summer reviews. Four ready pages.",
  ),
  category: "pets",
  style: ["playful"],
  sortOrder: 940,
  palette: ["#f4fbfc", "#dff3f6", "#fde68a", "#0e7490"],
  colors: {
    primary: "#0e7490",
    secondary: "#dff3f6",
    background: "#ffffff",
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
        text: L("اسأل عن مقاس أو منتج، وسنرد عليك.", "Ask about a size or a product, and we will reply."),
        heading: L("اسأل عن مقاس أو منتج", "Ask about a size or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والخامات والطلبات.", "Sizes, materials and orders."),
        question: L("هل يمكن إرجاع المايوه؟", "Can I return a swimsuit?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
