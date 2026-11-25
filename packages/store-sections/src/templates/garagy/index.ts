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
    "تشكيلة الموسم الجديد وصلت": L("منتجات عناية وإكسسوارات للسيارات", "Car care products and accessories"),
    "الدفع عند الاستلام": L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
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
    "مختارات بعناية لكل يوم.": L("منتجات عناية وإكسسوارات لسيارتك.", "Care products and accessories for your car."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نادي جراجي. كل الحقوق محفوظة.", "© 2026 Garagy Club. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.mirrorFoam],
    text: {
      "مجموعة الموسم": L("نادي جراجي", "Garagy Club"),
      "صوت أنقى، كل يوم": L("مستلزمات العناية بالسيارة", "Car care supplies"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "منتجات غسيل وتلميع وإكسسوارات للسيارة.",
        "Wash and polish products and car accessories.",
      ),
      "تسوق الآن": L("تواصل معنا", "Contact us"),
      "العروض": L("الأكثر طلبًا", "Most ordered"),
      "صورة الحملة": L("رغوة غسيل على مرآة سيارة", "Wash foam on a car mirror"),
    },
    links: { "/products": ["/contact", BEST] },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("ما الذي تحتاجه سيارتك؟", "What does your car need?") } }),
  // v4 (2026-11-25, owner): the store's 1st category as a carousel right under the categories.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("service-plans", {
    text: {
      "الضمان": L("الأطقم", "Kits"),
      "احمِ جهازك لمدة أطول": L("اختر طقم العناية", "Choose a care kit"),
      "سنة": L("أساسي", "Basic"),
      "١٩٩ ج.م": L("٢٥٠ ج.م", "EGP 250"),
      "إصلاح الأعطال": L("شامبو بالشمع", "Wax shampoo"),
      "زيارة فني منزلية": L("مناشف ألياف دقيقة", "Microfiber towels"),
      "سنتان": L("متقدم", "Plus"),
      "٣٤٩ ج.م": L("٤٥٠ ج.م", "EGP 450"),
      "جهاز بديل وقت الصيانة": L("رغوة غسيل وشامبو ومناشف", "Snow foam, shampoo and towels"),
      "٣ سنوات": L("احترافي", "Pro"),
      "٤٧٩ ج.م": L("٧٥٠ ج.م", "EGP 750"),
      "كل مزايا السنتين": L("كل محتويات الطقم المتقدم", "Everything in the Plus kit"),
      "كسر الشاشة مرة واحدة": L("مع دواسات ومقياس ضغط الإطارات", "With floor mats and a tyre pressure gauge"),
    },
  }),
  lib("text-steps", {
    name: L("كيف تطلب", "How to order"),
    text: {
      "كيف ترجع منتجًا": L("كيف تطلب", "How to order"),
      "راسلنا على واتساب": L("اختر منتجاتك", "Choose your products"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("تصفّح الأقسام واقرأ مواصفات كل منتج.", "Browse the categories and read each product's specs."),
      "جهّز المنتج": L("أضف إلى السلة", "Add to cart"),
      "في علبته الأصلية بكل الإكسسوارات.": L("اختر النوع والكمية المناسبة.", "Pick the type and quantity you need."),
      "يستلمه المندوب": L("أكمل الطلب", "Place your order"),
      "من عنوانك خلال يومي عمل.": L("أكمل طلبك من هاتفك في خطوات قليلة.", "Order from your phone in a few steps."),
      "استرداد المبلغ": L("استلم طلبك", "Receive your order"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("تظهر طرق الدفع والشحن عند إتمام الطلب.", "Payment and shipping options are shown at checkout."),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر طلبًا", "Most ordered"),
      "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The store's most ordered products."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("service-support", {
    text: {
      "هل تحتاج إلى مساعدة؟": L("لديك سؤال عن منتج؟", "A question about a product?"),
      "زُر أحد فروعنا": L("تواصل معنا", "Contact us"),
      "٣ فروع في القاهرة": L("لأي سؤال عن منتج أو طلب", "For any product or order question"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نادي جراجي", "About Garagy Club"), L("منتجات عناية وإكسسوارات لسيارتك.", "Care products and accessories for your car.")),
  aboutStory(lib, {
    photo: PHOTOS.towelsWide,
    alt: L("مناشف ألياف دقيقة ملونة على عربة الغسيل", "Colourful microfiber towels on a wash trolley"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("عناية بسيارتك", "Care for your car"),
    text: L("منتجات غسيل وتلميع ومناشف ألياف دقيقة وإكسسوارات لداخل السيارة.", "Wash and polish products, microfiber towels and interior accessories."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("الأكثر طلبًا", "Most ordered"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("منتجات عناية وإكسسوارات لسيارتك.", "Care products and accessories for your car."),
  categories: [
    // v4: wash first, so the category carousel (the 1st category) shows a full row.
    ["wash", "غسيل", "Wash", PHOTOS.windowFoam],
    ["care", "عناية", "Care", PHOTOS.towels],
    ["interior", "داخل السيارة", "Interior", PHOTOS.organizer],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
    ["mats", "دواسات", "Floor mats", PHOTOS.floorMat],
    ["charms", "معلّقات المرآة", "Mirror charms", PHOTOS.turboCharm],
    ["mounts", "حوامل", "Mounts", PHOTOS.dashMount],
    ["gauges", "عدادات", "Gauges", PHOTOS.gauge],
  ],
  products: [
    ["microfiber-towel-set", "care", "طقم مناشف ألياف دقيقة", "Microfiber Towel Set", PHOTOS.towels, 420, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["snow-foam-wash", "wash", "رغوة غسيل كثيفة", "Snow Foam Wash", PHOTOS.windowFoam, 380, { sold90: 150 }],
    ["wax-car-shampoo", "wash", "شامبو سيارات بالشمع", "Wax Car Shampoo", PHOTOS.doorFoam, 290, { compareAtPrice: 340, sold90: 180 }],
    ["glass-foam-cleaner", "wash", "منظف زجاج رغوي", "Foaming Glass Cleaner", PHOTOS.mirrorFoam, 180, { sold90: 92 }],
    ["drying-towels-pair", "wash", "منشفتا تجفيف", "Drying Towels, Pair", PHOTOS.towels, 260, { sold90: 70 }],
    ["rubber-floor-mats", "mats", "دواسات مطاط", "Rubber Floor Mats", PHOTOS.floorMat, 950, { rating: 4.7, sold90: 96 }],
    ["seat-back-organizer", "interior", "منظم لظهر المقعد", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 64 }],
    ["turbo-mirror-charm", "charms", "معلّقة تيربو للمرآة", "Turbo Mirror Charm", PHOTOS.turboCharm, 180, { sold90: 72 }],
    ["dash-camera", "tech", "كاميرا للوحة القيادة", "Dash Camera", PHOTOS.camera, 2400, { isFeatured: true, sold90: 40 }],
    ["dashboard-phone-mount", "mounts", "حامل هاتف للوحة القيادة", "Dashboard Phone Mount", PHOTOS.dashMount, 450, { sold90: 130 }],
    ["tyre-pressure-gauge", "gauges", "مقياس ضغط الإطارات", "Tyre Pressure Gauge", PHOTOS.gauge, 320, { inStock: false, sold90: 30 }],
  ],
});

export const GARAGY = libraryTemplate({
  key: GARAGY_KEY,
  version: 4,
  changelog: "Garagy v4: products by category as a carousel on the home",
  productPage: { thumbs: "side", band: "paper", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("منتجات أخرى لسيارتك", "More for your car") } },
  name: L("جراجي", "Garagy"),
  description: L(
    "اشتراك عناية السيارة: باقات شهرية، خطوات الغسيل والدعم. أربع صفحات جاهزة.",
    "Car care subscription: monthly plans, how a wash works and support. Four ready pages.",
  ),
  category: "auto",
  style: ["minimal"],
  sortOrder: 1000,
  palette: ["#f6f7fb", "#e6e9f3", "#c7d2fe", "#4338ca"],
  colors: {
    primary: "#4338ca",
    secondary: "#e6e9f3",
    background: "#ffffff",
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
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or order."),
        heading: L("اسأل عن منتج أو مقاس", "Ask about a product or size"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المنتجات والطلبات والدفع.", "Products, orders and payment."),
        question: L("كيف أعرف المنتج المناسب لسيارتي؟", "How do I find the right product for my car?"),
        answer: L("راجع صور ومواصفات كل منتج، أو تواصل معنا لأي سؤال.", "Check each product's photos and specs, or contact us with any question."),
      }),
    },
  ],
  demo: DEMO,
});
