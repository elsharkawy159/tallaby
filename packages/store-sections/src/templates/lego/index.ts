/**
 * Tarkib (template 86, building toys; Claude Design "Storefront Templates",
 * template id `lego`): cream paper, a toy-brick red for actions and a sunny
 * yellow highlight, Baloo Bhaijaan 2 throughout and round 16px corners. A
 * builders' toy shop: one big word, shop by the builder's age, top kits,
 * a starter pack of blocks, tools and dinosaurs, safe to play and parents'
 * reviews. Built from section library designs (`fromLibrary`). No branded
 * toys: generic blocks, bricks and wooden kits only.
 *
 * Photos: Pexels, each checked by eye (2026-10-21): numbered blocks, a
 * wooden tool kit laid flat, toy dinosaurs, loose bricks, natural blocks, a
 * puzzle, a rainbow stacker and books on a shelf. The design's photos of
 * children playing were replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LEGO_KEY = "lego";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LEGO_KEY, getDesign(id)!, { corners: 16, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  numberBlocks: pexels(311269, 900),
  toolKit: pexels(7269570, 900),
  dinosOrange: pexels(8014537, 900),
  dinosWhite: pexels(8014582, 900),
  rainbow: pexels(38695466, 900),
  rainbowWide: pexels(38695466),
  books: pexels(31024471, 900),
  bricks: pexels(4491702, 900),
  naturalBlocks: pexels(31061855, 900),
  puzzle: pexels(30708395, 900),
  safari: pexels(3663061, 900),
  stacker: pexels(9271758, 900),
};

const NAME = L("تركيب تويز", "Tarkib Toys");

const header = lib("header-chips", {
  text: { "م": L("ت", "T"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن مكعبات، عدة، ديناصورات…", "Search blocks, tools, dinosaurs…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("كمّل بناء", "Keep building"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تركيب تويز. كل الحقوق محفوظة.", "© 2026 Tarkib Toys. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("ابني", "BUILD") } }),
  lib("finder-use", {
    text: {
      "ساعدني أختار": L("حسب السن", "By age"),
      "هتستخدمها في إيه؟": L("البنّاي عنده كام سنة؟", "How old is the builder?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختار السن ونوريك الأطقم المناسبة ليه.", "Pick an age and we will show you the right kits."),
      "المشاوير": L("من ٢ لـ٤", "Ages 2–4"),
      "الرياضة": L("من ٥ لـ٧", "Ages 5–7"),
      "المكالمات": L("من ٨ لـ١٢", "Ages 8–12"),
      "الشغل من البيت": L("للبيبي", "For babies"),
      "الأكثر طلبًا دلوقتي": L("الأكتر تركيباً دلوقتي", "Most built right now"),
    },
    links: { "/products": [search("مكعبات"), search("عدة"), search("ديناصورات"), search("بيبي")] },
  }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("الأكتر تركيباً", "Most built"), "الكل بيسأل عليهم": L("أحسن الأطقم", "Top kits") },
    links: { "/products": BEST },
  }),
  lib("bundle-poster", {
    text: {
      "طقم المشاوير": L("باكدج البداية", "Starter pack"),
      "كل اللي تحتاجه في الطريق": L("مكعبات وعدة وديناصورات", "Blocks, tools and dinosaurs"),
      "١٬٢٧٠ ج.م": L("١٬٤٣٥ ج.م", "EGP 1,435"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٦٩٠ ج.م", "Was EGP 1,690"),
      "اشتري الطقم": L("خد التلاتة", "Get all three"),
    },
    links: { "/products": NEW },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("وعدنا", "Our promise"),
      "تسوّق وأنت مطمئن": L("آمن للعب", "Safe to play"),
      "توصيل سريع": L("ألوان آمنة", "Non-toxic paint"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("ألوان مائية ومتختبرة.", "Water-based, tested colours."),
      "الدفع عند الاستلام": L("أطراف ناعمة", "Smooth edges"),
      "أو ادفع بالبطاقة والمحفظة": L("كل قطعة متصنفرة مرتين.", "Every piece is sanded twice."),
      "استرجاع سهل": L("قطع ناقصة", "Missing pieces"),
      "١٤ يومًا لتغيّر رأيك": L("بنبعتها ببلاش، في أي وقت.", "Sent free, any time."),
      "دعم على واتساب": L("السن على كل علبة", "Age on every box"),
      "أشخاص حقيقيون طوال الأسبوع": L("عشان تختار اللعبة الصح.", "So you pick the right toy."),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("من الأهالي", "From parents"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "المكعبات ألوانها حلوة ومفيهاش ريحة خالص، وابني بيبني بيها كل يوم.",
        "Lovely colours and no smell at all; my son builds with them every day.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هالة س.", "Hala S."),
      "القاهرة": L("المعادي", "Maadi"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "قطعة ناقصة من الديناصورات، بعتوهالي في يومين ببلاش.",
        "One dinosaur piece was missing; they sent it free in two days.",
      ),
      "ي": L("ك", "K"),
      "يوسف م.": L("كريم ف.", "Karim F."),
      "المنصورة": L("الإسكندرية", "Alexandria"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("شنطة العدة خشبها تقيل ومتصنفر كويس.", "The tool kit is solid wood and nicely sanded."),
      "ع": L("ن", "N"),
      "عمر ك.": L("نهى م.", "Noha M."),
      "الإسكندرية": L("مدينة نصر", "Nasr City"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصلت أسيوط في ٣ أيام ومتغلفة هدية.", "Reached Assiut in three days, gift wrapped."),
      "س": L("ع", "O"),
      "سلمى ر.": L("علا ح.", "Ola H."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("أحلى هدية عيد ميلاد جبتها لبنت أختي.", "The best birthday present I have bought my niece."),
      "ن": L("ش", "S"),
      "نور ح.": L("شريف ع.", "Sherif A."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("السن مكتوب على كل طقم، فسهل أختار.", "The age is printed on every kit, so choosing is easy."),
      "ك": L("د", "D"),
      "كريم ع.": L("دينا ر.", "Dina R."),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تركيب", "About Tarkib"), L("محل لعب تركيب في مصر الجديدة.", "A building-toy shop in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.rainbowWide,
    alt: L("قوس قزح خشب ولعبة أشكال على الأرض", "A wooden rainbow and a shape sorter on the floor"),
    eyebrow: L("مصر الجديدة", "Heliopolis"),
    title: L("كل طفل بنّاي", "Every child is a builder"),
    text: L("بنختار مكعبات وأطقم تركيب بألوان آمنة، تكبر مع الطفل من سنتين لـ١٢ سنة.", "We choose blocks and building kits with safe paints that grow with a child from 2 to 12."),
    more: L("ولو قطعة ضاعت أو ناقصة، بنبعتها ببلاش.", "And if a piece goes missing, we send it free."),
    button: L("تسوق الأطقم", "Shop kits"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مكعبات وقطع وأطقم للبنّايين من ٢ لـ١٢.", "Blocks, bricks and kits for builders aged 2 to 12."),
  categories: [
    ["build", "تركيب", "Building", PHOTOS.bricks],
    ["pretend", "لعب تمثيلي", "Pretend play", PHOTOS.toolKit],
    ["books", "كتب", "Books", PHOTOS.books],
    ["baby", "بيبي", "Baby", PHOTOS.rainbow],
  ],
  products: [
    ["rainbow-block-set", "build", "مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["wooden-tool-kit", "pretend", "شنطة عدة خشب", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["dinosaur-builders", "build", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinosOrange, 560, { sold90: 41 }],
    ["first-birthday-box", "baby", "بوكس أول عيد ميلاد", "First Birthday Box", PHOTOS.rainbow, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["animal-friends-set", "pretend", "طقم الحيوانات", "Animal Friends Set", PHOTOS.safari, 390, { sold90: 74 }],
    ["bedtime-stories-box", "books", "بوكس حواديت", "Bedtime Stories Box", PHOTOS.books, 520, { rating: 4.8, sold90: 88 }],
    ["building-bricks-tub", "build", "علبة قطع تركيب ٣٠٠ قطعة", "Building Bricks Tub, 300 pieces", PHOTOS.bricks, 890, { rating: 4.8, sold90: 130 }],
    ["natural-blocks-bucket", "build", "جردل مكعبات خشب طبيعي", "Natural Wooden Blocks Bucket", PHOTOS.naturalBlocks, 720, { sold90: 52 }],
    ["dinosaur-figures", "pretend", "مجسمات ديناصورات", "Dinosaur Figures", PHOTOS.dinosWhite, 260, { compareAtPrice: 320, sold90: 66 }],
    ["first-puzzle-100", "books", "بازل ١٠٠ قطعة", "First Puzzle, 100 pieces", PHOTOS.puzzle, 240, { inStock: false, sold90: 20 }],
    ["baby-stacking-rings", "baby", "حلقات تركيب للبيبي", "Baby Stacking Rings", PHOTOS.stacker, 280, { sold90: 70 }],
  ],
});

export const LEGO = libraryTemplate({
  key: LEGO_KEY,
  version: 2,
  changelog: "Tarkib v2: product page",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع للألعاب", "Back to the toys"), reviews: L("رأي الأهالي", "Parents' reviews"), related: L("كمّل البناء", "Keep building") } },
  name: L("تركيب", "Tarkib"),
  description: L(
    "لعب تركيب: كلمة كبيرة، اختار حسب السن، أحسن الأطقم، باكدج البداية وآراء الأهالي. أربع صفحات جاهزة.",
    "Building toys: one big word, shop by age, top kits, a starter pack and parents’ reviews. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 860,
  palette: ["#fffdf5", "#fff1c2", "#ffd60a", "#e63946"],
  colors: {
    primary: "#e63946",
    secondary: "#fff1c2",
    background: "#fffdf5",
    foreground: "#1c2541",
    muted: "#5a6078",
    border: "#f5e2a0",
    accent: "#ffd60a",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تركيب", "About"), seo: { title: L("عن تركيب", "About Tarkib") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٢٢ شارع بغداد، مصر الجديدة.", "22 Baghdad St, Heliopolis."),
        heading: L("قطعة ناقصة؟ قولنا وهنبعتها", "Missing a piece? Tell us and we will send it"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("السن والقطع الناقصة والتوصيل.", "Ages, missing pieces and delivery."),
        question: L("لو قطعة ناقصة أعمل إيه؟", "What if a piece is missing?"),
        answer: L("ابعتلنا اسم الطقم وصورة، وبنبعت القطعة ببلاش في أي وقت.", "Send us the kit name and a photo and we send the piece free, any time."),
      }),
    },
  ],
  demo: DEMO,
});
