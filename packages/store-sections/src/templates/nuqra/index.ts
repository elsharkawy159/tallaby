/**
 * Nuqra (template 82, men's sterling silver; Claude Design "Storefront
 * Templates"): cool grey paper, a graphite for actions and a pale steel
 * highlight, Changa headings over Cairo and square corners. A men's silver
 * shop: a poster hero with a "from EGP 850" sticker, the core pieces,
 * after-you-buy services, why Nuqra and reviews from WhatsApp. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): silver rings on dark
 * tables, mirrors and leaves, curb chains on leather and white, pendants
 * and an egg tray of rings. No hands, necks or people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const NUQRA_KEY = "nuqra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NUQRA_KEY, getDesign(id)!, { corners: 0, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  spinners: pexels(39326365),
  spinnersCard: pexels(39326365, 900),
  signet: pexels(6012226, 900),
  cubanLeather: pexels(16109266, 900),
  molten: pexels(38909365, 900),
  onyx: pexels(6609969, 900),
  ringSet: pexels(10421147, 900),
  pendant: pexels(16109264, 900),
  curbWhite: pexels(16124724, 900),
  curbDark: pexels(16124758, 900),
  curbBrown: pexels(16109298, 900),
  dogTag: pexels(16109307, 900),
  eggTray: pexels(33299085),
};

const NAME = L("نقرة سيلفر", "Nuqra Silver");

const header = lib("header-brand-bar", {
  text: { "م": L("ن", "N"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن خاتم أو سلسلة…", "Search rings or chains…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("معمول عشان يتلبس", "Built to be worn"),
    "كلمنا على واتساب": L("اسأل عن الحفر على واتساب", "Ask about engraving on WhatsApp"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نقرة سيلفر. كل الحقوق محفوظة.", "© 2026 Nuqra Silver. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.spinners],
    text: {
      "مجموعة الموسم": L("فضة ٩٢٥", "Sterling 925"),
      "من ١ إلى ٣٠ نوفمبر": L("حفر ببلاش", "Engraved free"),
      "صورة الحملة": L("تلات خواتم فضة منقوشة على ترابيزة غامقة", "Three engraved silver rings on a dark table"),
      "خصم": L("من", "From"),
      "٣٠٪": L("٨٥٠", "850"),
      "لفترة محدودة": L("ج.م", "EGP"),
      "الموسم الجديد وصل": L("فضة بتحلو مع الوقت", "Silver that gets better with age"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "بتتصب وتتلمع باليد في خان الخليلي.",
        "Cast and polished by hand in Khan El Khalili.",
      ),
      "اكتشف المجموعة": L("تسوق الخواتم", "Shop rings"),
    },
    links: { "/products": search("خاتم") },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("القطع", "The pieces"), "تسوق بالقسم": L("اختار قطعتك", "Pick your piece") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("الأكتر لبساً", "Most worn"), "الكل بيسأل عليهم": L("القطع الأساسية", "The core pieces") },
    links: { "/products": BEST },
  }),
  lib("features-compare", {
    text: {
      "إحنا ولا غيرنا؟": L("ليه نقرة", "Why Nuqra"),
      "متجرنا": L("نقرة", "Nuqra"),
      "منتجات أصلية بفاتورة": L("فضة ٩٢٥ صلبة بختم", "Solid, hallmarked 925 silver"),
      "ضمان محلي": L("الدفع عند الاستلام", "Cash on delivery"),
      "استرجاع خلال ١٤ يوم": L("حفر ببلاش", "Free engraving"),
      "الدفع عند الاستلام": L("تبديل المقاس", "Size exchange"),
      "رد على واتساب في دقايق": L("تلميع مدى الحياة", "Lifetime polishing"),
    },
  }),
  lib("service-cards", {
    text: {
      "خدمات بعد البيع": L("بعد ما تشتري", "After you buy"),
      "عشان جهازك يفضل شغال زي الجديد.": L("عشان الفضة تفضل بتلمع سنين.", "So your silver keeps its shine for years."),
      "تركيب في البيت": L("حفر", "Engraving"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("أسامي أو تواريخ أو إحداثيات.", "Names, dates or coordinates."),
      "من ٢٥٠ ج.م": L("ببلاش", "Free"),
      "صيانة وإصلاح": L("تلميع", "Polishing"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("ببلاش مدى الحياة في المحل.", "Free for life, in store."),
      "من ١٥٠ ج.م": L("من ١٥٠ ج.م", "From EGP 150"),
      "استبدل القديم": L("تغيير مقاس", "Resizing"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("مقاسين أكبر أو أصغر.", "Up or down two sizes."),
      "مجانًا": L("ببلاش مدى الحياة", "Free for life"),
      "مد الضمان": L("تصليح السلاسل", "Chain repair"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("لحام قفل أو حلقة مقطوعة في نفس اليوم.", "A broken clasp or link soldered the same day."),
      "من ١٩٩ ج.م": L("من ١٠٠ ج.م", "From EGP 100"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("من واتساب", "From WhatsApp"),
      "رسايل بتفرّحنا": L("رسايل الزباين", "Customer messages"),
      "مريم أ.": L("أحمد س.", "Ahmed S."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الخاتم وصل والحفر بتاريخ جوازي مظبوط بالظبط. تسلم إيدكم.",
        "The ring arrived with my wedding date engraved exactly right. Great work.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("ألف مبروك! ابعتلنا لما تحب نلمعه.", "Congratulations! Message us whenever you want it polished."),
      "عمر ك.": L("كريم ف.", "Karim F."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("كبّرت الخاتم مقاس في يوم واحد في المحل.", "They sized my ring up one size in a single day."),
      "يوسف م.": L("مازن ع.", "Mazen A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("السلسلة تقيلة وعليها ختم ٩٢٥. تالت مرة أطلب.", "The chain is heavy and stamped 925. My third order."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نقرة", "About Nuqra"), L("ورشة فضة رجالي في خان الخليلي.", "A men's silver workshop in Khan El Khalili.")),
  aboutStory(lib, {
    photo: PHOTOS.eggTray,
    alt: L("خواتم فضة ودهب في كرتونة بيض", "Silver and gold rings in an egg tray"),
    eyebrow: L("خان الخليلي", "Khan El Khalili"),
    title: L("فضة بتتصب باليد", "Silver cast by hand"),
    text: L("بنصب كل خاتم ونلمعه في ورشتنا، فضة ٩٢٥ صلبة مش مطلية.", "We cast and polish every ring in our workshop: solid 925 silver, never plated."),
    more: L("والحفر ببلاش، والتلميع ببلاش مدى الحياة.", "Engraving is free, and polishing is free for life."),
    button: L("تسوق الخواتم", "Shop rings"),
    href: search("خاتم"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خواتم وسلاسل رجالي، فضة ٩٢٥.", "Rings and chains for men, in solid sterling silver."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.ringSet],
    ["chains", "سلاسل", "Chains", PHOTOS.curbBrown],
    ["pendants", "دلايات", "Pendants", PHOTOS.dogTag],
  ],
  products: [
    ["spinner-ring-trio", "rings", "تلات خواتم منقوشة", "Engraved Ring Trio", PHOTOS.spinnersCard, 1485, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["engraved-signet", "rings", "خاتم ختم منقوش", "Engraved Signet Ring", PHOTOS.signet, 1290, { sold90: 120 }],
    ["cuban-chain", "chains", "سلسلة كوبي", "Cuban Link Chain", PHOTOS.cubanLeather, 2350, { rating: 4.9, sold90: 88 }],
    ["molten-band", "rings", "دبلة فضة مموجة", "Molten Band", PHOTOS.molten, 855, { sold90: 44 }],
    ["onyx-signet", "rings", "خاتم أونكس", "Onyx Signet Ring", PHOTOS.onyx, 1450, { compareAtPrice: 1700, sold90: 52 }],
    ["artisan-ring-set", "rings", "طقم خواتم يدوي", "Artisan Ring Set", PHOTOS.ringSet, 2610, { compareAtPrice: 3060, isFeatured: true, sold90: 31 }],
    ["pendant-chain", "pendants", "سلسلة بدلاية", "Pendant Chain", PHOTOS.pendant, 1650, { sold90: 40 }],
    ["curb-chain", "chains", "سلسلة كيرب ٥٥ سم", "Curb Chain 55 cm", PHOTOS.curbWhite, 1950, { sold90: 70 }],
    ["heavy-curb-chain", "chains", "سلسلة كيرب تقيلة", "Heavy Curb Chain", PHOTOS.curbDark, 2900, { inStock: false, sold90: 22 }],
  ],
});

export const NUQRA = libraryTemplate({
  key: NUQRA_KEY,
  version: 3,
  changelog: "Nuqra v3: categories, section order",
  productPage: { thumbs: "side", button: "outline", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع للفضة", "Back to the silver"), reviews: L("من واتساب العملاء", "From customers on WhatsApp"), related: L("قطع تلبس معاه", "Pieces to wear with it") } },
  name: L("نقرة", "Nuqra"),
  description: L(
    "فضة رجالي: بوستر بستيكر السعر، القطع الأساسية، خدمات بعد البيع، مقارنة ورسايل الواتساب. أربع صفحات جاهزة.",
    "Men's silver: a poster with a price sticker, the core pieces, after-sale services, a comparison and WhatsApp reviews. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 820,
  palette: ["#f2f2f2", "#e3e3e3", "#d4d4d8", "#3f3f46"],
  colors: {
    primary: "#3f3f46",
    secondary: "#e3e3e3",
    background: "#f2f2f2",
    foreground: "#111111",
    muted: "#525252",
    border: "#d0d0d0",
    accent: "#d4d4d8",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نقرة", "About"), seo: { title: L("عن نقرة", "About Nuqra") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("الورشة في خان الخليلي، الحسين.", "The workshop is in Khan El Khalili, El Hussein."),
        heading: L("اسأل عن مقاس أو حفر", "Ask about a size or engraving"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الفضة والحفر والمقاسات.", "Silver, engraving and sizes."),
        question: L("الفضة بتسوّد؟", "Does the silver tarnish?"),
        answer: L("الفضة ٩٢٥ بتغمق مع الوقت، وبنلمعها لك ببلاش في المحل مدى الحياة.", "925 silver darkens with time, and we polish it free in store for life."),
      }),
    },
  ],
  demo: DEMO,
});
