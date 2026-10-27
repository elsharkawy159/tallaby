/**
 * Sada (template 56, audio store; Claude Design "Storefront Templates"): a
 * dark home, near-black paper and light type, a violet for actions and a
 * mint highlight, Alexandria throughout and 16px corners. An earbuds and
 * headphones shop (v3): a headline with two small photos and quick links,
 * the categories, most played, which earbuds, just in, installments and
 * reviews from listeners.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): earbuds in their cases,
 * headphones on tables and a stand, wired earphones and a speaker on a jetty.
 * No people, no ears, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch, type ListPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SADA_KEY = "sada";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SADA_KEY, getDesign(id)!, { corners: 16, ...patch });

const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  pulseBuds: pexels(32880383, 900),
  airBuds: pexels(6889216, 900),
  blueBuds: pexels(16703772, 900),
  sportBuds: pexels(33797659, 900),
  pinkBuds: pexels(30981655, 900),
  studio: pexels(5269726, 900),
  desk: pexels(7172685, 900),
  wired: pexels(18573077, 900),
  speaker: pexels(13465232, 900),
  stand: pexels(15372898),
};

const NAME = L("صدى أوديو", "Sada Audio");

const header = lib("header-brand-bar", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "ابحث في المتجر": L("ابحث عن سماعة أذن أو رأس…", "Search earbuds or headphones…"),
  },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("سماعات أذن ورأس، بتتجرب قبل ما تتشحن.", "Earbuds and headphones, tested before they ship."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صدى أوديو. كل الحقوق محفوظة.", "© 2026 Sada Audio. All rights reserved."),
  },
});

const REVIEWS = {
  "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
    "العزل في المترو فرق معايا جداً، ومبقتش أعلّي الصوت.",
    "The noise cancelling on the metro changed everything; I no longer turn the volume up.",
  ),
  "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("جربتها أسبوع وكانت مريحة، فخلّيتها. التجربة دي طمنتني.", "I tried them for a week, they were comfortable, so I kept them. The trial reassured me."),
  "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بدّلت أطراف السماعة لمقاس أصغر ببلاش، والرد كان في دقايق.", "Swapped the ear tips for a smaller size for free, and they replied in minutes."),
  "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("السماعة الستوديو وصلت أسيوط في ٣ أيام ومتغلفة كويس.", "The studio headphones reached Assiut in 3 days, well packed."),
  "أسعار معقولة وجودة أفضل مما توقعت.": L("الباص أحسن من سماعات بضعف السعر.", "The bass beats headphones at twice the price."),
  "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("سألتهم أنهي أحسن للجيم ورشحولي سماعة مريحة ومبتقعش.", "I asked which is best for the gym and they suggested a pair that never falls out."),
};

const BEST = "/products?sort=popularity";
const NEW = "/products?sort=newest";

const home: Design[] = [
  lib("hero-inline", {
    photo: [PHOTOS.pulseBuds, PHOTOS.studio],
    text: {
      "تشكيلة ٢٠٢٦": L("مجرّبة قبل الشحن", "Tested before shipping"),
      "منتجات مختارة بعناية": L("سماعات أذن ورأس وسبيكرات", "Earbuds, headphones, speakers"),
      "كل ما تستخدمه": L("كل نغمة", "Every note"),
      "كل يوم،": L("بوضوح،", "crystal clear,"),
      "بجودة أفضل.": L("من غير دوشة.", "no noise."),
      "صورة صغيرة": L("سماعة لاسلكي جنب علبتها", "Wireless earbuds beside their case"),
      "نختار كل منتج بأنفسنا ونجرّبه قبل أن يصل إليك، بضمان وتوصيل سريع.": L(
        "بنسمع كل سماعة قبل ما تتشحن، وعندك ٧ أيام تجربة لو مش مريحة.",
        "We listen to every pair before it ships, and you get a 7-day trial if they do not fit.",
      ),
      "ابدأ التسوق": L("تسوق الأكثر مبيعاً", "Shop best sellers"),
      "وصل حديثًا": L("سماعات أذن", "Earbuds"),
      "الأكثر مبيعًا": L("سماعات رأس", "Headphones"),
      "العروض": L("للرياضة", "For sport"),
      "هدايا": L("سبيكرات", "Speakers"),
    },
    links: { "/products": [BEST, search("سماعة أذن"), search("سماعة رأس"), search("سبورت"), search("سبيكر")] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("بتسمع فين؟", "Where do you listen?") } }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("الأكثر سماعاً", "Most played") },
    links: { "/products": BEST },
  }),
  lib("finder-versus", {
    text: {
      "تختار مين؟": L("أنهي سماعة؟", "Which earbuds?"),
      "٥٫٢ جم": L("لأ", "No"),
      "الوزن": L("شحن لاسلكي", "Wireless charging"),
      "٤٫٨ جم": L("أيوه", "Yes"),
    },
    // Side B drops the library offset (a store with one best seller would hide the section) and shows the newest pair instead.
    lists: [undefined, { source: "newest", offset: null } as ListPatch],
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("وصل جديد", "Just in"),
      "أحدث المنتجات اللي نزلت المتجر.": L("أحدث السماعات اللي جربناها ونزلت المحل.", "The newest pairs we tested and put on the shelf."),
    },
    links: { "/products": NEW },
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط سماعتك", "Split your headphones"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("من غير فوايد ولا مقدم مع valU وسيمبل وسهولة.", "No interest and no down payment with valU, Sympl and souhoola."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("من المستمعين", "Heard from listeners"),
      ...REVIEWS,
      "م": L("ه", "H"),
      "مريم أ.": L("هنا م.", "Hana M."),
      "ي": L("ز", "Z"),
      "يوسف م.": L("زياد ع.", "Ziad A."),
      "ع": L("ر", "R"),
      "عمر ك.": L("رنا س.", "Rana S."),
      "س": L("م", "M"),
      "سلمى ر.": L("مصطفى ح.", "Mostafa H."),
      "ن": L("ل", "L"),
      "نور ح.": L("ليلى ك.", "Laila K."),
      "ك": L("أ", "A"),
      "كريم ع.": L("أدهم ي.", "Adham Y."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن صدى أوديو", "About Sada Audio"), L("محل صوتيات بيجرّب كل سماعة قبل ما تتشحن.", "An audio shop that tests every pair before it ships.")),
  aboutStory(lib, {
    photo: PHOTOS.stand,
    alt: L("سماعة رأس على حامل خشب جنب مكتب", "Headphones on a wooden stand beside a desk"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("بنسمع قبل ما نبيع", "We listen before we sell"),
    text: L("كل سماعة بتعدّي على ودننا الأول: العزل والباص والمايك والبطارية.", "Every pair goes past our ears first: noise cancelling, bass, mic and battery."),
    more: L("ولو مش مريحة ليك، عندك ٧ أيام ترجّعها.", "And if they do not fit you, you have 7 days to return them."),
    button: L("تسوق السماعات", "Shop earbuds"),
    href: search("سماعة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("سماعات أذن ورأس، بتتجرب قبل ما تتشحن.", "Earbuds and headphones, tested before they ship."),
  categories: [
    ["buds", "سماعات أذن", "Earbuds", PHOTOS.pulseBuds],
    ["over", "سماعات رأس", "Headphones", PHOTOS.studio],
    ["sport", "رياضة", "Sport", PHOTOS.sportBuds],
    ["speakers", "سبيكرات", "Speakers", PHOTOS.speaker],
  ],
  products: [
    ["air-buds-4", "buds", "سماعة إير 4", "Air Buds 4", PHOTOS.airBuds, 1390, { rating: 4.7, sold90: 140 }],
    ["pulse-buds-pro", "buds", "سماعة بالس برو", "Pulse Buds Pro", PHOTOS.pulseBuds, 1730, { compareAtPrice: 2100, isFeatured: true, rating: 4.7, sold90: 212 }],
    ["studio-headphones", "over", "سماعة ستوديو", "Studio Headphones", PHOTOS.studio, 990, { sold90: 88 }],
    ["sport-wired-earphones", "sport", "سماعة سلك سبورت", "Sport Wired Earphones", PHOTOS.wired, 540, { compareAtPrice: 690, sold90: 77 }],
    ["pulse-buds-lite", "buds", "سماعة بالس لايت", "Pulse Buds Lite", PHOTOS.blueBuds, 890, { sold90: 120 }],
    ["sport-buds", "sport", "سماعة سبورت لاسلكي", "Sport Wireless Buds", PHOTOS.sportBuds, 1150, { rating: 4.6, sold90: 64 }],
    ["air-buds-rose", "buds", "سماعة إير روز", "Air Buds Rose", PHOTOS.pinkBuds, 1250, { compareAtPrice: 1390, sold90: 40 }],
    ["desk-headphones", "over", "سماعة مكتب أون إير", "On-Ear Desk Headphones", PHOTOS.desk, 750, { sold90: 52 }],
    ["outdoor-speaker", "speakers", "سبيكر خارجي ضد المية", "Waterproof Outdoor Speaker", PHOTOS.speaker, 1450, { isFeatured: true, rating: 4.8, sold90: 36 }],
  ],
});

export const SADA = libraryTemplate({
  key: SADA_KEY,
  version: 3,
  changelog: "Sada v3: new hero, categories, section order",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للسماعات", "Back to the audio"), reviews: L("رأي المستمعين", "From listeners"), related: L("اسمع كمان", "Listen to more") } },
  name: L("صدى", "Sada"),
  description: L(
    "محل صوتيات بواجهة داكنة: عنوان بصور صغيرة، الأكثر سماعاً، مقارنة سماعتين، الجديد، التقسيط وآراء المستمعين. أربع صفحات جاهزة.",
    "A dark audio store: a headline with small photos, most played, two earbuds head to head, just in, installments and listener reviews. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 560,
  palette: ["#0f1115", "#1b1f27", "#3ee6b0", "#7c5cff"],
  colors: {
    primary: "#7c5cff",
    secondary: "#1b1f27",
    background: "#0f1115",
    foreground: "#f4f5f7",
    muted: "#a6adbb",
    border: "#2a303b",
    accent: "#3ee6b0",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن صدى", "About"), seo: { title: L("عن صدى أوديو", "About Sada Audio") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("قولنا بتسمع إيه وفين، ونرشحلك السماعة.", "Tell us what and where you listen, and we suggest a pair."),
        heading: L("اسأل عن سماعة", "Ask about a pair"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التجربة والتقسيط والضمان.", "Trial, installments and warranty."),
        question: L("ينفع أجرّب السماعة وأرجّعها؟", "Can I try a pair and return it?"),
        answer: L("أيوه، عندك ٧ أيام تجربة، ولو مش مريحة رجّعها في علبتها.", "Yes, you have a 7-day trial; if they do not fit, return them in their box."),
      }),
    },
  ],
  demo: DEMO,
});
