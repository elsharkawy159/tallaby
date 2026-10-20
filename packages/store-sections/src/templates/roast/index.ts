/**
 * Roast (template 20, coffee roaster; Claude Design "Storefront
 * Templates"): warm paper, a dark roast brown for actions and a caramel
 * highlight, Lalezar display type over Tajawal and 14px corners. A roaster
 * with a story: roast-day promises, why we roast weekly, this week's roast,
 * milestones since 1987, bean to cup, a coffee feed, FAQs and a sign-up.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): roasted and green
 * beans, a roaster, cezves and spices. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ROAST_KEY = "roast";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ROAST_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  beansDark: pexels(16682442, 900),
  beansClose: pexels(30444143, 900),
  scoop: pexels(22938072, 900),
  cezve: pexels(27047830, 900),
  sandCezve: pexels(31330206, 900),
  greenHalves: pexels(7125599, 900),
  greenBeans: pexels(4815898, 900),
  roasterDrop: pexels(4820734, 900),
  roasterTop: pexels(4820812, 900),
  spices: pexels(458796, 900),
};

const NAME = L("بيت البن", "Bunn House");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل البن", "All coffee"), "العروض": L("الأكثر طلباً", "Most ordered"), "المدونة": L("حكايتنا", "Our story") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت البن. كل الحقوق محفوظة.", "© 2026 Bunn House. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("features-ticker", {
    text: {
      "توصيل سريع": L("بيتحمص كل اتنين", "Roasted every Monday"),
      "الدفع عند الاستلام": L("يوصل قبل الأربع", "Delivered by Wednesday"),
      "استرجاع سهل": L("تاريخ التحميص على كل كيس", "Roast date on every bag"),
      "دعم على واتساب": L("ادفع عند الاستلام", "Pay on delivery"),
    },
  }),
  lib("text-lead", {
    text: {
      "بدأنا المتجر عشان نلاقي منتجات أصلية بسعر عادل، من غير لف على المحلات.": L(
        "بنحمص كميات صغيرة كل اتنين عشان القهوة في فنجانك ما يعداش عليها أكتر من ١٠ أيام.",
        "We roast small batches every Monday so the coffee in your cup is never more than ten days old.",
      ),
      "النهارده بنشحن لكل المحافظات، وكل منتج بيتراجع قبل ما يخرج.": L(
        "البن بتاعنا من ٥ مزارع في إثيوبيا والبرازيل وكولومبيا، بنشتريه مباشرة من مستورد واحد في إسكندرية.",
        "Our beans come from five farms in Ethiopia, Brazil and Colombia, bought through one importer in Alexandria.",
      ),
      "بنشتغل مع موردين معتمدين بس، وكل طلب معاه فاتورة رسمية.": L("كل كيس عليه تاريخ التحميص واسم المزرعة.", "Every bag is stamped with its roast date and the farm it came from."),
    },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("تحميص الأسبوع", "This week’s roast"),
      "هدايا تحت ١٠٠٠ جنيه": L("لسه طالع من المحمصة", "Fresh out of the roaster"),
      "اختيارات مضمونة لأي مناسبة.": L("اتحمص الاتنين واتشحن التلات.", "Roasted Monday, shipped Tuesday."),
    },
    links: { "/products": SHOP },
    lists: [{ source: "best-sellers" }],
  }),
  lib("stats-milestones", {
    text: {
      "من محل صغير لكل مصر": L("من محمصة واحدة لكل مصر", "From one roaster to all of Egypt"),
      "٢٠١٨": L("١٩٨٧", "1987"),
      "أول محل صغير": L("جدّي فتح محل بن في طلعت حرب", "Grandfather opens a coffee shop on Talaat Harb"),
      "٢٠٢٠": L("٢٠١٢", "2012"),
      "بدأنا البيع أونلاين": L("أول بن مختص من مزرعة واحدة", "First specialty single-origin beans"),
      "٢٠٢٣": L("٢٠٢١", "2021"),
      "شحن لكل المحافظات": L("بدأنا نشحن أونلاين", "Started shipping online"),
      "٢٥ ألف طلب": L("٤٠ ألف كيس في السنة", "40,000 bags a year"),
    },
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.greenHalves, PHOTOS.roasterTop, PHOTOS.scoop],
    text: {
      "إزاي بنشتغل": L("من الحباية للفنجان", "Bean to cup"),
      "من المخزن لإيدك": L("قهوتك بتوصلك إزاي", "How your coffee gets to you"),
      "بنختار": L("بنختار", "We source"),
      "من موردين معتمدين بس.": L("بن أخضر من ٥ مزارع.", "Green beans from five farms."),
      "بنراجع": L("بنحمص", "We roast"),
      "كل منتج قبل ما يتغلّف.": L("كل اتنين في وسط البلد.", "Every Monday in Downtown."),
      "بنوصّل": L("بنعبّي", "We pack"),
      "لحد باب البيت خلال أيام.": L("أكياس بصمام، متقفلة في نفس اليوم.", "Valve bags, sealed the same day."),
    },
  }),
  lib("gallery-side", {
    photo: [PHOTOS.beansDark, PHOTOS.beansClose, PHOTOS.cezve, PHOTOS.sandCezve, PHOTOS.greenBeans, PHOTOS.roasterDrop],
    text: {
      "صوّر واعمل منشن": L("صوّر فنجان الصبح", "Share your morning cup"),
      "استخدم #اسم_متجرك وممكن صورتك تظهر هنا.": L("حط على صورتك ‎#bunnhouse وممكن تظهر هنا.", "Tag your photo with #bunnhouse to appear here."),
      "صورة إنستجرام": L("صورة قهوة من إنستجرام", "A coffee photo from Instagram"),
    },
  }),
  lib("faq-numbered", {
    text: {
      "أسئلة مهمة": L("حاجات تهمك", "Good to know"),
      "كم يستغرق التوصيل؟": L("البن بيوصل إمتى؟", "When does the coffee arrive?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "بنحمص الاتنين ونشحن التلات، فيوصلك قبل الأربع في القاهرة والجيزة.",
        "We roast on Monday and ship on Tuesday, so it reaches Cairo and Giza by Wednesday.",
      ),
    },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("خصم ١٠٪ على أول كيس", "Get 10% off your first bag"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("ملاحظات التحميص والعروض كل اتنين.", "Roast notes and offers every Monday."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيت البن", "About Bunn House"), L("محمصة بن عائلية في طلعت حرب من ١٩٨٧.", "A family coffee roaster on Talaat Harb since 1987.")),
  aboutStory(lib, {
    photo: PHOTOS.roasterDrop,
    alt: L("بن طالع من المحمصة", "Beans pouring out of the roaster"),
    eyebrow: L("من ١٩٨٧", "Since 1987"),
    title: L("محمصة العيلة", "The family roastery"),
    text: L("جدّي فتح محل البن في طلعت حرب، والنهارده بنحمص لكل مصر بنفس الطريقة: كميات صغيرة كل اتنين.", "Grandfather opened the shop on Talaat Harb; today we roast for all of Egypt the same way, in small batches every Monday."),
    more: L("وكل كيس عليه تاريخ التحميص.", "And every bag carries its roast date."),
    button: L("تسوق كل البن", "Shop all coffee"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بن متحمص الاتنين وعلى بابك الأربع.", "Coffee roasted on Monday, at your door by Wednesday."),
  categories: [
    ["beans", "بن حبوب", "Whole beans", PHOTOS.beansClose],
    ["turkish", "بن تركي", "Turkish coffee", PHOTOS.cezve],
    ["green", "بن أخضر", "Green beans", PHOTOS.greenHalves],
    ["pantry", "بهارات وأدوات", "Spices & tools", PHOTOS.spices],
  ],
  products: [
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جرام", "Ethiopia Sidamo, 250 g", PHOTOS.beansClose, 420, { isFeatured: true, rating: 4.9, sold90: 410 }],
    ["house-turkish-blend", "turkish", "خلطة البيت التركي ٥٠٠ جرام", "House Turkish Blend, 500 g", PHOTOS.cezve, 360, { rating: 4.8, sold90: 620 }],
    ["brazil-santos", "beans", "برازيل سانتوس كيلو", "Brazil Santos, 1 kg", PHOTOS.scoop, 980, { sold90: 88 }],
    ["espresso-roast", "beans", "تحميص إسبريسو ٢٥٠ جرام", "Espresso Roast, 250 g", PHOTOS.beansDark, 390, { sold90: 120 }],
    ["green-arabica", "green", "أرابيكا أخضر كيلو", "Green Arabica, 1 kg", PHOTOS.greenBeans, 650, { sold90: 24 }],
    ["copper-cezve", "pantry", "كنكة نحاس", "Copper Cezve", PHOTOS.sandCezve, 450, { isFeatured: true, sold90: 61 }],
    ["spice-jar-set", "pantry", "طقم برطمانات بهارات", "Spice Jar Set", PHOTOS.spices, 220, { compareAtPrice: 260, sold90: 61 }],
    ["roasters-box", "beans", "بوكس المحمصة", "The Roaster’s Box", PHOTOS.roasterTop, 890, { compareAtPrice: 1020, inStock: false, sold90: 73 }],
  ],
});

export const ROAST = libraryTemplate({
  key: ROAST_KEY,
  version: 2,
  name: L("روست", "Roast"),
  description: L(
    "محمصة بن: وعود يوم التحميص، تحميص الأسبوع، حكاية من ١٩٨٧ ومن الحباية للفنجان. أربع صفحات جاهزة.",
    "Coffee roaster: roast-day promises, this week’s roast, a story since 1987 and bean to cup. Four ready pages.",
  ),
  category: "food",
  sortOrder: 200,
  palette: ["#f7efe4", "#ecdcc6", "#e39a4b", "#2a1a12"],
  colors: {
    primary: "#2a1a12",
    secondary: "#ecdcc6",
    background: "#f7efe4",
    foreground: "#2a1a12",
    muted: "#6b5546",
    border: "#e2cfb5",
    accent: "#e39a4b",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("عن بيت البن", "About Bunn House") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٢ شارع طلعت حرب، وسط البلد، القاهرة.", "12 Talaat Harb St, Downtown, Cairo."),
        heading: L("عن طحنة أو طلب كافيه", "About a grind or a café order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التحميص والطحن والتوصيل.", "Roasting, grinding and delivery."),
        question: L("بتطحنوا البن؟", "Do you grind the coffee?"),
        answer: L(
          "أيوه، اكتب الطحنة في ملاحظات الطلب: تركي أو إسبريسو أو فلتر، أو سيبه حبوب.",
          "Yes. Write the grind in the order notes: Turkish, espresso or filter, or leave it whole.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
