/**
 * Pure (template 09, minimal skincare; Claude Design "Storefront
 * Templates"): warm off-white paper, a deep sage for actions and a pale
 * sage highlight, Noto Naskh Arabic headings over Almarai and 20px
 * corners. A calm, ingredient-led store: split-screen launch, four
 * promises, best sellers, what is in every bottle, a four-step routine, the
 * rating summary and FAQs. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): bottles, droppers,
 * jars and tubes on plain surfaces. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const PURE_KEY = "pure";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PURE_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  serum: pexels(8101534, 900),
  serumHero: pexels(8101534),
  vitaminC: pexels(8054400, 900),
  dropper: pexels(10819538, 900),
  eucalyptusOil: pexels(4857813, 900),
  creamJars: pexels(6690232, 900),
  lotions: pexels(7691162, 900),
  squeezeTubes: pexels(8049849, 900),
  set: pexels(6167398, 900),
  amberMirror: pexels(7796455),
};

const NAME = L("نبتة سكين", "Nabta Skin");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن نبتة", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("مكونات قليلة، مناسبة لجو مصر.", "Short ingredient lists, made for Egyptian weather."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نبتة سكين. كل الحقوق محفوظة.", "© 2026 Nabta Skin. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن نبتة", "About Nabta"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.serumHero],
    text: {
      "كوليكشن الموسم": L("جديد · سيرم الهيالورونيك", "New · Hyaluronic Water Serum"),
      "صوت أنقى، كل يوم": L("عناية بالبشرة من غير زيادات", "Skin care with nothing extra"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "مكونات قليلة، اتجربت في حر ورطوبة مصر، ولطيفة كفاية لكل يوم.",
        "Short ingredient lists, tested in Egyptian heat and humidity, and gentle enough for every day.",
      ),
      "تسوق الآن": L("تسوقي الجديد", "Shop new in"),
      "العروض": L("كل المنتجات", "Shop all"),
      "صورة الحملة": L("زجاجة سيرم بقطّارة", "A serum bottle with a dropper"),
    },
    links: { "/products": [NEW, SHOP] },
  }),
  lib("categories-photo-tiles", {
    text: { "تسوّق حسب القسم": L("ابدئي من خطوة", "Start with a step") },
  }),
  lib("products-grid", {
    as: "best-sellers",
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("الأربع منتجات اللي معظم عميلاتنا بيبدأوا بيها.", "The four products most of our customers start with."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-steps", {
    text: {
      "الطلب في ٤ خطوات": L("مش عارفة تبدئي منين؟", "Not sure where to start?"),
      "اختر": L("نضّفي", "Cleanse"),
      "أضف ما يعجبك إلى السلة": L("الصبح وبالليل، ٣٠ ثانية.", "Morning and night, 30 seconds."),
      "اطلب": L("عالجي", "Treat"),
      "عنوانك ورقم موبايلك فقط": L("سيرم واحد لأهم مشكلة.", "One serum for your main concern."),
      "نؤكد": L("رطّبي", "Moisturise"),
      "نتواصل معك على واتساب للتأكيد": L("كريم بالليل ولوشن بالنهار.", "Cream at night, lotion by day."),
      "استلم": L("احمي", "Protect"),
      "وادفع عند الاستلام": L("واقي شمس كل صباح.", "Sunscreen every morning."),
    },
  }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.eucalyptusOil],
    text: {
      "صورة المتجر": L("زجاجة بقطّارة جنب فرع أوكالبتوس", "A dropper bottle beside a eucalyptus branch"),
      "مع كل طلب": L("في كل عبوة", "In every bottle"),
      "كل منتج بيتراجع قبل ما يوصلك": L("مكونات أقل، كل واحد ليه سبب", "Fewer ingredients, chosen for a reason"),
      "فاتورة رسمية وضمان": L("من غير عطر ولا زيوت عطرية", "No fragrance, no essential oils"),
      "تغليف محمي من الصدمات": L("مختبر من طبيبة جلدية، pH متوازن", "Dermatologist tested, pH balanced"),
      "رقم تتبع على واتساب": L("قائمة المكونات كاملة في صفحة كل منتج", "Full ingredient list on every page"),
      "اعرف أكتر": L("اعرفي أكتر عن نبتة", "More about Nabta"),
    },
  }),
  lib("testimonials-rating", {
    text: {
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "بشرتي بطلت تشد بعد الغسيل في أسبوع. الغسول بيقعد حوالي ٣ شهور.",
        "My skin stopped feeling tight after washing within a week. The cleanser lasts about three months.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هدى ر.", "Hoda R."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "سيرم الهيالورونيك الوحيد اللي مش بيتكتل تحت واقي الشمس في رطوبة إسكندرية.",
        "The hyaluronic serum is the only one that does not pill under my sunscreen in Alexandria humidity.",
      ),
      "ع": L("ي", "Y"),
      "عمر ك.": L("يارا إ.", "Yara E."),
      "كل التقييمات": L("المنتجات الأعلى تقييماً", "Shop top rated"),
    },
    links: { "/products": RATED },
  }),
  lib("faq-columns", { as: "home-faq", text: { "أسئلة شائعة": L("أسئلة بتتسأل كتير", "Questions we get a lot") } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نبتة", "About Nabta"), L("براند عناية بالبشرة صغير من الزمالك، تركيباته مع طبيبة جلدية.", "A small skincare brand from Zamalek, formulated with a dermatologist.")),
  aboutStory(lib, {
    photo: PHOTOS.amberMirror,
    alt: L("زجاجات عسلي على مراية", "Amber bottles on a mirror"),
    eyebrow: L("من ٢٠٢١", "Since 2021"),
    title: L("معمول لجونا", "Made for our weather"),
    text: L("معظم منتجات العناية معمولة لجو بارد وناشف. منتجاتنا متجربة في صيف القاهرة.", "Most skincare is made for cool, dry climates. Ours is tested in Cairo summers."),
    more: L("وكل تركيبة بتتراجع مع طبيبة جلدية قبل ما تنزل.", "And every formula is reviewed with a dermatologist before launch."),
    button: L("تسوقي الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مكونات قليلة، مناسبة لجو مصر.", "Short ingredient lists, made for Egyptian weather."),
  categories: [
    ["cleansers", "غسول", "Cleansers", PHOTOS.squeezeTubes],
    ["serums", "سيرم وزيوت", "Serums & oils", PHOTOS.serum],
    ["moisturisers", "مرطبات", "Moisturisers", PHOTOS.creamJars],
    ["sets", "مجموعات", "Sets", PHOTOS.set],
    ["body", "عناية الجسم", "Body care", PHOTOS.lotions],
  ],
  products: [
    ["hyaluronic-water-serum", "serums", "سيرم الهيالورونيك", "Hyaluronic Water Serum", PHOTOS.serum, 690, { isFeatured: true, rating: 4.9, sold90: 348 }],
    ["oat-milk-cleanser", "cleansers", "غسول حليب الشوفان", "Oat Milk Cleanser", PHOTOS.squeezeTubes, 450, { rating: 4.8, sold90: 212 }],
    ["vitamin-c-serum", "serums", "سيرم فيتامين سي", "Vitamin C Brightening Serum", PHOTOS.vitaminC, 780, { compareAtPrice: 920, rating: 4.7, sold90: 190 }],
    ["rosehip-face-oil", "serums", "زيت ورد المسك", "Rosehip Face Oil", PHOTOS.dropper, 640, { isFeatured: true, sold90: 96 }],
    ["eucalyptus-night-oil", "serums", "زيت ليلي بالأوكالبتوس", "Eucalyptus Night Oil", PHOTOS.eucalyptusOil, 690, { sold90: 40 }],
    ["barrier-repair-cream", "moisturisers", "كريم إصلاح الحاجز", "Barrier Repair Cream", PHOTOS.creamJars, 720, { rating: 4.8, sold90: 265 }],
    ["light-day-lotion", "moisturisers", "لوشن نهاري خفيف", "Light Day Lotion", PHOTOS.lotions, 590, { sold90: 74 }],
    ["morning-set", "sets", "مجموعة الصباح", "The Morning Set", PHOTOS.set, 1650, { compareAtPrice: 1890, rating: 4.9, sold90: 58 }],
    ["eucalyptus-body-lotion", "body", "لوشن جسم بالأوكالبتوس", "Eucalyptus Body Lotion", PHOTOS.lotions, 520, { sold90: 61 }],
  ],
});

export const PURE = libraryTemplate({
  key: PURE_KEY,
  version: 4,
  changelog: "Pure v4: categories, section order",
  name: L("بيور", "Pure"),
  description: L(
    "عناية بالبشرة بهدوء: مكونات واضحة، روتين من ٤ خطوات وتقييمات. أربع صفحات جاهزة.",
    "Calm skincare: clear ingredients, a four-step routine and ratings. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 90,
  palette: ["#faf8f3", "#e9ede4", "#4f6146", "#26302a"],
  colors: {
    primary: "#4f6146",
    secondary: "#e9ede4",
    background: "#faf8f3",
    foreground: "#26302a",
    muted: "#5c665e",
    border: "#dfe3d8",
    accent: "#d9e4cc",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نبتة", "About"), seo: { title: L("عن نبتة", "About Nabta") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("٣١ شارع محمد مظهر، الزمالك، القاهرة.", "31 Mohamed Mazhar St, Zamalek, Cairo."),
        heading: L("اسألي عن بشرتك", "Ask about your skin"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المكونات والتوصيل والاسترجاع.", "Ingredients, delivery and returns."),
        question: L("المنتجات مناسبة للبشرة الحساسة؟", "Are the products suitable for sensitive skin?"),
        answer: L(
          "كل التركيبات من غير عطر وpH متوازن، واتجربت على ٥٠ شخص قبل النزول. ولو مش متأكدة ابعتيلنا ونرشحلك.",
          "Every formula is fragrance free and pH balanced, and was patch tested on 50 people. If you are unsure, message us and we will suggest one.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "bottom", surface: "shelf", band: "paper", extras: ["product-perks"], copy: { reviews: L("تجارب بشرة حقيقية", "Real skin, real results"), related: L("تكمل روتينك", "Complete your routine") } },
});
