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
    "اشترك في النشرة": L("اشترك في النشرة", "Join the newsletter"),
    "منتجات جديدة وأخبار المتجر.": L("اشترك ليصلك جديد المتجر.", "Subscribe to hear about new arrivals."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.ambientGear],
    text: {
      "وصل جديد": L("لداخل السيارة", "Car interior"),
      "صوت أنقى، كل يوم": L("إكسسوارات داخلية للسيارة", "Car interior accessories"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "أغطية مقاعد وإضاءة داخلية ومعطرات ومنظمات.",
        "Seat covers, ambient light, air fresheners and organisers.",
      ),
      "تسوق الآن": L("تسوّق الآن", "Shop now"),
      "صورة الحملة": L("إضاءة بنفسجية حول ناقل الحركة", "Purple ambient light around the gear lever"),
      "٤٫٨": L("إضاءة LED", "LED lighting"),
      "تقييم العملاء": L("إضاءة داخلية", "Ambient light"),
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
      "الأقسام": L("تسوّق حسب المكان", "Shop by area"),
      "وصل حديثًا": L("المقاعد", "Seats"),
      "الأكثر مبيعًا": L("عجلة القيادة", "Steering wheel"),
      "العروض": L("الإضاءة", "Lighting"),
      "هدايا": L("الأرضية", "Floor"),
      "إكسسوارات": L("المرآة", "Mirror"),
      "أساسيات": L("التنظيم", "Storage"),
      "مجموعات": L("المعطرات", "Fresheners"),
      "الموسم الجديد": L("الكلاسيكي", "Classic"),
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
  lib("products-shelf", {
    text: { "تسوّق حسب اختيارك": L("المتجر", "Shop") },
    links: { "/products": [NEW, BEST, undefined, undefined] },
  }),
  // v3 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 4 }] }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء عملائنا", "What our customers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "غطاء المقعد الدانتيل مقاسه مناسب تمامًا، وشكله أنيق.",
        "The lace seat cover is just the right size and looks elegant.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "الإضاءة الداخلية يتغير لونها من الهاتف، وشكلها جميل ليلًا.",
        "The ambient light changes colour from my phone and looks lovely at night.",
      ),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "لون الإضاءة هادئ، ويناسب لون الفرش.",
        "The light colour is soft and suits the upholstery.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L(
        "رائحة المعطر ما زالت جميلة بعد شهر.",
        "The scent still smells good a month later.",
      ),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("غطاء عجلة القيادة مريح في الحر ولا ينزلق.", "The wheel wrap is comfortable in the heat and never slips."),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("اللون مطابق للصور، ويناسب فرش السيارة.", "The colour matches the photos and suits my seats."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن زينة عربية", "About Zeinet Arabeya"), L("أغطية مقاعد وإضاءة ومعطرات لداخل السيارة.", "Seat covers, lights and scents for the car interior.")),
  aboutStory(lib, {
    photo: PHOTOS.vintageCabin,
    alt: L("مقاعد سيارة قديمة بأغطية منقوشة", "Old car seats with patterned covers"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("إكسسوارات لداخل السيارة", "Accessories for the car interior"),
    text: L("نختار أغطية مقاعد وإضاءة داخلية ومعطرات ومنظمات، ونكتب المقاسات المناسبة لكل منتج.", "We choose seat covers, ambient lights, scents and organisers, and list the fit for every product."),
    more: L("تواصل معنا لأي سؤال عن مقاس أو لون.", "Contact us with any question about a fit or a colour."),
    button: L("تسوق أغطية المقاعد", "Shop covers"),
    href: search("كفر"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أغطية مقاعد وإضاءة ومعطرات لداخل السيارة.", "Seat covers, lights and scents for the car interior."),
  categories: [
    ["covers", "أغطية المقاعد والعجلة", "Covers & wraps", PHOTOS.laceCover],
    ["light-scent", "إضاءة ومعطرات", "Light & scent", PHOTOS.ambientConsole],
    ["storage", "منظمات ودواسات", "Storage & floor", PHOTOS.backSeat],
  ],
  products: [
    ["lace-seat-cover", "covers", "غطاء مقعد دانتيل", "Lace Seat Cover", PHOTOS.laceCover, 850, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["red-steering-wrap", "covers", "غطاء عجلة قيادة أحمر", "Red Steering Wheel Wrap", PHOTOS.steeringWrap, 450, { compareAtPrice: 520, rating: 4.7, sold90: 205 }],
    ["ambient-light-kit", "light-scent", "إضاءة داخلية بالتحكم من الهاتف", "App-Controlled Ambient Light Kit", PHOTOS.ambientGearSmall, 980, { isFeatured: true, sold90: 36 }],
    ["crochet-seat-cover", "covers", "غطاء مقعد كروشيه", "Crochet Seat Cover", PHOTOS.crochetCover, 690, { sold90: 44 }],
    ["plaid-classic-cover", "covers", "غطاء مقعد كلاسيكي بمربعات", "Classic Plaid Seat Cover", PHOTOS.plaidCover, 1150, { rating: 4.6, sold90: 28 }],
    ["grey-leather-covers", "covers", "أغطية مقاعد جلد رمادية", "Grey Leather Seat Covers", PHOTOS.greySeats, 2900, { compareAtPrice: 3300, sold90: 52 }],
    ["seat-back-organizer", "storage", "منظم ظهر المقعد", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 88 }],
    ["rubber-floor-mats", "storage", "دواسات مطاطية", "Rubber Floor Mats", PHOTOS.floorMat, 950, { sold90: 70 }],
    ["striped-air-freshener", "light-scent", "معطر مخطط", "Striped Air Freshener", PHOTOS.stripeScent, 120, { sold90: 240 }],
    ["teddy-air-freshener", "light-scent", "معلّقة دبدوب معطرة", "Teddy Hanging Freshener", PHOTOS.teddyScent, 95, { sold90: 130 }],
    ["turbo-mirror-charm", "light-scent", "معلّقة تيربو للمرآة", "Turbo Mirror Charm", PHOTOS.turboCharm, 180, { inStock: false, sold90: 60 }],
  ],
});

export const ZEINA = libraryTemplate({
  key: ZEINA_KEY,
  version: 4,
  changelog: "Zeina v3: products by category in a swipe row on the home",
  productPage: { surface: "shelf", thumbs: "bottom", gallery: "end", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("منتجات أخرى لداخل السيارة", "More for the interior") } },
  name: L("زينة", "Zeina"),
  description: L(
    "تزيين داخل السيارة: تسوّق حسب المكان وآراء العملاء. أربع صفحات جاهزة.",
    "Car interior styling: shop by area and reviews. Four ready pages.",
  ),
  category: "auto",
  style: ["playful"],
  sortOrder: 970,
  palette: ["#faf8f6", "#efe9e3", "#f0abfc", "#7c3aed"],
  colors: {
    primary: "#7c3aed",
    secondary: "#efe9e3",
    background: "#ffffff",
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
        text: L("اسأل عن مقاس أو لون، وسنرد عليك.", "Ask about a fit or a colour, and we will reply."),
        heading: L("أرسل موديل السيارة ولون الفرش", "Send your car model and seat colour"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والألوان والطلبات.", "Fit, colours and orders."),
        question: L("هل يناسب الغطاء سيارتي؟", "Will the cover fit my car?"),
        answer: L("الموديلات المناسبة مكتوبة في صفحة كل منتج، وتواصل معنا إن لم تكن متأكدًا.", "Each product page lists the models it fits; contact us if you are not sure."),
      }),
    },
  ],
  demo: DEMO,
});
