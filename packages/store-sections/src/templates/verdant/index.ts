/**
 * Verdant (template 21, plant shop; Claude Design "Storefront Templates"):
 * pale sage paper, a leaf green for actions and a soft green highlight,
 * Noto Naskh Arabic headings over IBM Plex Sans Arabic and 14px corners. A
 * nursery-led store: department tabs, a bento opening, find your plant,
 * what comes with every plant, a segmented shelf, a customer story and
 * plant questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): houseplants, pots,
 * succulents, dried stems and a greenhouse. No people or hands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const VERDANT_KEY = "verdant";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(VERDANT_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  plantShelf: pexels(37023906),
  monsteraWindow: pexels(12014192, 900),
  monsteraWall: pexels(9088036, 900),
  monsteraPot: pexels(11329174, 900),
  pothosYellow: pexels(7245620, 900),
  shelves: pexels(8600800, 900),
  succulents: pexels(36620948, 900),
  cacti: pexels(7208488, 900),
  terracottaPots: pexels(10991800, 900),
  pastelPots: pexels(19712946, 900),
  whitePot: pexels(18294113, 900),
  driedPalm: pexels(6963598, 900),
  driedPastel: pexels(9130761, 900),
  greenhouse: pexels(6777855),
};

const NAME = L("جنينة", "Ganina");

const header = lib("header-departments", {
  text: {
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "نساء": L("داخلي", "Indoor"),
    "رجال": L("أصص", "Pots"),
    "أطفال": L("العناية", "Care"),
    "ملابس": L("نباتات بيت", "Houseplants"),
    "أحذية": L("سهلة العناية", "Easy care"),
    "شنط": L("ورد مجفف", "Dried stems"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [SHOP, SHOP, "/faq", undefined, NEW, SHOP, SHOP, SHOP, RATED] },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("نصايح العناية الموسمية والنباتات الجديدة أول بأول.", "Seasonal care tips and new plants as they arrive."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ جنينة. كل الحقوق محفوظة.", "© 2026 Ganina. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("مشتلنا", "Our nursery"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.plantShelf],
    text: {
      "وصل جديد": L("زراعة الخريف", "Autumn planting"),
      "صوت أنقى، كل يوم": L("دخّل الجنينة البيت", "Bring the garden inside"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "نباتات بيت بصحتها من مشتلنا في الجيزة، توصل في أصيصها ومعاها كارت عناية.",
        "Healthy houseplants from our Giza nursery, delivered in their pots with a care card.",
      ),
      "تسوق الآن": L("تسوق النباتات", "Shop plants"),
      "صورة الحملة": L("رف خشب عليه نباتات بيت", "A wooden shelf of houseplants"),
      "من ١٢ ألف تقييم": L("من أكتر من ٦٠٠ عميل", "from 600+ plant parents"),
    },
  }),
  lib("categories-feature-list", { text: { "الأقسام": L("لاقي نبتتك", "Find your plant"), "كل الأقسام": L("كل النباتات", "All plants") } }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.monsteraWindow],
    text: {
      "صورة المتجر": L("مونستيرا جنب الشباك", "A Monstera by the window"),
      "مع كل طلب": L("مع كل نبتة", "With every plant"),
      "كل منتج بيتراجع قبل ما يوصلك": L("توصل جاهزة تكبر", "Delivered ready to thrive"),
      "فاتورة رسمية وضمان": L("كارت عناية فيه نصايح النور والمية", "A care card with light and water tips"),
      "تغليف محمي من الصدمات": L("متغلفة واقفة في علبة مبطّنة", "Packed upright in a padded box"),
      "رقم تتبع على واتساب": L("بديل مجاني لو وصلت تعبانة", "A free replacement if it arrives unwell"),
      "اعرف أكتر": L("اقرا الأسئلة", "Plant questions"),
    },
    links: { "/about": "/faq" },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختار نبتتك", "Pick your plant"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«المونستيرا وصلت ولا ورقة اتثنت، وبعد ٣ شهور طلعت ٤ ورقات جديدة.»",
        "“The Monstera arrived without a single bent leaf, and three months later it has four new leaves.”",
      ),
      "م": L("ل", "L"),
      "مريم أ.": L("ليلى ع.", "Laila A."),
    },
  }),
  lib("faq-cards", {
    text: {
      "قبل أن تطلب": L("أسئلة عن النباتات", "Plant questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("أحط النبتة فين؟", "Where should I put my plant?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "كارت العناية بيقولك نوع النور. معظم نباتات البيت بتحب نور ساطع غير مباشر جنب شباك.",
        "The care card tells you the light it needs. Most houseplants like bright, indirect light near a window.",
      ),
      "ما سياسة الاسترجاع؟": L("لو النبتة وصلت تعبانة؟", "What if the plant arrives unwell?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "ضمان ١٤ يوم: ابعتلنا صورة ونبعتلك واحدة جديدة ببلاش.",
        "A 14-day guarantee: send us a photo and we send a new one free.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مشتلنا", "Our nursery"), L("مشتل عائلي على طريق المنصورية بيزرع من ١٩٩٨.", "A family nursery on the Mansouriya road growing plants since 1998.")),
  aboutStory(lib, {
    photo: PHOTOS.greenhouse,
    alt: L("صوبة مليانة نباتات", "A greenhouse full of plants"),
    eyebrow: L("من ١٩٩٨", "Since 1998"),
    title: L("بنزرعها قبل ما نبيعها", "We grow them before we sell them"),
    text: L("كل نبتة بتكبر في صوبتنا لحد ما تبقى جاهزة، وبتتغلف واقفة عشان توصلك بصحتها.", "Every plant grows in our greenhouse until it is ready, then ships upright so it reaches you healthy."),
    more: L("ومعاها كارت عناية وضمان ١٤ يوم.", "With a care card and a 14-day guarantee."),
    button: L("تسوق النباتات", "Shop plants"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("نباتات بصحتها توصلك في أصيصها.", "Healthy plants, delivered in their pots."),
  categories: [
    ["indoor", "نباتات بيت", "Houseplants", PHOTOS.monsteraWall],
    ["easy", "سهلة العناية", "Easy care", PHOTOS.succulents],
    ["pots", "أصص", "Pots", PHOTOS.pastelPots],
    ["dried", "ورد مجفف", "Dried stems", PHOTOS.driedPalm],
  ],
  products: [
    ["monstera-deliciosa", "indoor", "مونستيرا", "Monstera Deliciosa", PHOTOS.monsteraPot, 650, { isFeatured: true, rating: 4.9, sold90: 240 }],
    ["golden-pothos", "indoor", "بوتس ذهبي", "Golden Pothos", PHOTOS.pothosYellow, 380, { sold90: 88 }],
    ["silver-leaf-plant", "indoor", "نبتة ورق فضي", "Silver Leaf Plant", PHOTOS.whitePot, 420, { sold90: 52 }],
    ["succulent-dozen", "easy", "١٢ صبار صغير", "Succulent Dozen", PHOTOS.succulents, 520, { compareAtPrice: 620, rating: 4.8, sold90: 156 }],
    ["cactus-garden", "easy", "جنينة صبار", "Cactus Garden", PHOTOS.cacti, 460, { sold90: 27 }],
    ["terracotta-pot-set", "pots", "طقم أصص فخار", "Terracotta Pot Set", PHOTOS.terracottaPots, 420, { isFeatured: true, sold90: 64 }],
    ["pastel-pot-family", "pots", "عيلة أصص باستيل", "Pastel Pot Family", PHOTOS.pastelPots, 560, { sold90: 31 }],
    ["dried-palm-bouquet", "dried", "بوكيه نخيل مجفف", "Dried Palm Bouquet", PHOTOS.driedPalm, 290, { compareAtPrice: 340, sold90: 42 }],
    ["pastel-dried-stems", "dried", "ورد مجفف باستيل", "Pastel Dried Stems", PHOTOS.driedPastel, 380, { inStock: false, sold90: 19 }],
  ],
});

export const VERDANT = libraryTemplate({
  key: VERDANT_KEY,
  version: 2,
  name: L("فيردانت", "Verdant"),
  description: L(
    "محل نباتات: افتتاحية بنتو، لاقي نبتتك، اللي بييجي مع كل نبتة وأسئلة العناية. أربع صفحات جاهزة.",
    "Plant shop: a bento opening, find your plant, what comes with every plant and care questions. Four ready pages.",
  ),
  category: "home",
  sortOrder: 210,
  palette: ["#f2f4ec", "#dfe7d3", "#3f7d4e", "#1d2a1f"],
  colors: {
    primary: "#3f7d4e",
    secondary: "#dfe7d3",
    background: "#f2f4ec",
    foreground: "#1d2a1f",
    muted: "#56645a",
    border: "#d3dcc6",
    accent: "#c9dbb3",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "IBM Plex Sans Arabic" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("مشتلنا", "Our nursery"), seo: { title: L("مشتلنا", "Our nursery") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("مشتل ٤، الطريق الدائري، المنصورية، الجيزة.", "Nursery 4, Ring Road, Mansouriya, Giza."),
        heading: L("ابعتلنا صورة نبتتك", "Send us a photo of your plant"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والتوصيل والضمان.", "Care, delivery and the guarantee."),
        question: L("أسقي النبتة كل قد إيه؟", "How often should I water?"),
        answer: L(
          "اسقي لما أول ٣ سم من التربة تنشف. معظم النباتات بتموت من كتر المية مش من قلتها.",
          "Water when the top 3 cm of soil is dry. Most plants die from too much water, not too little.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
