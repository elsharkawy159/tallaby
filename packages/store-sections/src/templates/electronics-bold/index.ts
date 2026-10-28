/**
 * Electronics Bold (2026-10-28, electronics niche, bold / high energy): white
 * paper, near-black ink, an electric indigo and a lime spark, Changa
 * headings over Cairo, round 20px corners and a 1320px container. A loud,
 * gamer-friendly gadget store: a scrolling ticker header, a three-slide hero
 * carousel of desk setups, categories as huge type, best sellers in tall
 * cards, the "how we test" panel, four category rows with rounded photos, a
 * big newsletter panel and the help footer (WhatsApp, call, track order). Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): dark,
 * saturated product shots only, no people, no readable brand logos, none used
 * twice. Hero slides 30393928, 9128854, 4499765; about 3184451, about page 9984695; tiles
 * 6867267, 12955830, 19983034, 13094372, 39076654, 37330646; products as
 * listed in `DEMO`. Swapped for a readable logo: speakers 191877 (Genius),
 * 1714206 (Edifier) and 34241691 (Yandex) for 6800754, 34241799 and
 * 14017572; keyboards 17895080 and 9785238 for 34704932 and 27568671;
 * cameras 30872554 (Canon) and 3497060 (Fujifilm) for 19522697 and 19969436.
 * Browser QA swaps: hero slide 5366225 (name sign, poster) for 9128854;
 * cameras 19522697 (lettering) and 19969436 (near black) for 23614245 and
 * 19841137; chargers 32710069 (lettering) and 5083410 (same shoot as
 * 5083490) for 4097201 and 7742588; speaker 18542239 (same shoot as
 * 18542244) for 4790255. Re-check swaps: hero slide 1 5618615 (monitor and
 * box brands) for 30393928; same-shoot cable 4219866 for 28042833.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const ELECTRONICS_BOLD_KEY = "electronics-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ELECTRONICS_BOLD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201093327416";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideDualScreen: pexels(30393928, 1920),
  slideNeonDesk: pexels(9128854, 1920),
  slideDarkDesk: pexels(4499765, 1920),
  flatLay: pexels(3184451, 1200),
  keyboardFlatLay: pexels(9984695, 1200),
  // Category photos.
  catHeadphones: pexels(6867267, 1200),
  catSpeakers: pexels(12955830, 1200),
  catPhone: pexels(19983034, 1200),
  catComputers: pexels(13094372, 1200),
  catWatches: pexels(39076654, 1200),
  catCameras: pexels(37330646, 1200),
};

const NAME = L("شحنة", "Shohna");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر خلال ٣ أيام", "Delivery across Egypt in 3 days"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام أو بالتقسيط", "Pay on delivery or in instalments"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order from My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الجادجتس", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن شحنة", "About"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-help", {
  text: {
    "واتساب": L("واتساب", "WhatsApp"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١٠٩ ٣٣٢ ٧٤١٦"), "+20 109 332 7416"),
    "اتصل": L("اتصل بينا", "Call us"),
    "تتبع طلبك": L("تتبّع طلبك", "Track your order"),
    "برقم الطلب": L("من صفحة طلباتي", "From My orders"),
    "اسم متجرك": NAME,
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الجادجتس", "All gadgets"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "من نحن": L("عن شحنة", "About Shohna"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شحنة. كل الحقوق محفوظة.", "© 2026 Shohna. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": WHATSAPP,
    "tel:+201001234567": "tel:+201093327416",
    "/contact": "/profile/orders",
    "/products": [SHOP, NEW, BEST, RATED],
  },
  nodes: { "شريط المساعدة": { style: { maxWidth: "1320px", radius: 20 } } },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideDualScreen, PHOTOS.slideNeonDesk, PHOTOS.slideDarkDesk],
    nodes: { "التظليل": { style: { opacity: 100 } } },
    text: {
      "صورة الحملة الأولى": L("كيبورد مضيء بإضاءة زرقا وحمرا", "A backlit keyboard in blue and red light"),
      "وصل حديثًا": L("وصل حديثًا", "Just landed"),
      "الموسم الجديد وصل": L("سيت أب أقوى بسعر معقول", "Level up your setup"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("كيبوردات وماوسات وسماعات أصلية، توصلك خلال ٣ أيام.", "Genuine gear, at your door in 3 days."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("كيبورد وماوس على مكتب بإضاءة بنفسجي", "A keyboard and mouse on a desk in purple light"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("اللي الكل بيسأل عليه", "Everyone’s favourites"),
      "القطع اللي بترجع لها كل مرة.": L("السماعات والشواحن اللي بتخلص كل أسبوع.", "The gear that sells out every week."),
      "شوف الأكثر مبيعًا": L("شوف الأكثر مبيعًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("مكتب غامق بشاشة وكيبورد مضيء", "A dark desk with a monitor and a glowing keyboard"),
      "عروض الأسبوع": L("الركن بتاعك", "Your corner"),
      "خصومات لفترة محدودة": L("كمّل الديسك في طلب واحد", "Your desk, in one order"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كيبورد، ماوس، سماعة وشاحن بيمشوا مع بعض.", "A keyboard, mouse, headset and charger that match."),
      "تسوّق العروض": L("تسوّق كل الجادجتس", "Shop every gadget"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-big-type", { text: { "منتج": L("منتجات", "items") } }),
  lib("products-rail", {
    text: {
      "بيحبوها": L("الأكثر مبيعًا الشهر ده", "This month’s best sellers"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "عرض الكل": L("عرض الكل", "View all"),
    },
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.flatLay],
    text: {
      "إزاي بنشتغل": L("إزاي بنختبر", "How we test"),
      "كل منتج بيتراجع قبل ما يوصلك": L("كل جهاز بيتشحن ويتجرب قبل ما يتغلف", "Every device is charged and tested before it’s packed"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "+٢٥٠٠٠ طلب وصل لحد دلوقتي. بنفتح كل علبة، نشحن الجهاز ونجرب البلوتوث والزراير، وبعدين نغلفه تاني بختم شحنة.",
        "25,000+ orders delivered so far. We open every box, charge the device, test the Bluetooth and buttons, then reseal it with the Shohna seal.",
      ),
      "اعرف أكتر": L("اعرف حكايتنا", "Our story"),
      "صورة المتجر": L("تابلت وماوس وساعة ذكية وموبايل مترتبين على مكتب", "A tablet, mouse, smartwatch and phone laid out on a desk"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    muted: [2, 4],
    nodes: { "صورة المنتج": { style: { radius: 20 } } },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("أول واحد يعرف اللي نازل", "Be first to know what drops"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("إيميل واحد في الأسبوع بالجادجتس الجديدة ومراجعات سريعة.", "One email a week with new gadgets and quick reviews."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شحنة", "About Shohna"), L("جادجتس أصلية بأسعار معقولة، من مدينة نصر.", "Genuine gadgets at fair prices, from Nasr City.")),
  aboutStory(lib, {
    photo: PHOTOS.keyboardFlatLay,
    alt: L("موبايل وباور بانك وسماعات وساعة فوق كيبورد", "A phone, power bank, earbuds and watch laid on a keyboard"),
    eyebrow: L("من ٢٠٢٠", "Since 2020"),
    title: L("بدأنا بكابل واحد", "We started with one cable"),
    text: L(
      "بدأنا نبيع كابلات شحن من أوضة في مدينة نصر، لأننا زهقنا من الكابلات اللي بتبوظ بعد شهر. النهارده عندنا أكتر من ٤٠٠ منتج.",
      "We started selling charging cables from a room in Nasr City because we were sick of cables that die after a month. Today we stock more than 400 products.",
    ),
    more: L("لسه بنجرب كل حاجة بنفسنا، وكل جهاز عليه ضمان سنة واستبدال خلال ١٤ يوم.", "We still test everything ourselves, and every device has a one-year warranty and a 14-day exchange."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("جادجتس أصلية بأسعار معقولة، بتوصلك خلال ٣ أيام.", "Genuine gadgets at fair prices, delivered within 3 days."),
  categories: [
    ["headphones", "السماعات", "Headphones", PHOTOS.catHeadphones],
    ["speakers", "السبيكرات", "Speakers", PHOTOS.catSpeakers],
    ["phone-accessories", "الشواحن والكابلات", "Chargers & cables", PHOTOS.catPhone],
    ["computers", "الكيبورد والماوس", "Keyboards & mice", PHOTOS.catComputers],
    ["smartwatches", "الساعات الذكية", "Smartwatches", PHOTOS.catWatches],
    ["cameras", "الكاميرات", "Cameras", PHOTOS.catCameras],
  ],
  products: [
    // Headphones
    ["volt-studio-blue", "headphones", "سماعة ستوديو أزرق كهربائي", "Volt Studio Headphones, Electric Blue", P(11398246), 1890, { isFeatured: true, rating: 4.8, sold90: 240 }],
    ["pro-monitor-orange", "headphones", "سماعة مونيتور برو", "Pro Monitor Headphones", P(20385204), 2650, { rating: 4.9, sold90: 88 }],
    ["racing-red-wireless", "headphones", "سماعة لاسلكية أحمر ريسينج", "Wireless Headphones, Racing Red", P(12920900), 1450, { compareAtPrice: 1750, rating: 4.6, sold90: 121 }],
    ["metal-cup-wired", "headphones", "سماعة سلك بكبايات معدن", "Wired Metal-Cup Headphones, White", P(7054718), 690, { rating: 4.5, sold90: 156 }],
    ["violet-studio-hang", "headphones", "سماعة ستوديو بنفسجي", "Studio Headphones, Violet", P(8132514), 2290, { rating: 4.7, sold90: 47 }],
    ["true-wireless-black", "headphones", "إيربودز لاسلكي أسود", "True Wireless Earbuds, Black", P(3585797), 990, { rating: 4.6, sold90: 230 }],
    ["glow-case-earbuds", "headphones", "إيربودز بعلبة مضيئة", "Earbuds with Glow Case", P(33936400), 1350, { rating: 4.7, sold90: 96 }],
    ["white-case-earbuds", "headphones", "إيربودز بعلبة شحن بيضا", "Earbuds with Charging Case, White", P(7424282), 1190, { rating: 4.5, sold90: 74, inStock: false }],
    // Speakers
    ["camo-waterproof-speaker", "speakers", "سبيكر كاموفلاج ضد الماية", "Camo Waterproof Bluetooth Speaker", P(33693664), 1290, { rating: 4.7, sold90: 205 }],
    ["red-clip-speaker", "speakers", "سبيكر أحمر بمشبك", "Clip-On Outdoor Speaker, Red", P(3779780), 850, { rating: 4.6, sold90: 105 }],
    ["dot-smart-charcoal", "speakers", "سبيكر دوت ذكي فحمي", "Dot Smart Speaker, Charcoal", P(14309806), 1950, { compareAtPrice: 2250, rating: 4.8, sold90: 61 }],
    ["halo-ring-speaker", "speakers", "سبيكر هالو بحلقة ضوء", "Halo Ring Speaker", P(6800754), 1650, { rating: 4.7, sold90: 39 }],
    ["stripe-pocket-speaker", "speakers", "سبيكر جيب مقلّم", "Stripe Pocket Speaker", P(34241799), 990, { rating: 4.8, sold90: 93 }],
    ["rugged-touch-speaker", "speakers", "سبيكر رجيد بلمس", "Rugged Touch-Control Speaker", P(18542244), 1750, { rating: 4.6, sold90: 52 }],
    ["clock-smart-speaker", "speakers", "سبيكر ذكي بساعة", "Clock Smart Speaker", P(4790255), 1650, { rating: 4.5, sold90: 31 }],
    ["cube-desk-speaker", "speakers", "سبيكر مكتب كيوب", "Cube Desk Speaker", P(14017572), 1190, { rating: 4.4, sold90: 28 }],
    // Chargers & cables
    ["red-braided-usb", "phone-accessories", "كابل USB مضفر أحمر", "Red Braided USB Cable", P(6081231), 149, { rating: 4.7, sold90: 160 }],
    ["fast-usb-orange", "phone-accessories", "كابل USB سريع برتقالي", "Fast USB Cable, Orange", P(4219867), 129, { rating: 4.6, sold90: 150 }],
    ["clear-blue-usb", "phone-accessories", "كابل USB شفاف أزرق", "Transparent Blue USB Cable", P(7688795), 139, { rating: 4.5, sold90: 120 }],
    ["black-usb-cable", "phone-accessories", "كابل USB أسود", "Black USB Cable", P(6726749), 99, { rating: 4.4, sold90: 110 }],
    ["flat-wireless-charger", "phone-accessories", "شاحن لاسلكي فلات", "Flat Wireless Charger", P(5083490), 590, { isFeatured: true, compareAtPrice: 690, rating: 4.8, sold90: 190 }],
    ["desk-charging-pad", "phone-accessories", "شاحن لاسلكي للمكتب", "Desk Wireless Charging Pad", P(7742588), 620, { rating: 4.6, sold90: 98 }],
    ["glow-usb-cable", "phone-accessories", "كابل USB بإضاءة", "Glow USB Cable", P(28042833), 119, { rating: 4.3, sold90: 77 }],
    ["usb-c-wall-charger", "phone-accessories", "شاحن حيطة USB-C سريع", "Fast USB-C Wall Charger", P(4097201), 450, { rating: 4.9, sold90: 210 }],
    // Keyboards & mice
    ["rgb-keyboard-blue", "computers", "كيبورد جيمنج RGB أزرق", "RGB Gaming Keyboard, Blue Glow", P(28842075), 2450, { isFeatured: true, rating: 4.8, sold90: 220 }],
    ["rgb-keyboard-purple", "computers", "كيبورد جيمنج RGB بنفسجي", "RGB Gaming Keyboard, Purple", P(7862496), 1950, { rating: 4.7, sold90: 66 }],
    ["backlit-keyboard-red", "computers", "كيبورد جيمنج بإضاءة حمرا", "Backlit Gaming Keyboard, Red", P(841228), 1650, { compareAtPrice: 1890, rating: 4.6, sold90: 58 }],
    ["neon-gaming-mouse", "computers", "ماوس جيمنج نيون", "Neon Gaming Mouse", P(34704932), 1250, { rating: 4.8, sold90: 92 }],
    ["red-mech-keyboard", "computers", "كيبورد ميكانيكال بإضاءة حمرا", "Mechanical Keyboard, Red Backlight", P(4792732), 2190, { rating: 4.7, sold90: 49 }],
    ["wireless-gaming-mouse", "computers", "ماوس جيمنج لاسلكي", "Wireless Gaming Mouse", P(18295023), 1590, { rating: 4.9, sold90: 200 }],
    ["midnight-office-mouse", "computers", "ماوس مكتب ميدنايت", "Office Mouse, Midnight", P(5931186), 290, { rating: 4.5, sold90: 140 }],
    ["duo-compact-keyboards", "computers", "طقم كيبوردين ٧٥٪ بزراير ملونة", "75% Keyboard Pair, Colour Keys", P(27568671), 2750, { rating: 4.8, sold90: 37 }],
    // Smartwatches
    ["fit-watch-red", "smartwatches", "ساعة فيتنس بحزام أحمر", "Fitness Watch, Red Sport Band", P(18259150), 2900, { rating: 4.7, sold90: 195 }],
    ["sport-watch-trio", "smartwatches", "ساعة رياضية حمرا", "Sport Watch, Red", P(37735294), 2450, { rating: 4.6, sold90: 41 }],
    ["amber-black-watch", "smartwatches", "ساعة ذكية سودا وعنبري", "Smartwatch, Black and Amber", P(31541678), 3400, { compareAtPrice: 3900, rating: 4.8, sold90: 55 }],
    ["black-glass-watch", "smartwatches", "ساعة ذكية زجاج أسود", "Smartwatch, Black Glass", P(437038), 3900, { rating: 4.5, sold90: 22 }],
    // Cameras
    ["mirrorless-20-60", "cameras", "كاميرا ميرورلس بعدسة ٢٠-٦٠", "Mirrorless Camera with 20-60mm Lens", P(11600738), 38500, { rating: 4.9, sold90: 9 }],
    ["pocket-action-camera", "cameras", "كاميرا أكشن صغيرة", "Pocket Action Camera", P(23614245), 9900, { rating: 4.8, sold90: 6 }],
    ["prime-lens-50", "cameras", "عدسة ميرورلس ٥٠ مم", "50mm Mirrorless Lens", P(19841137), 8900, { rating: 4.6, sold90: 14 }],
    ["action-360-camera", "cameras", "كاميرا أكشن ٣٦٠ ضد الرذاذ", "360 Action Camera, Splash-Proof", P(19297707), 6900, { rating: 4.4, sold90: 18 }],
  ],
});

export const ELECTRONICS_BOLD = libraryTemplate({
  key: ELECTRONICS_BOLD_KEY,
  version: 1,
  name: L("شحنة", "Shohna"),
  description: L(
    "جادجتس بطاقة عالية: سلايدر بثلاث صور، أقسام بخط ضخم وأربع صفوف منتجات. لمتاجر الإكسسوارات والجيمنج اللي عايزة بيع سريع.",
    "High-energy gadgets: a three-slide hero, categories in huge type and four product rows. For accessory and gaming stores that want fast sales.",
  ),
  category: "electronics",
  sortOrder: 1270,
  palette: ["#ffffff", "#eef0ff", "#3b2bd9", "#c6ff3d"],
  colors: {
    primary: "#3b2bd9",
    secondary: "#eef0ff",
    background: "#ffffff",
    foreground: "#0d0d14",
    muted: "#545767",
    border: "#dfe1f2",
    accent: "#c6ff3d",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 20,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شحنة", "About"), seo: { title: L("عن شحنة", "About Shohna") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L(`٤٨ شارع عباس العقاد، مدينة نصر، القاهرة، ${phone("٠١٠٩ ٣٣٢ ٧٤١٦")}، ${handle("hello@shohna.eg")}`, "48 Abbas El Akkad St, Nasr City, Cairo · +20 109 332 7416 · hello@shohna.eg"),
        heading: L("مش عارف الشاحن ده ينفع موبايلك؟ اسألنا", "Not sure a charger fits your phone? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والتقسيط.", "Warranty, delivery and instalments."),
        question: L("المنتجات أصلية؟", "Are the products genuine?"),
        answer: L(
          "أيوه، كل منتج أصلي ومعاه فاتورة وضمان سنة. ولو الجهاز وصلك فيه أي مشكلة، بنبدله خلال ١٤ يوم من غير أسئلة.",
          "Yes. Every product is genuine, with an invoice and a one-year warranty. If a device arrives with any problem, we swap it within 14 days, no questions asked.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("رأي اللي جربوه", "From people who tried it"), related: L("يمشي معاه", "Goes well with") },
  },
});
