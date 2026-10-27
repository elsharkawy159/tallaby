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
    "اشترك وخد العروض قبل أي حد.": L("نصايح عناية كل شهر، ونباتات جديدة أول ما توصل.", "Monthly care tips, and new plants as soon as they land."),
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
      "وصل جديد": L("مضمونة", "Guaranteed"),
      "صوت أنقى، كل يوم": L("نباتات بتفضل عايشة", "Plants that stay alive"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "متختارة لشقق القاهرة، وبتتغير ببلاش لو ماتت في ٣٠ يوم.",
        "Chosen for Cairo flats, and replaced free if they fail within 30 days.",
      ),
      "تسوق الآن": L("تسوق النباتات", "Shop plants"),
      "صورة الحملة": L("مونستيرا على كرسي خشب في ركن منوّر", "A Monstera on a wooden stool in a bright corner"),
      "من ١٢ ألف تقييم": L("من أكتر من ٤٠٠ تقييم", "from 400+ reviews"),
    },
  }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("زرعتك الجاية", "Your next plant") } }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("المتجر", "Shop"),
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
      "هتستخدمها في إيه؟": L("عندك نور قد إيه؟", "How much light do you get?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختار حالة بيتك ونوريك النباتات اللي هتعيش فيه.", "Pick what your home is like and we show you the plants that will live there."),
      "المشاوير": L("شمس كتير", "Lots of sun"),
      "الرياضة": L("نور غير مباشر", "Bright, indirect light"),
      "المكالمات": L("نور قليل", "A little light"),
      "الشغل من البيت": L("بنسى أسقي", "I forget to water"),
      "الأكثر طلبًا دلوقتي": L("الأكثر طلباً دلوقتي", "Popular right now"),
    },
    links: { "/products": [search("صبار"), search("مونستيرا"), search("زاميا"), search("عصارية")] },
  }),
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("العناية في ٤ خطوات", "Care in four steps"),
      "ابعتلنا على واتساب": L("النور", "Light"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("جنب شباك، مش في الشمس على طول.", "Near a window, not in direct sun."),
      "جهّز المنتج": L("المية", "Water"),
      "في علبته الأصلية بكل الإكسسوارات.": L("لما أول ٢ سم من التربة يبقوا ناشفين.", "When the top 2 cm of soil are dry."),
      "المندوب يستلم": L("السماد", "Feed"),
      "خلال يومين شغل من عنوانك.": L("مرة في الشهر في الصيف، ومن غير سماد في الشتا.", "Once a month in summer, none in winter."),
      "فلوسك ترجع": L("لو تعبت", "If it struggles"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("ابعتلنا صورة على واتساب خلال ٣٠ يوم ونبدّلها ببلاش.", "Send us a photo on WhatsApp within 30 days and we replace it free."),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.brickCorner, PHOTOS.windowLedge, PHOTOS.balcony, PHOTOS.palmCorner, PHOTOS.cafeMonstera],
    text: {
      "عملاؤنا": L("أركانكم الخضرا", "Your green corners"),
      "أرسل لنا صورتك": L("ابعتلنا صورة ركنك", "Send us your corner"),
      "مريم": handle("@leafy.zamalek"),
      "عمر": handle("@plants.maadi"),
      "نور": handle("@monstera.mama"),
      "يوسف": handle("@balcony.heliopolis"),
      "سلمى": handle("@green.dokki"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("لسه عايشين", "Still alive"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "المونستيرا وصلت ولا ورقة اتثنت، وبعد ٣ شهور طلعت ٤ ورقات جديدة.",
        "The Monstera arrived without a bent leaf, and three months later it has four new leaves.",
      ),
      "مريم أ.": L("مريم أ.", "Mariam A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "شقتي ضلمة شوية والزاميا عايشة بقالها سنة من غير أي مشاكل.",
        "My flat is quite dark and the ZZ plant has lived a year without any trouble.",
      ),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "البوتس اصفرّ في أول أسبوع، بعتلهم صورة وبدّلوه تاني يوم.",
        "The pothos yellowed in the first week; I sent a photo and they replaced it the next day.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصلت أسيوط في ٣ أيام وهي واقفة في علبتها ومبلولة.", "It reached Assiut in 3 days, upright in its box and still damp."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الأصيص الستون وير أتقل وأحلى من الصورة.", "The stoneware pot is heavier and nicer than the photo."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("قلتلهم إني بنسى أسقي، ونصحوني بالصبار. لسه عايش!", "I told them I forget to water and they suggested cacti. Still alive!"),
      "كل الآراء": L("تسوق النباتات", "Shop plants"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مشتلنا", "Our nursery"), L("مشتل صغير في القناطر بيختار نباتات تعيش في الشقق.", "A small nursery in Qanater choosing plants that live in flats.")),
  aboutStory(lib, {
    photo: PHOTOS.ferns,
    alt: L("سرخس في أصص فخار", "Ferns in terracotta pots"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("بنجرب كل نبتة في شقة قبل ما نبيعها", "We test every plant in a flat before we sell it"),
    text: L("مش كل نبتة حلوة بتعيش في القاهرة. بنختار اللي بتستحمل الحر والتكييف والنور القليل.", "Not every pretty plant survives Cairo. We pick the ones that handle heat, air conditioning and low light."),
    more: L("وكل نبتة معاها ضمان ٣٠ يوم.", "And every plant has a 30-day guarantee."),
    button: L("تسوق النباتات", "Shop plants"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("نباتات بتعيش في شقة في القاهرة.", "Indoor plants that survive a Cairo flat."),
  categories: [
    ["indoor", "داخلي", "Indoor", PHOTOS.plantStools],
    ["easy", "سهلة العناية", "Easy care", PHOTOS.cactusShelf],
    ["pots", "أصص", "Pots", PHOTOS.terracottaBig],
  ],
  products: [
    ["monstera-deliciosa", "indoor", "مونستيرا", "Monstera Deliciosa", PHOTOS.monstera, 650, { isFeatured: true, rating: 4.8, sold90: 140 }],
    ["philodendron-pair", "indoor", "فيلوديندرون اتنين", "Philodendron Pair", PHOTOS.philodendron, 780, { rating: 4.7, sold90: 88 }],
    ["golden-pothos", "indoor", "بوتس ذهبي", "Golden Pothos", PHOTOS.pothos, 420, { sold90: 96 }],
    ["small-monstera", "indoor", "مونستيرا صغيرة", "Small Monstera", PHOTOS.windowMonstera, 380, { sold90: 54 }],
    ["shelf-starter-trio", "easy", "٣ نباتات عصارية للرف", "Shelf Starter Trio", PHOTOS.succulentShelf, 520, { isFeatured: true, rating: 4.9, sold90: 160 }],
    ["zz-plant", "easy", "زاميا", "ZZ Plant", PHOTOS.zz, 450, { sold90: 72 }],
    ["desert-cactus", "easy", "صبار في أصيص سيراميك", "Desert Cactus", PHOTOS.cactus, 320, { sold90: 61 }],
    ["mini-succulent", "easy", "عصارية صغيرة", "Mini Succulent", PHOTOS.succulent, 180, { sold90: 120 }],
    ["dried-stems", "easy", "فروع ناشفة", "Dried Stems", PHOTOS.driedStems, 290, { sold90: 20 }],
    ["terracotta-pot-set", "pots", "طقم أصص فخار", "Terracotta Pot Set", PHOTOS.potStack, 380, { compareAtPrice: 450, sold90: 52 }],
    ["large-clay-pot", "pots", "أصيص فخار كبير", "Large Clay Pot", PHOTOS.terracottaBig, 520, { inStock: false, sold90: 18 }],
  ],
});

export const ZAREA = libraryTemplate({
  key: ZAREA_KEY,
  version: 3,
  changelog: "Zarea v3: categories, section order",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { back: L("رجوع للنباتات", "Back to the plants"), reviews: L("ركن أخضر عند عملائنا", "Customers' green corners"), related: L("نبات تاني يعيش معاه", "A plant to live beside it") } },
  name: L("زرعة", "Zarea"),
  description: L(
    "نباتات وأصص: ضمان ٣٠ يوم، اختار حسب النور، العناية في خطوات وأركان العملاء الخضرا. أربع صفحات جاهزة.",
    "Plants and pots: a 30-day guarantee, choose by light, care in steps and customers’ green corners. Four ready pages.",
  ),
  category: "home",
  sortOrder: 770,
  palette: ["#f4f6ef", "#e2e9d8", "#d8f3dc", "#2d6a4f"],
  colors: {
    primary: "#2d6a4f",
    secondary: "#e2e9d8",
    background: "#f4f6ef",
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
        text: L("ابعتلنا صورة نبتتك أو ركنك ونقولك يناسبه إيه.", "Send us a photo of your plant or corner and we will tell you what suits it."),
        heading: L("ابعتلنا صورة نبتتك", "Send us a photo of your plant"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والتوصيل وضمان ٣٠ يوم.", "Care, delivery and the 30-day guarantee."),
        question: L("ضمان الـ٣٠ يوم بيشتغل إزاي؟", "How does the 30-day guarantee work?"),
        answer: L("لو النبتة تعبت خلال ٣٠ يوم، ابعتلنا صورة على واتساب ونبعتلك واحدة جديدة ببلاش.", "If the plant struggles within 30 days, send us a photo on WhatsApp and we send a new one free."),
      }),
    },
  ],
  demo: DEMO,
});
