/**
 * Safar (template 99, road trip and camping gear; Claude Design "Storefront
 * Templates"): sand paper, a deep forest ink for type and a burnt orange for
 * actions, Changa headings over Cairo text and tight 6px corners. A trip
 * outfitter: a road-trip poster, the desert kit, browse by category, fresh
 * gear, delivery days to Siwa and Sinai, the tents as a carousel (the
 * store's 1st category) and messages from the road. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): tents by a lake and in a
 * forest, a trekking pack, gas and LED lanterns, camp stoves with a kettle
 * and a coffee pot, a cook set, an air pillow, a folding chair and beach
 * bags. No people, no hands and no gear brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SAFAR_KEY = "safar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SAFAR_KEY, getDesign(id)!, { corners: 6, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  lakeTent: pexels(6271632),
  forestTent: pexels(30563253, 900),
  tentView: pexels(6271630),
  pack: pexels(12220945, 900),
  gasLantern: pexels(6271463, 900),
  ledLantern: pexels(20413588, 900),
  kettleStove: pexels(8911191, 900),
  coffeeStove: pexels(9143864, 900),
  cookSet: pexels(31442974, 900),
  airPillow: pexels(31443014, 900),
  chair: pexels(29458688, 900),
  beachBags: pexels(27528410, 900),
};

const NAME = L("سفر جير", "Safar Gear");

const header = lib("header-chips", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن خيمة، حقيبة، كشاف…", "Search tents, packs, lanterns…"),
  },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد معدات الرحلات أولًا.", "Sign up to hear about new trip gear first."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سفر جير. كل الحقوق محفوظة.", "© 2026 Safar Gear. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.lakeTent],
    text: {
      "مجموعة الموسم": L("موسم الرحلات", "Road trip season"),
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "صورة الحملة": L("خيمة حمراء وبيضاء على شاطئ بحيرة", "A red and white tent on a lake shore"),
      "مجموعة": L("أطقم من", "Kits from"),
      "٢٠٢٦": L("٣٩٠٠", "3,900"),
      "الجديدة": L("جنيه", "EGP"),
      "الموسم الجديد وصل": L("معدات الرحلات والتخييم", "Camping and trip gear"),
      "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": L(
        "خيام وحقائب وإضاءة للرحلات في الصحراء والساحل.",
        "Tents, packs and lights for desert and coast trips.",
      ),
      "اكتشف المجموعة": L("تسوق الأطقم", "Shop kits"),
    },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("تصفح", "Browse") } }),
  lib("products-rail", {
    text: { "المفضلة لدى العملاء": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("أدوات جديدة", "Fresh gear") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("pay-days", {
    text: {
      "١": L("٢٤", "24"),
      "يوم": L("ساعة", "hours"),
      "القاهرة، الجيزة": L("تُشحن الأطقم", "Kits ship"),
      "الإسكندرية، الدلتا، مدن القناة": L("القاهرة والإسكندرية", "Cairo and Alexandria"),
      "٤–٦": L("٤", "4"),
      "الصعيد، البحر الأحمر، سيناء": L("سيوة وسيناء", "Siwa and Sinai"),
    },
  }),
  // The store's 1st category (camp, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("testimonials-chat", {
    text: {
      "رسائل تسعدنا": L("من الطريق", "From the road"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الخيمة سهلة التركيب، وخامتها قوية كما في الوصف.",
        "The tent is easy to pitch, and the material is as strong as described.",
      ),
      "هذا يسعدنا جدًا، شكرًا لك!": L("يسعدنا أنها أعجبتكم، شكرًا لكم!", "So glad you liked it, thank you!"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "كشاف LED قوي الإضاءة وبطاريته تدوم طويلًا.",
        "The LED lantern is bright and its battery lasts a long time.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "ثاني طقم أطلبه، والمنتجات كما في الصور تمامًا.",
        "My second kit, and everything is just like the photos.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سفر جير", "About Safar Gear"), L("خيام وحقائب وإضاءة وأدوات طهي للرحلات.", "Tents, packs, lights and cookware for trips.")),
  aboutStory(lib, {
    photo: PHOTOS.tentView,
    alt: L("منظر بحيرة من باب خيمة", "A lake seen from a tent door"),
    eyebrow: L("على الطريق", "On the road"),
    title: L("معدات لكل رحلة", "Gear for every trip"),
    text: L("نختار خيامًا وحقائب وكشافات وأدوات طهي للرحلات، ونعرض مواصفات كل منتج بوضوح.", "We choose tents, packs, lanterns and camp cookware, and show every product's specs clearly."),
    more: L("تواصل معنا لأي سؤال عن منتج أو مقاس.", "Contact us with any question about a product or size."),
    button: L("تسوق الخيم", "Shop tents"),
    href: search("خيمة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خيام وحقائب وإضاءة وأدوات طهي للرحلات.", "Tents, packs, lights and cookware for trips."),
  categories: [
    ["camp", "تخييم", "Camp", PHOTOS.forestTent],
    ["cook", "طبخ ورحلة", "Cook & carry", PHOTOS.kettleStove],
    ["packs-light", "حقائب وإضاءة", "Packs & light", PHOTOS.pack],
    ["lanterns", "كشافات", "Lanterns", PHOTOS.ledLantern],
    ["coffee", "قهوة الرحلة", "Trip coffee", PHOTOS.coffeeStove],
    ["sleep", "لوازم النوم", "Sleep", PHOTOS.airPillow],
    ["chairs", "كراسي", "Chairs", PHOTOS.chair],
    ["coolers", "حقائب تبريد", "Cooler bags", PHOTOS.beachBags],
  ],
  products: [
    ["two-person-dome-tent", "camp", "خيمة قبة لفردين", "Two-Person Dome Tent", PHOTOS.forestTent, 4200, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["trekking-pack-45l", "packs-light", "حقيبة ظهر ٤٥ لتر", "45 L Trekking Pack", PHOTOS.pack, 2650, { rating: 4.7, sold90: 60 }],
    ["gas-camp-lantern", "lanterns", "كشاف غاز للتخييم", "Gas Camp Lantern", PHOTOS.gasLantern, 950, { sold90: 84 }],
    ["rechargeable-led-lantern", "lanterns", "كشاف LED قابل للشحن", "Rechargeable LED Lantern", PHOTOS.ledLantern, 1250, { compareAtPrice: 1450, isFeatured: true, sold90: 120 }],
    ["camp-stove-kettle", "cook", "موقد رحلات وغلاية", "Camp Stove and Kettle", PHOTOS.kettleStove, 1800, { rating: 4.6, sold90: 48 }],
    ["trip-coffee-set", "coffee", "طقم قهوة الرحلة", "Trip Coffee Set", PHOTOS.coffeeStove, 1100, { sold90: 66 }],
    ["camp-cook-set", "cook", "طقم أواني طهي للتخييم", "Camp Cook Set", PHOTOS.cookSet, 890, { sold90: 52 }],
    ["air-pillow-pad", "sleep", "وسادة هوائية ومرتبة نوم", "Air Pillow and Sleeping Pad", PHOTOS.airPillow, 1350, { sold90: 40 }],
    ["folding-camp-chair", "chairs", "كرسي رحلات قابل للطي", "Folding Camp Chair", PHOTOS.chair, 780, { compareAtPrice: 900, sold90: 110 }],
    ["beach-cooler-bag", "coolers", "حقيبة تبريد للشاطئ", "Beach Cooler Bag", PHOTOS.beachBags, 650, { inStock: false, sold90: 70 }],
    // Three more for camp, so its carousel fills a row of four (v3).
    ["lakeside-tent", "camp", "خيمة لأربعة أفراد", "Four-Person Tent", pexels(6271632, 900), 5600, { sold90: 18 }],
    ["tent-with-porch", "camp", "خيمة بمظلة أمامية", "Tent with Porch", pexels(6271630, 900), 4800, { sold90: 16 }],
    ["camp-chair-pair", "camp", "كرسيان للتخييم", "Camp Chair Pair", PHOTOS.chair, 1450, { sold90: 14 }],
  ],
});

export const SAFAR = libraryTemplate({
  key: SAFAR_KEY,
  version: 3,
  changelog: "Safar v3: a camp carousel (the store's 1st category) on the home",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("رسائل من الطريق", "Messages from the road"), related: L("جهّز رحلتك", "Pack for your trip") } },
  name: L("سفر", "Safar"),
  description: L(
    "أدوات رحلات وتخييم: بوستر الرحلة، أدوات جديدة، أيام التوصيل وآراء من الطريق. أربع صفحات جاهزة.",
    "Road trip and camping gear: a trip poster, fresh gear, delivery days and reviews from the road. Four ready pages.",
  ),
  category: "shoes-bags",
  style: ["warm"],
  sortOrder: 990,
  palette: ["#f3efe6", "#e5dccb", "#fcd34d", "#b45309"],
  colors: {
    primary: "#b45309",
    secondary: "#e5dccb",
    background: "#ffffff",
    foreground: "#1f2a22",
    muted: "#5a604f",
    border: "#d4c7ae",
    accent: "#fcd34d",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن سفر جير", "About"), seo: { title: L("عن سفر جير", "About Safar Gear") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن خيمة أو طقم لرحلتك.", "Ask about a tent or a kit for your trip."),
        heading: L("اسأل عن طقم لرحلتك", "Ask about a kit for your trip"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأطقم والمقاسات والطلبات.", "Kits, sizes and orders."),
        question: L("هل يمكن إرجاع الخيمة؟", "Can I return the tent?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
