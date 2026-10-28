/**
 * Arcade (template 07, gaming and audio in dark mode; Claude Design
 * "Storefront Templates"): near-black paper, violet actions and an acid lime
 * highlight, Changa throughout and 14px corners. A bold three-slide hero,
 * captioned categories, a numbered best-seller leaderboard, big numbers, new
 * drops and players' reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): headphones, earbuds,
 * controllers and gaming desks. No people and no visible brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ARCADE_KEY = "arcade";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ARCADE_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  headphones: pexels(7772548, 900),
  budsBlack: pexels(8858287, 900),
  budsOpen: pexels(3921830, 900),
  watch: pexels(31406900, 900),
  watchGreen: pexels(13007642, 900),
  powerBank: pexels(3921704, 900),
  powerBankSilver: pexels(4072683, 900),
  cable: pexels(3921713, 900),
  neonController: pexels(7773745, 900),
  camoControllers: pexels(7887636, 900),
  glowControllers: pexels(34592708, 900),
  headset: pexels(9742608, 900),
  rgbDesk: pexels(4317157),
  heroDesk: pexels(4317157, 1600),
  heroController: pexels(7773745, 1600),
  heroBuds: pexels(8858287, 1600),
};

const NAME = L("بِت أركيد", "Bit Arcade");

const header = lib("header-brand-bar", {
  text: { "م": L("ب", "B"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن سماعة، دراع، ساعة…", "Search headsets, controllers, watches…") },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("سماعات وأدوات جيمنج، مجربة من جيمرز.", "Audio and gaming gear, tested by gamers."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بِت أركيد. كل الحقوق محفوظة.", "© 2026 Bit Arcade. All rights reserved."),
  },
});

/**
 * Home (v4, template-rules §2a): a bold dark slideshow, the categories, then
 * the gamer's journey: the weekly leaderboard first, the numbers that back it
 * (delivery, warranty, rating), the new drops, and players' reviews to close.
 */
const home: Design[] = [
  lib("hero-thumbs", {
    photo: [PHOTOS.heroDesk, PHOTOS.heroController, PHOTOS.heroBuds],
    text: {
      "درجات جديدة": L("السيت أب الكامل", "The full setup"),
      "لون بيتكلم عنك": L("سيت أب يليق بيك", "A setup worth bragging about"),
      "درجات هادية لكل يوم وألوان جريئة للمناسبات.": L("سماعات ودراعات وباور، كلها متجربة على الهوا.", "Headsets, controllers and power, all tested on stream."),
      "تسوّق الآن": L("شوف الأكثر مبيعاً", "See the top sellers"),
      "صورة الشريحة الأولى": L("مكتب جيمنج بإضاءة ملوّنة", "A gaming desk in coloured light"),
      "المجموعة الجديدة": L("وصل حديثاً", "Just dropped"),
      "جريء ومريح وليك": L("دراعك الجاي هنا", "Your next controller"),
      "اختيارات جديدة وصلت للموسم ده.": L("لاسلكي، خفيف، ومن غير أي تأخير.", "Wireless, light and lag-free."),
      "تسوّق الجديد": L("تسوّق الجديد", "Shop new drops"),
      "صورة الشريحة الثانية": L("دراع لاسلكي في إضاءة نيون", "A wireless controller in neon light"),
      "أطقم كاملة": L("صوت نضيف", "Clean audio"),
      "قطعتين وعشر إطلالات": L("اسمع كل خطوة", "Hear every footstep"),
      "قطع بتتنسّق مع بعض بسهولة.": L("سماعات بعزل ضوضاء ومايك واضح.", "Noise-cancelling buds and clear mics."),
      "تسوّق الأطقم": L("تسوّق السماعات", "Shop audio"),
      "صورة الشريحة الثالثة": L("سماعة لاسلكية سوداء في علبتها", "Black wireless earbuds in their case"),
    },
    links: { "/products": [BEST, NEW, `/products?search=${encodeURIComponent("سماعة")}`] },
  }),
  lib("categories-captioned", {
    text: { "اكتشف الأقسام": L("اختار عالمك", "Pick your world") },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("الترتيب", "Leaderboard"),
      "كل الإكسسوارات": L("الأكثر مبيعاً الأسبوع ده", "Top sellers this week"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("حسب الطلبات، بيتحدّث كل اتنين.", "Ranked by orders, updated every Monday."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 8 }],
  }),
  lib("stats-big-numbers", {
    text: {
      "أرقامنا تتكلم عنا": L("أرقام تهمّك", "Numbers that matter"),
      "+٢٥ ألف": L("٢٤ ساعة", "24 h"),
      "طلب تم توصيله": L("توصيل القاهرة", "Cairo delivery"),
      "٢٧": L("سنتين", "2 yrs"),
      "محافظة نوصل لها": L("ضمان محلي", "Local warranty"),
      "متوسط التقييم": L("من ٣٬٢٠٠ تقييم", "From 3,200 reviews"),
      "١٤": L("١٥ ألف", "15K"),
      "يومًا للاسترجاع": L("طلب اتشحن", "Orders shipped"),
    },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("نزل جديد", "New drops"),
      "هدايا تحت ١٠٠٠ جنيه": L("لسه واصلين", "Fresh off the truck"),
      "اختيارات مضمونة لأي مناسبة.": L("أحدث السماعات والدراعات، متجربة قبل ما تنزل.", "The latest headsets and controllers, tested before they hit the shelf."),
    },
    links: { "/products": NEW },
    lists: [{ source: "newest" }],
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("من الجيمرز", "From our players"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الستوديو برو صوته نضيف والمايك واضح على ديسكورد.",
        "Studio Pro sounds clean and the mic is clear on Discord.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("مازن ر.", "Mazen R."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("وضع الألعاب من غير أي تأخير. وصلت تاني يوم.", "Game mode has no delay at all. Arrived the next day."),
      "ع": L("ل", "L"),
      "عمر ك.": L("لينا ع.", "Lina A."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("ساعة حلوة، نفسي في واجهات أكتر.", "Great watch, wish it had more faces."),
      "ن": L("ع", "O"),
      "نور ح.": L("عمر ز.", "Omar Z."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بِت أركيد", "About Bit Arcade"), L("محل جيمنج وسماعات بيديره اتنين ستريمرز.", "A gaming and audio shop run by two streamers.")),
  aboutStory(lib, {
    photo: PHOTOS.rgbDesk,
    alt: L("مكتب جيمنج بإضاءة ملوّنة", "A gaming desk with coloured lights"),
    eyebrow: L("مكرم عبيد، مدينة نصر", "Makram Ebeid, Nasr City"),
    title: L("كل حاجة اتجربت على الهوا", "Everything is tested on stream"),
    text: L("بنلعب بكل سماعة ودراع قبل ما نعرضه، وبنقولك رأينا بصراحة.", "We play with every headset and controller before we list it, and give you our honest take."),
    more: L("ولو مش مناسب لسيت أب بتاعك، هنقولك.", "And if it does not suit your setup, we will tell you."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("سماعات وأدوات جيمنج، مجربة من جيمرز.", "Audio and gaming gear, tested by gamers."),
  categories: [
    ["audio", "سماعات", "Audio", PHOTOS.headphones],
    ["gaming", "أدوات جيمنج", "Gaming gear", PHOTOS.glowControllers],
    ["wear", "ساعات", "Wearables", PHOTOS.watchGreen],
    ["power", "باور", "Power", PHOTOS.cable],
    ["headsets", "سماعات جيمنج", "Gaming headsets", PHOTOS.headset],
  ],
  products: [
    ["studio-pro-headphones", "audio", "سماعة ستوديو برو", "Studio Pro Headphones", PHOTOS.headphones, 1290, { compareAtPrice: 1890, isFeatured: true, rating: 4.8, sold90: 410 }],
    ["pulse-buds-anc", "audio", "سماعة بالس ANC", "Pulse Buds ANC", PHOTOS.budsBlack, 1590, { sold90: 320 }],
    ["air-buds-4", "audio", "سماعة إير ٤", "Air Buds 4", PHOTOS.budsOpen, 1190, { sold90: 120 }],
    ["arena-gaming-headset", "headsets", "سماعة جيمنج بمايك", "Gaming Headset with Mic", PHOTOS.headset, 1490, { compareAtPrice: 1790, sold90: 150 }],
    ["neon-controller", "gaming", "دراع لاسلكي نيون", "Neon Wireless Controller", PHOTOS.neonController, 1350, { isFeatured: true, sold90: 96 }],
    ["camo-controller-pair", "gaming", "دراعين مموّهين", "Camo Controller Pair", PHOTOS.camoControllers, 2400, { sold90: 44 }],
    ["ultra-watch-3", "wear", "ساعة ألترا ٣", "Ultra Watch 3", PHOTOS.watch, 1450, { sold90: 96 }],
    ["magsnap-10k", "power", "ماج سناب 10K", "MagSnap 10K", PHOTOS.powerBank, 1290, { compareAtPrice: 1490, rating: 4.7, sold90: 380 }],
    ["slim-20k", "power", "سليم 20K", "Slim 20K", PHOTOS.powerBankSilver, 990, { inStock: false, sold90: 210 }],
  ],
});

export const ARCADE = libraryTemplate({
  key: ARCADE_KEY,
  version: 4,
  changelog: "Arcade v4: hero, categories, section order",
  name: L("أركيد", "Arcade"),
  description: L(
    "جيمنج وسماعات بالوضع الداكن: شرائح جريئة، ترتيب الأكثر مبيعاً، أرقام والجديد. أربع صفحات جاهزة.",
    "Gaming and audio in dark mode: a bold slideshow, a best-seller leaderboard, numbers and new drops. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 70,
  palette: ["#0f1117", "#1e222c", "#b6ff3b", "#7c5cff"],
  colors: {
    primary: "#7c5cff",
    secondary: "#1e222c",
    background: "#0f1117",
    foreground: "#f2f3f7",
    muted: "#a4a9b8",
    border: "#2a2f3b",
    accent: "#b6ff3b",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن بِت أركيد", "About Bit Arcade") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("محل ٤، مكرم عبيد، مدينة نصر.", "Shop 4, Makram Ebeid, Nasr City."),
        heading: L("اسأل جيمر", "Ask a gamer"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والاسترجاع.", "Warranty, delivery and returns."),
        question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
        answer: L(
          "ضمان محلي سنتين على كل جهاز ضد عيوب الصناعة. الوقعات والسوائل مش داخلين.",
          "A 2-year local warranty on every device against manufacturing faults. Drops and liquid damage are not covered.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "side", headingCase: "upper", band: "brand", copy: { reviews: L("رأي اللاعبين", "Player reviews"), related: L("كمّل السيتاب", "Level up your setup") } },
});
