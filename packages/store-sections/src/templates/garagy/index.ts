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
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("غسيل في البيت أو الشغل، بمواعيد تناسبك", "Washes at home or work, at times that suit you"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "العروض": L("الإكسسوارات", "Accessories"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("غسلة كل شهر، وفحص كل سنة.", "A monthly wash and a yearly check."),
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
        "غسلة كل شهر على بابك، وفحص كل سنة.",
        "A monthly wash at your door and a yearly check.",
      ),
      "تسوق الآن": L("اشترك دلوقتي", "Join now"),
      "العروض": L("الأكثر طلبًا", "Most ordered"),
      "صورة الحملة": L("رغوة غسيل على مراية عربية", "Wash foam on a car mirror"),
    },
    links: { "/products": ["/contact", BEST] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("عربيتك محتاجة إيه؟", "What does your car need?") } }),
  lib("service-plans", {
    text: {
      "الضمان": L("الباقات", "Plans"),
      "احمي جهازك أكتر": L("اختار باقة", "Pick a plan"),
      "سنة": L("أساسي", "Basic"),
      "١٩٩ ج.م": L("٢٥٠ ج.م في الشهر", "EGP 250 a month"),
      "إصلاح الأعطال": L("غسيل خارجي على بابك", "Exterior wash at your door"),
      "فني في البيت": L("شفط داخلي", "Interior vacuum"),
      "سنتين": L("بلس", "Plus"),
      "٣٤٩ ج.م": L("٤٥٠ ج.م في الشهر", "EGP 450 a month"),
      "جهاز بديل وقت الصيانة": L("غسلتين وشفط داخلي وتلميع", "Two washes, interior vacuum and a polish"),
      "٣ سنين": L("برو", "Pro"),
      "٤٧٩ ج.م": L("٧٥٠ ج.م في الشهر", "EGP 750 a month"),
      "كل مزايا السنتين": L("كل مزايا بلس", "Everything in Plus"),
      "كسر الشاشة مرة واحدة": L("غسلة كل أسبوع وفحص سنوي", "A weekly wash and a yearly check"),
    },
  }),
  lib("text-steps", {
    name: L("الغسلة بتمشي إزاي", "How a wash works"),
    text: {
      "إزاي ترجّع منتج": L("احجز", "Book"),
      "ابعتلنا على واتساب": L("اختار ميعادك", "Pick your slot"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("على واتساب أو من الموقع.", "On WhatsApp or online."),
      "جهّز المنتج": L("بنغسل", "We wash"),
      "في علبته الأصلية بكل الإكسسوارات.": L("غسيل يدوي من جوه وبره.", "A hand wash inside and out."),
      "المندوب يستلم": L("استلم", "Collect"),
      "خلال يومين شغل من عنوانك.": L("عربيتك جاهزة في ساعة.", "Your car is ready in an hour."),
      "فلوسك ترجع": L("ادفع عند الاستلام", "Pay on collection"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("كاش أو محفظة، وقت ما تستلم عربيتك.", "Cash or wallet, when you collect your car."),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر طلبًا", "Most ordered"),
      "أحدث المنتجات اللي نزلت المتجر.": L("اللي بيطلبه السواقين أكتر من غيره.", "What drivers order most."),
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
  pageHeader(lib, "about-header", L("عن نادي جراجي", "About Garagy Club"), L("غسلة كل شهر، وفحص كل سنة.", "A monthly wash and a yearly check.")),
  aboutStory(lib, {
    photo: PHOTOS.towelsWide,
    alt: L("فوط مايكروفايبر ملونة على ترولي الغسيل", "Colourful microfiber towels on a wash trolley"),
    eyebrow: L("على بابك", "At your door"),
    title: L("نادي لعربيتك", "A club for your car"),
    text: L("فريق غسيل بيجيلك في المعاد، بمية قليلة وفوط مايكروفايبر نضيفة لكل عربية.", "A wash team comes on time, with little water and clean microfiber towels for every car."),
    more: L("وكل غسلة بمنتجات آمنة على الدهان.", "And every wash uses paint-safe products."),
    button: L("الأكثر طلبًا", "Most ordered"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("غسلة كل شهر، وفحص كل سنة.", "A monthly wash and a yearly check."),
  categories: [
    ["care", "عناية", "Care", PHOTOS.towels],
    ["interior", "الصالون", "Interior", PHOTOS.organizer],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
    ["wash", "غسيل", "Wash", PHOTOS.windowFoam],
    ["mats", "دواسات", "Floor mats", PHOTOS.floorMat],
    ["charms", "تعاليق", "Mirror charms", PHOTOS.turboCharm],
    ["mounts", "حوامل", "Mounts", PHOTOS.dashMount],
    ["gauges", "عدادات", "Gauges", PHOTOS.gauge],
  ],
  products: [
    ["microfiber-towel-set", "care", "طقم فوط مايكروفايبر", "Microfiber Towel Set", PHOTOS.towels, 420, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["snow-foam-wash", "wash", "رغوة غسيل سنو فوم", "Snow Foam Wash", PHOTOS.windowFoam, 380, { sold90: 150 }],
    ["wax-car-shampoo", "wash", "شامبو عربيات بالشمع", "Wax Car Shampoo", PHOTOS.doorFoam, 290, { compareAtPrice: 340, sold90: 180 }],
    ["rubber-floor-mats", "mats", "دواسات كاوتش", "Rubber Floor Mats", PHOTOS.floorMat, 950, { rating: 4.7, sold90: 96 }],
    ["seat-back-organizer", "interior", "منظم ظهر الكرسي", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 64 }],
    ["turbo-mirror-charm", "charms", "تعليقة تيربو للمراية", "Turbo Mirror Charm", PHOTOS.turboCharm, 180, { sold90: 72 }],
    ["dash-camera", "tech", "كاميرا تابلوه", "Dash Camera", PHOTOS.camera, 2400, { isFeatured: true, sold90: 40 }],
    ["dashboard-phone-mount", "mounts", "حامل موبايل للتابلوه", "Dashboard Phone Mount", PHOTOS.dashMount, 450, { sold90: 130 }],
    ["tyre-pressure-gauge", "gauges", "عداد ضغط الكاوتش", "Tyre Pressure Gauge", PHOTOS.gauge, 320, { inStock: false, sold90: 30 }],
  ],
});

export const GARAGY = libraryTemplate({
  key: GARAGY_KEY,
  version: 3,
  changelog: "Garagy v3: categories after the hero",
  productPage: { thumbs: "side", band: "paper", copy: { reviews: L("رأي أعضاء النادي", "From club members"), related: L("خدمة تانية للعربية", "More services for your car") } },
  name: L("جراجي", "Garagy"),
  description: L(
    "اشتراك عناية العربية: باقات شهرية، الغسلة بتمشي إزاي والدعم. أربع صفحات جاهزة.",
    "Car care subscription: monthly plans, how a wash works and support. Four ready pages.",
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
        text: L("الباقات والمواعيد والدفع.", "Plans, booking and payment."),
        question: L("أقدر أوقف الاشتراك؟", "Can I pause my plan?"),
        answer: L("أيوه، ابعتلنا على واتساب قبل معاد الغسلة الجاية بيومين.", "Yes, message us on WhatsApp two days before your next wash."),
      }),
    },
  ],
  demo: DEMO,
});
