/**
 * Lumière (template 25, fine jewellery; Claude Design "Storefront
 * Templates"): warm ivory paper, near-black actions and a soft gold
 * highlight, Aref Ruqaa display type over Noto Kufi Arabic and square
 * corners. A family jeweller: gold in the headline, collections, new in,
 * four generations in the Khan, most loved, the jeweller and the private
 * list. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): rings, earrings,
 * chains and pendants on stands and trays. No hands, ears, necks, busts or
 * brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LUMIERE_KEY = "lumiere";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LUMIERE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dropEarrings: pexels(19869443, 900),
  braided: pexels(12124662, 900),
  goldRings: pexels(28933799, 900),
  leafEarrings: pexels(11655269, 900),
  ropeChain: pexels(12155925, 900),
  boxChain: pexels(12124617, 900),
  studs: pexels(12194361, 900),
  pendant: pexels(19869445, 900),
  ringTray: pexels(36597044, 900),
  bench: pexels(33873069, 900),
  dish: pexels(4735888),
};

const NAME = L("بيت الدهب", "Dahab House");

const header = lib("header-centered", {
  text: {
    "المتجر": L("خواتم", "Rings"),
    "العروض": L("حلقان", "Earrings"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("دهب عيار ١٨ من خان الخليلي", "18k gold from Khan el-Khalili"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الأتيليه", "The atelier"),
  },
  links: { "/products": [search("خاتم"), search("حلق"), undefined, search("خاتم"), search("حلق")], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ب", "D"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("توصيل مؤمّن وشهادة مع كل قطعة.", "Insured delivery and a certificate with every piece."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت الدهب. كل الحقوق محفوظة.", "© 2026 Dahab House. All rights reserved."),
    "من نحن": L("الأتيليه", "The atelier"),
  },
});

const home: Design[] = [
  lib("hero-inline", {
    photo: [PHOTOS.dropEarrings, PHOTOS.braided],
    text: {
      "تشكيلة ٢٠٢٦": L("مجموعة جديدة", "New collection"),
      "منتجات مختارة بعناية": L("مصنوعة يدوي في القاهرة", "Set by hand in Cairo"),
      "كل ما تستخدمه": L("دهب", "Gold"),
      "صورة صغيرة": L("حلق وغويشة دهب", "Gold earrings and bracelet"),
      "كل يوم،": L("معمول يتلبس", "made to be worn"),
      "بجودة أفضل.": L("كل يوم ولسنين.", "every day, for years."),
      "نختار كل منتج بأنفسنا ونجرّبه قبل أن يصل إليك، بضمان وتوصيل سريع.": L(
        "خواتم وحلقان وأساور دهب ١٨، كل قطعة بشهادة.",
        "Rings, earrings and bracelets in 18k gold, each with a certificate.",
      ),
      "ابدأ التسوق": L("اكتشفي المجموعة", "Discover the collection"),
      "وصل حديثًا": L("خواتم", "Rings"),
      "الأكثر مبيعًا": L("حلقان", "Earrings"),
      "العروض": L("أساور", "Bracelets"),
      "هدايا": L("سلاسل", "Necklaces"),
    },
    links: { "/products": [SHOP, search("خاتم"), search("حلق"), search("غويشة"), search("سلسلة")] },
  }),
  lib("categories-rail", {
    photo: [undefined, PHOTOS.goldRings, PHOTOS.leafEarrings, PHOTOS.ropeChain],
    text: {
      "اكتشف": L("المجموعات", "Collections"),
      "عالم كامل في كل قسم": L("لاقي قطعتك", "Find your piece"),
      "اختر من أقسامنا؛ في كل قسم أفضل ما جربناه.": L("كل تصميم بيتعمل بكميات صغيرة في أتيليه خان الخليلي.", "Every design is made in small runs in our Khan el-Khalili atelier."),
      "وصل حديثًا": L("خواتم", "Rings"),
      "الأكثر مبيعًا": L("حلقان", "Earrings"),
      "العروض": L("سلاسل وأساور", "Chains & bracelets"),
      "تسوّق الآن": L("تسوقي", "Shop"),
    },
    links: { "/products": [SHOP, search("خاتم"), search("حلق"), search("سلسلة")] },
  }),
  lib("products-feature", { text: { "اختيارنا ليك": L("وصل حديثاً", "New in"), "اختيار الأسبوع": L("قطعة الموسم", "Piece of the season") } }),
  lib("about-panel", {
    text: {
      "لماذا بدأنا": L("٤ أجيال في الخان", "Four generations in the Khan"),
      "كنا نجرب كل منتج بأنفسنا قبل أن نبيعه، وما زلنا نفعل ذلك مع كل ما يدخل المتجر.": L(
        "عيلتنا بترصّع أحجار في شارع المعز من ١٩٤٨.",
        "Our family has set stones on Al Moez Street since 1948.",
      ),
      "اليوم يعود إلينا آلاف العملاء، وهذا أكبر دليل على أن الطريقة صحيحة.": L(
        "كل قطعة مدموغة ومعاها شهادة وزن وعيار.",
        "Every piece is hallmarked and sold with a certificate of weight and purity.",
      ),
      "«إن لم نستخدمه نحن، لن نبيعه.»": L("«الدهب لازم يعيش أطول من المناسبة.»", "“Gold should outlive the occasion.”"),
    },
  }),
  lib("products-grid", {
    as: "most-loved",
    text: { "وصل حديثًا": L("الأكثر حباً", "Most loved"), "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي بتتطلب كهدايا أكتر.", "The pieces most often chosen as gifts.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("about-circle", {
    person: [PHOTOS.bench],
    text: {
      "صورة الفريق": L("ترابيزة صايغ عليها أدواته", "A jeweller’s bench with its tools"),
      "إحنا مين": L("الصايغ", "The jeweller"),
      "فريق صغير بيحب اللي بيعمله": L("حسن عبد العزيز، معلم ترصيع", "Hassan Abdelaziz, master setter"),
      "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.": L(
        "احجزي ميعاد في الأتيليه وحسن يظبط مقاس خاتمك ويحفره وانتي مستنية.",
        "Book a fitting at the atelier and Hassan will size and engrave your ring while you wait.",
      ),
      "قابل الفريق": L("احجزي ميعاد", "Book a fitting"),
    },
    links: { "/about": "/contact" },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.dish],
    text: {
      "صورة من المتجر": L("سلاسل دهب في طبق رخام", "Gold chains in a marble dish"),
      "للمشتركين": L("القائمة الخاصة", "Private list"),
      "خد ١٠٪ خصم على أول طلب": L("أول نظرة على القطع الجديدة", "First look at new pieces"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L("المشتركين بيشوفوا التصاميم الجديدة قبل الكل بأسبوع.", "Members see new designs a week early."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الأتيليه", "The atelier"), L("صايغ عائلي في شارع المعز من ١٩٤٨.", "A family jeweller on Al Moez Street since 1948.")),
  aboutStory(lib, {
    photo: PHOTOS.ringTray,
    alt: L("خواتم دهب في علبة عرض", "Gold rings in a display box"),
    eyebrow: L("من ١٩٤٨", "Since 1948"),
    title: L("دهب بشهادة", "Gold with a certificate"),
    text: L("كل قطعة بتتعمل في أتيليه خان الخليلي، مدموغة ومعاها شهادة وزن وعيار.", "Every piece is made in our Khan el-Khalili atelier, hallmarked and certified for weight and purity."),
    more: L("والتوصيل مؤمّن لحد باب بيتك.", "And delivery is insured to your door."),
    button: L("اكتشفي المجموعة", "Discover the collection"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("دهب عيار ١٨، مصنوع يدوي في خان الخليلي.", "18k gold, set by hand in Khan el-Khalili."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.goldRings],
    ["earrings", "حلقان", "Earrings", PHOTOS.leafEarrings],
    ["bracelets", "أساور", "Bracelets", PHOTOS.boxChain],
    ["necklaces", "سلاسل", "Necklaces", PHOTOS.pendant],
  ],
  products: [
    ["drop-earrings", "earrings", "حلق نقطة دهب", "Gold Drop Earrings", PHOTOS.dropEarrings, 24900, { isFeatured: true, rating: 4.9, sold90: 31 }],
    ["leaf-earrings", "earrings", "حلق ورقة شجر", "Leaf Earrings", PHOTOS.leafEarrings, 12800, { sold90: 22 }],
    ["mini-studs", "earrings", "حلق صغير", "Mini Studs", PHOTOS.studs, 6900, { sold90: 48 }],
    ["rope-chain-bracelet", "bracelets", "غويشة سلسلة مبرومة", "Rope Chain Bracelet", PHOTOS.ropeChain, 18500, { isFeatured: true, rating: 4.9, sold90: 52 }],
    ["box-chain-bracelet", "bracelets", "غويشة سلسلة رفيعة", "Fine Chain Bracelet", PHOTOS.boxChain, 8900, { compareAtPrice: 9900, sold90: 66 }],
    ["braided-bracelet", "bracelets", "غويشة مضفّرة", "Braided Bracelet", PHOTOS.braided, 11400, { sold90: 30 }],
    ["textured-bands", "rings", "طقم دبل منقوشة", "Textured Band Set", PHOTOS.goldRings, 12800, { sold90: 44 }],
    ["drop-pendant", "necklaces", "سلسلة بدلاية", "Drop Pendant Necklace", PHOTOS.pendant, 15200, { sold90: 28 }],
    ["gemstone-rings", "rings", "خواتم بأحجار", "Gemstone Rings", PHOTOS.ringTray, 14200, { inStock: false, sold90: 12 }],
  ],
});

export const LUMIERE = libraryTemplate({
  key: LUMIERE_KEY,
  version: 3,
  changelog: "Lumière v3: product page",
  name: L("لوميير", "Lumière"),
  description: L(
    "مجوهرات فاخرة: الدهب في العنوان، المجموعات، حكاية ٤ أجيال والصايغ. أربع صفحات جاهزة.",
    "Fine jewellery: gold in the headline, collections, four generations and the jeweller. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 250,
  palette: ["#f8f3ea", "#efe4d2", "#c9a96e", "#1f1a17"],
  colors: {
    primary: "#1f1a17",
    secondary: "#efe4d2",
    background: "#f8f3ea",
    foreground: "#1f1a17",
    muted: "#655b52",
    border: "#e2d5bf",
    accent: "#e2cfa6",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الأتيليه", "The atelier"), seo: { title: L("الأتيليه", "The atelier") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("احجزي ميعاد", "Book a fitting"),
        text: L("شارع المعز، خان الخليلي، القاهرة.", "Al Moez St, Khan el-Khalili, Cairo."),
        heading: L("مقاس أو حفر أو قطعة خاصة", "A size, an engraving or a special piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العيار والشهادة والتوصيل.", "Purity, certificates and delivery."),
        question: L("القطعة بتيجي بشهادة؟", "Does each piece come with a certificate?"),
        answer: L("أيوه، كل قطعة مدموغة ومعاها شهادة وزن وعيار، والتوصيل مؤمّن.", "Yes. Every piece is hallmarked with a weight and purity certificate, and delivery is insured."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "flat", thumbs: "side", button: "outline", band: "paper", copy: { reviews: L("كلمات من عملائنا", "Words from our clients"), related: L("قطع قد تعجبك", "Pieces you may love") } },
});
