/**
 * Halawa (template 72, oriental sweets; Claude Design "Storefront
 * Templates"): warm ivory paper, a caramel brown for actions and a honey
 * yellow highlight, Lalezar headings over Tajawal text and round 20px
 * corners. A family sweets shop since 1975: campaign tickets, what are you
 * craving, gifts for every visit, the most ordered, fifty years of trays
 * and questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): pistachio basbousa,
 * konafa, konafa nests, a qatayef platter, maamoul, butter cookies in a tin,
 * meshabek, syrup balls, dates, a pudding bowl and a tea pot on a mat. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HALAWA_KEY = "halawa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HALAWA_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  basbousa: pexels(10395259, 900),
  basbousaWide: pexels(10395259),
  konafa: pexels(36691304, 900),
  nests: pexels(25810607, 900),
  qatayef: pexels(36355419, 900),
  maamoul: pexels(17255896, 900),
  cookies: pexels(5985991, 900),
  meshabek: pexels(39852669, 900),
  syrupBalls: pexels(15014918, 900),
  dates: pexels(36094809, 900),
  pudding: pexels(29177191, 900),
  teaWide: pexels(32148345),
};

const NAME = L("حلاوة زمان", "Halawet Zaman");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("الحلويات", "Sweets"),
    "العروض": L("بوكسات الهدايا", "Gift boxes"),
    "المدونة": L("حكايتنا", "Our story"),
  },
  links: { "/products": [SHOP, search("بوكس")], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "اشترك في النشرة": L("عروض رمضان والعيد أول بأول", "Ramadan and Eid offers first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("بوكسات المواسم قبل ما تخلص، مرة في الأسبوع.", "Seasonal boxes before they sell out, once a week."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حلاوة زمان. كل الحقوق محفوظة.", "© 2026 Halawet Zaman. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QA = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("الحلويات بتتعمل إمتى؟", "When are the sweets made?"),
  "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
    "كل يوم الصبح في فرننا في شبرا، ومفيش حاجة بتبات عندنا.",
    "Every morning in our Shubra oven, and nothing stays overnight.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("بتقعد كام يوم؟", "How long do they keep?"),
  "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L(
    "البسبوسة والكنافة ٣ أيام في التلاجة، والغريبة والكحك أسبوعين في علبة مقفولة.",
    "Basbousa and konafa 3 days in the fridge; ghorayeba and kahk two weeks in a closed tin.",
  ),
  "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
  "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
    "في القاهرة والجيزة نفس اليوم لو طلبت قبل ٢ الضهر.",
    "Same day in Cairo and Giza if you order before 2 pm.",
  ),
  "هل التوصيل متاح لكل المحافظات؟": L("بتوصلوا بره القاهرة؟", "Do you deliver outside Cairo?"),
  "نعم، نوصل لكل محافظات مصر.": L("الغريبة والكحك والبوكسات الناشفة بس، لأنها بتستحمل السفر.", "Only ghorayeba, kahk and dry boxes, since they travel well."),
  "ما طرق الدفع المتاحة؟": L("ينفع أكتب كارت على الهدية؟", "Can I add a card to a gift?"),
  "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L(
    "أيوه، اكتب الرسالة في ملاحظات الطلب وهنكتبها بخط اليد.",
    "Yes, write your message in the order notes and we write it by hand.",
  ),
} as const;

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.basbousaWide, PHOTOS.qatayef, PHOTOS.dates],
    text: {
      "صورة الحملة": L("صينية بسبوسة بالفستق", "A tray of pistachio basbousa"),
      "مجموعة الخريف": L("من ١٩٧٥", "Since 1975"),
      "ألوان هادئة لأيام أطول": L("بسبوسة زي بتاعة تيتا", "Basbousa like your grandmother made"),
      "تسوّق المجموعة": L("تسوق الصواني", "Shop trays"),
      "عروض الأسبوع": L("بوكسات لكل زيارة", "Boxes for every visit"),
      "هدايا مختارة": L("بلح وكحك رمضان", "Ramadan dates and kahk"),
    },
    links: { "/products": [search("صينية"), search("بوكس"), search("رمضان")] },
  }),
  lib("categories-stories", {
    photo: [PHOTOS.basbousa, PHOTOS.konafa, PHOTOS.qatayef, PHOTOS.maamoul, PHOTOS.cookies, PHOTOS.meshabek, PHOTOS.syrupBalls, PHOTOS.dates],
    text: {
      "الأقسام": L("نفسك في إيه؟", "What are you craving?"),
      "الكل": L("كل الحلويات", "All sweets"),
      "وصل حديثًا": L("بسبوسة", "Basbousa"),
      "الأكثر مبيعًا": L("كنافة", "Konafa"),
      "العروض": L("قطايف", "Qatayef"),
      "هدايا": L("كحك ومعمول", "Kahk & maamoul"),
      "إكسسوارات": L("غريبة", "Ghorayeba"),
      "أساسيات": L("مشبك", "Meshabek"),
      "مجموعات": L("لقمة القاضي", "Luqmet el adi"),
      "الموسم الجديد": L("بلح", "Dates"),
    },
    links: {
      "/products": [SHOP, search("بسبوسة"), search("كنافة"), search("قطايف"), search("كحك"), search("غريبة"), search("مشبك"), search("لقمة"), search("بلح")],
    },
  }),
  lib("bundle-gifts", {
    photo: [PHOTOS.qatayef, PHOTOS.cookies, PHOTOS.dates, PHOTOS.basbousa],
    text: {
      "هدية لمين؟": L("رايح لحد؟", "Visiting someone?"),
      "ليه": L("زيارة عيلة", "Family visit"),
      "ليها": L("الشغل", "Office"),
      "للطلبة": L("رمضان", "Ramadan"),
      "للجيمرز": L("لينا إحنا", "Just us"),
    },
    links: { "/products": [search("مشكل"), search("غريبة"), search("رمضان"), search("صينية")] },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكتر طلباً", "Most ordered"),
      "أحدث المنتجات اللي نزلت المتجر.": L("الصواني اللي الناس بترجعلها كل أسبوع.", "The trays people come back for every week."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("team-timeline", {
    text: {
      "رحلتنا": L("قصتنا", "Our story"),
      "من ٢٠١٩ لحد النهارده": L("٥٠ سنة صواني", "Fifty years of trays"),
      "٢٠١٩": L("١٩٧٥", "1975"),
      "أول ١٠ طلبات على واتساب": L("أول محل في شبرا", "First shop in Shubra"),
      "٢٠٢١": L("١٩٩٨", "1998"),
      "أول مخزن في الجيزة": L("فرن تاني", "A second oven"),
      "٢٠٢٣": L("٢٠٢٠", "2020"),
      "التوصيل لكل المحافظات": L("توصيل لكل القاهرة", "Delivery across Cairo"),
      "٥٠ ألف عميل وفرعين": L("متجر أونلاين", "Online store"),
    },
  }),
  lib("faq-columns", { as: "faq-home", text: { "أسئلة شائعة": L("أسئلة", "Questions"), ...QA } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن حلاوة زمان", "About Halawet Zaman"), L("حلويات شرقي من ١٩٧٥.", "Oriental sweets since 1975.")),
  aboutStory(lib, {
    photo: PHOTOS.teaWide,
    alt: L("براد شاي على مفرش خوص", "A tea pot on a woven mat"),
    eyebrow: L("شبرا، ١٩٧٥", "Shubra, 1975"),
    title: L("نفس الوصفة من خمسين سنة", "The same recipe for fifty years"),
    text: L("جدنا فتح أول محل في شبرا بصينية بسبوسة واحدة، والنهارده بنخبز نفس الوصفة بالسمنة البلدي.", "Our grandfather opened in Shubra with a single tray of basbousa; today we bake the same recipe with local ghee."),
    more: L("وكل بوكس بيتقفل بإيد العيلة قبل ما يخرج.", "And every box is closed by the family before it leaves."),
    button: L("تسوق الصواني", "Shop trays"),
    href: search("صينية"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بسبوسة وكنافة وغريبة من ١٩٧٥.", "Basbousa, konafa and ghorayeba since 1975."),
  categories: [
    ["trays", "صواني", "Trays", PHOTOS.basbousa],
    ["boxes", "بوكسات هدايا", "Gift boxes", PHOTOS.qatayef],
    ["bakes", "مخبوزات", "Bakes", PHOTOS.cookies],
  ],
  products: [
    ["basbousa-tray", "trays", "صينية بسبوسة بالفستق", "Pistachio Basbousa Tray", PHOTOS.basbousa, 280, { isFeatured: true, rating: 4.9, sold90: 300 }],
    ["mixed-sweets-box", "boxes", "بوكس حلويات مشكل", "Mixed Sweets Box", PHOTOS.qatayef, 450, { sold90: 180 }],
    ["ghorayeba-500g", "bakes", "غريبة نص كيلو", "Ghorayeba, 500 g", PHOTOS.cookies, 190, { sold90: 140 }],
    ["konafa-cream", "trays", "كنافة بالقشطة", "Konafa with Cream", PHOTOS.konafa, 340, { compareAtPrice: 390, sold90: 96 }],
    ["ramadan-box", "boxes", "بوكس رمضان", "Ramadan Box", PHOTOS.dates, 890, { isFeatured: true, sold90: 61 }],
    ["konafa-nests", "trays", "عش البلبل بالفستق", "Pistachio Konafa Nests", PHOTOS.nests, 360, { rating: 4.8, sold90: 88 }],
    ["maamoul-kahk", "bakes", "كحك ومعمول ١ كيلو", "Kahk & Maamoul, 1 kg", PHOTOS.maamoul, 320, { sold90: 120 }],
    ["meshabek", "bakes", "مشبك نص كيلو", "Meshabek, 500 g", PHOTOS.meshabek, 120, { sold90: 70 }],
    ["luqmet-el-adi", "trays", "لقمة القاضي", "Luqmet el Adi", PHOTOS.syrupBalls, 150, { sold90: 64 }],
    ["om-ali", "trays", "أم علي بالمكسرات", "Om Ali with Nuts", PHOTOS.pudding, 210, { inStock: false, sold90: 40 }],
  ],
});

export const HALAWA = libraryTemplate({
  key: HALAWA_KEY,
  version: 1,
  name: L("حلاوة", "Halawa"),
  description: L(
    "حلويات شرقي: حملات الموسم، نفسك في إيه، هدايا لكل زيارة، الأكتر طلباً وحكاية ٥٠ سنة. أربع صفحات جاهزة.",
    "Oriental sweets: seasonal campaigns, what are you craving, gifts for every visit, the most ordered and fifty years of trays. Four ready pages.",
  ),
  category: "sweets",
  sortOrder: 720,
  palette: ["#fff9f0", "#fbe9cf", "#f9c74f", "#b45309"],
  colors: {
    primary: "#b45309",
    secondary: "#fbe9cf",
    background: "#fff9f0",
    foreground: "#2e1a0c",
    muted: "#6b5440",
    border: "#f0d7b2",
    accent: "#f9c74f",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن حلاوة زمان", "About"), seo: { title: L("عن حلاوة زمان", "About Halawet Zaman") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٧ شارع شبرا، القاهرة.", "7 Shubra St, Cairo."),
        heading: L("اطلب صينية لمناسبة", "Order a tray for an occasion"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطزاجة والتوصيل والهدايا.", "Freshness, delivery and gifts."),
        question: L("ينفع أرجّع صينية؟", "Can I return a tray?"),
        answer: L("الحلويات مبتترجعش، بس لو فيها أي مشكلة صوّرها ونبدلها في نفس اليوم.", "Sweets cannot be returned, but if anything is wrong send a photo and we replace it the same day."),
      }),
    },
  ],
  demo: DEMO,
});
