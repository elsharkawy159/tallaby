/**
 * Drive (template 37, car tech and care; Claude Design "Storefront
 * Templates"): cool white paper, a deep navy for type and a bright blue
 * for actions, IBM Plex Sans Arabic throughout and 12px corners. A
 * search-led car shop: popular searches, departments, best/new/top rated,
 * spend tiers with real codes, four promises and drivers' questions.
 * Built from section library designs (`fromLibrary`).
 *
 * The design's "Bought together" block is a product-page section and is
 * left out, as in Volt.
 *
 * Photos: Pexels, each checked by eye (2026-10-20): phone mounts, a start
 * button, seats, cables and keys. No people, no car badges and no product
 * brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DRIVE_KEY = "drive";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DRIVE_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dashMount: pexels(7738878, 900),
  ventMount: pexels(13536013, 900),
  startButton: pexels(32667398, 900),
  leatherSeat: pexels(10196155, 900),
  headrest: pexels(9258341, 900),
  jumperCables: pexels(7568447, 900),
  keys: pexels(842528, 900),
  powerBank: pexels(3921704, 900),
  starsCar: pexels(11716837),
  vintageDash: pexels(3076827, 900),
};

const NAME = L("مشوار كار كير", "Mashwar Car Care");

const header = lib("header-search", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن حامل، شاحن، فرش…", "Search mounts, chargers, covers…"),
    "العروض": L("حوامل", "Mounts"),
    "هدايا": L("شواحن", "Chargers"),
    "إكسسوارات": L("الصالون", "Interior"),
    "توصيل خلال ٤٨ ساعة": L("توصيل خلال ٤٨ ساعة ودليل تركيب مع كل قطعة", "Delivery in 48 hours and a fitting guide with every part"),
  },
  links: { "/products": [undefined, NEW, BEST, search("حامل"), search("شاحن"), search("فرش")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مشوار كار كير. كل الحقوق محفوظة.", "© 2026 Mashwar Car Care. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("عربيتك محتاجة إيه النهارده؟", "What does your car need today?"),
      "اكتب اسم المنتج": L("اسم القطعة أو موديل العربية", "Part name or car model"),
    },
  }),
  lib("categories-ruled", {
    text: { "الأقسام": L("الأقسام", "Departments"), "تسوق بالقسم": L("تسوّق حسب القسم", "Shop by department") },
  }),
  lib("products-tabbed", {
    text: {
      "المتجر": L("المتجر", "Shop"),
      "منتجاتنا": L("السواقين بيطلبوا", "What drivers order"),
      "وصل جديد": L("وصل حديثاً", "New arrivals"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("features-ruled", {
    text: {
      "توصيل سريع": L("دليل تركيب", "Fitting guide"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("فيديو قصير مع كل قطعة، تركّبها بنفسك في دقايق.", "A short video with every part, fit it yourself in minutes."),
      "الدفع عند الاستلام": L("ضمان سنة", "1-year warranty"),
      "أو ادفع بالبطاقة والمحفظة": L("على الشواحن والإلكترونيات، والاستبدال علينا.", "On chargers and electronics; swaps are on us."),
      "استرجاع سهل": L("الدفع عند الاستلام", "Cash on delivery"),
      "١٤ يومًا لتغيّر رأيك": L("أو بالبطاقة والمحفظة وإنستاباي.", "Or by card, wallet and InstaPay."),
      "دعم على واتساب": L("استرجاع ١٤ يوم", "14-day returns"),
      "أشخاص حقيقيون طوال الأسبوع": L("لو القطعة ما ركبتش عربيتك.", "If the part does not fit your car."),
    },
  }),
  lib("faq-columns", {
    as: "driver-questions",
    text: {
      "أسئلة شائعة": L("أسئلة السواقين", "Driver questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("القطعة هتركب عربيتي؟", "Will the part fit my car?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "اكتب الماركة والموديل في ملاحظات الطلب، وهنتأكد قبل الشحن.",
        "Write the make and model in the order notes and we check before shipping.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("الشاحن بيشتغل مع كل الموبايلات؟", "Does the charger work with every phone?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، فيه منفذ USB-C ومنفذ USB-A بشحن سريع.", "Yes, it has fast-charging USB-C and USB-A ports."),
      "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
      "هل التوصيل متاح لكل المحافظات؟": L("ينفع تركّبوها لي؟", "Can you fit it for me?"),
      "نعم، نوصل لكل محافظات مصر.": L("في القاهرة والجيزة أيوه، بموعد على واتساب.", "In Cairo and Giza, yes, booked on WhatsApp."),
      "ما سياسة الاسترجاع؟": L("لو القطعة ما ركبتش؟", "What if the part does not fit?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "رجّعها خلال ١٤ يوم في علبتها وهنرجعلك فلوسك كاملة.",
        "Return it within 14 days in its box for a full refund.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مشوار", "About Mashwar"), L("محل تكنولوجيا وعناية عربيات في الشيخ زايد.", "A car tech and care shop in Sheikh Zayed.")),
  aboutStory(lib, {
    photo: PHOTOS.starsCar,
    alt: L("عربية راكنة تحت سما مليانة نجوم", "A car parked under a starry sky"),
    eyebrow: L("الشيخ زايد", "Sheikh Zayed"),
    title: L("كل مشوار أريح", "Every drive, easier"),
    text: L("بنختار قطع بسيطة بتفرق في كل يوم: حامل ثابت، شحن سريع، ومقعد مريح.", "We pick simple parts that matter every day: a steady mount, fast charging and a comfortable seat."),
    more: L("ومع كل قطعة فيديو تركيب قصير.", "And every part comes with a short fitting video."),
    button: L("تسوق القطع", "Shop parts"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("تكنولوجيا وعناية للعربية.", "Tech and care for your car."),
  categories: [
    ["mounts", "حوامل", "Mounts", PHOTOS.dashMount],
    ["power", "شحن وطاقة", "Charging & power", PHOTOS.powerBank],
    ["interior", "الصالون", "Interior", PHOTOS.leatherSeat],
    ["safety", "أمان وطوارئ", "Safety & emergency", PHOTOS.jumperCables],
    ["extras", "إضافات", "Extras", PHOTOS.keys],
    ["seats", "فرش المقاعد", "Seat covers", PHOTOS.leatherSeat],
    ["lighting", "إضاءة الصالون", "Interior lighting", PHOTOS.starsCar],
    ["classic", "كلاسيك", "Classic cars", PHOTOS.vintageDash],
  ],
  products: [
    ["wireless-charging-mount", "mounts", "حامل بشحن لاسلكي", "Wireless Charging Mount", PHOTOS.dashMount, 990, { isFeatured: true, rating: 4.8, sold90: 240 }],
    ["magnetic-vent-mount", "mounts", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 290, { sold90: 380 }],
    ["car-power-bank", "power", "باور بانك ٢٠ ألف", "20,000 mAh Power Bank", PHOTOS.powerBank, 850, { compareAtPrice: 990, rating: 4.7, sold90: 160 }],
    ["start-button-ring", "power", "حلقة زرار التشغيل", "Start Button Ring", PHOTOS.startButton, 220, { sold90: 90 }],
    ["leather-seat-covers", "seats", "فرش جلد للمقاعد", "Leather Seat Covers", PHOTOS.leatherSeat, 3100, { isFeatured: true, sold90: 70 }],
    ["headrest-cushion", "interior", "مخدة مسند الراس", "Headrest Cushion", PHOTOS.headrest, 360, { sold90: 130 }],
    ["classic-dash-cover", "classic", "غطا تابلوه كلاسيك", "Classic Dash Cover", PHOTOS.vintageDash, 690, { inStock: false, sold90: 22 }],
    ["jumper-cables-3m", "safety", "كابلات اشتراك ٣ متر", "Jumper Cables 3 m", PHOTOS.jumperCables, 420, { rating: 4.9, sold90: 150 }],
    ["key-fob-case", "extras", "جراب مفتاح وميدالية", "Key Fob Case", PHOTOS.keys, 160, { sold90: 210 }],
    ["starlight-roof-kit", "lighting", "إضاءة نجوم للسقف", "Starlight Roof Kit", PHOTOS.starsCar, 2400, { sold90: 46 }],
  ],
});

export const DRIVE = libraryTemplate({
  key: DRIVE_KEY,
  version: 3,
  changelog: "Drive v3: product page",
  name: L("درايف", "Drive"),
  description: L(
    "تكنولوجيا وعناية العربية: بحث الأول، أقسام، أكواد بالمبلغ وأسئلة السواقين. أربع صفحات جاهزة.",
    "Car tech and care: search first, departments, spend-tier codes and driver questions. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 370,
  palette: ["#f5f7fa", "#e8eef6", "#2a6df4", "#0f2340"],
  colors: {
    primary: "#2a6df4",
    secondary: "#e8eef6",
    background: "#f5f7fa",
    foreground: "#0f2340",
    muted: "#52617a",
    border: "#d9e1ec",
    accent: "#cfe0ff",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مشوار", "About"), seo: { title: L("عن مشوار", "About Mashwar") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("مول زايد ديونز، الشيخ زايد.", "Zayed Dunes Mall, Sheikh Zayed."),
        heading: L("اسأل قبل ما تطلب", "Ask before you order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التركيب والضمان والتوصيل.", "Fitting, warranty and delivery."),
        question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
        answer: L("أي عيب صناعة في الشواحن والإلكترونيات لمدة سنة.", "Any manufacturing fault in chargers and electronics for one year."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء السائقين", "Driver reviews"), related: L("منتجات مشابهة لسيارتك", "Similar for your car") } },
});
