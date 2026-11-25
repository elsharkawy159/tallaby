/**
 * Zarea (template 77, plants and pots; Claude Design "Storefront
 * Templates"): pale sage paper, a deep leaf green for actions and a mint
 * highlight, Alexandria throughout and soft 22px corners. A plant shop for
 * Cairo flats: a bento opening with the 30-day guarantee, how much light do
 * you get, a segmented shelf, care in four steps, customers' green corners
 * and the plants that are still alive. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): houseplants, cacti,
 * succulents, terracotta pots, dried stems and plant corners. No people, no
 * hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const ZAREA_KEY = "zarea";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAREA_KEY, getDesign(id)!, { corners: 22, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  monsteraCorner: pexels(18263840),
  plantStools: pexels(4484184, 900),
  cactusShelf: pexels(7623077, 900),
  terracottaBig: pexels(17962521, 900),
  ferns: pexels(35920773),
  monstera: pexels(27022471, 900),
  philodendron: pexels(9116727, 900),
  pothos: pexels(12643650, 900),
  windowMonstera: pexels(12210458, 900),
  succulentShelf: pexels(36058908, 900),
  zz: pexels(5173850, 900),
  cactus: pexels(1058963, 900),
  succulent: pexels(5579163, 900),
  potStack: pexels(9412408, 900),
  driedStems: pexels(9130691, 900),
  brickCorner: pexels(20432880, 900),
  windowLedge: pexels(9710609, 900),
  balcony: pexels(31090396, 900),
  palmCorner: pexels(8366802, 900),
  cafeMonstera: pexels(34673919, 900),
};

const NAME = L("زرعة بلانتس", "Zarea Plants");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("النباتات", "Plants"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("العناية", "Care") },
  links: { "/products": [SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("نصائح العناية ونباتات جديدة في بريدك.", "Care tips and new plants in your inbox."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ زرعة بلانتس. كل الحقوق محفوظة.", "© 2026 Zarea Plants. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("مشتلنا", "Our nursery"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.monsteraCorner],
    text: {
      "وصل جديد": L("وصل حديثًا", "New in"),
      "صوت أنقى، كل يوم": L("نباتات داخلية وأصص", "Indoor plants and pots"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "نباتات داخلية سهلة العناية وأصص فخار.",
        "Easy-care indoor plants and clay pots.",
      ),
      "تسوق الآن": L("تسوق النباتات", "Shop plants"),
      "صورة الحملة": L("مونستيرا على كرسي خشبي في ركن مضيء", "A Monstera on a wooden stool in a bright corner"),
      "٤٫٨": L("داخلية", "Indoor"),
      "تقييم العملاء": L("نباتات سهلة العناية", "Easy-care plants"),
    },
  }),
  lib("categories-circles", { text: { "ما الذي تبحث عنه؟": L("نبتتك القادمة", "Your next plant") } }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب اختيارك": L("المتجر", "Shop"),
      "وصل جديد": L("وصل جديد", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
      "عليه خصم": L("الأعلى تقييماً", "Top rated"),
      "كل المنتجات": L("كل النباتات", "All plants"),
    },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("finder-use", {
    text: {
      "ساعدني أختار": L("ساعدني أختار", "Help me choose"),
      "فيمَ ستستخدمها؟": L("ما كمية الضوء لديك؟", "How much light do you get?"),
      "اختر الاستخدام، ونعرض لك المنتجات المناسبة له.": L("اختر كمية الضوء، ونعرض لك النباتات المناسبة لها.", "Pick your light, and we show you the plants that suit it."),
      "التنقل": L("شمس كثيرة", "Lots of sun"),
      "الرياضة": L("ضوء غير مباشر", "Bright, indirect light"),
      "المكالمات": L("ضوء قليل", "A little light"),
      "العمل من المنزل": L("أنسى الري", "I forget to water"),
      "الأكثر طلبًا الآن": L("الأكثر طلبًا الآن", "Popular right now"),
    },
    links: { "/products": [search("صبار"), search("مونستيرا"), search("زاميا"), search("عصارية")] },
  }),
  lib("text-steps", {
    text: {
      "كيف ترجع منتجًا": L("العناية في ٤ خطوات", "Care in four steps"),
      "راسلنا على واتساب": L("الضوء", "Light"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("بجانب نافذة، بعيدًا عن الشمس المباشرة.", "Near a window, not in direct sun."),
      "جهّز المنتج": L("الماء", "Water"),
      "في علبته الأصلية بكل الإكسسوارات.": L("عندما تجف أول ٢ سم من التربة.", "When the top 2 cm of soil are dry."),
      "يستلمه المندوب": L("السماد", "Feed"),
      "من عنوانك خلال يومي عمل.": L("مرة في الشهر صيفًا، ودون سماد شتاءً.", "Once a month in summer, none in winter."),
      "استرداد المبلغ": L("إذا ذبلت", "If it struggles"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("أرسل لنا صورة، وسنساعدك في العناية بها.", "Send us a photo, and we will help you care for it."),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.brickCorner, PHOTOS.windowLedge, PHOTOS.balcony, PHOTOS.palmCorner, PHOTOS.cafeMonstera],
    text: {
      "عملاؤنا": L("أركان عملائنا الخضراء", "Your green corners"),
      "أرسل لنا صورتك": L("أرسل لنا صورة ركنك", "Send us your corner"),
      "مريم": handle("@leafy.zamalek"),
      "عمر": handle("@plants.maadi"),
      "نور": handle("@monstera.mama"),
      "يوسف": handle("@balcony.heliopolis"),
      "سلمى": handle("@green.dokki"),
    },
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  // 3 across: the demo's category holds 3 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 3 }], nodes: { "منتجات القسم": { style: { columns: 3 } } } }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء عملائنا", "What our customers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "المونستيرا وصلت سليمة، وظهرت أوراق جديدة بعد أشهر.",
        "The Monstera arrived intact, and new leaves came after a few months.",
      ),
      "مريم أ.": L("مريم أ.", "Mariam A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "الزاميا تتحمل الضوء القليل كما في الوصف.",
        "The ZZ plant handles low light, as described.",
      ),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "البوتس ينمو بسرعة، وتعليمات العناية واضحة.",
        "The pothos grows fast, and the care notes are clear.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("النبتة كانت مغلفة جيدًا ومرتبة في علبتها.", "The plant was well packed, upright in its box."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الأصيص الحجري أثقل وأجمل من الصورة.", "The stoneware pot is heavier and nicer than the photo."),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("الصبار مناسب لمن ينسى الري، وما زال بحالة ممتازة.", "The cactus suits someone who forgets to water, and it is still doing great."),
      "كل الآراء": L("تسوق النباتات", "Shop plants"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مشتلنا", "Our nursery"), L("نباتات داخلية وأصص وأدوات عناية.", "Indoor plants, pots and care tools.")),
  aboutStory(lib, {
    photo: PHOTOS.ferns,
    alt: L("سرخس في أصص فخار", "Ferns in terracotta pots"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("نباتات تناسب المساحات الداخلية", "Plants for indoor spaces"),
    text: L("نختار نباتات تتحمل الحرارة والتكييف والضوء القليل، ونكتب طريقة العناية بكل نبتة.", "We choose plants that handle heat, air conditioning and low light, and list how to care for each one."),
    more: L("تواصل معنا لأي سؤال عن العناية بنبتتك.", "Contact us with any question about caring for your plant."),
    button: L("تسوق النباتات", "Shop plants"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("نباتات داخلية سهلة العناية وأصص.", "Easy-care indoor plants and pots."),
  categories: [
    ["indoor", "داخلي", "Indoor", PHOTOS.plantStools],
    ["easy", "سهلة العناية", "Easy care", PHOTOS.cactusShelf],
    ["pots", "أصص", "Pots", PHOTOS.terracottaBig],
    ["cacti", "صبار وعصاريات", "Cacti & succulents", PHOTOS.cactus],
    ["climbers", "نباتات متسلقة", "Climbers", PHOTOS.pothos],
    ["dried", "نباتات مجففة", "Dried stems", PHOTOS.driedStems],
  ],
  products: [
    ["monstera-deliciosa", "indoor", "مونستيرا", "Monstera Deliciosa", PHOTOS.monstera, 650, { isFeatured: true, rating: 4.8, sold90: 140 }],
    ["philodendron-pair", "indoor", "زوج فيلوديندرون", "Philodendron Pair", PHOTOS.philodendron, 780, { rating: 4.7, sold90: 88 }],
    ["golden-pothos", "climbers", "بوتس ذهبي", "Golden Pothos", PHOTOS.pothos, 420, { sold90: 96 }],
    ["small-monstera", "indoor", "مونستيرا صغيرة", "Small Monstera", PHOTOS.windowMonstera, 380, { sold90: 54 }],
    ["shelf-starter-trio", "easy", "٣ نباتات عصارية للرف", "Shelf Starter Trio", PHOTOS.succulentShelf, 520, { isFeatured: true, rating: 4.9, sold90: 160 }],
    ["zz-plant", "easy", "زاميا", "ZZ Plant", PHOTOS.zz, 450, { sold90: 72 }],
    ["desert-cactus", "cacti", "صبار في أصيص سيراميك", "Desert Cactus", PHOTOS.cactus, 320, { sold90: 61 }],
    ["mini-succulent", "cacti", "عصارية صغيرة", "Mini Succulent", PHOTOS.succulent, 180, { sold90: 120 }],
    ["dried-stems", "dried", "فروع مجففة", "Dried Stems", PHOTOS.driedStems, 290, { sold90: 20 }],
    ["terracotta-pot-set", "pots", "طقم أصص فخار", "Terracotta Pot Set", PHOTOS.potStack, 380, { compareAtPrice: 450, sold90: 52 }],
    ["large-clay-pot", "pots", "أصيص فخار كبير", "Large Clay Pot", PHOTOS.terracottaBig, 520, { inStock: false, sold90: 18 }],
  ],
});

export const ZAREA = libraryTemplate({
  key: ZAREA_KEY,
  version: 4,
  changelog: "Zarea v4: products by category in a swipe row on the home",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("ركن أخضر عند عملائنا", "Customers' green corners"), related: L("نباتات تناسبه", "A plant to go with it") } },
  name: L("زرعة", "Zarea"),
  description: L(
    "نباتات وأصص: افتتاحية بالنباتات، اختر حسب الضوء، العناية في خطوات وأركان العملاء الخضراء. أربع صفحات جاهزة.",
    "Plants and pots: a plant-led opening, choose by light, care in steps and customers’ green corners. Four ready pages.",
  ),
  category: "home",
  style: ["warm"],
  sortOrder: 770,
  palette: ["#f4f6ef", "#e2e9d8", "#d8f3dc", "#2d6a4f"],
  colors: {
    primary: "#2d6a4f",
    secondary: "#e2e9d8",
    background: "#ffffff",
    foreground: "#17251b",
    muted: "#506052",
    border: "#d0dbc2",
    accent: "#d8f3dc",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 22,
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
        text: L("أرسل لنا صورة نبتتك، وسنساعدك في العناية بها.", "Send us a photo of your plant, and we will help you care for it."),
        heading: L("اسأل عن نبتتك", "Ask about your plant"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والضوء والري.", "Care, light and watering."),
        question: L("كم مرة أسقي النبتة؟", "How often should I water?"),
        answer: L("عندما تجف أول ٢ سم من التربة، وطريقة العناية مكتوبة في صفحة كل نبتة.", "When the top 2 cm of soil are dry; care notes are on each plant's page."),
      }),
    },
  ],
  demo: DEMO,
});
