/**
 * Kasr (template 04, editorial fashion; Claude Design "Storefront
 * Templates"): bone paper, oxblood actions and a warm sand highlight,
 * Amiri display type over Noto Sans Arabic and square corners. Built from
 * section library designs (`fromLibrary`), so every element is a tree node
 * the seller can select, restyle and move.
 *
 * Photos: Pexels, each checked by eye (2026-10-20): coats, jackets and
 * linen on rails, flat lays, leather bags and fabric. No people, bodies or
 * mannequins (owner rule).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const KASR_KEY = "kasr";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KASR_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  camelCoat: pexels(36180262),
  neutralRack: pexels(5706273),
  linenCloset: pexels(6461398),
  teddyCoat: pexels(16008693, 900),
  jackets: pexels(6051248, 900),
  garments: pexels(5424908),
  shirts: pexels(7671168, 900),
  corduroy: pexels(12956068, 900),
  leatherJacket: pexels(8113002, 900),
  flatLay: pexels(8408556, 900),
  bagShelf: pexels(9327162, 900),
  cardigan: pexels(31078828, 900),
  fabricStack: pexels(6766360),
  blazer: pexels(7671167, 900),
  floralDress: pexels(8536187, 900),
  sweatshirts: pexels(9594422, 900),
  terracottaTote: pexels(5706278, 900),
  crocBags: pexels(22434771, 900),
  darkCloset: pexels(15923917, 900),
  softRack: pexels(6347879, 900),
  copperRail: pexels(5531711, 900),
  checkRack: pexels(12700580, 900),
  fabricRolls: pexels(4614236),
};

const NAME = L("قصر ستوديو", "Kasr Studio");

const header = lib("header-departments", {
  text: {
    "م": L("ق", "K"),
    "اسم متجرك": NAME,
    "نساء": L("حريمي", "Women"),
    "رجال": L("رجالي", "Men"),
    "أطفال": L("المجلة", "Journal"),
    "ملابس": L("فساتين", "Dresses"),
    "أحذية": L("جواكت", "Jackets"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [SHOP, SHOP, "/blog", undefined, NEW, SHOP, SHOP, SHOP, RATED] },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ق", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ قصر ستوديو. كل الحقوق محفوظة.", "© 2026 Kasr Studio. All rights reserved."),
    "من نحن": L("الاستوديو", "The studio"),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("features-ticker", {
    text: {
      "توصيل سريع": L("توصيل مجاني فوق ١٬٥٠٠ ج.م", "Free delivery over EGP 1,500"),
      "استرجاع سهل": L("تبديل مقاس ببلاش", "Free size exchange"),
      "دعم على واتساب": L("متفصل في القاهرة", "Cut in Cairo"),
      "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    },
  }),
  lib("gallery-slider", {
    photo: [PHOTOS.camelCoat, PHOTOS.neutralRack, PHOTOS.linenCloset, PHOTOS.teddyCoat, PHOTOS.jackets, PHOTOS.garments],
    text: {
      "صورة الحملة": L("بالطو جملي وكوفية صوف من حملة الخريف", "Camel coat and wool scarf from the autumn campaign"),
      "صورة مصغرة": L("صورة من لوك بوك الخريف", "Autumn lookbook photo"),
    },
  }),
  lib("gallery-captioned", {
    photo: [PHOTOS.shirts, PHOTOS.corduroy, PHOTOS.leatherJacket, PHOTOS.flatLay, PHOTOS.bagShelf, PHOTOS.cardigan],
    text: {
      "لوك بوك": L("تسوق المجموعة", "Shop the edit"),
      "كل يوم بشكل": L("لوك لكل يوم", "A look for every day"),
      "إطلالة الشغل": L("المكتب", "The office"),
      "٣ منتجات": L("بدل وأطقم", "Suits & sets"),
      "المشوار": L("الويك إند", "The weekend"),
      "٤ منتجات": L("فساتين", "Dresses"),
      "الويكند": L("المشوار", "The commute"),
      "٢ منتج": L("جواكت", "Jackets"),
      "السفر": L("كل يوم", "Every day"),
      "٥ منتجات": L("أساسيات", "Basics"),
      "الجيم": L("السهرة", "Evenings"),
      "السهرة": L("طبقات", "Layers"),
    },
    links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP, BEST] },
  }),
  lib("video-shop", {
    photo: [undefined, PHOTOS.fabricStack],
    text: {
      "كل اللي في الفيديو": L("بدلة واحدة بخمس طرق", "One suit, five ways"),
      "فيديو المنتجات": L("فيديو: بدلة واحدة بخمس طرق", "Video: one suit, five ways"),
    },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("وصل جديد", "New in"),
      "هدايا تحت ١٠٠٠ جنيه": L("وصل الأسبوع ده", "This week’s arrivals"),
      "اختيارات مضمونة لأي مناسبة.": L("كميات صغيرة متفصلة في استوديو الزمالك.", "Small runs, cut in our Zamalek studio."),
    },
    links: { "/products": NEW },
    lists: [{ source: "newest" }],
  }),
  lib("testimonials-products", {
    photo: [PHOTOS.blazer, PHOTOS.floralDress, PHOTOS.shirts, PHOTOS.sweatshirts],
    text: {
      "تقييمات": L("التقييمات", "Reviews"),
      "تقييمات على منتجات حقيقية": L("اتلبست واتقيّمت", "Worn and reviewed"),
      "الطقم الكلاسيك": L("بليزر رملي مفصّل", "Sand Tailored Blazer"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "البليزر لابساني كأنه متفصل عليا. لبسته في ٣ أفراح لحد دلوقتي.",
        "The blazer fits like it was made for me. I have worn it to three weddings already.",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نور ع.", "Nour A."),
      "القاهرة": L("الزمالك", "Zamalek"),
      "الحقيبة اليومية": L("فستان زيتي مشجّر", "Olive Floral Dress"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("القماش استحمل الغسالة ولسه زي الجديد.", "The fabric survived the washing machine and still looks new."),
      "ع": L("ه", "H"),
      "عمر ك.": L("هنا م.", "Hana M."),
      "الإسكندرية": L("المعادي", "Maadi"),
      "العلبة الهدية": L("أوفر شيرت لونين", "Two-Tone Overshirt"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("أوفر شيرت حلو، الكم طويل شوية.", "Great overshirt, sleeves are a little long."),
      "ن": L("ع", "O"),
      "نور ح.": L("عمر ف.", "Omar F."),
      "الإصدار الجديد": L("سويت شيرت باستيل", "Pastel Crew Sweatshirt"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("أحسن سويت شيرت عندي. اشتريته بلونين.", "Best sweatshirt I own. I bought it in two colours."),
      "ي": L("ي", "Y"),
      "يوسف م.": L("يارا س.", "Yara S."),
      "المنصورة": L("القاهرة", "Cairo"),
    },
    links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP] },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.darkCloset, PHOTOS.softRack, PHOTOS.copperRail, PHOTOS.checkRack, PHOTOS.fabricRolls],
    text: {
      "عملاؤنا": L("دواليبكم فيها قصر", "Kasr in your wardrobes"),
      "أرسل لنا صورتك": L("ابعتلنا صورتك", "Send us your photo"),
      "مريم": handle("@nour.a"),
      "عمر": handle("@omar.f"),
      "نور": handle("@hana.m"),
      "يوسف": handle("@yara.s"),
      "سلمى": handle("@karim"),
    },
  }),
  lib("newsletter-sticker", {
    photo: [undefined, undefined, undefined, PHOTOS.crocBags],
    text: {
      "خد ١٠٪ خصم على أول طلب": L("خصم ١٠٪ على أول طلب", "10% off your first order"),
      "وكمان توصلك العروض قبل أي حد.": L("اشترك واعرف الجديد قبل الكل.", "Join the list and hear about new drops first."),
      "صورة العرض": L("شنط جلد بملمس كروكو", "Croc-effect leather bags"),
    },
  }),
];

const pageHeader = (as: string, title: ReturnType<typeof L>, text: ReturnType<typeof L>) =>
  lib("page-header", { as, text: { "من نحن": title, "فريق صغير يختار منتجات نشتريها نحن أنفسنا.": text } });

const about: Design[] = [
  pageHeader("about-header", L("الاستوديو", "The studio"), L("استوديو تصميم صغير في الزمالك بيفصّل كميات ٥٠ قطعة.", "A small design studio in Zamalek cutting clothes in runs of fifty.")),
  lib("about-classic", {
    person: [undefined, undefined, PHOTOS.fabricRolls],
    text: {
      "صورة المتجر": L("لفات قماش على ترابيزة الورشة", "Fabric rolls on the workshop table"),
      "حكايتنا": L("من الزمالك", "From Zamalek"),
      "بدأنا بسؤال واحد: هل سيدوم؟": L("هدوم متفصلة في القاهرة لكل يوم", "Clothes cut in Cairo, styled for every day"),
      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": L(
        "بنختار القماش بنفسنا ونفصّل كل موديل ٥٠ قطعة بس، عشان كل قطعة تفضل مميزة.",
        "We pick every fabric ourselves and cut each style in runs of fifty, so every piece stays special.",
      ),
      "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": L("وتبديل المقاس عندنا ببلاش، دايماً.", "And size exchanges are always free."),
      "تعرّف علينا": L("تسوق الجديد", "Shop new in"),
    },
    links: { "/about": NEW },
  }),
];

const contact: Design[] = [
  pageHeader("contact-header", L("تواصل", "Contact"), L("٥ شارع البرازيل، الزمالك، القاهرة.", "5 Brazil St, Zamalek, Cairo.")),
  lib("contact-form", { text: { "ابعتلنا وهنرجعلك": L("عن مقاس أو طلب أو قطعة", "About a size, an order or a piece") } }),
];

const faq: Design[] = [
  pageHeader("faq-header", L("الأسئلة الشائعة", "FAQ"), L("المقاسات والتوصيل والتبديل.", "Sizes, delivery and exchanges.")),
  lib("faq-columns", {
    text: {
      "ما سياسة الاسترجاع؟": L("إزاي أبدّل المقاس؟", "How do I exchange a size?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "تبديل المقاس ببلاش خلال ١٤ يوم لأي قطعة بالتيكت بتاعها.",
        "Size exchanges are free within 14 days for any piece with its tags on.",
      ),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هدوم متفصلة في القاهرة لكل يوم.", "Clothes cut in Cairo, styled for every day."),
  categories: [
    ["sets", "بدل وأطقم", "Suits & sets", PHOTOS.neutralRack],
    ["dresses", "فساتين", "Dresses", PHOTOS.floralDress],
    ["jackets", "جواكت", "Jackets", PHOTOS.jackets],
    ["basics", "أساسيات", "Basics", PHOTOS.flatLay],
    ["bags", "شنط", "Bags", PHOTOS.bagShelf],
  ],
  products: [
    ["sand-tailored-blazer", "sets", "بليزر رملي مفصّل", "Sand Tailored Blazer", PHOTOS.blazer, 3450, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["olive-floral-dress", "dresses", "فستان زيتي مشجّر", "Olive Floral Dress", PHOTOS.floralDress, 2250, { rating: 4.8, sold90: 58 }],
    ["two-tone-overshirt", "jackets", "أوفر شيرت لونين", "Two-Tone Overshirt", PHOTOS.shirts, 2650, { sold90: 31 }],
    ["teddy-coat", "jackets", "بالطو تيدي", "Teddy Coat", PHOTOS.teddyCoat, 3900, { isFeatured: true, sold90: 22 }],
    ["shearling-leather-jacket", "jackets", "جاكت جلد بفرو", "Shearling Leather Jacket", PHOTOS.leatherJacket, 4800, { compareAtPrice: 5600, sold90: 12 }],
    ["pastel-crew-sweatshirt", "basics", "سويت شيرت باستيل", "Pastel Crew Sweatshirt", PHOTOS.sweatshirts, 590, { rating: 4.7, sold90: 210 }],
    ["corduroy-overshirt", "basics", "قميص قطيفة", "Corduroy Overshirt", PHOTOS.corduroy, 1450, { sold90: 27 }],
    ["chunky-knit-cardigan", "basics", "كارديجان تريكو تقيل", "Chunky Knit Cardigan", PHOTOS.cardigan, 890, { compareAtPrice: 1090, sold90: 27 }],
    ["terracotta-mini-tote", "bags", "شنطة توت طوبي صغيرة", "Terracotta Mini Tote", PHOTOS.terracottaTote, 1950, { isFeatured: true, sold90: 44 }],
    ["croc-shoulder-bag", "bags", "شنطة كتف كروكو", "Croc-Effect Shoulder Bag", PHOTOS.crocBags, 1700, { compareAtPrice: 1990, sold90: 36 }],
  ],
});

export const KASR = libraryTemplate({
  key: KASR_KEY,
  version: 2,
  name: L("قصر", "Kasr"),
  description: L(
    "موضة تحريرية: لوك بوك وفيديو وتقييمات على المنتجات، بخط كلاسيكي وزوايا حادة. أربع صفحات جاهزة.",
    "Editorial fashion: a lookbook, a video and product reviews, with classic type and square corners. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 40,
  palette: ["#f4f1ec", "#e8e2d8", "#a3472b", "#1c1b19"],
  colors: {
    primary: "#a3472b",
    secondary: "#e8e2d8",
    background: "#f4f1ec",
    foreground: "#1c1b19",
    muted: "#615c54",
    border: "#dcd5c9",
    accent: "#e8c9a8",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    {
      slug: "about",
      name: L("الاستوديو", "Studio"),
      seo: { title: L("الاستوديو", "The studio"), description: L("استوديو تصميم صغير في الزمالك.", "A small design studio in Zamalek.") },
      sections: about,
    },
    { slug: "contact", name: L("تواصل", "Contact"), seo: { title: L("تواصل", "Contact") }, sections: contact },
    { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
  ],
  demo: DEMO,
});
