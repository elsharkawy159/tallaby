/**
 * Pace (template 32, fitness gear; Claude Design "Storefront Templates"):
 * pale concrete paper, a signal orange for actions and a soft apricot
 * highlight, Changa throughout and 8px corners. A home-gym store: a split
 * opening, training chips, coach picks, the sport watch's features, spend
 * tiers, just arrived and reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): dumbbells,
 * kettlebells, mats, bands, a watch and earbuds. No people and no brand
 * marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const PACE_KEY = "pace";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PACE_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  gymRoom: pexels(11593505),
  flatLaySmall: pexels(6740821, 900),
  hexDumbbells: pexels(29224210, 900),
  blueDumbbells: pexels(5412247, 900),
  kettlebells: pexels(13863727, 900),
  matRolls: pexels(4325439, 900),
  bands: pexels(16695681, 900),
  rope: pexels(8032842, 900),
  watch: pexels(13007642, 900),
  buds: pexels(3921817, 900),
  essentials: pexels(7016908, 900),
  homeGym: pexels(27195989),
};

const NAME = L("آدر سبورت", "Ader Sports");

const header = lib("header-chips", {
  text: { "م": L("آ", "A"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن دمبل، مات، ساعة…", "Search dumbbells, mats, watches…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("اتمرن جامد وارتاح كويس", "Train hard, rest well"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ آدر سبورت. كل الحقوق محفوظة.", "© 2026 Ader Sports. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن آدر", "About Ader"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.homeGym],
    text: {
      "كوليكشن الموسم": L("موسم جيم البيت", "Home gym season"),
      "صوت أنقى، كل يوم": L("كل اللي محتاجه عشان تتمرن في البيت", "Everything you need to train at home"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "باقات بداية ودمبل ومات بتوصيل مجاني فوق ١٬٢٠٠ ج.م.",
        "Starter kits, dumbbells and mats with free delivery over EGP 1,200.",
      ),
      "تسوق الآن": L("تسوق باقات البداية", "Shop starter kits"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "صورة الحملة": L("ركن جيم في البيت", "A home gym corner"),
    },
    links: { "/products": [search("باقة"), BEST] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("بتتمرن لإيه؟", "What are you training for?") } }),
  lib("products-bento", { text: { "الكل بيسأل عليهم": L("الكوتشات بيرشحوا", "Coaches recommend") }, links: { "/products": BEST } }),
  lib("features-orbit", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.watch],
    text: {
      "ليه هتحبه": L("ساعة بالس الرياضية", "The Pulse sport watch"),
      "خامة تعيش": "GPS",
      "مختارة عشان تستحمل الاستخدام اليومي": L("بيسجل الجري من غير الموبايل", "Tracks runs without your phone"),
      "خفيف وعملي": L("النبض", "Heart rate"),
      "سهل تشيله معاك في أي مكان": L("طول اليوم وأثناء التمرين", "All day and during training"),
      "صورة المنتج": L("ساعة رياضية بحزام أبيض", "A sport watch with a white strap"),
      "ضمان محلي": L("٧ أيام", "7 days"),
      "بفاتورة رسمية من المتجر": L("بطارية بشحنة واحدة", "Battery on one charge"),
      "تغليف هدية": "5 ATM",
      "مجانًا لو طلبت": L("مقاومة للسباحة", "Swim-proof"),
    },
  }),
  lib("promo-tiers", {
    text: {
      "عرض الشهر": L("عرض الشهر", "This month"),
      "كل ما تزود، توفّر أكتر": L("كمّل جيمك ووفّر أكتر", "Build your gym, save more"),
      "١٠٠٠ ج.م": L("١٢٠٠ ج.م", "EGP 1,200"),
      "٢٠٠٠ ج.م": L("٢٥٠٠ ج.م", "EGP 2,500"),
      "٢٥٠ ج.م": L("٣٠٠ ج.م", "EGP 300"),
      "٣٥٠٠ ج.م": L("٤٥٠٠ ج.م", "EGP 4,500"),
      "٥٠٠ ج.م": L("٦٠٠ ج.م", "EGP 600"),
    },
  }),
  lib("products-rail", {
    as: "just-arrived",
    text: { "بيحبوها": L("جديد", "New"), "الأكثر مبيعًا": L("وصل حالاً", "Just arrived") },
    links: { "/products": NEW },
    lists: [{ source: "newest" }],
  }),
  lib("testimonials-bento", {
    text: {
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "باقة البداية فيها كل اللي محتاجه للتمرين في البيت. جودة حلوة بالسعر ده.",
        "The starter kit had everything I needed to train at home. Good quality for the price.",
      ),
      "م": L("ك", "K"),
      "مريم أ.": L("كريم ح.", "Karim H."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("المات مش بيزحلق خالص حتى على السيراميك.", "The mat does not slide at all, even on tiles."),
      "ع": L("س", "S"),
      "عمر ك.": L("سلمى ن.", "Salma N."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الساعة حلوة، الأبلكيشن محتاج يوم تتعود عليه.", "The watch is great; the app takes a day to get used to."),
      "ن": L("أ", "A"),
      "نور ح.": L("أحمد ر.", "Ahmed R."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن آدر", "About Ader"), L("محل رياضة بيديره اتنين كوتش في مدينة نصر.", "A sports shop run by two coaches in Nasr City.")),
  aboutStory(lib, {
    photo: PHOTOS.gymRoom,
    alt: L("أوضة جيم في البيت بمات وكور", "A home gym room with mats and balls"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("أدوات الكوتشات بيستخدموها", "Gear coaches actually use"),
    text: L("كل حاجة في المحل اتجربت في تمارين حقيقية، وبنساعدك تختار على واتساب.", "Everything in the shop is tested in real sessions, and we help you choose on WhatsApp."),
    more: L("واسترجاع ٣٠ يوم للمنتجات غير المستخدمة.", "With 30-day returns on unused gear."),
    button: L("تسوق باقات البداية", "Shop starter kits"),
    href: search("باقة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات للجيم والتراك وأوضة المعيشة.", "Gear for the gym, the track and the living room."),
  categories: [
    ["home", "تمرين البيت", "Home workout", PHOTOS.hexDumbbells],
    ["yoga", "يوجا ومات", "Yoga & mats", PHOTOS.matRolls],
    ["kits", "باقات البداية", "Starter kits", PHOTOS.flatLaySmall],
    ["wearables", "ساعات وسماعات", "Watches & audio", PHOTOS.watch],
  ],
  products: [
    ["home-gym-starter-kit", "kits", "باقة جيم البيت", "Home Gym Starter Kit", PHOTOS.flatLaySmall, 2450, { compareAtPrice: 2850, isFeatured: true, rating: 4.8, sold90: 214 }],
    ["training-essentials", "kits", "باقة أساسيات التمرين", "Training Essentials", PHOTOS.essentials, 1590, { sold90: 60 }],
    ["hex-dumbbell-pair", "home", "زوج دمبل سداسي", "Hex Dumbbell Pair", PHOTOS.hexDumbbells, 1890, { rating: 4.7, sold90: 166 }],
    ["vinyl-dumbbells", "home", "دمبل فينيل", "Vinyl Dumbbells", PHOTOS.blueDumbbells, 450, { sold90: 120 }],
    ["kettlebell-pair", "home", "زوج كيتل بيل", "Kettlebell Pair", PHOTOS.kettlebells, 1650, { sold90: 70 }],
    ["grip-yoga-mat", "yoga", "مات يوجا ٦ مم", "Grip Yoga Mat 6 mm", PHOTOS.matRolls, 690, { rating: 4.8, sold90: 302 }],
    ["mini-band-set", "yoga", "طقم حبال مقاومة", "Mini Band Set", PHOTOS.bands, 390, { compareAtPrice: 480, sold90: 141 }],
    ["rope-and-bottle", "yoga", "حبل نط وزمزمية", "Jump Rope & Bottle", PHOTOS.rope, 420, { sold90: 76 }],
    ["pulse-sport-watch", "wearables", "ساعة بالس الرياضية", "Pulse Sport Watch", PHOTOS.watch, 1450, { isFeatured: true, rating: 4.6, sold90: 98 }],
    ["run-buds", "wearables", "سماعة لاسلكية للجري", "Wireless Run Buds", PHOTOS.buds, 1190, { inStock: false, sold90: 57 }],
  ],
});

export const PACE = libraryTemplate({
  key: PACE_KEY,
  version: 3,
  changelog: "Pace v3: product page",
  name: L("بيس", "Pace"),
  description: L(
    "أدوات رياضة: جيم البيت، اختيارات الكوتشات، مميزات الساعة وعروض بالمبلغ. أربع صفحات جاهزة.",
    "Fitness gear: home gym, coach picks, the sport watch’s features and spend tiers. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 320,
  palette: ["#f4f5f0", "#e2e6dc", "#e8410f", "#111315"],
  colors: {
    primary: "#e8410f",
    secondary: "#e2e6dc",
    background: "#f4f5f0",
    foreground: "#111315",
    muted: "#53585f",
    border: "#d8dcd2",
    accent: "#f6c6a6",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن آدر", "About"), seo: { title: L("عن آدر", "About Ader") }, sections: about },
    {
      slug: "contact",
      name: L("اسأل كوتش", "Ask a coach"),
      seo: { title: L("اسأل كوتش", "Ask a coach") },
      sections: contactPage(lib, {
        title: L("اسأل كوتش", "Ask a coach"),
        text: L("٢٢ شارع مكرم عبيد، مدينة نصر.", "22 Makram Ebeid St, Nasr City."),
        heading: L("قولنا هدفك ونرشحلك الأدوات", "Tell us your goal and we suggest the gear"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والاسترجاع والأكواد.", "Delivery, returns and codes."),
        question: L("ينفع أرجّع لو ما استخدمتش؟", "Can I return unused gear?"),
        answer: L("أيوه، استرجاع خلال ٣٠ يوم لأي منتج مش مستخدم في علبته.", "Yes. Return any unused item in its box within 30 days."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "side", headingCase: "upper", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للجيم", "Back to the gym"), reviews: L("آراء المتدرّبين", "Athlete reviews"), related: L("كمّل تجهيزك", "Complete your kit") } },
});
