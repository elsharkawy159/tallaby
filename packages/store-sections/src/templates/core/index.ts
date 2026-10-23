/**
 * Core (template 34, strength equipment; Claude Design "Storefront
 * Templates"): off-white paper, near-black type and a hot red for actions,
 * Cairo throughout and square corners. A gym supplier: one featured
 * product with a launch tag, the numbers, two offers, who we are, the most
 * ordered and reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): kettlebell racks,
 * dumbbells, plates, ropes and mats. No people and no brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const CORE_KEY = "core";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(CORE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  kettlebellRack: pexels(14502821),
  kettlebellRackSmall: pexels(14502821, 900),
  greyKettlebells: pexels(13863727, 900),
  grassKettlebells: pexels(8978325, 900),
  hexDumbbells: pexels(29224210, 900),
  blueDumbbells: pexels(4793245, 900),
  vinylDumbbells: pexels(5412247, 900),
  matDumbbells: pexels(5412251, 900),
  ropes: pexels(6339721, 900),
  bands: pexels(16695681, 900),
  gymRoom: pexels(27195989),
  gymRoomSmall: pexels(27195989, 900),
};

const NAME = L("كور جيم سبلاي", "Core Gym Supply");

const header = lib("header-ruled", {
  text: { "م": L("ك", "C"), "اسم متجرك": NAME, "المتجر": L("المعدات", "Equipment"), "العروض": L("الأكثر مبيعاً", "Best sellers") },
  links: { "/products": [SHOP, BEST, SHOP, SHOP] },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("عروض المعدات قبل أي حد، مرة في الشهر.", "Equipment offers before anyone else, once a month."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كور جيم سبلاي. كل الحقوق محفوظة.", "© 2026 Core Gym Supply. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-product", {
    photo: [undefined, undefined, undefined, PHOTOS.kettlebellRack],
    text: {
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best seller"),
      "اسم المنتج المميز هنا": L("طقم كيتل بيل ٤ إلى ٢٤ كجم", "Kettlebell set, 4 to 24 kg"),
      "٤٫٨ من ١٢٨ تقييم": L("٤٫٩ من ٢١٦ تقييم", "4.9 from 216 reviews"),
      "اكتب هنا ما يميز المنتج في سطرين: الخامة، والمدة، ولماذا سيحبه العميل.": L(
        "حديد زهر بطلاء بودرة ومسكة خشنة. ستة أوزان على حامل واحد لجيم البيت أو الاستوديو.",
        "Powder-coated cast iron with a rough grip. Six weights on one rack for a home gym or studio.",
      ),
      "٤٨ ساعة": L("٣ أيام", "3 days"),
      "توصيل": L("توصيل وتركيب", "Delivery & setup"),
      "سنتين": L("٥ سنين", "5 years"),
      "١٤ يومًا": L("١٤ يوم", "14 days"),
      "صورة المنتج": L("حامل كيتل بيل بستة أوزان", "A kettlebell rack with six weights"),
      "عرض الإطلاق": L("عرض الشهر", "This month"),
      "خصم ٢٠٪": L("الحامل مجاناً", "Free rack"),
      "لأول ١٠٠ طلب": L("مع الطقم الكامل", "With the full set"),
    },
    links: { "/products": [search("كيتل"), search("كيتل")] },
  }),
  lib("stats-big-numbers", {
    text: {
      "أرقامنا تتكلم عنا": L("من ٢٠١٨ لحد النهارده", "Since 2018"),
      "+٢٥ ألف": L("+٣٤٠", "340+"),
      "طلب تم توصيله": L("جيم واستوديو جهزناه", "Gyms and studios equipped"),
      "٢٧": L("٦٠", "60"),
      "محافظة نوصل لها": L("طن حديد سنوياً", "Tonnes of iron a year"),
      "٤٫٨": L("٤٫٩", "4.9"),
      "١٤": L("٥", "5"),
      "يومًا للاسترجاع": L("سنين ضمان", "Years of warranty"),
    },
  }),
  lib("promo-pair", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.blueDumbbells, PHOTOS.grassKettlebells],
    text: {
      "اشترِ مجموعة ووفّر ١٥٪": L("جهّز جيم البيت ووفّر ١٥٪", "Equip a home gym, save 15%"),
      "اختر أي منتجين معًا.": L("دمبل وكيتل بيل ومات في طلب واحد.", "Dumbbells, kettlebells and a mat in one order."),
      "كوّن مجموعتك": L("كوّن جيمك", "Build your gym"),
      "هدايا أقل من ٦٠٠ ج.م": L("حديد الحديقة", "Outdoor iron"),
      "أشياء صغيرة سيستخدمونها كل يوم.": L("كيتل بيل مطلي يستحمل الشمس والمطر.", "Coated kettlebells that handle sun and rain."),
      "تسوّق الهدايا": L("تسوق الكيتل بيل", "Shop kettlebells"),
    },
    links: { "/products": [search("دمبل"), search("كيتل")] },
  }),
  lib("text-columns", {
    text: {
      "عن متجرنا": L("مين إحنا", "Who we are"),
      "بدأنا بهدف واحد: منتجات أصلية بسعر عادل، يختارها أشخاص يستخدمونها فعلًا.": L(
        "بنجهز جيمات من ٢٠١٨: حديد تقيل، أرضيات وحوامل، بأسعار المصنع.",
        "We have equipped gyms since 2018: heavy iron, flooring and racks at factory prices.",
      ),
      "اليوم نشحن لكل المحافظات ونجرّب كل منتج قبل أن يصل إليك.": L(
        "وبنوصّل للبيت كمان: نفس الحديد، بكميات صغيرة، مع تركيب في القاهرة والجيزة.",
        "And we deliver to homes too: the same iron in small quantities, with setup in Cairo and Giza.",
      ),
    },
  }),
  lib("products-rail", {
    text: { "بيحبوها": L("الجيمات بتطلب", "Gyms order"), "الأكثر مبيعًا": L("الأكثر طلباً", "Most ordered") },
    links: { "/products": BEST },
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("قالوا عننا", "What they say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "جهزوا الاستوديو كله في يومين والتركيب كان نضيف.",
        "They equipped the whole studio in two days and the setup was clean.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رامي ع.", "Rami A."),
      "القاهرة": L("التجمع", "New Cairo"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("الدمبل السداسي ثابت على الأرض ومش بيتدحرج.", "The hex dumbbells sit flat and never roll."),
      "ع": L("م", "M"),
      "عمر ك.": L("مي ج.", "Mai G."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("أسعار أقل من السوق وضمان بجد.", "Below-market prices and a real warranty."),
      "ن": L("ح", "H"),
      "نور ح.": L("حسام ل.", "Hossam L."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كور", "About Core"), L("مورّد معدات جيم في العاشر من رمضان.", "A gym equipment supplier in 10th of Ramadan.")),
  aboutStory(lib, {
    photo: PHOTOS.gymRoom,
    alt: L("جيم في البيت فيه أوزان ومات", "A home gym with weights and mats"),
    eyebrow: L("العاشر من رمضان", "10th of Ramadan"),
    title: L("حديد بسعر المصنع", "Iron at factory prices"),
    text: L("بنستورد ونجمّع ونوصّل بنفسنا، فمفيش وسيط بينك وبين المخزن.", "We import, assemble and deliver ourselves, so there is no middleman between you and the warehouse."),
    more: L("وكل منتج عليه ضمان ٥ سنين.", "And every product carries a five-year warranty."),
    button: L("تسوق المعدات", "Shop equipment"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات قوة للجيمات والبيوت.", "Strength equipment for gyms and homes."),
  categories: [
    ["kettlebells", "كيتل بيل", "Kettlebells", PHOTOS.greyKettlebells],
    ["dumbbells", "دمبل", "Dumbbells", PHOTOS.hexDumbbells],
    ["functional", "تمارين وظيفية", "Functional", PHOTOS.ropes],
  ],
  products: [
    ["kettlebell-set-rack", "kettlebells", "طقم كيتل بيل بالحامل", "Kettlebell Set with Rack", PHOTOS.kettlebellRackSmall, 9800, { isFeatured: true, rating: 4.9, sold90: 84 }],
    ["cast-kettlebell-pair", "kettlebells", "زوج كيتل بيل حديد زهر", "Cast Kettlebell Pair", PHOTOS.greyKettlebells, 1850, { sold90: 120 }],
    ["outdoor-kettlebells", "kettlebells", "كيتل بيل للحديقة", "Outdoor Kettlebells", PHOTOS.grassKettlebells, 1450, { compareAtPrice: 1700, sold90: 52 }],
    ["hex-dumbbell-set", "dumbbells", "طقم دمبل سداسي", "Hex Dumbbell Set", PHOTOS.hexDumbbells, 6400, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["neoprene-dumbbells", "dumbbells", "دمبل نيوبرين", "Neoprene Dumbbells", PHOTOS.blueDumbbells, 520, { sold90: 210 }],
    ["vinyl-dumbbell-pair", "dumbbells", "زوج دمبل فينيل", "Vinyl Dumbbell Pair", PHOTOS.vinylDumbbells, 380, { sold90: 140 }],
    ["battle-rope", "functional", "حبل باتل ١٢ متر", "Battle Rope 12 m", PHOTOS.ropes, 1950, { rating: 4.7, sold90: 40 }],
    ["band-set-pro", "functional", "طقم حبال مقاومة برو", "Pro Band Set", PHOTOS.bands, 560, { sold90: 115 }],
    ["mat-and-weights-bundle", "functional", "باقة مات وأوزان", "Mat & Weights Bundle", PHOTOS.matDumbbells, 1250, { inStock: false, sold90: 33 }],
    ["home-gym-package", "functional", "باكدج جيم البيت", "Home Gym Package", PHOTOS.gymRoomSmall, 24500, { compareAtPrice: 28000, sold90: 12 }],
  ],
});

export const CORE = libraryTemplate({
  key: CORE_KEY,
  version: 3,
  changelog: "Core v3: product page",
  name: L("كور", "Core"),
  description: L(
    "معدات قوة: منتج مميز بتاج عرض، الأرقام، عرضين والأكثر طلباً. أربع صفحات جاهزة.",
    "Strength equipment: a featured product with an offer tag, the numbers, two offers and the most ordered. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 340,
  palette: ["#f4f4f2", "#e6e6e2", "#ff4d4d", "#101010"],
  colors: {
    primary: "#101010",
    secondary: "#e6e6e2",
    background: "#f4f4f2",
    foreground: "#101010",
    muted: "#5a5a58",
    border: "#d9d9d4",
    accent: "#ff4d4d",
  },
  fonts: { heading: "Cairo", body: "Cairo" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كور", "About"), seo: { title: L("عن كور", "About Core") }, sections: about },
    {
      slug: "contact",
      name: L("اطلب عرض سعر", "Get a quote"),
      seo: { title: L("اطلب عرض سعر", "Get a quote") },
      sections: contactPage(lib, {
        title: L("اطلب عرض سعر", "Get a quote"),
        text: L("المنطقة الصناعية الثالثة، العاشر من رمضان.", "Industrial Zone 3, 10th of Ramadan."),
        heading: L("بتجهز جيم؟ ابعتلنا المساحة والميزانية", "Equipping a gym? Send us the space and budget"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والتركيب والضمان.", "Delivery, setup and warranty."),
        question: L("التركيب عليه فلوس؟", "Does setup cost extra?"),
        answer: L("التركيب مجاني في القاهرة والجيزة للطلبات فوق ٥٠٠٠ ج.م.", "Setup is free in Cairo and Giza on orders over EGP 5,000."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "flat", thumbs: "side", headingCase: "upper", tracking: 0.06, band: "paper", copy: { back: L("رجوع للمعدات", "Back to the equipment"), reviews: L("آراء الأكثر طلباً", "What buyers say"), related: L("معدات تكمّل الصالة", "Equipment to build out your gym") } },
});
