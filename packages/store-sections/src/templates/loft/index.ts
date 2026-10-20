/**
 * Loft (template 22, modern furniture; Claude Design "Storefront
 * Templates"): warm off-white paper, near-black actions and a sand
 * highlight, Amiri headings over Noto Sans Arabic and almost square
 * corners. A showroom store: a split opening, shop by piece, best sellers,
 * three generations of carpenters, the rating summary and delivery
 * questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): sofas, armchairs,
 * tables, dining sets, beds and lamps in rooms. No people.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LOFT_KEY = "loft";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LOFT_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  beigeLiving: pexels(39828916),
  greenSofa: pexels(4846087, 900),
  navySofa: pexels(30386991, 900),
  olivesArmchairs: pexels(13806257, 900),
  beigeArmchair: pexels(7195580, 900),
  greenMarbleTable: pexels(19991831, 900),
  diningRoom: pexels(3935326, 900),
  roundDining: pexels(7180275, 900),
  woodBed: pexels(5644286, 900),
  floorLamps: pexels(11850174, 900),
  redChair: pexels(6078545, 900),
  oakDining: pexels(8113029, 900),
};

const NAME = L("بيت مودرن", "Beit Modern");

const header = lib("header-centered", {
  text: {
    "المتجر": L("كنب", "Sofas"),
    "العروض": L("فوتيهات", "Armchairs"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("أثاث معمول في دمياط", "Furniture made in Damietta"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("المعرض", "Showroom"),
  },
  links: { "/products": [search("كنبة"), search("فوتيه"), undefined, search("كنبة"), search("فوتيه")], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("أثاث معمول في دمياط، يوصلك ويتركب.", "Furniture made in Damietta, delivered and assembled."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت مودرن. كل الحقوق محفوظة.", "© 2026 Beit Modern. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("المعرض", "The showroom"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.beigeLiving],
    text: {
      "كوليكشن الموسم": L("مجموعة جديدة", "New collection"),
      "صوت أنقى، كل يوم": L("أوض شكلها مكتمل", "Rooms that feel finished"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "كنب وفوتيهات وترابيزات معمولة في دمياط، بتوصيل وتركيب مجاني.",
        "Sofas, armchairs and tables built in Damietta, delivered and assembled for free.",
      ),
      "تسوق الآن": L("تسوق الكنب", "Shop sofas"),
      "العروض": L("زور المعرض", "Visit the showroom"),
      "صورة الحملة": L("أوضة معيشة بكنبة بيج", "A living room with a beige sofa"),
    },
    links: { "/products": [search("كنبة"), "/contact"] },
  }),
  lib("categories-rail", {
    photo: [undefined, PHOTOS.greenSofa, PHOTOS.beigeArmchair, PHOTOS.greenMarbleTable],
    text: {
      "اكتشف": L("الأوض", "Rooms"),
      "عالم كامل في كل قسم": L("تسوق حسب القطعة", "Shop by piece"),
      "اختر من أقسامنا؛ في كل قسم أفضل ما جربناه.": L("كل قطعة بتتعمل على الطلب في ٦ لـ ٨ أسابيع.", "Every piece is made to order in six to eight weeks."),
      "وصل حديثًا": L("كنب", "Sofas"),
      "الأكثر مبيعًا": L("فوتيهات", "Armchairs"),
      "العروض": L("ترابيزات", "Tables"),
      "تسوّق الآن": L("تسوق", "Shop"),
    },
    links: { "/products": [SHOP, search("كنبة"), search("فوتيه"), search("ترابيزة")] },
  }),
  lib("products-grid", {
    as: "best-sellers",
    text: { "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"), "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي العملاء بيطلبوها أكتر.", "The pieces customers order most.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.oakDining],
    text: {
      "صورة المتجر": L("سفرة خشب جنب الشباك", "A wooden dining table by the window"),
      "من داخل المتجر": L("صنع في دمياط", "Made in Damietta"),
      "بدأنا من محل صغير": L("٣ أجيال نجارين", "Three generations of carpenters"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L("ورشتنا بتعمل أثاث في دمياط من ١٩٧١.", "Our workshop has built furniture in Damietta since 1971."),
      "اعرف أكثر": L("حكايتنا", "Our story"),
    },
  }),
  lib("testimonials-rating", {
    text: {
      "تقييم عملائنا": L("تقييم العملاء", "Customer rating"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الكنبة وصلت في ميعادها واتركبت في ٣٠ دقيقة وأحلى من اللي في المعرض.",
        "The sofa arrived on time, was assembled in 30 minutes and is even better than the showroom piece.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("محمد إ.", "Mohamed E."),
      "القاهرة": L("التجمع", "New Cairo"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("التقسيط سهّل الموضوع. الجودة ممتازة.", "Instalments made it easy. The quality is excellent."),
      "ع": L("ن", "N"),
      "عمر ك.": L("نهى ف.", "Noha F."),
      "الإسكندرية": L("الشيخ زايد", "Sheikh Zayed"),
      "كل التقييمات": L("الأعلى تقييماً", "Shop top rated"),
    },
    links: { "/products": RATED },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("التوصيل والتركيب", "Delivery & assembly"),
      "كم يستغرق التوصيل؟": L("القطعة بتوصل إمتى؟", "When does my piece arrive?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "كل قطعة بتتعمل على الطلب في ٦ لـ ٨ أسابيع، وبنكلمك قبل التوصيل نحدد ميعاد.",
        "Every piece is made to order in six to eight weeks, and we call you to book a delivery slot.",
      ),
      "ما سياسة الاسترجاع؟": L("التركيب ببلاش؟", "Is assembly free?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "أيوه، التوصيل والتركيب ببلاش فوق ١٥٬٠٠٠ ج.م، وفريقنا بيشيل الكراتين معاه.",
        "Yes. Delivery and assembly are free over EGP 15,000, and our team takes the packaging away.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("المعرض", "The showroom"), L("زورنا في شارع التسعين بالتجمع كل يوم من ١١ الصبح لـ ١٠ بالليل.", "Visit us on 90th Street, New Cairo, every day from 11am to 10pm.")),
  aboutStory(lib, {
    photo: PHOTOS.roundDining,
    alt: L("سفرة مدورة بأطباق بيضا", "A round dining table set with white plates"),
    eyebrow: L("من ١٩٧١", "Since 1971"),
    title: L("ورشة عيلة في دمياط", "A family workshop in Damietta"),
    text: L("بنعمل كل قطعة على الطلب بخشب زان وبلوط، وبنركّبها في بيتك.", "We build every piece to order in beech and oak, and assemble it in your home."),
    more: L("وقسّط على ١٢ شهر من غير ما تستنى.", "And pay over 12 months."),
    button: L("تسوق الكنب", "Shop sofas"),
    href: search("كنبة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث معمول في دمياط، يوصلك ويتركب.", "Furniture made in Damietta, delivered and assembled."),
  categories: [
    ["sofas", "كنب", "Sofas", PHOTOS.navySofa],
    ["chairs", "فوتيهات", "Armchairs", PHOTOS.beigeArmchair],
    ["tables", "ترابيزات", "Tables", PHOTOS.greenMarbleTable],
    ["dining", "سفرة", "Dining", PHOTOS.diningRoom],
    ["lighting", "أباجورات", "Lamps", PHOTOS.floorLamps],
  ],
  products: [
    ["nile-three-seater", "sofas", "كنبة النيل ٣ مقاعد", "Nile Three-Seater", PHOTOS.navySofa, 28500, { isFeatured: true, rating: 4.9, sold90: 86 }],
    ["velvet-lounge-sofa", "sofas", "كنبة قطيفة خضرا", "Green Velvet Sofa", PHOTOS.greenSofa, 32900, { sold90: 24 }],
    ["olive-armchair-pair", "chairs", "زوج فوتيه زيتي", "Olive Armchair Pair", PHOTOS.olivesArmchairs, 17800, { compareAtPrice: 19900, sold90: 41 }],
    ["deep-reading-armchair", "chairs", "فوتيه قراية عميق", "Deep Reading Armchair", PHOTOS.beigeArmchair, 9800, { sold90: 33 }],
    ["green-marble-table", "tables", "ترابيزة رخام أخضر", "Green Marble Coffee Table", PHOTOS.greenMarbleTable, 8900, { isFeatured: true, sold90: 33 }],
    ["oak-dining-six", "dining", "سفرة بلوط ٦ كراسي", "Oak Dining Set for Six", PHOTOS.diningRoom, 46500, { rating: 4.8, sold90: 19 }],
    ["round-dining-four", "dining", "سفرة مدورة ٤ كراسي", "Round Dining Set for Four", PHOTOS.roundDining, 21500, { sold90: 22 }],
    ["oak-bed-frame", "dining", "سرير خشب طبيعي", "Natural Wood Bed", PHOTOS.woodBed, 18900, { sold90: 28 }],
    ["brass-floor-lamps", "lighting", "أباجورة أرضي نحاس", "Brass Floor Lamp", PHOTOS.floorLamps, 3200, { compareAtPrice: 3700, sold90: 58 }],
  ],
});

export const LOFT = libraryTemplate({
  key: LOFT_KEY,
  version: 2,
  name: L("لوفت", "Loft"),
  description: L(
    "أثاث مودرن: افتتاحية نصين، تسوق حسب القطعة، ٣ أجيال نجارين وأسئلة التركيب. أربع صفحات جاهزة.",
    "Modern furniture: a split opening, shop by piece, three generations of carpenters and assembly questions. Four ready pages.",
  ),
  category: "home",
  sortOrder: 220,
  palette: ["#f7f4ef", "#ece6dc", "#d9c3a0", "#22201c"],
  colors: {
    primary: "#22201c",
    secondary: "#ece6dc",
    background: "#f7f4ef",
    foreground: "#22201c",
    muted: "#625b52",
    border: "#ddd5c8",
    accent: "#d9c3a0",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("المعرض", "Showroom"), seo: { title: L("المعرض", "The showroom") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زور المعرض", "Visit the showroom"),
        text: L("معرض ١٢، شارع التسعين، التجمع الخامس.", "Showroom 12, 90th Street, New Cairo."),
        heading: L("احجز زيارة أو اسأل عن قطعة", "Book a visit or ask about a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: [pageHeader(lib, "faq-header", L("الأسئلة الشائعة", "FAQ"), L("التوصيل والتركيب والتقسيط.", "Delivery, assembly and instalments.")), lib("faq-panel", {})],
    },
  ],
  demo: DEMO,
});
