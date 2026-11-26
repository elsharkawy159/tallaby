/**
 * Garage (template 36, car accessories; Claude Design "Storefront
 * Templates"): concrete paper, near-black type and a signal yellow, Changa
 * throughout and tight 4px corners. A bold accessories shop: a winter-kit
 * poster, the aisles, drivers' picks, why Torque, new small upgrades and
 * drivers on WhatsApp. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): phone mounts, seats,
 * a steering wheel, tools, jumper cables and keys. No people, no car
 * badges and no product brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const GARAGE_KEY = "garage";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GARAGE_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  workshop: pexels(34337558),
  workshopSmall: pexels(34337558, 900),
  ventMount: pexels(13536013, 900),
  dashMount: pexels(7738878, 900),
  jumperCables: pexels(7568447, 900),
  toolWall: pexels(4480461, 900),
  spanners: pexels(4480466, 900),
  leatherSeat: pexels(10196155, 900),
  headrest: pexels(9258341, 900),
  plaidSeat: pexels(7916803, 900),
  steering: pexels(39813049, 900),
  keys: pexels(842528, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("تورك أوتو", "Torque Auto");

const header = lib("header-brand-bar", {
  text: { "م": L("ت", "T"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن حامل، غطاء مقعد، عُدّة…", "Search mounts, covers, tools…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا لزيارتك": L("شكرًا لتسوّقك من تورك أوتو", "Thanks for shopping at Torque Auto"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تورك أوتو. كل الحقوق محفوظة.", "© 2026 Torque Auto. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن تورك", "About Torque"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.workshop],
    text: {
      "مجموعة الموسم": L("مجموعة الشتاء", "The winter kit"),
      "وصل حديثًا": L("وصل حديثًا", "Just in"),
      "صورة الحملة": L("ورشة سيارات بها عُدد ورافعات", "A car workshop with tools and lifts"),
      "مجموعة": L("جهّزها", "Ready"),
      "٢٠٢٦": L("للشتاء", "for winter"),
      "الجديدة": L("عُدد وإكسسوارات", "Tools and accessories"),
      "الموسم الجديد وصل": L("جهّز سيارتك للشتاء", "Get your car ready for winter"),
      "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": L(
        "حوامل هاتف وأغطية مقاعد وحقائب طوارئ، بمواصفات ومقاسات واضحة.",
        "Phone mounts, seat covers and emergency kits, with clear specs and sizes.",
      ),
      "اكتشف المجموعة": L("تسوّق المجموعة", "Shop the kit"),
    },
    links: { "/products": BEST },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("ماذا تحتاج سيارتك؟", "What does your car need?") } }),
  lib("products-bento", { text: { "منتجات يكثر الطلب عليها": L("اختيارات السائقين", "Drivers’ picks") }, links: { "/products": BEST } }),
  lib("features-compare", {
    text: {
      "قارن": L("قارن", "Compare"),
      "نحن أم غيرنا؟": L("لماذا تورك؟", "Why Torque?"),
      "متجرنا": NAME,
      "غيرنا": L("متاجر أخرى", "Other shops"),
      "تفاصيل واضحة": L("مواصفات ومقاسات واضحة", "Clear specs and sizes"),
      "تواصل سهل لأي سؤال": L("بيانات التوافق موضحة لكل منتج", "Fit details for every product"),
    },
  }),
  // v6 (2026-11-25, owner): the store's 1st category as a carousel between the comparison and the newest.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  // v5: the newest upgrades as a grid of bordered cards with the cart button (they were slim rows).
  lib("products-classic", {
    text: { "وصل حديثًا": L("إضافات صغيرة لسيارتك", "Small upgrades for your car") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("testimonials-chat", {
    text: {
      "رسائل تسعدنا": L("آراء السائقين", "What drivers say"),
      "مريم أ.": L("شريف م.", "Sherif M."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "أغطية المقاعد مقاسها مضبوط وخامتها متينة.",
        "The seat covers fit well and the material is sturdy.",
      ),
      "هذا يسعدنا جدًا، شكرًا لك!": L("سعدنا برأيك، شكرًا لك.", "Glad to hear it, thank you."),
      "عمر ك.": L("ياسمين ع.", "Yasmine A."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("الحامل المغناطيسي يثبّت الهاتف حتى على الطرق الوعرة.", "The magnetic mount holds the phone steady even on rough roads."),
      "يوسف م.": L("محمود ك.", "Mahmoud K."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("حقيبة الطوارئ تضم كل ما أحتاجه على الطريق.", "The emergency kit has everything I need on the road."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تورك", "About Torque"), L("إكسسوارات وعُدد للسيارات.", "Car accessories and tools.")),
  aboutStory(lib, {
    photo: PHOTOS.workshopSmall,
    alt: L("ورشة سيارات", "A car workshop"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("إكسسوارات تناسب سيارتك", "Accessories that suit your car"),
    text: L("حوامل هاتف وأغطية مقاعد وعُدد طوارئ، مع مواصفات وبيانات توافق واضحة لكل منتج.", "Phone mounts, seat covers and emergency tools, with clear specs and fit details for every product."),
    more: L("تواصل معنا لأي سؤال عن مقاس أو موديل.", "Contact us with any question about a size or model."),
    button: L("تسوّق الإكسسوارات", "Shop accessories"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إكسسوارات وعُدد للسيارات بمواصفات ومقاسات واضحة.", "Car accessories and tools with clear specs and sizes."),
  categories: [
    // v6: tools first, so the category carousel (the 1st category) shows a full row.
    ["tools", "عُدد وطوارئ", "Tools & emergency", PHOTOS.spanners],
    ["mounts", "حوامل الهاتف", "Phone mounts", PHOTOS.dashMount],
    ["interior", "المقصورة الداخلية", "Interior", PHOTOS.leatherSeat],
    ["extras", "إضافات", "Extras", PHOTOS.keys],
    ["seats", "أغطية المقاعد", "Seat covers", PHOTOS.plaidSeat],
    ["steering", "عجلة القيادة", "Steering", PHOTOS.steering],
    ["garage", "تجهيز المرآب", "Garage setup", PHOTOS.toolWall],
    ["power", "شحن", "Charging", PHOTOS.powerBank],
  ],
  products: [
    ["magnetic-vent-mount", "mounts", "حامل مغناطيسي لفتحة التكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 290, { isFeatured: true, rating: 4.7, sold90: 410 }],
    ["dash-phone-mount", "mounts", "حامل للوحة القيادة بشاحن", "Dash Mount with Charger", PHOTOS.dashMount, 650, { sold90: 180 }],
    ["leather-seat-covers", "seats", "أغطية مقاعد جلدية", "Leather Seat Covers", PHOTOS.leatherSeat, 3200, { compareAtPrice: 3800, isFeatured: true, rating: 4.8, sold90: 96 }],
    ["neck-headrest-pillow", "interior", "وسادة لمسند الرأس", "Headrest Pillow", PHOTOS.headrest, 380, { sold90: 150 }],
    ["plaid-seat-blanket", "seats", "غطاء مقاعد بنقشة مربعات", "Plaid Seat Blanket", PHOTOS.plaidSeat, 540, { sold90: 60 }],
    ["steering-wheel-cover", "steering", "غطاء عجلة القيادة", "Steering Wheel Cover", PHOTOS.steering, 320, { sold90: 220 }],
    ["emergency-kit", "tools", "حقيبة طوارئ للسيارة", "Car Emergency Kit", PHOTOS.jumperCables, 890, { compareAtPrice: 1270, rating: 4.9, sold90: 132 }],
    ["spanner-set", "tools", "طقم مفاتيح ١٢ قطعة", "12-Piece Spanner Set", PHOTOS.spanners, 750, { sold90: 74 }],
    ["pegboard-tool-set", "tools", "طقم عُدد بلوحة تعليق", "Tool Set with Pegboard", PHOTOS.toolWall, 1650, { sold90: 22 }],
    ["workshop-starter-set", "tools", "طقم عُدد للورشة", "Workshop Starter Set", PHOTOS.workshopSmall, 2900, { sold90: 15 }],
    ["garage-tool-board", "garage", "لوحة تعليق عُدد للمرآب", "Garage Tool Board", PHOTOS.toolWall, 2400, { inStock: false, sold90: 18 }],
    ["key-holder-set", "extras", "حلقة مفاتيح وغطاء للمفتاح", "Key Ring & Fob Case", PHOTOS.keys, 180, { sold90: 260 }],
    ["car-power-bank", "power", "بطارية شحن متنقلة للسيارة", "Car Power Bank", PHOTOS.powerBank, 790, { sold90: 88 }],
  ],
});

export const GARAGE = libraryTemplate({
  key: GARAGE_KEY,
  // v5 (2026-11-16, owner): every home has at least one real products grid (the newest upgrades, rows before).
  version: 7,
  changelog: "Garage v6: products by category as a carousel on the home",
  name: L("جراج", "Garage"),
  description: L(
    "إكسسوارات سيارات: ملصق الموسم، اختيارات السائقين، مقارنة ورسائل واتساب. أربع صفحات جاهزة.",
    "Car accessories: a season poster, drivers’ picks, a comparison and WhatsApp messages. Four ready pages.",
  ),
  category: "auto",
  style: ["bold"],
  sortOrder: 360,
  palette: ["#f2f2f0", "#e4e4e0", "#f2b705", "#121417"],
  colors: {
    primary: "#121417",
    secondary: "#e4e4e0",
    background: "#ffffff",
    foreground: "#121417",
    muted: "#585c63",
    border: "#d8d8d3",
    accent: "#f2b705",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تورك", "About"), seo: { title: L("عن تورك", "About Torque") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل معنا", "Contact us"),
      seo: { title: L("تواصل معنا", "Contact us") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or order."),
        heading: L("اسأل عن توافق قطعة مع سيارتك", "Ask whether a part fits your car"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتوافق والشحن.", "Sizes, fit and shipping."),
        question: L("كيف أعرف أن القطعة تناسب سيارتي؟", "How do I know a part fits my car?"),
        answer: L("راجع بيانات التوافق في صفحة المنتج، أو تواصل معنا بالماركة والموديل وسنة الصنع قبل الطلب.", "Check the fit details on the product page, or contact us with the make, model and year before you order."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "side", headingCase: "upper", band: "brand", extras: ["product-perks"], copy: { reviews: L("آراء السائقين", "What drivers say"), related: L("إضافات أخرى لسيارتك", "More small upgrades") } },
});
