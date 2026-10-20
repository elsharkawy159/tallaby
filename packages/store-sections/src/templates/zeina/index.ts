/**
 * Zeina (template 97, car interior styling; Claude Design "Storefront
 * Templates"): warm off-white paper, a deep violet for actions and a soft
 * pink accent, Tajawal throughout and rounded 16px corners. An interior
 * shop: a bento hero, shop by area of the car, the comfort set, a tabbed
 * shelf, refer a friend and reviews from inside customers' cars. Built from
 * section library designs (`fromLibrary`).
 *
 * The design's "Refer a friend" block has no library design yet: it uses
 * the reward card (`popup-reward`) with the referral copy and code.
 *
 * Photos: Pexels, each checked by eye (2026-10-21): seat covers (lace,
 * crochet, plaid, grey), a red steering-wheel wrap, ambient light around a
 * gear lever and a console, hanging air fresheners, a seat-back organiser
 * and rubber mats. No people, no hands and no steering-wheel badges.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ZEINA_KEY = "zeina";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZEINA_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ambientGear: pexels(19870007),
  ambientGearSmall: pexels(19870007, 900),
  ambientConsole: pexels(12369534, 900),
  laceCover: pexels(33713198, 900),
  crochetCover: pexels(37417135, 900),
  plaidCover: pexels(35867019, 900),
  greySeats: pexels(8886308, 900),
  steeringWrap: pexels(38056693, 900),
  organizer: pexels(30563011, 900),
  backSeat: pexels(30563032, 900),
  stripeScent: pexels(5158247, 900),
  teddyScent: pexels(17037530, 900),
  turboCharm: pexels(31352892, 900),
  floorMat: pexels(28055130, 900),
  vintageCabin: pexels(33496776),
};

const NAME = L("زينة عربية", "Zeinet Arabeya");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "العروض": L("الإضاءة", "Lighting"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, search("إضاءة")], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "م": L("ز", "Z"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ زينة عربية. كل الحقوق محفوظة.", "© 2026 Zeinet Arabeya. All rights reserved."),
    "اشترك في النشرة": L("خليك أول من يعرف", "Hear it first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("ألوان جديدة وعروض التركيب، مرة في الأسبوع.", "New colours and fitting offers, once a week."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.ambientGear],
    text: {
      "وصل جديد": L("جوه عربيتك", "Inside your car"),
      "صوت أنقى، كل يوم": L("خليها زي الجديدة", "Make it feel new"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "كفرات جلد ونور داخلي ومخدات، والتركيب ببلاش فوق ١٠٠٠ جنيه.",
        "Leather covers, ambient light and cushions, fitted free over EGP 1,000.",
      ),
      "تسوق الآن": L("تسوق الداخلي", "Shop interior"),
      "صورة الحملة": L("إضاءة موف حوالين الفتيس", "Purple ambient light around the gear lever"),
      "٤٫٨": L("٤٫٧", "4.7"),
      "من ١٢ ألف تقييم": L("من أكتر من ٣٠٠ تقييم", "from 300+ reviews"),
    },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.greySeats,
      PHOTOS.steeringWrap,
      PHOTOS.ambientConsole,
      PHOTOS.floorMat,
      PHOTOS.teddyScent,
      PHOTOS.backSeat,
      PHOTOS.stripeScent,
      PHOTOS.plaidCover,
    ],
    text: {
      "الأقسام": L("تسوق بالمكان", "Shop by area"),
      "وصل حديثًا": L("الكراسي", "Seats"),
      "الأكثر مبيعًا": L("الدركسيون", "Steering"),
      "العروض": L("النور", "Lights"),
      "هدايا": L("الأرضية", "Floor"),
      "إكسسوارات": L("المراية", "Mirror"),
      "أساسيات": L("التنظيم", "Storage"),
      "مجموعات": L("الريحة", "Scent"),
      "الموسم الجديد": L("الكلاسيك", "Classic"),
    },
    links: {
      "/products": [
        SHOP,
        search("كفر"),
        search("دركسيون"),
        search("إضاءة"),
        search("دواسات"),
        search("تعليقة"),
        search("منظم"),
        search("معطر"),
        search("كلاسيك"),
      ],
    },
  }),
  lib("bundle-plus", {
    text: {
      "باقة": L("طقم الراحة", "Comfort set"),
      "اشتريهم مع بعض ووفّر": L("كفر وجلدة ونور", "Cover, wheel wrap and lights"),
      "١٬٢٧٠ ج.م": L("٢٬٠٠٠ ج.م", "EGP 2,000"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٢٬٢٨٠ ج.م", "Instead of EGP 2,280"),
      "وفّر ٢٢٠ ج.م": L("وفّر ٢٨٠ ج.م", "Save EGP 280"),
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("المتجر", "Shop") },
    links: { "/products": [NEW, BEST, undefined, undefined] },
  }),
  lib("popup-reward", {
    name: L("شارك ووفّر", "Refer a friend"),
    text: {
      "جرّب حظك": L("شارك ووفّر", "Share and save"),
      "المرة دي كسبت، وده كودك.": L(
        "صاحبك يوفر ١٠٪ على أول طلب، وانت كمان على اللي بعده.",
        "Your friend saves 10% on the first order, and you save the same on your next.",
      ),
      "كسبت": L("ابعت لصاحبك", "Send to a friend"),
      "شحن مجاني": L("خصم ١٠٪", "10% off"),
      "الكود: FREESHIP": L("الكود: WELCOME10", "Code: WELCOME10"),
      "استخدمه دلوقتي": L("تسوق دلوقتي", "Shop now"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("جوه عربياتهم", "Inside their cars"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الكفر الدانتيل اتركب في ربع ساعة، وشكله كأنه جاي مع العربية.",
        "The lace cover went on in fifteen minutes and looks like it came with the car.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "تاني مرة أطلب. النور الداخلي بيتغير لونه من الموبايل وشكله تحفة بالليل.",
        "My second order. The ambient light changes colour from my phone and looks lovely at night.",
      ),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "الفني ركّب الإضاءة في البيت ومسابش ولا سلك باين.",
        "The fitter installed the lights at home and left no wire showing.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L(
        "وصل أسيوط في ٣ أيام، والمعطر ريحته لسه حلوة بعد شهر.",
        "Reached Assiut in 3 days, and the scent still smells good a month later.",
      ),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جلدة الدركسيون مريحة جدًا في الحر ومبتزحلقش.", "The wheel wrap is comfortable in the heat and never slips."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار لون يمشي مع فرش العربية.", "They helped me pick a colour that matches my seats."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن زينة عربية", "About Zeinet Arabeya"), L("كفرات ونور وراحة لعربيتك من جوه.", "Covers, lights and comfort for the inside of your car.")),
  aboutStory(lib, {
    photo: PHOTOS.vintageCabin,
    alt: L("كراسي عربية قديمة بكفرات منقوشة", "Old car seats with patterned covers"),
    eyebrow: L("من جوه", "From the inside"),
    title: L("العربية بيتك التاني", "Your car is your second home"),
    text: L("بدأنا بكفرات بنفصّلها لعربيات العيلة، وبعدين زوّدنا النور الداخلي والمعطرات والمنظمات.", "We started by making covers for family cars, then added ambient light, scents and organisers."),
    more: L("والتركيب ببلاش للطلبات فوق ١٠٠٠ جنيه، في البيت أو في الشغل.", "And fitting is free on orders over EGP 1,000, at home or at work."),
    button: L("تسوق الكفرات", "Shop covers"),
    href: search("كفر"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كفرات ونور وراحة لعربيتك من جوه.", "Covers, lights and comfort for the inside of your car."),
  categories: [
    ["covers", "كفرات وجلدة", "Covers & wraps", PHOTOS.laceCover],
    ["light-scent", "نور وريحة", "Light & scent", PHOTOS.ambientConsole],
    ["storage", "تنظيم وأرضية", "Storage & floor", PHOTOS.backSeat],
  ],
  products: [
    ["lace-seat-cover", "covers", "كفر كرسي دانتيل", "Lace Seat Cover", PHOTOS.laceCover, 850, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["red-steering-wrap", "covers", "جلدة دركسيون حمرا", "Red Steering Wheel Wrap", PHOTOS.steeringWrap, 450, { compareAtPrice: 520, rating: 4.7, sold90: 205 }],
    ["ambient-light-kit", "light-scent", "إضاءة داخلية بالموبايل", "App-Controlled Ambient Light Kit", PHOTOS.ambientGearSmall, 980, { isFeatured: true, sold90: 36 }],
    ["crochet-seat-cover", "covers", "كفر كرسي كروشيه", "Crochet Seat Cover", PHOTOS.crochetCover, 690, { sold90: 44 }],
    ["plaid-classic-cover", "covers", "كفر كاروهات كلاسيك", "Classic Plaid Seat Cover", PHOTOS.plaidCover, 1150, { rating: 4.6, sold90: 28 }],
    ["grey-leather-covers", "covers", "كفرات جلد رمادي", "Grey Leather Seat Covers", PHOTOS.greySeats, 2900, { compareAtPrice: 3300, sold90: 52 }],
    ["seat-back-organizer", "storage", "منظم ظهر الكرسي", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 88 }],
    ["rubber-floor-mats", "storage", "دواسات كاوتش", "Rubber Floor Mats", PHOTOS.floorMat, 950, { sold90: 70 }],
    ["striped-air-freshener", "light-scent", "معطر مخطط", "Striped Air Freshener", PHOTOS.stripeScent, 120, { sold90: 240 }],
    ["teddy-air-freshener", "light-scent", "تعليقة دبدوب معطرة", "Teddy Hanging Freshener", PHOTOS.teddyScent, 95, { sold90: 130 }],
    ["turbo-mirror-charm", "light-scent", "تعليقة تيربو للمراية", "Turbo Mirror Charm", PHOTOS.turboCharm, 180, { inStock: false, sold90: 60 }],
  ],
});

export const ZEINA = libraryTemplate({
  key: ZEINA_KEY,
  version: 1,
  name: L("زينة", "Zeina"),
  description: L(
    "تزيين العربية من جوه: تسوق بالمكان، طقم الراحة، شارك ووفّر وآراء العملاء. أربع صفحات جاهزة.",
    "Car interior styling: shop by area, a comfort set, refer a friend and reviews. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 970,
  palette: ["#faf8f6", "#efe9e3", "#f0abfc", "#7c3aed"],
  colors: {
    primary: "#7c3aed",
    secondary: "#efe9e3",
    background: "#faf8f6",
    foreground: "#24201d",
    muted: "#625a54",
    border: "#e2d9d0",
    accent: "#f0abfc",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن زينة عربية", "About"), seo: { title: L("عن زينة عربية", "About Zeinet Arabeya") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("التركيب في القاهرة والجيزة، والشحن لكل المحافظات.", "Fitting in Cairo and Giza, delivery everywhere."),
        heading: L("ابعت موديل العربية ولون الفرش", "Send your car model and seat colour"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتركيب والتوصيل.", "Fit, fitting and delivery."),
        question: L("الكفر هيناسب عربيتي؟", "Will the cover fit my car?"),
        answer: L("ابعتلنا الموديل والسنة، وبنقولك المقاس قبل ما تطلب.", "Send us the model and year and we confirm the fit before you order."),
      }),
    },
  ],
  demo: DEMO,
});
