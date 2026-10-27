/**
 * Safar (template 99, road trip and camping gear; Claude Design "Storefront
 * Templates"): sand paper, a deep forest ink for type and a burnt orange for
 * actions, Changa headings over Cairo text and tight 6px corners. A trip
 * outfitter: a road-trip poster, the desert kit, browse by category, fresh
 * gear, delivery days to Siwa and Sinai and messages from the road. Built
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
    "ابحث عن منتج…": L("ابحث عن خيمة، شنطة، كشاف…", "Search tents, packs, lanterns…"),
  },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("اشترك وخد مواعيد الرحلات والعروض قبل أي حد.", "Sign up for trip dates and offers before anyone else."),
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
      "من ١ إلى ٣٠ نوفمبر": L("بيتشحن في ٢٤ ساعة", "Ships in 24 h"),
      "صورة الحملة": L("خيمة حمرا وبيضا على شط بحيرة", "A red and white tent on a lake shore"),
      "خصم": L("باكدجات من", "Kits from"),
      "٣٠٪": L("٣٩٠٠", "3,900"),
      "لفترة محدودة": L("جنيه", "EGP"),
      "الموسم الجديد وصل": L("جهّز العربية ومتشلش هم", "Pack the car, not the worry"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "خيم وشنط وطاقة للصحرا والساحل، وكله بيتشحن في ٢٤ ساعة.",
        "Tents, packs and power for the desert and the coast, all shipped within 24 hours.",
      ),
      "اكتشف المجموعة": L("تسوق الباكدجات", "Shop kits"),
    },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("تصفح", "Browse") } }),
  lib("products-rail", {
    text: { "بيحبوها": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("أدوات جديدة", "Fresh gear") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 6 }],
  }),
  lib("pay-days", {
    text: {
      "١": L("٢٤", "24"),
      "يوم": L("ساعة", "hours"),
      "القاهرة، الجيزة": L("الباكدجات بتتشحن", "Kits ship"),
      "الإسكندرية، الدلتا، مدن القناة": L("القاهرة وإسكندرية", "Cairo and Alexandria"),
      "٤–٦": L("٤", "4"),
      "الصعيد، البحر الأحمر، سيناء": L("سيوة وسينا", "Siwa and Sinai"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "رسايل بتفرّحنا": L("من الطريق", "From the road"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الخيمة اتنصبت في ٥ دقايق فعلًا، وقعدنا ليلتين في سيوة من غير مشاكل.",
        "The tent really went up in five minutes, and we spent two nights in Siwa without a problem.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("مبسوطين إنها عجبتكم، ابعتولنا صور!", "So glad you liked it, send us photos!"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "الكشاف الـLED نوّر الكامب كله ليلتين على شحنة واحدة.",
        "The LED lantern lit the whole camp for two nights on one charge.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "تاني باكدج أطلبه. وصل دهب قبل الرحلة بيوم.",
        "My second kit. It reached Dahab a day before the trip.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سفر جير", "About Safar Gear"), L("كل اللي تحتاجه لطريق سيوة ورجوع.", "Everything for the road to Siwa and back.")),
  aboutStory(lib, {
    photo: PHOTOS.tentView,
    alt: L("منظر بحيرة من باب خيمة", "A lake seen from a tent door"),
    eyebrow: L("على الطريق", "On the road"),
    title: L("بنجرّب كل حاجة في الرحلة الأول", "We test everything on a trip first"),
    text: L("بدأنا جروب رحلات للصحرا والساحل، وبقينا نجهّز أصحابنا بالخيم والكشافات.", "We started as a desert and coast trip group, then began kitting out our friends with tents and lanterns."),
    more: L("النهارده الباكدجات بتتشحن في ٢٤ ساعة لأي مكان في مصر.", "Today our kits ship within 24 hours anywhere in Egypt."),
    button: L("تسوق الخيم", "Shop tents"),
    href: search("خيمة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كل اللي تحتاجه لطريق سيوة ورجوع.", "Everything for the road to Siwa and back."),
  categories: [
    ["camp", "تخييم", "Camp", PHOTOS.forestTent],
    ["cook", "طبخ ورحلة", "Cook & carry", PHOTOS.kettleStove],
    ["packs-light", "شنط وإضاءة", "Packs & light", PHOTOS.pack],
  ],
  products: [
    ["two-person-dome-tent", "camp", "خيمة قبة لفردين", "Two-Person Dome Tent", PHOTOS.forestTent, 4200, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["trekking-pack-45l", "packs-light", "شنطة ٤٥ لتر", "45 L Trekking Pack", PHOTOS.pack, 2650, { rating: 4.7, sold90: 60 }],
    ["gas-camp-lantern", "packs-light", "كشاف جاز للكامب", "Gas Camp Lantern", PHOTOS.gasLantern, 950, { sold90: 84 }],
    ["rechargeable-led-lantern", "packs-light", "كشاف LED بيتشحن", "Rechargeable LED Lantern", PHOTOS.ledLantern, 1250, { compareAtPrice: 1450, isFeatured: true, sold90: 120 }],
    ["camp-stove-kettle", "cook", "بوتاجاز رحلات وكاتل", "Camp Stove and Kettle", PHOTOS.kettleStove, 1800, { rating: 4.6, sold90: 48 }],
    ["trip-coffee-set", "cook", "طقم قهوة الرحلة", "Trip Coffee Set", PHOTOS.coffeeStove, 1100, { sold90: 66 }],
    ["camp-cook-set", "cook", "طقم حلل للكامب", "Camp Cook Set", PHOTOS.cookSet, 890, { sold90: 52 }],
    ["air-pillow-pad", "camp", "مخدة نفخ ومرتبة", "Air Pillow and Sleeping Pad", PHOTOS.airPillow, 1350, { sold90: 40 }],
    ["folding-camp-chair", "camp", "كرسي رحلات بيتطبق", "Folding Camp Chair", PHOTOS.chair, 780, { compareAtPrice: 900, sold90: 110 }],
    ["beach-cooler-bag", "cook", "شنطة تبريد للبحر", "Beach Cooler Bag", PHOTOS.beachBags, 650, { inStock: false, sold90: 70 }],
  ],
});

export const SAFAR = libraryTemplate({
  key: SAFAR_KEY,
  version: 2,
  changelog: "Safar v2: product page",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للعدة", "Back to the gear"), reviews: L("رسائل من الطريق", "Messages from the road"), related: L("جهّز رحلتك", "Pack for your trip") } },
  name: L("سفر", "Safar"),
  description: L(
    "أدوات رحلات وتخييم: بوستر الرحلة، أدوات جديدة، أيام التوصيل وآراء من الطريق. أربع صفحات جاهزة.",
    "Road trip and camping gear: a trip poster, fresh gear, delivery days and reviews from the road. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 990,
  palette: ["#f3efe6", "#e5dccb", "#fcd34d", "#b45309"],
  colors: {
    primary: "#b45309",
    secondary: "#e5dccb",
    background: "#f3efe6",
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
        text: L("قولنا رايح فين وإمتى، ونجهزلك الباكدج.", "Tell us where and when, and we pack your kit."),
        heading: L("اسأل عن باكدج لرحلتك", "Ask about a kit for your trip"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الباكدجات والتوصيل والاسترجاع.", "Kits, delivery and returns."),
        question: L("ينفع أرجّع الخيمة بعد الرحلة؟", "Can I return the tent after a trip?"),
        answer: L("بنرجّع أي حاجة مش مستعملة خلال ١٤ يوم في كيسها الأصلي.", "We take back anything unused within 14 days in its original bag."),
      }),
    },
  ],
  demo: DEMO,
});
