/**
 * Garagy (template 100, car care subscription; Claude Design "Storefront
 * Templates"): cool white paper, a navy ink for type and an indigo for
 * actions, Noto Kufi Arabic throughout and 14px corners. A wash club: a
 * monthly plan, how points work, member tiers, spend your points and help
 * with your plan. Built from section library designs (`fromLibrary`).
 *
 * Rewards have no library designs yet: "How points work" uses the numbered
 * steps (`text-steps`) and "Tier ladder" the spend tiers (`promo-tiers`),
 * with the tiers' points as copy. Plans are booked on WhatsApp; there is no
 * recurring billing or points ledger behind them.
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wash foam on a mirror,
 * a window and a door, microfiber towels, rubber mats, a seat-back
 * organiser, a mirror charm, an action camera, a dashboard mount and a
 * pressure gauge. No people, no hands, no car badges and no product brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const GARAGY_KEY = "garagy";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GARAGY_KEY, getDesign(id)!, { corners: 14, ...patch });

const BEST = "/products?sort=popularity";

const PHOTOS = {
  mirrorFoam: pexels(4870737),
  windowFoam: pexels(4870739, 900),
  doorFoam: pexels(4870724, 900),
  towels: pexels(20051443, 900),
  towelsWide: pexels(20051443),
  floorMat: pexels(28055130, 900),
  organizer: pexels(30563011, 900),
  turboCharm: pexels(31352892, 900),
  camera: pexels(2294894, 900),
  dashMount: pexels(7738878, 900),
  gauge: pexels(39649976, 900),
};

const NAME = L("نادي جراجي", "Garagy Club");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("الأعضاء بياخدوا نقط على كل غسلة", "Members earn points on every wash"),
    "الكود: SAVE10": L("أول غسلة ببلاش", "First wash free"),
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "العروض": L("اصرف نقطك", "Spend points"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("غسلة كل شهر، فحص كل سنة، ونقط على كل زيارة.", "A monthly wash, a yearly check, and points on every visit."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نادي جراجي. كل الحقوق محفوظة.", "© 2026 Garagy Club. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.mirrorFoam],
    text: {
      "كوليكشن الموسم": L("نادي جراجي", "Garagy Club"),
      "صوت أنقى، كل يوم": L("عربيتك متشافة كل شهر", "Your car, looked after every month"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "غسلة كل شهر على بابك، فحص كل سنة، ونقط تصرفها على الإكسسوارات.",
        "A monthly wash at your door, a yearly check, and points you spend on accessories.",
      ),
      "تسوق الآن": L("اشترك دلوقتي", "Join now"),
      "العروض": L("اصرف نقطك", "Spend your points"),
      "صورة الحملة": L("رغوة غسيل على مراية عربية", "Wash foam on a car mirror"),
    },
    links: { "/products": ["/contact", BEST] },
  }),
  lib("service-plans", {
    text: {
      "الضمان": L("الباقات", "Plans"),
      "احمي جهازك أكتر": L("اختار باقة", "Pick a plan"),
      "سنة": L("أساسي", "Basic"),
      "١٩٩ ج.م": L("٢٥٠ ج.م في الشهر", "EGP 250 a month"),
      "إصلاح الأعطال": L("غسيل خارجي على بابك", "Exterior wash at your door"),
      "فني في البيت": L("نقط على كل غسلة", "Points on every wash"),
      "سنتين": L("بلس", "Plus"),
      "٣٤٩ ج.م": L("٤٥٠ ج.م في الشهر", "EGP 450 a month"),
      "جهاز بديل وقت الصيانة": L("غسلتين وشفط داخلي ونقط مضاعفة", "Two washes, interior vacuum and double points"),
      "٣ سنين": L("برو", "Pro"),
      "٤٧٩ ج.م": L("٧٥٠ ج.م في الشهر", "EGP 750 a month"),
      "كل مزايا السنتين": L("كل مزايا بلس", "Everything in Plus"),
      "كسر الشاشة مرة واحدة": L("غسلة كل أسبوع وفحص سنوي", "A weekly wash and a yearly check"),
    },
  }),
  lib("text-steps", {
    name: L("النقط بتشتغل إزاي", "How points work"),
    text: {
      "إزاي ترجّع منتج": L("كل غسلة بتكسّبك", "Every wash earns"),
      "ابعتلنا على واتساب": L("٥٠ نقطة كل غسلة", "50 points a wash"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("بتتضاف بعد كل زيارة.", "Added after each visit."),
      "جهّز المنتج": L("٥٠٠ نقطة بـ ٥٠ جنيه", "500 points = EGP 50"),
      "في علبته الأصلية بكل الإكسسوارات.": L("خصم على أي إكسسوار في المتجر.", "Off any accessory in the shop."),
      "المندوب يستلم": L("هات صاحبك", "Bring a friend"),
      "خلال يومين شغل من عنوانك.": L("٢٠٠ نقطة ليك و٢٠٠ ليه.", "200 points for each of you."),
      "فلوسك ترجع": L("اطلع درجة", "Move up a tier"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("كل ما نقطك تزيد، الغسلة بتكسّبك أكتر.", "The more points you hold, the more each wash earns."),
    },
  }),
  lib("promo-tiers", {
    name: L("درجات العضوية", "Member tiers"),
    text: {
      "عرض الشهر": L("درجات العضوية", "Member tiers"),
      "كل ما تزود، توفّر أكتر": L("فضي، ذهبي، بلاك", "Silver, Gold, Black"),
      "لما تشتري بـ": L("من", "From"),
      "١٠٠٠ ج.م": L("٠ نقطة", "0 pts"),
      "١٠٠ ج.م": L("فضي", "Silver"),
      "خصم على الفاتورة": L("نقط أكتر على كل غسلة كل ما تطلع", "More points per wash as you go up"),
      "الأكثر استخدامًا": L("إنت هنا: ١٨٠٠ نقطة", "You are here: 1,800 pts"),
      "٢٠٠٠ ج.م": L("١٥٠٠ نقطة", "1,500 pts"),
      "٢٥٠ ج.م": L("ذهبي", "Gold"),
      "٣٥٠٠ ج.م": L("٤٠٠٠ نقطة", "4,000 pts"),
      "٥٠٠ ج.م": L("بلاك", "Black"),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("اصرف نقطك", "Spend your points"),
      "أحدث المنتجات اللي نزلت المتجر.": L("كل ٥٠٠ نقطة بخصم ٥٠ جنيه على أي حاجة هنا.", "Every 500 points takes EGP 50 off anything here."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("service-support", {
    text: {
      "محتاج مساعدة؟": L("أسئلة عن باقتك؟", "Questions about your plan?"),
      "زور فرع": L("زورنا", "Visit us"),
      "٣ فروع في القاهرة": L("مدينة نصر والشيخ زايد", "Nasr City and Sheikh Zayed"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نادي جراجي", "About Garagy Club"), L("غسلة كل شهر، فحص كل سنة، ونقط على كل زيارة.", "A monthly wash, a yearly check, and points on every visit.")),
  aboutStory(lib, {
    photo: PHOTOS.towelsWide,
    alt: L("فوط مايكروفايبر ملونة على ترولي الغسيل", "Colourful microfiber towels on a wash trolley"),
    eyebrow: L("على بابك", "At your door"),
    title: L("نادي لعربيتك", "A club for your car"),
    text: L("فريق غسيل بيجيلك في المعاد، بمية قليلة وفوط مايكروفايبر نضيفة لكل عربية.", "A wash team comes on time, with little water and clean microfiber towels for every car."),
    more: L("وكل غسلة بتكسّبك نقط تصرفها على الإكسسوارات من المتجر.", "And every wash earns points you spend on accessories in the shop."),
    button: L("اصرف نقطك", "Spend your points"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("غسلة كل شهر، فحص كل سنة، ونقط على كل زيارة.", "A monthly wash, a yearly check, and points on every visit."),
  categories: [
    ["care", "عناية", "Care", PHOTOS.towels],
    ["interior", "الصالون", "Interior", PHOTOS.organizer],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
  ],
  products: [
    ["microfiber-towel-set", "care", "طقم فوط مايكروفايبر", "Microfiber Towel Set", PHOTOS.towels, 420, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["snow-foam-wash", "care", "رغوة غسيل سنو فوم", "Snow Foam Wash", PHOTOS.windowFoam, 380, { sold90: 150 }],
    ["wax-car-shampoo", "care", "شامبو عربيات بالشمع", "Wax Car Shampoo", PHOTOS.doorFoam, 290, { compareAtPrice: 340, sold90: 180 }],
    ["rubber-floor-mats", "interior", "دواسات كاوتش", "Rubber Floor Mats", PHOTOS.floorMat, 950, { rating: 4.7, sold90: 96 }],
    ["seat-back-organizer", "interior", "منظم ظهر الكرسي", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 64 }],
    ["turbo-mirror-charm", "interior", "تعليقة تيربو للمراية", "Turbo Mirror Charm", PHOTOS.turboCharm, 180, { sold90: 72 }],
    ["dash-camera", "tech", "كاميرا تابلوه", "Dash Camera", PHOTOS.camera, 2400, { isFeatured: true, sold90: 40 }],
    ["dashboard-phone-mount", "tech", "حامل موبايل للتابلوه", "Dashboard Phone Mount", PHOTOS.dashMount, 450, { sold90: 130 }],
    ["tyre-pressure-gauge", "tech", "عداد ضغط الكاوتش", "Tyre Pressure Gauge", PHOTOS.gauge, 320, { inStock: false, sold90: 30 }],
  ],
});

export const GARAGY = libraryTemplate({
  key: GARAGY_KEY,
  version: 1,
  name: L("جراجي", "Garagy"),
  description: L(
    "اشتراك عناية العربية: باقات شهرية، النقط ودرجات العضوية، اصرف نقطك والدعم. أربع صفحات جاهزة.",
    "Car care subscription: monthly plans, points and member tiers, spend your points and support. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 1000,
  palette: ["#f6f7fb", "#e6e9f3", "#c7d2fe", "#4338ca"],
  colors: {
    primary: "#4338ca",
    secondary: "#e6e9f3",
    background: "#f6f7fb",
    foreground: "#121a33",
    muted: "#515a76",
    border: "#d3d8e8",
    accent: "#c7d2fe",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نادي جراجي", "About"), seo: { title: L("عن نادي جراجي", "About Garagy Club") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("مدينة نصر والشيخ زايد.", "Nasr City and Sheikh Zayed."),
        heading: L("اشترك أو اسأل عن باقتك", "Join or ask about your plan"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الباقات والنقط والمواعيد.", "Plans, points and booking."),
        question: L("أقدر أوقف الاشتراك؟", "Can I pause my plan?"),
        answer: L("أيوه، ابعتلنا على واتساب قبل معاد الغسلة الجاية بيومين.", "Yes, message us on WhatsApp two days before your next wash."),
      }),
    },
  ],
  demo: DEMO,
});
