/**
 * Arena (template 08, gaming gear in dark mode; Claude Design "Storefront
 * Templates"): near-black paper, violet actions and a lime highlight,
 * Changa throughout and 10px corners. A trust-led store: a brand film,
 * brand cards, players' picks, numbers, shop-the-setup video, warranty
 * terms, help topics and an interests sign-up. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): keyboards, mice,
 * headsets, controllers and gaming desks. No people and no visible brand
 * logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ARENA_KEY = "arena";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ARENA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  rgbKeyboard: pexels(34877295, 900),
  switches: pexels(9020272, 900),
  keyboardShelf: pexels(31076950),
  mouseDesk: pexels(5861328, 900),
  mouseTop: pexels(5861324, 900),
  headset: pexels(9742608, 900),
  pcDesk: pexels(30469973),
  editDesk: pexels(8774458),
  neonController: pexels(7773745, 900),
  glowControllers: pexels(34592708, 900),
  arenaDesk: pexels(7862505),
  powerBank: pexels(3921704, 900),
  cable: pexels(3921713, 900),
};

const NAME = L("ليفل أب", "Level Up");

const header = lib("header-chips", {
  text: { "م": L("ل", "L"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن كيبورد، ماوس، سماعة…", "Search keyboards, mice, headsets…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("GG. نتقابل الماتش الجاي", "GG. See you next match"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ليفل أب. كل الحقوق محفوظة.", "© 2026 Level Up. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن ليفل أب", "About Level Up"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("video-film", {
    photo: [undefined, undefined, undefined, PHOTOS.pcDesk],
    text: {
      "إزاي بنجهّز كل طلب قبل ما يخرج": L("إزاي بنجرّب كل كيبورد قبل ما يخرج", "How we test every keyboard before it ships"),
      "عن المتجر": L("عن ليفل أب", "About Level Up"),
      "فيلم المتجر": L("فيلم: إزاي بنجرّب الكيبوردات", "Film: how we test keyboards"),
    },
  }),
  lib("brands-cards", {
    text: {
      "فولتا": "NOVA",
      "٤٢": L("٢٤", "24"),
      "نورو": "Kinetic",
      "كيان": "HALO",
      "٢٧": L("١٢", "12"),
      "ساحل": "Vector",
    },
    links: { "/products": [undefined, search("Nova"), search("Kinetic"), search("Halo"), search("Vector")] },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("الأكثر مبيعاً", "Best sellers"),
      "هدايا تحت ١٠٠٠ جنيه": L("اختيارات اللعيبة", "Players’ picks"),
      "اختيارات مضمونة لأي مناسبة.": L("متجرب من فريقنا من ١٠ لعيبة.", "Tested by our team of ten players."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
  }),
  lib("stats-band", {
    text: {
      "+٢٥ ألف": L("سنتين", "2 yrs"),
      "طلب تم توصيله": L("ضمان محلي", "Local warranty"),
      "٢٧": L("٢٤ س", "24 h"),
      "محافظة نوصل لها": L("توصيل القاهرة", "Cairo delivery"),
      "١٤": L("١٢ ألف", "12K"),
      "يومًا للاسترجاع": L("لعيب اتعامل معانا", "Players served"),
    },
  }),
  lib("video-shop", {
    photo: [undefined, PHOTOS.editDesk],
    text: {
      "تسوق من الفيديو": L("تسوق السيت أب", "Shop the setup"),
      "كل اللي في الفيديو": L("جوه مكتب الستريمر بتاعنا", "Inside our streamer’s desk"),
      "فيديو المنتجات": L("فيديو: مكتب الستريمر", "Video: the streamer’s desk"),
    },
  }),
  lib("text-terms", {
    text: {
      "سنة من تاريخ الفاتورة.": L("سنتين من تاريخ الفاتورة.", "Two years from the invoice date."),
      "عيوب الصناعة.": L("السويتشات والسنسور والبطاريات والكابلات.", "Switches, sensors, batteries and cables."),
      "الكسر والمياه وسوء الاستخدام.": L("الوقعات والسوائل والأزرار المستهلكة.", "Drops, liquid damage and worn keycaps."),
    },
  }),
  lib("faq-topics", {
    text: { "بتسأل عن إيه؟": L("محتاج مساعدة في إيه؟", "What do you need help with?") },
  }),
  lib("newsletter-interests", {
    text: {
      "إيه اللي يهمك؟": L("بتلعب إيه؟", "What do you play?"),
      "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": L("اختار وهنبعتلك العروض اللي تخص السيت أب بتاعك بس.", "Pick and we will only send drops for your setup."),
      "وصل حديثًا": L("كمبيوتر", "PC"),
      "العروض": L("كونسول", "Console"),
      "هدايا": L("موبايل", "Mobile"),
      "نصايح": L("ستريم", "Streaming"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ليفل أب", "About Level Up"), L("محل جيمنج في سيتي ستارز بيديره ١٠ لعيبة.", "A gaming shop in City Stars run by ten players.")),
  aboutStory(lib, {
    photo: PHOTOS.arenaDesk,
    alt: L("شاشة وسماعة جيمنج على مكتب", "A monitor and gaming headset on a desk"),
    eyebrow: L("سيتي ستارز", "City Stars"),
    title: L("متجرب من لعيبة قبل ما يوصلك", "Tested by players before it reaches you"),
    text: L("كل كيبورد وماوس وسماعة بيعدّي على فريقنا قبل ما ينزل المحل.", "Every keyboard, mouse and headset goes through our team before it reaches the shelf."),
    more: L("وضمانه المحلي سنتين، وإحنا بنخلّصه.", "With a 2-year local warranty that we handle."),
    button: L("تسوق كل الأدوات", "Shop all gear"),
    href: SHOP,
  }),
];

const faq: Design[] = [
  pageHeader(lib, "faq-header", L("الأسئلة الشائعة", "FAQ"), L("الضمان والتوصيل والدفع والاسترجاع.", "Warranty, delivery, payment and returns.")),
  lib("faq-columns", {
    text: {
      "ما سياسة الاسترجاع؟": L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "سنتين على السويتشات والسنسور والبطاريات والكابلات. الوقعات والسوائل مش داخلين.",
        "Two years on switches, sensors, batteries and cables. Drops and liquid damage are not covered.",
      ),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات جيمنج متجربة من لعيبة.", "Gaming gear tested by players."),
  categories: [
    ["keyboards", "كيبوردات", "Keyboards", PHOTOS.rgbKeyboard],
    ["mice", "ماوسات", "Mice", PHOTOS.mouseTop],
    ["audio", "سماعات", "Headsets", PHOTOS.headset],
    ["setups", "سيت أب كامل", "Full setups", PHOTOS.pcDesk],
    ["power", "باور", "Power", PHOTOS.cable],
  ],
  products: [
    ["mechanical-rgb-keyboard", "keyboards", "كيبورد ميكانيكال RGB", "Mechanical RGB Keyboard", PHOTOS.rgbKeyboard, 3450, { isFeatured: true, rating: 4.8, sold90: 212 }],
    ["switch-tester-kit", "keyboards", "طقم سويتشات للتجربة", "Switch Tester Kit", PHOTOS.switches, 690, { sold90: 73 }],
    ["ultralight-wireless-mouse", "mice", "ماوس لاسلكي خفيف", "Ultralight Wireless Mouse", PHOTOS.mouseDesk, 1890, { rating: 4.7, sold90: 164 }],
    ["pro-gaming-headset", "audio", "سماعة جيمنج برو", "Pro Gaming Headset", PHOTOS.headset, 2650, { isFeatured: true, sold90: 98 }],
    ["streamer-desk-bundle", "setups", "باقة مكتب الستريمر", "Streamer Desk Bundle", PHOTOS.editDesk, 9900, { compareAtPrice: 11400, sold90: 22 }],
    ["console-corner-kit", "setups", "باقة ركن الكونسول", "Console Corner Kit", PHOTOS.neonController, 4200, { sold90: 17 }],
    ["glow-controller", "setups", "دراع بإضاءة", "Glow Controller", PHOTOS.glowControllers, 1590, { compareAtPrice: 1790, sold90: 40 }],
    ["fast-power-bank", "power", "باور بانك سريع", "Fast Power Bank", PHOTOS.powerBank, 890, { inStock: false, rating: 4.6, sold90: 140 }],
  ],
});

export const ARENA = libraryTemplate({
  key: ARENA_KEY,
  version: 2,
  name: L("أرينا", "Arena"),
  description: L(
    "أدوات جيمنج بالوضع الداكن: فيلم للمتجر، ماركات، فيديو السيت أب وشروط الضمان. أربع صفحات جاهزة.",
    "Gaming gear in dark mode: a brand film, brands, a shop-the-setup video and warranty terms. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 80,
  palette: ["#0f1117", "#1e2230", "#c6ff4d", "#7c5cff"],
  colors: {
    primary: "#7c5cff",
    secondary: "#1e2230",
    background: "#0f1117",
    foreground: "#eef0f6",
    muted: "#a1a7b8",
    border: "#2a2f3e",
    accent: "#c6ff4d",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن ليفل أب", "About Level Up") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("سيتي ستارز، مدينة نصر، القاهرة.", "City Stars Mall, Nasr City, Cairo."),
        heading: L("اسأل لعيب", "Ask a player"),
      }),
    },
    { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
  ],
  demo: DEMO,
});
