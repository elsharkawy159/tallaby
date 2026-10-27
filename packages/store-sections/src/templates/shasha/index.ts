/**
 * Shasha (template 102, electronics megastore; Claude Design "Storefront
 * Templates"): cool grey-white paper, slate ink, a strong blue for actions
 * and a yellow highlight, Cairo throughout and 10px corners. Original
 * electronics with local warranty: banners for audio, watches and TV, the
 * best sellers, more warranty cover, open before you pay, delivery days and
 * order tracking. Built from section library designs (`fromLibrary`).
 *
 * The design's "Protection plans" lists a free 6-month plan beside the paid
 * ones; the library section has three paid plans with shared perk lines, so
 * the free 6 months moved into the badge and the plans are 1, 2 and 3 years.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): over-ear headphones,
 * a smartwatch on charts, a living-room TV, earbuds in their cases, a
 * router, a smart speaker and power banks on marble. No people, no hands,
 * no logos (the design's product renders are local files, not Pexels, so
 * every photo is new).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SHASHA_KEY = "shasha";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SHASHA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  headphonesBanner: pexels(5269735),
  watchBanner: pexels(7947641),
  tvBanner: pexels(6980724),
  pulseBuds: pexels(8858287, 900),
  airBuds: pexels(11390378, 900),
  watch: pexels(7947641, 900),
  headphones: pexels(5269735, 900),
  tvRoom: pexels(6980724, 900),
  router: pexels(28348054, 900),
  speaker: pexels(1279107, 900),
  powerBank: pexels(3921704, 900),
  chargers: pexels(3921718),
};

const NAME = L("شاشة", "Shasha");

const header = lib("header-line", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الأجهزة", "All devices"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن شاشة", "About"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شاشة. كل الحقوق محفوظة.", "© 2026 Shasha. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED], "/contact": "/profile/orders" },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.headphonesBanner, PHOTOS.watchBanner, PHOTOS.tvBanner],
    text: {
      "وصل حديثًا": L("وصل جديد", "New in"),
      "الموسم الجديد وصل": L("صوت معاك في كل حتة", "Sound you can carry"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("سماعات وسبيكرات بضمان محلي.", "Earbuds and speakers with local warranty."),
      "تسوّق الجديد": L("تسوق السماعات", "Shop audio"),
      "صورة الحملة الأولى": L("سماعة فوق الودن على ترابيزة خشب", "Over-ear headphones on a wooden table"),
      "الأكثر مبيعًا": L("ساعات ذكية", "Smartwatches"),
      "المفضّلة عند عملائنا": L("بطارية تكفي أسبوع", "A battery that lasts the week"),
      "القطع اللي بترجع لها كل مرة.": L("تابع خطواتك ونومك ومكالماتك من إيدك.", "Track steps, sleep and calls from your wrist."),
      "شوف الأكثر مبيعًا": L("تسوق الساعات", "Shop watches"),
      "صورة الحملة الثانية": L("ساعة ذكية على ورق رسوم بيانية", "A smartwatch on printed charts"),
      "عروض الأسبوع": L("التلفزيون والبيت", "TV & home"),
      "خصومات لفترة محدودة": L("شاشة أكبر لنفس الصالة", "A bigger screen for the same living room"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("شاشات وأجهزة ستريمنج بالتقسيط.", "TVs and streaming boxes, paid in instalments."),
      "تسوّق العروض": L("تسوق التلفزيون والبيت", "Shop TV & home"),
      "صورة الحملة الثالثة": L("شاشة على حيطة صالة فيها كنبة رمادي", "A TV on a living-room wall with a grey sofa"),
    },
    links: { "/products": [search("سماعة"), search("ساعة"), search("شاشة")] },
  }),
  lib("categories-ruled", { text: { "تسوق بالقسم": L("اختار جهازك", "Pick your device") } }),
  lib("products-list", {
    text: {
      "الكتالوج": L("الأكتر طلباً", "Top picks"),
      "كل الإكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("إلكترونيات أصلية بضمان محلي، وتقسيط لحد ١٢ شهر.", "Original electronics with local warranty, in up to 12 instalments."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("service-plans", {
    text: {
      "الضمان": L("٦ شهور ضمان مجاناً مع كل جهاز", "6 months' warranty free with every device"),
      "احمي جهازك أكتر": L("زوّد الضمان", "Add more cover"),
      "١٩٩ ج.م": L("٢٤٩ ج.م", "EGP 249"),
      "٣٤٩ ج.م": L("٣٩٩ ج.م", "EGP 399"),
      "٤٧٩ ج.م": L("٥٤٩ ج.م", "EGP 549"),
      "إصلاح الأعطال": L("تصليح أو تغيير", "Repair or replace"),
      "فني في البيت": L("المندوب ياخده ببلاش", "Free courier pick-up"),
      "جهاز بديل وقت الصيانة": L("حادثة واحدة", "One accident"),
      "كسر الشاشة مرة واحدة": L("حادثتين وجهاز بديل وقت التصليح", "Two accidents and a loan device during repair"),
    },
  }),
  lib("pay-open-box", {
    text: {
      "جرّب المنتج قدام المندوب.": L("شغّل الجهاز واتأكد إنه سليم قدام المندوب.", "Switch the device on and check it in front of the courier."),
    },
  }),
  lib("track-ask"),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شاشة", "About Shasha"), L("إلكترونيات أصلية بضمان محلي.", "Original electronics with local warranty.")),
  aboutStory(lib, {
    photo: PHOTOS.chargers,
    alt: L("باور بانك وشاحن وكابلات على رخام", "A power bank, a charger and cables on marble"),
    eyebrow: L("أصلي وبضمان", "Original, with warranty"),
    title: L("الجهاز الصح، بالسعر الصح", "The right device, at the right price"),
    text: L("بنجيب سماعات وساعات وشاشات وشواحن من الوكيل، وكل جهاز معاه ضمان محلي.", "We bring in earbuds, watches, TVs and chargers from the official dealer, each with a local warranty."),
    more: L("وتقدر تقسّط لحد ١٢ شهر، والتوصيل خلال ٤٨ ساعة.", "Pay in up to 12 instalments, delivered within 48 hours."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إلكترونيات أصلية بضمان محلي.", "Original electronics with local warranty."),
  categories: [
    ["audio", "سماعات", "Audio", PHOTOS.pulseBuds],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
    ["tv", "التلفزيون والبيت", "TV & home", PHOTOS.tvRoom],
    ["power", "الطاقة", "Power", PHOTOS.powerBank],
  ],
  products: [
    ["pulse-buds-pro", "audio", "بالس برو", "Pulse Buds Pro", PHOTOS.pulseBuds, 1090, { compareAtPrice: 1730, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["sport-smartwatch", "watches", "ساعة ذكية سبورت", "Sport Smartwatch", PHOTOS.watch, 890, { compareAtPrice: 1450, sold90: 88 }],
    ["tv-box-4k", "tv", "رسيفر 4K", "4K TV Box", PHOTOS.tvRoom, 690, { compareAtPrice: 1250, sold90: 41 }],
    ["magnetic-power-bank-10k", "power", "باور بانك مغناطيسي 10K", "Magnetic Power Bank 10K", PHOTOS.powerBank, 1090, { compareAtPrice: 1835, sold90: 22 }],
    ["studio-headphones", "audio", "سماعة ستوديو", "Studio Headphones", PHOTOS.headphones, 590, { compareAtPrice: 990, sold90: 30 }],
    ["air-buds-4", "audio", "إير 4", "Air Buds 4", PHOTOS.airBuds, 790, { rating: 4.7, sold90: 64 }],
    ["wifi-router", "tv", "راوتر واي فاي", "Wi-Fi Router", PHOTOS.router, 1290, { sold90: 36 }],
    ["mini-smart-speaker", "tv", "سبيكر ذكي ميني", "Mini Smart Speaker", PHOTOS.speaker, 990, { inStock: false, sold90: 18 }],
  ],
});

export const SHASHA = libraryTemplate({
  key: SHASHA_KEY,
  version: 3,
  changelog: "Shasha v3: categories after the hero, one delivery block",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للأجهزة", "Back to the devices"), reviews: L("تجارب مستخدمين", "Verified buyer reviews"), related: L("أجهزة تكمّل جهازك", "Pairs well with this") } },
  name: L("شاشة", "Shasha"),
  description: L(
    "متجر إلكترونيات: بانرات متحركة، الأكثر مبيعاً، الضمان، افتح قبل ما تدفع وتتبع طلبك. أربع صفحات جاهزة.",
    "Electronics megastore: a banner carousel, best sellers, warranty, open before you pay and order tracking. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 1020,
  palette: ["#f5f7fa", "#e8ecf2", "#facc15", "#1d4ed8"],
  colors: {
    primary: "#1d4ed8",
    secondary: "#e8ecf2",
    background: "#f5f7fa",
    foreground: "#0f172a",
    muted: "#5b6576",
    border: "#d8dee8",
    accent: "#facc15",
  },
  fonts: { heading: "Cairo", body: "Cairo" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شاشة", "About"), seo: { title: L("عن شاشة", "About Shasha") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا على shasha@shasha.eg أو على واتساب.", "Write to shasha@shasha.eg or on WhatsApp."),
        heading: L("اسأل عن جهاز أو تقسيط", "Ask about a device or instalments"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتقسيط والتوصيل.", "Warranty, instalments and delivery."),
        question: L("الضمان بيشمل إيه؟", "What does the warranty cover?"),
        answer: L("أي عطل صناعة خلال مدة الضمان: بنصلّح الجهاز أو نغيّره، والمندوب بياخده من عندك.", "Any manufacturing fault during the warranty: we repair or replace the device, and a courier picks it up."),
      }),
    },
  ],
  demo: DEMO,
});
