/**
 * Core (template 34, strength equipment; Claude Design "Storefront
 * Templates"): off-white paper, near-black type and a hot red for actions,
 * Cairo throughout and square corners. A gym supplier: one featured
 * product, the equipment aisles, the most ordered, the numbers, who we are
 * and reviews. Built from section library designs (`fromLibrary`).
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
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد المعدات.", "Subscribe for new equipment."),
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
      "تقييمات العملاء": L("تقييمات العملاء", "Customer reviews"),
      "اكتب هنا ما يميز المنتج في سطرين: الخامة، والمدة، ولماذا سيحبه العميل.": L("حديد زهر بطلاء بودرة ومقبض خشن. ستة أوزان على حامل واحد.", "Powder-coated cast iron with a rough grip. Six weights on one rack."),
      "٣ ألوان": L("٦ أوزان", "6 weights"),
      "الألوان": L("الأوزان", "Weights"),
      "٢٠٢٦": L("٢٠٢٦", "2026"),
      "خفيف": L("٤–٢٤ كجم", "4–24 kg"),
      "صورة المنتج": L("حامل كيتل بيل بستة أوزان", "A kettlebell rack with six weights"),
      "جديد": L("على حامل واحد", "On one rack"),
      "وصل حديثًا": L("٦ أوزان", "6 weights"),
      "متوفر الآن": L("من ٤ حتى ٢٤ كجم", "4 to 24 kg"),
    },
    links: { "/products": [search("كيتل"), search("كيتل")] },
  }),
  lib("categories-ruled", { text: { "تسوق بالقسم": L("تسوق حسب التمرين", "Shop by training") } }),
  lib("products-rail", {
    text: { "المفضلة لدى العملاء": L("اختيارات الصالات الرياضية", "Gym favourites"), "الأكثر مبيعًا": L("الأكثر طلباً", "Most ordered") },
    links: { "/products": BEST },
  }),
  lib("stats-big-numbers", {
    text: {
      "أرقامنا تتحدث عنا": L("أرقامنا", "Our numbers"),
      "+٢٥ ألف": L("+٣٤٠", "340+"),
      "طلب تم توصيله": L("صالة واستوديو", "Gyms and studios"),
      "٢٧": L("٦٠", "60"),
      "محافظة نوصل لها": L("طنًا من الحديد سنويًا", "Tonnes of iron a year"),
      "٤٫٨": L("٤٫٩", "4.9"),
      "١٤": L("٨", "8"),
      "يومًا للاسترجاع": L("أقسام للمعدات", "Equipment aisles"),
    },
  }),
  lib("text-columns", {
    text: {
      "عن متجرنا": L("من نحن", "Who we are"),
      "بدأنا بهدف واحد: منتجات جيدة بسعر عادل، يختارها أشخاص يستخدمونها فعلًا.": L("معدات قوة للصالات الرياضية والمنازل: أوزان وحوامل وأرضيات.", "Strength equipment for gyms and homes: weights, racks and flooring."),
      "ونعرض لكل منتج صورًا ومواصفات واضحة لتختار بثقة.": L("ونعرض لكل منتج صورًا ومواصفات واضحة لتختار بثقة.", "With clear photos and specs for every product."),
    },
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("آراء العملاء", "What they say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("الحامل متين والأوزان ثابتة عليه.", "The rack is sturdy and holds the weights firmly."),
      "م": L("ر", "R"),
      "مريم أ.": L("رامي ع.", "Rami A."),
      "القاهرة": L("التجمع", "New Cairo"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("الدمبل السداسي ثابت على الأرض ولا يتدحرج.", "The hex dumbbells sit flat and never roll."),
      "ع": L("م", "M"),
      "عمر ك.": L("مي ج.", "Mai G."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جودة الحديد ممتازة مقابل السعر.", "Great iron quality for the price."),
      "ن": L("ح", "H"),
      "نور ح.": L("حسام ل.", "Hossam L."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كور", "About Core"), L("معدات قوة للصالات الرياضية والمنازل.", "Strength equipment for gyms and homes.")),
  aboutStory(lib, {
    photo: PHOTOS.gymRoom,
    alt: L("صالة منزلية فيها أوزان وسجادة تمرين", "A home gym with weights and mats"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("حديد متين لكل تمرين", "Solid iron for every workout"),
    text: L("نختار أوزانًا وحوامل وأرضيات بمواصفات واضحة للصالات والمنازل.", "We choose weights, racks and flooring with clear specs for gyms and homes."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق المعدات", "Shop equipment"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات قوة للصالات الرياضية والمنازل.", "Strength equipment for gyms and homes."),
  categories: [
    ["kettlebells", "كيتل بيل", "Kettlebells", PHOTOS.greyKettlebells],
    ["dumbbells", "دمبل", "Dumbbells", PHOTOS.hexDumbbells],
    ["functional", "تمارين وظيفية", "Functional", PHOTOS.ropes],
    ["racks", "حوامل ورفوف", "Racks & storage", PHOTOS.kettlebellRack],
    ["bands", "أحزمة مقاومة", "Resistance bands", PHOTOS.bands],
    ["mats", "سجاد تمرين وأرضيات", "Mats & flooring", PHOTOS.matDumbbells],
    ["home-gym", "الصالة المنزلية", "Home gym", PHOTOS.gymRoomSmall],
    ["outdoor", "تمارين خارجية", "Outdoor training", PHOTOS.grassKettlebells],
  ],
  products: [
    ["kettlebell-set-rack", "kettlebells", "طقم كيتل بيل بالحامل", "Kettlebell Set with Rack", PHOTOS.kettlebellRackSmall, 9800, { isFeatured: true, rating: 4.9, sold90: 84 }],
    ["cast-kettlebell-pair", "kettlebells", "زوج كيتل بيل حديد زهر", "Cast Kettlebell Pair", PHOTOS.greyKettlebells, 1850, { sold90: 120 }],
    ["outdoor-kettlebells", "outdoor", "كيتل بيل للحديقة", "Outdoor Kettlebells", PHOTOS.grassKettlebells, 1450, { compareAtPrice: 1700, sold90: 52 }],
    ["hex-dumbbell-set", "dumbbells", "طقم دمبل سداسي", "Hex Dumbbell Set", PHOTOS.hexDumbbells, 6400, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["neoprene-dumbbells", "dumbbells", "دمبل نيوبرين", "Neoprene Dumbbells", PHOTOS.blueDumbbells, 520, { sold90: 210 }],
    ["vinyl-dumbbell-pair", "dumbbells", "زوج دمبل فينيل", "Vinyl Dumbbell Pair", PHOTOS.vinylDumbbells, 380, { sold90: 140 }],
    ["battle-rope", "functional", "حبل تمارين ١٢ متر", "Battle Rope 12 m", PHOTOS.ropes, 1950, { rating: 4.7, sold90: 40 }],
    ["band-set-pro", "bands", "طقم أحزمة مقاومة احترافي", "Pro Band Set", PHOTOS.bands, 560, { sold90: 115 }],
    ["mat-and-weights-bundle", "mats", "مجموعة سجادة وأوزان", "Mat & Weights Bundle", PHOTOS.matDumbbells, 1250, { inStock: false, sold90: 33 }],
    ["home-gym-package", "home-gym", "مجموعة الصالة المنزلية", "Home Gym Package", PHOTOS.gymRoomSmall, 24500, { compareAtPrice: 28000, sold90: 12 }],
    ["dumbbell-storage-rack", "racks", "حامل دمبل ٣ أدوار", "3-Tier Dumbbell Rack", PHOTOS.kettlebellRack, 3900, { sold90: 27 }],
  ],
});

export const CORE = libraryTemplate({
  key: CORE_KEY,
  version: 4,
  changelog: "Core v4: categories, section order, no launch offer",
  name: L("كور", "Core"),
  description: L(
    "معدات قوة: منتج مميز، الأرقام والأكثر طلباً. أربع صفحات جاهزة.",
    "Strength equipment: a featured product, the numbers and the most ordered. Four ready pages.",
  ),
  category: "sports",
  style: ["bold", "minimal"],
  sortOrder: 340,
  palette: ["#f4f4f2", "#e6e6e2", "#ff4d4d", "#101010"],
  colors: {
    primary: "#101010",
    secondary: "#e6e6e2",
    background: "#ffffff",
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
      name: L("تواصل معنا", "Contact us"),
      seo: { title: L("تواصل معنا", "Contact us") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("تواصل معنا لأي سؤال عن المعدات.", "Contact us with any question about our equipment."),
        heading: L("اسأل عن الأوزان والمقاسات", "Ask about weights and sizes"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأوزان والمقاسات والطلبات.", "Weights, sizes and orders."),
        question: L("كيف أختار الوزن المناسب؟", "How do I choose the right weight?"),
        answer: L("تجد الأوزان والمقاسات في صفحة كل منتج، وتواصل معنا لأي سؤال.", "Each product page lists its weights and sizes; contact us with any question."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "flat", thumbs: "side", headingCase: "upper", band: "paper", copy: { reviews: L("آراء المشترين", "What buyers say"), related: L("معدات تكمّل الصالة", "Equipment to build out your gym") } },
});
