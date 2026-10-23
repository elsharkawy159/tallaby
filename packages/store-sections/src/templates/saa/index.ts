/**
 * Saa (template 58, smartwatches; Claude Design "Storefront Templates"):
 * warm off-white paper, near-black ink, a rose red for actions and a lemon
 * highlight, Tajawal throughout and 20px corners. A watch shop: a week on
 * one charge, browse, most worn, why buy from us, installments and messages
 * from WhatsApp. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): smartwatches resting on
 * desks and plain backgrounds, a set of straps, earbuds in their case and a
 * power bank. No wrists, no hands, no people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SAA_KEY = "saa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SAA_KEY, getDesign(id)!, { corners: 20, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ultra: pexels(11700618, 900),
  watchX: pexels(30707908, 900),
  active: pexels(18662969, 900),
  pinkWatch: pexels(31406910, 900),
  sportWatch: pexels(7947642, 900),
  deskWatch: pexels(7947630),
  straps: pexels(32768001, 900),
  leatherWatch: pexels(16247533),
  airBuds: pexels(17810093, 900),
  miniBuds: pexels(16240420, 900),
  powerBank: pexels(3921705, 900),
};

const NAME = L("ساعة سمارت", "Saa Smart");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("الساعات", "Watches"),
    "العروض": L("الأساور", "Straps"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [search("ساعة"), search("أسورة")], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "اشترك في النشرة": L("اعرف الموديلات الجديدة الأول", "Hear about new models first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("ساعات جديدة وأساور وعروض تقسيط، مرة في الأسبوع.", "New watches, straps and installment offers, once a week."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ساعة سمارت. كل الحقوق محفوظة.", "© 2026 Saa Smart. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.deskWatch],
    text: {
      "وصل جديد": L("ألترا 3 الجديدة", "New Ultra 3"),
      "صوت أنقى، كل يوم": L("أسبوع بشحنة واحدة", "A week on one charge"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L("ضمان محلي، أسورة زيادة ببلاش، وعربي على الشاشة.", "Local warranty, a free extra strap, and Arabic on the watch face."),
      "تسوق الآن": L("تسوق الساعات", "Shop watches"),
      "صورة الحملة": L("ساعة ذكية سودا على مكتب خشب", "A black smartwatch on a wooden desk"),
      "٤٫٨": L("٤٫٧", "4.7"),
      "من ١٢ ألف تقييم": L("من أكتر من ٣٠٠ تقييم", "from 300+ reviews"),
    },
    links: { "/products": search("ساعة") },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("تصفح", "Browse") } }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر لبساً", "Most worn"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("features-compare", {
    text: {
      "إحنا ولا غيرنا؟": L("ليه تشتري من ساعة سمارت؟", "Why buy from Saa?"),
      "متجرنا": NAME,
      "منتجات أصلية بفاتورة": L("ضمان محلي سنة", "Local 1-year warranty"),
      "ضمان محلي": L("استرجاع ٧ أيام", "7-day returns"),
      "استرجاع خلال ١٤ يوم": L("أسورة زيادة ببلاش", "Free extra strap"),
      "رد على واتساب في دقايق": L("عربي على شاشة الساعة", "Arabic on the watch face"),
    },
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط ساعتك", "Split your watch"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("من غير فوايد ولا مقدم، والأسورة الزيادة معاها ببلاش.", "No interest, no down payment, and the extra strap is still free."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("من واتساب", "From WhatsApp"),
      "رسايل بتفرّحنا": L("رسايل من اللي لابسينها", "Messages from people wearing them"),
      "مريم أ.": L("نادين ف.", "Nadine F."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الساعة قعدت ٦ أيام من غير شحن، والأسورة الزيادة لونها حلو جداً.",
        "The watch lasted 6 days without charging, and the extra strap colour is lovely.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("ده يسعدنا جداً، استمتعي بيها!", "So happy to hear that, enjoy it!"),
      "عمر ك.": L("طارق ب.", "Tarek B."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("ظبطولي العربي على الشاشة في مكالمة دقيقتين.", "They set the watch face to Arabic for me in a two-minute call."),
      "يوسف م.": L("دينا ع.", "Dina A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("قسّطتها على ١٢ شهر من غير مقدم، والضمان المحلي طمني.", "I split it over 12 months with no down payment, and the local warranty reassured me."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ساعة سمارت", "About Saa Smart"), L("ساعات ذكية بضمان محلي وأساور ببلاش.", "Smartwatches with local warranty and free straps.")),
  aboutStory(lib, {
    photo: PHOTOS.leatherWatch,
    alt: L("ساعة ذكية بأسورة جلد على لابتوب", "A smartwatch with a leather strap on a laptop"),
    eyebrow: L("مصر الجديدة", "Heliopolis"),
    title: L("ساعة بضمان تقدر توصله", "A watch with a warranty you can reach"),
    text: L("بدأنا لأن الساعات المستوردة كانت بتيجي من غير ضمان ولا عربي على الشاشة.", "We started because imported watches came with no warranty and no Arabic on the screen."),
    more: L("دلوقتي كل ساعة عندنا بضمان محلي سنة ومعاها أسورة زيادة.", "Now every watch we sell has a local 1-year warranty and an extra strap."),
    button: L("تسوق الساعات", "Shop watches"),
    href: search("ساعة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ساعات ذكية بضمان محلي وأساور ببلاش.", "Smartwatches with local warranty and free straps."),
  categories: [
    ["watches", "ساعات", "Watches", PHOTOS.ultra],
    ["straps", "أساور", "Straps", PHOTOS.straps],
    ["audio", "سماعات", "Audio", PHOTOS.airBuds],
    ["power", "شحن", "Charging", PHOTOS.powerBank],
  ],
  products: [
    ["ultra-3-smartwatch", "watches", "ساعة ألترا 3", "Ultra 3 Smartwatch", PHOTOS.ultra, 1450, { isFeatured: true, rating: 4.7, sold90: 180 }],
    ["watch-x-series", "watches", "ساعة إكس", "Watch X Series", PHOTOS.watchX, 1080, { rating: 4.6, sold90: 96 }],
    ["active-fit-watch", "watches", "ساعة أكتيف فِت", "Active Fit Watch", PHOTOS.active, 890, { compareAtPrice: 990, sold90: 120 }],
    ["watch-se-rose", "watches", "ساعة SE روز", "Watch SE Rose", PHOTOS.pinkWatch, 1250, { sold90: 70 }],
    ["sport-watch-2", "watches", "ساعة سبورت 2", "Sport Watch 2", PHOTOS.sportWatch, 990, { sold90: 64 }],
    ["strap-set", "straps", "طقم أساور جلد وستيل", "Leather and Steel Strap Set", PHOTOS.straps, 450, { compareAtPrice: 520, sold90: 140 }],
    ["air-buds-4", "audio", "سماعة إير 4", "Air Buds 4", PHOTOS.airBuds, 1390, { sold90: 44 }],
    ["mini-buds", "audio", "سماعة ميني", "Mini Buds", PHOTOS.miniBuds, 790, { inStock: false, sold90: 30 }],
    ["slim-20k-power-bank", "power", "باور بانك سليم 20K", "Slim 20K Power Bank", PHOTOS.powerBank, 1080, { compareAtPrice: 1250, sold90: 60 }],
  ],
});

export const SAA = libraryTemplate({
  key: SAA_KEY,
  version: 2,
  changelog: "Saa v2: product page",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { back: L("رجوع للساعات", "Back to the watches"), reviews: L("رسايل من واتساب", "Messages from WhatsApp"), related: L("سيور وإكسسوارات", "Straps and extras") } },
  name: L("ساعة", "Saa"),
  description: L(
    "ساعات ذكية: أسبوع بشحنة واحدة، الأكتر لبساً، ليه تشتري مننا، التقسيط ورسايل واتساب. أربع صفحات جاهزة.",
    "Smartwatches: a week on one charge, most worn, why buy from us, installments and WhatsApp messages. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 580,
  palette: ["#f7f7f5", "#ebebe6", "#fde047", "#e11d48"],
  colors: {
    primary: "#e11d48",
    secondary: "#ebebe6",
    background: "#f7f7f5",
    foreground: "#18181b",
    muted: "#55555c",
    border: "#dcdcd5",
    accent: "#fde047",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ساعة سمارت", "About"), seo: { title: L("عن ساعة سمارت", "About Saa Smart") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن موديل أو مقاس أسورة.", "Ask about a model or a strap size."),
        heading: L("اسأل عن ساعة", "Ask about a watch"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتقسيط والأساور.", "Warranty, installments and straps."),
        question: L("الساعة بتشتغل مع أي موبايل؟", "Does the watch work with any phone?"),
        answer: L("أيوه، أندرويد وآيفون، وبنظبطهالك بالعربي قبل الشحن لو حابب.", "Yes, Android and iPhone, and we can set it to Arabic before shipping."),
      }),
    },
  ],
  demo: DEMO,
});
