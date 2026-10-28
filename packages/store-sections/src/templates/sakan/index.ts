/**
 * Sakan (template 24, living and bedroom furniture; Claude Design
 * "Storefront Templates"): stone paper, a deep green-grey for actions and a
 * warm sand highlight, Amiri headings over Noto Sans Arabic and almost
 * square corners. A showroom store: room slides, shop by room, best
 * sellers, pick the fabric, the delivery timeline and a designer on hand. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): sofas, beds,
 * armchairs, lamps and dining rooms. No people.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SAKAN_KEY = "sakan";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SAKAN_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  beigeLiving: pexels(39828916),
  woodBed: pexels(5644286),
  greenSofa: pexels(4846087),
  oliveArmchairs: pexels(13806257),
  navySofa: pexels(30386991),
  showroom: pexels(276528),
  beigeArmchair: pexels(7195580, 900),
  floorLamps: pexels(11850174, 900),
  diningRoom: pexels(3935326, 900),
  readingCorner: pexels(2079246, 900),
  cushionSofa: pexels(6758245),
  greenMarble: pexels(19991831, 900),
  greyBed: pexels(7445084, 900),
  heroLiving: pexels(39828916, 1600),
  heroBed: pexels(5644286, 1600),
  heroArmchairs: pexels(13806257, 1600),
};

const NAME = L("سكن ليفنج", "Sakan Living");

const header = lib("header-ruled", {
  text: { "م": L("س", "S"), "اسم متجرك": NAME, "المتجر": L("كل الأثاث", "All furniture"), "العروض": L("الأكثر مبيعاً", "Best sellers") },
  links: { "/products": [SHOP, BEST, undefined, undefined] },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("أوض هادية ومعمولة تعيش.", "Calm rooms, built to last."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سكن ليفنج. كل الحقوق محفوظة.", "© 2026 Sakan Living. All rights reserved."),
    "من نحن": L("المعرض", "The showroom"),
  },
});

/**
 * Home (v4, template-rules §2a): three showroom rooms as a slideshow hero,
 * shop by room, then the furniture journey: the best-loved pieces, made to
 * order in your fabric, the five-week delivery timeline and a designer on
 * hand to close.
 */
const home: Design[] = [
  lib("hero-thumbs", {
    photo: [PHOTOS.heroLiving, PHOTOS.heroBed, PHOTOS.heroArmchairs],
    text: {
      "درجات جديدة": L("المعيشة", "Living room"),
      "لون بيتكلم عنك": L("أوضة هادية ومعمولة تعيش", "A calm room, built to last"),
      "درجات هادية لكل يوم وألوان جريئة للمناسبات.": L("كنب كتان واطي بالقماش اللي تختاره.", "Low linen sofas in the fabric you choose."),
      "تسوّق الآن": L("تسوق الأكثر مبيعاً", "Shop best sellers"),
      "صورة الشريحة الأولى": L("أوضة معيشة بكنبة بيج في المعرض", "A living room with a beige sofa in our showroom"),
      "المجموعة الجديدة": L("النوم", "Bedroom"),
      "جريء ومريح وليك": L("نوم أهدى من أول ليلة", "Calmer sleep from night one"),
      "اختيارات جديدة وصلت للموسم ده.": L("سراير خشب ومفارش كتان من دمياط.", "Wooden beds and linen bedding from Damietta."),
      "تسوّق الجديد": L("شوف الجديد", "See what’s new"),
      "صورة الشريحة الثانية": L("سرير خشب بمفرش رمادي", "A wooden bed with grey bedding"),
      "أطقم كاملة": L("ركن القراية", "Reading corner"),
      "قطعتين وعشر إطلالات": L("فوتيه يستاهل الكتاب", "An armchair worth the book"),
      "قطع بتتنسّق مع بعض بسهولة.": L("فوتيهات قطيفة وكتان على الطلب.", "Velvet and linen armchairs, made to order."),
      "تسوّق الأطقم": L("تسوق كل الأثاث", "Shop all furniture"),
      "صورة الشريحة الثالثة": L("فوتيهين زيتي في ركن هادي", "Two olive armchairs in a quiet corner"),
    },
    links: { "/products": [BEST, NEW, SHOP] },
  }),
  lib("categories-captioned", {
    text: { "اكتشف الأقسام": L("تسوق حسب الأوضة", "Shop by room") },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكثر مبيعاً", "Best sellers"), "اختيار الأسبوع": L("الأكثر حباً", "Most loved") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.cushionSofa],
    text: {
      "إزاي بنشتغل": L("على الطلب", "Made to order"),
      "كل منتج بيتراجع قبل ما يوصلك": L("اختار القماش وإحنا نعمل الكنبة", "Pick the fabric, we build the sofa"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "اختار من ٢٤ كتان وقطيفة. كل قطعة بتتعمل في ورشتنا في دمياط في ٥ أسابيع.",
        "Choose from 24 linens and velvets. Every piece is built in our Damietta workshop in five weeks.",
      ),
      "اعرف أكتر": L("احجز زيارة للمعرض", "Book a showroom visit"),
      "صورة المتجر": L("كنبة رمادي بمخدات", "A grey sofa with cushions"),
    },
    links: { "/about": "/contact" },
  }),
  lib("stats-milestones", {
    text: {
      "حكايتنا": L("مواعيد التوصيل", "Delivery timeline"),
      "من محل صغير لكل مصر": L("من الطلب لأوضة المعيشة", "From order to living room"),
      "٢٠١٨": L("يوم ١", "Day 1"),
      "أول محل صغير": L("تختار القماش والمقاس", "You pick fabric and size"),
      "٢٠٢٠": L("أسبوع ١", "Week 1"),
      "بدأنا البيع أونلاين": L("الهيكل بيتقص في دمياط", "The frame is cut in Damietta"),
      "٢٠٢٣": L("أسبوع ٤", "Week 4"),
      "شحن لكل المحافظات": L("التنجيد والمراجعة", "Upholstery and checks"),
      "٢٠٢٦": L("أسبوع ٥", "Week 5"),
      "٢٥ ألف طلب": L("التوصيل والتركيب", "Delivered and assembled"),
    },
  }),
  lib("faq-panel", {
    text: {
      "محتاج مساعدة؟": L("محتار؟", "Not sure?"),
      "إحنا هنا": L("كلم مصمم", "Talk to a designer"),
      "بنرد في ١٢ دقيقة في المتوسط": L("متوسط الرد: ١٥ دقيقة", "Average reply: 15 minutes"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("المعرض", "The showroom"), L("زورنا في مول العرب كل يوم من ١٠ الصبح لـ ١٠ بالليل.", "Visit us at Mall of Arabia every day from 10am to 10pm.")),
  aboutStory(lib, {
    photo: PHOTOS.showroom,
    alt: L("كنب بيج في صالة عرض", "Beige sofas in a showroom"),
    eyebrow: L("مول العرب", "Mall of Arabia"),
    title: L("أوض هادية ومعمولة تعيش", "Calm rooms, built to last"),
    text: L("كل قطعة بتتعمل على الطلب في دمياط بالقماش اللي تختاره، وبتوصل في ٥ أسابيع.", "Every piece is built to order in Damietta in the fabric you choose, and arrives in five weeks."),
    more: L("وكل قطعة عليها ضمان سنتين.", "And every piece has a two-year warranty."),
    button: L("تسوق كل الأثاث", "Shop all furniture"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أوض هادية ومعمولة تعيش.", "Calm rooms, built to last."),
  categories: [
    ["living", "المعيشة", "Living room", PHOTOS.beigeLiving],
    ["bedroom", "النوم", "Bedroom", PHOTOS.woodBed],
    ["chairs", "فوتيهات", "Armchairs", PHOTOS.oliveArmchairs],
    ["lighting", "الإضاءة", "Lighting", PHOTOS.floorLamps],
    ["dining", "السفرة", "Dining", PHOTOS.diningRoom],
  ],
  products: [
    ["low-linen-sofa", "living", "كنبة كتان واطية", "Low Linen Sofa", PHOTOS.beigeLiving, 26500, { isFeatured: true, rating: 4.8, sold90: 62 }],
    ["green-velvet-sofa", "living", "كنبة قطيفة خضرا", "Green Velvet Sofa", PHOTOS.greenSofa, 31900, { sold90: 15 }],
    ["navy-sofa", "living", "كنبة كحلي", "Navy Sofa", PHOTOS.navySofa, 24900, { compareAtPrice: 27500, sold90: 22 }],
    ["green-marble-table", "living", "ترابيزة رخام أخضر", "Green Marble Table", PHOTOS.greenMarble, 4900, { compareAtPrice: 5600, sold90: 33 }],
    ["oak-bed-frame", "bedroom", "سرير خشب", "Wooden Bed Frame", PHOTOS.woodBed, 18900, { rating: 4.8, sold90: 28 }],
    ["grey-linen-bedding", "bedroom", "مفرش كتان رمادي", "Grey Linen Bedding", PHOTOS.greyBed, 3400, { sold90: 40 }],
    ["reading-armchair", "chairs", "فوتيه قراية", "Reading Armchair", PHOTOS.beigeArmchair, 9800, { isFeatured: true, sold90: 41 }],
    ["olive-armchair-pair", "chairs", "زوج فوتيه زيتي", "Olive Armchair Pair", PHOTOS.oliveArmchairs, 17800, { sold90: 19 }],
    ["brass-floor-lamp", "lighting", "أباجورة أرضي نحاس", "Brass Floor Lamp", PHOTOS.floorLamps, 3200, { inStock: false, sold90: 19 }],
    ["oak-dining-set", "dining", "سفرة خشب ٦ كراسي", "Wooden Dining Set, 6 Chairs", PHOTOS.diningRoom, 34500, { sold90: 11 }],
  ],
});

export const SAKAN = libraryTemplate({
  key: SAKAN_KEY,
  version: 4,
  changelog: "Sakan v4: hero, categories, section order",
  name: L("سكن", "Sakan"),
  description: L(
    "أثاث المعيشة والنوم: شرائح من المعرض، تسوق حسب الأوضة، اختار القماش ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Living and bedroom furniture: showroom slides, shop by room, pick the fabric and the delivery timeline. Four ready pages.",
  ),
  category: "home",
  sortOrder: 240,
  palette: ["#f3f0ea", "#e3ddd2", "#c7b79a", "#26302e"],
  colors: {
    primary: "#26302e",
    secondary: "#e3ddd2",
    background: "#f3f0ea",
    foreground: "#26302e",
    muted: "#5f6763",
    border: "#d8d1c4",
    accent: "#c7b79a",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("المعرض", "Showroom"), seo: { title: L("المعرض", "The showroom") }, sections: about },
    {
      slug: "contact",
      name: L("احجز زيارة", "Book a visit"),
      seo: { title: L("احجز زيارة", "Book a visit") },
      sections: contactPage(lib, {
        title: L("احجز زيارة", "Book a visit"),
        text: L("مول العرب، ٦ أكتوبر، الجيزة.", "Mall of Arabia, 6th of October City, Giza."),
        heading: L("كلم مصمم", "Talk to a designer"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والتركيب والضمان.", "Delivery, assembly and warranty."),
        question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
        answer: L("سنتين على الهيكل والمكانيزم، وسنة على القماش.", "Two years on the frame and mechanism, one year on the fabric."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", band: "paper", extras: ["product-shipping"], copy: { reviews: L("آراء سكان البيوت", "What homeowners say"), related: L("قطع لنفس الغرفة", "More for the same room") } },
});
