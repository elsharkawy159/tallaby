/**
 * Moto (template 38, motorcycle riding gear; Claude Design "Storefront
 * Templates"): warm grey paper, near-black type and a racing red for
 * actions, Changa throughout and tight 4px corners. A riders' shop: a split hero
 * on a helmet, the garage's categories, riders' favourites, why certified
 * only, most ordered, certified brands and good to know. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): helmets resting on
 * seats, gloves, a leather jacket on a hook, grips and a rear wheel. No
 * riders, no hands and no motorcycle badges.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MOTO_KEY = "moto";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MOTO_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  openHelmet: pexels(17533722, 900),
  whiteHelmet: pexels(30817488, 900),
  whiteHelmetWide: pexels(30817488),
  glovesSeat: pexels(18171625, 900),
  glovesMono: pexels(33582592, 900),
  jacket: pexels(8113002, 900),
  grips: pexels(20522567, 900),
  rearWheel: pexels(32683778, 900),
  twoBikes: pexels(19376383, 900),
  ventMount: pexels(13536013, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("موتو كلوب", "Moto Club");

const BRANDS = ["Apex Helmets", "Ridgeline", "Nile Moto", "Torq Gear"];

const header = lib("header-search", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن خوذة، جوانتي، جاكيت…", "Search helmets, gloves, jackets…"),
    "العروض": L("خوذ", "Helmets"),
    "هدايا": L("جوانتيات", "Gloves"),
    "إكسسوارات": L("جواكت", "Jackets"),
    "توصيل خلال ٤٨ ساعة": L("كل الخوذ معتمدة ECE و DOT", "Every helmet is ECE and DOT certified"),
  },
  links: { "/products": [undefined, NEW, BEST, search("خوذة"), search("جوانتي"), search("جاكيت")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ موتو كلوب. كل الحقوق محفوظة.", "© 2026 Moto Club. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QUESTIONS = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("أعرف مقاس الخوذة إزاي؟", "How do I find my helmet size?"),
  "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
    "قيس محيط راسك فوق الحواجب بشريط قماش، وقارنه بجدول المقاسات في صفحة المنتج.",
    "Measure around your head just above the eyebrows with a tape and match the size chart on the product page.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("ينفع أجرّب الخوذة في الجراج؟", "Can I try a helmet at the garage?"),
  "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، كل يوم من ٢ الضهر لـ ١٠ بالليل ما عدا الجمعة.", "Yes, daily from 2 pm to 10 pm except Friday."),
  "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
  "هل التوصيل متاح لكل المحافظات؟": L("الخوذة معتمدة فعلاً؟", "Is the helmet really certified?"),
  "نعم، نوصل لكل محافظات مصر.": L("كل خوذة عليها ملصق ECE أو DOT الأصلي وبنبعت صورة الشهادة.", "Every helmet carries its original ECE or DOT label and we send the certificate."),
} as const;

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.whiteHelmetWide],
    text: {
      "صورة الواجهة": L("خوذة بيضا على موتوسيكل في جراج", "A white helmet on a motorcycle in a garage"),
      "المجموعة الجديدة": L("خوذ معتمدة ECE و DOT", "ECE and DOT certified"),
      "معمول بكميات صغيرة": L("اركب وارجع بالسلامة", "Ride out, ride home safe"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "خوذ وجوانتيات وجواكت بحماية معتمدة، من رايدرز لرايدرز.",
        "Helmets, gloves and jackets with certified protection, from riders to riders.",
      ),
      "تسوّق المجموعة": L("تسوق الخوذ", "Shop helmets"),
      "حكايتنا": L("عن الجراج", "About the garage"),
    },
    links: { "/products": search("خوذة") },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("الجراج", "The garage"), "تسوق بالقسم": L("جهّز نفسك", "Gear up") } }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("اختيارات الرايدرز", "Riders’ favourites"), "اختيار الأسبوع": L("اختيار الشهر", "Pick of the month") },
  }),
  lib("text-lead", {
    text: {
      "بدأنا المتجر عشان نلاقي منتجات أصلية بسعر عادل، من غير لف على المحلات.": L(
        "بنبيع خوذ معتمدة بس، لأن الخوذة مش إكسسوار: هي اللي بترجّعك البيت.",
        "We sell certified helmets only, because a helmet is not an accessory: it is what gets you home.",
      ),
      "النهارده بنشحن لكل المحافظات، وكل منتج بيتراجع قبل ما يخرج.": L(
        "كل خوذة عليها ملصق ECE أو DOT الأصلي، وبنبعتلك صورة الشهادة مع الطلب.",
        "Every helmet carries its original ECE or DOT label, and we send the certificate with your order.",
      ),
      "بنشتغل مع موردين معتمدين بس، وكل طلب معاه فاتورة رسمية.": L(
        "والجواكت والجوانتيات فيها حماية معتمدة للكوع والكتف والمفاصل.",
        "And our jackets and gloves carry certified elbow, shoulder and knuckle armour.",
      ),
    },
  }),
  lib("products-rail", {
    text: { "بيحبوها": L("من الجراج", "From the garage"), "الأكثر مبيعًا": L("الأكثر طلباً", "Most ordered") },
    links: { "/products": BEST },
  }),
  lib("brands-cards", {
    text: {
      "الماركات": L("ماركات معتمدة", "Certified brands"),
      "تسوق بالماركة": L("تسوق بالماركة", "Shop by brand"),
      "فولتا": BRANDS[0]!,
      "٤٢": L("٢٤", "24"),
      "نورو": BRANDS[1]!,
      "١٨": L("١٦", "16"),
      "كيان": BRANDS[2]!,
      "٢٧": L("٣١", "31"),
      "ساحل": BRANDS[3]!,
      "٩": L("١١", "11"),
    },
    links: { "/products": [undefined, ...BRANDS.map(search)] },
  }),
  lib("faq-numbered", {
    text: {
      "قبل ما تطلب": L("قبل ما تطلب", "Before you order"),
      "أسئلة مهمة": L("حاجات مهمة", "Good to know"),
      ...QUESTIONS,
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن موتو كلوب", "About Moto Club"), L("جراج ومحل أدوات ركوب في المهندسين.", "A garage and riding gear shop in Mohandessin.")),
  aboutStory(lib, {
    photo: PHOTOS.whiteHelmetWide,
    alt: L("خوذة بيضا على موتوسيكل في جراج", "A white helmet on a motorcycle in a garage"),
    eyebrow: L("المهندسين", "Mohandessin"),
    title: L("رايدرز بيبيعوا لرايدرز", "Riders selling to riders"),
    text: L("بدأنا جروب ركوب كل جمعة، وبعدين فتحنا الجراج عشان نجيب أدوات أمان معتمدة بسعر معقول.", "We started as a Friday riding group, then opened the garage to bring certified safety gear at fair prices."),
    more: L("وتقدر تجرّب أي خوذة في الجراج قبل ما تشتري.", "And you can try any helmet at the garage before you buy."),
    button: L("تسوق الخوذ", "Shop helmets"),
    href: search("خوذة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خوذ معتمدة وأدوات ركوب للموتوسيكل.", "Certified helmets and motorcycle riding gear."),
  categories: [
    ["helmets", "خوذ", "Helmets", PHOTOS.openHelmet],
    ["gloves-jackets", "جوانتيات وجواكت", "Gloves & jackets", PHOTOS.glovesSeat],
    ["bike", "للموتوسيكل", "For the bike", PHOTOS.grips],
    ["jackets", "جواكت", "Jackets", PHOTOS.jacket],
    ["parts", "قطع غيار", "Parts", PHOTOS.rearWheel],
    ["mounts", "حوامل موبايل", "Phone mounts", PHOTOS.ventMount],
    ["power", "شحن", "Charging", PHOTOS.powerBank],
    ["riding-sets", "أطقم ركوب", "Riding sets", PHOTOS.twoBikes],
  ],
  products: [
    ["retro-open-helmet", "helmets", "خوذة ريترو مفتوحة", "Retro Open-Face Helmet", PHOTOS.openHelmet, 3400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["white-full-face-helmet", "helmets", "خوذة فل فيس بيضا", "White Full-Face Helmet", PHOTOS.whiteHelmet, 4900, { compareAtPrice: 5750, rating: 4.9, sold90: 88 }],
    ["leather-riding-gloves", "gloves-jackets", "جوانتي ركوب جلد", "Leather Riding Gloves", PHOTOS.glovesSeat, 950, { sold90: 170 }],
    ["armoured-gloves", "gloves-jackets", "جوانتي بحماية مفاصل", "Armoured Knuckle Gloves", PHOTOS.glovesMono, 1250, { isFeatured: true, sold90: 104 }],
    ["shearling-riding-jacket", "jackets", "جاكيت جلد بفرو", "Shearling Riding Jacket", PHOTOS.jacket, 6800, { rating: 4.7, sold90: 32 }],
    ["comfort-grips", "bike", "مقابض مريحة", "Comfort Grips", PHOTOS.grips, 420, { sold90: 140 }],
    ["brake-disc-set", "parts", "طقم ديسك فرامل", "Brake Disc Set", PHOTOS.rearWheel, 2100, { inStock: false, sold90: 26 }],
    ["handlebar-phone-mount", "mounts", "حامل موبايل للجادون", "Handlebar Phone Mount", PHOTOS.ventMount, 480, { sold90: 210 }],
    ["ride-power-bank", "power", "باور بانك للرحلة", "Ride Power Bank", PHOTOS.powerBank, 790, { compareAtPrice: 890, sold90: 64 }],
    ["new-rider-set", "riding-sets", "طقم الراكب الجديد", "New Rider Set", PHOTOS.whiteHelmetWide, 6200, { compareAtPrice: 7100, sold90: 24 }],
  ],
});

export const MOTO = libraryTemplate({
  key: MOTO_KEY,
  version: 4,
  changelog: "Moto v4: new hero, categories, section order",
  name: L("موتو", "Moto"),
  description: L(
    "أدوات ركوب الموتوسيكل: خوذ معتمدة، اختيارات الرايدرز وماركات موثوقة. أربع صفحات جاهزة.",
    "Motorcycle riding gear: certified helmets, riders' picks and trusted brands. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 380,
  palette: ["#f1f0ee", "#e2e0dc", "#e23d28", "#141414"],
  colors: {
    primary: "#e23d28",
    secondary: "#e2e0dc",
    background: "#f1f0ee",
    foreground: "#141414",
    muted: "#5c5a57",
    border: "#d6d3ce",
    accent: "#f9d3cc",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن موتو كلوب", "About"), seo: { title: L("عن موتو كلوب", "About Moto Club") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٨ شارع شهاب، المهندسين.", "18 Shehab St, Mohandessin."),
        heading: L("اسأل عن مقاس أو موديل", "Ask about a size or model"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والاعتماد والتوصيل.", "Sizes, certification and delivery."),
        question: L("ينفع أبدّل مقاس الخوذة؟", "Can I swap a helmet size?"),
        answer: L("أيوه، خلال ١٤ يوم لو الخوذة جديدة بالبلاستيك بتاعها.", "Yes, within 14 days if the helmet is new in its wrapping."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", headingCase: "upper", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء الراكبين", "Riders' reviews"), related: L("جهّز قبل الطريق", "Gear up before the ride") } },
});
