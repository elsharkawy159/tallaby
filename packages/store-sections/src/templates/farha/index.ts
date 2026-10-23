/**
 * Farha (template 108, toy store; Claude Design "Storefront Templates"):
 * warm cream paper, a tomato red for actions and a sunny yellow highlight,
 * Lemonada headings over Baloo Bhaijaan 2 text and round 22px corners. A
 * toy shop: banners for building, pretend play and books, shop by the
 * builder's age, top kits, a starter pack of blocks, tools and dinosaurs,
 * safe to play and parents' reviews. Built from section library designs
 * (`fromLibrary`). No branded toys: generic blocks, bricks and wooden kits.
 *
 * The design's age finder has three ages; the library design has four
 * choices, so the fourth is "For babies". The safety cards get a fourth
 * card (the age on every box).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): numbered blocks, a
 * wooden tool kit laid flat, wooden animals on a stack of books, loose
 * bricks, wooden animals on a sill, toy dinosaurs, a rainbow stacker by a
 * soft toy, natural blocks, a grey ring stacker, small safari figures and
 * a play corner with a canopy. The design's photos of children playing
 * (all but one) and its picture-book shelf (printed cover titles) were
 * replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const FARHA_KEY = "farha";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FARHA_KEY, getDesign(id)!, { corners: 22, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  numberBlocksWide: pexels(311269),
  numberBlocks: pexels(311269, 900),
  toolKitWide: pexels(7269570),
  toolKit: pexels(7269570, 900),
  animalsOnBooksWide: pexels(3661201),
  animalsOnBooks: pexels(3661201, 900),
  bricks: pexels(4491702, 900),
  woodenAnimals: pexels(3663061, 900),
  dinosOrange: pexels(8014537, 900),
  dinosBrown: pexels(8014582, 900),
  rainbow: pexels(38695466, 900),
  naturalBlocks: pexels(31061855, 900),
  stacker: pexels(9271758, 900),
  safari: pexels(1319572, 900),
  playCorner: pexels(7055872),
};

const NAME = L("فرحة", "Farha");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل اللعب", "All toys"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("الأسئلة", "FAQ") },
  links: { "/products": [undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("ألعاب وكتب الأطفال بيرجعولها", "Toys and books kids come back to"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فرحة. كل الحقوق محفوظة.", "© 2026 Farha. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن فرحة", "About Farha"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.numberBlocksWide, PHOTOS.toolKitWide, PHOTOS.animalsOnBooksWide],
    text: {
      "وصل حديثًا": L("تركيب ومكعبات", "Building"),
      "الموسم الجديد وصل": L("ابنيها وفكها وابنيها تاني", "Build it, take it apart, build it again"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("أطقم مكعبات من ٣ سنين وطالع.", "Block sets for ages 3 and up."),
      "تسوّق الجديد": L("تسوق تركيب", "Shop building"),
      "صورة الحملة الأولى": L("مكعبات خشب ملونة عليها أرقام", "Colourful wooden blocks with numbers"),
      "الأكثر مبيعًا": L("لعب تمثيل", "Pretend play"),
      "المفضّلة عند عملائنا": L("نجارين ودكاترة صغيرين", "Little builders and doctors"),
      "القطع اللي بترجع لها كل مرة.": L("عِدد خشب ومطابخ لعب وأزياء.", "Wooden tool kits, play kitchens and costumes."),
      "شوف الأكثر مبيعًا": L("تسوق لعب تمثيلي", "Shop pretend play"),
      "صورة الحملة الثانية": L("عدة لعب خشب ومكعبات على الأرض", "A wooden toy tool kit and blocks on the floor"),
      "عروض الأسبوع": L("كتب", "Books"),
      "خصومات لفترة محدودة": L("حدوتة قبل النوم", "A story before bed"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كتب مصورة بالعربي والإنجليزي.", "Picture books in Arabic and English."),
      "تسوّق العروض": L("تسوق كتب", "Shop books"),
      "صورة الحملة الثالثة": L("حيوانات خشب فوق كومة كتب", "Wooden animals on a stack of books"),
    },
    links: { "/products": [search("مكعبات"), search("عدة"), search("حواديت")] },
  }),
  lib("finder-use", {
    text: {
      "ساعدني أختار": L("حسب السن", "By age"),
      "هتستخدمها في إيه؟": L("البنّاي عنده كام سنة؟", "How old is the builder?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختار السن ونوريك اللعب المناسبة ليه.", "Pick an age and we will show you the right toys."),
      "المشاوير": L("من ٢ لـ٤", "Ages 2–4"),
      "الرياضة": L("من ٥ لـ٧", "Ages 5–7"),
      "المكالمات": L("من ٨ لـ١٢", "Ages 8–12"),
      "الشغل من البيت": L("للبيبي", "For babies"),
      "الأكثر طلبًا دلوقتي": L("الأكتر طلباً دلوقتي", "Most wanted right now"),
    },
    links: { "/products": [search("مكعبات"), search("حيوانات"), search("ديناصورات"), search("بيبي")] },
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
      "من يوم إلى ٤ أيام لكل المحافظات": L("ألوان مائية.", "Water-based colours."),
      "الدفع عند الاستلام": L("أطراف ناعمة", "Smooth edges"),
      "أو ادفع بالبطاقة والمحفظة": L("متصنفرة مرتين.", "Sanded twice."),
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
        "ابني بيلعب بيها كل يوم من ساعة ما وصلت.",
        "My son has played with it every day since it arrived.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هبة ر.", "Heba R."),
      "القاهرة": L("المعادي", "Maadi"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("ألوان آمنة وأطراف ناعمة، زي الوصف بالظبط.", "Safe paint and smooth edges, exactly as described."),
      "ي": L("م", "M"),
      "يوسف م.": L("مصطفى إ.", "Mostafa E."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("هدية حلوة. العلبة محتاجة تبقى أقوى.", "A great gift. The box could be sturdier."),
      "ع": L("آ", "A"),
      "عمر ك.": L("آية ل.", "Aya L."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصلت أسيوط في ٣ أيام ومتغلفة هدية.", "Reached Assiut in three days, gift wrapped."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("أحلى هدية عيد ميلاد جبتها لبنت أختي.", "The best birthday present I have bought my niece."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("السن مكتوب على كل لعبة، فسهل أختار.", "The age is printed on every toy, so choosing is easy."),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فرحة", "About Farha"), L("ألعاب وكتب الأطفال بيرجعولها.", "Toys and books that kids come back to.")),
  aboutStory(lib, {
    photo: PHOTOS.playCorner,
    alt: L("ركن لعب بترابيزة صغيرة وخيمة قماش", "A play corner with a small table and a fabric canopy"),
    eyebrow: L("فرحة", "Farha"),
    title: L("لعب بتعيش مع الطفل", "Toys that grow with a child"),
    text: L("بنختار مكعبات وعِدد خشب وحواديت بألوان آمنة، من سنتين لحد ١٢ سنة.", "We choose blocks, wooden tool kits and stories with safe paints, from age 2 to 12."),
    more: L("ولو قطعة ضاعت أو ناقصة، بنبعتها ببلاش.", "And if a piece goes missing, we send it free."),
    button: L("تسوق اللعب", "Shop toys"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب وكتب الأطفال بيرجعولها.", "Toys and books that kids come back to."),
  categories: [
    ["build", "تركيب", "Building", PHOTOS.bricks],
    ["pretend", "لعب تمثيلي", "Pretend play", PHOTOS.toolKit],
    ["books", "كتب", "Books", PHOTOS.animalsOnBooks],
    ["baby", "بيبي", "Baby", PHOTOS.rainbow],
  ],
  products: [
    ["rainbow-block-set", "build", "مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["wooden-tool-kit", "pretend", "شنطة عدة خشب", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["animal-friends-set", "pretend", "طقم الحيوانات", "Animal Friends Set", PHOTOS.woodenAnimals, 390, { sold90: 74 }],
    ["dinosaur-builders", "build", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinosOrange, 560, { sold90: 41 }],
    ["first-birthday-box", "baby", "بوكس أول عيد ميلاد", "First Birthday Box", PHOTOS.rainbow, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["bedtime-stories-box", "books", "بوكس حواديت", "Bedtime Stories Box", PHOTOS.animalsOnBooks, 520, { rating: 4.8, sold90: 88 }],
    ["building-bricks-tub", "build", "علبة قطع تركيب ٣٠٠ قطعة", "Building Bricks Tub, 300 pieces", PHOTOS.bricks, 890, { rating: 4.8, sold90: 130 }],
    ["natural-blocks-bucket", "build", "جردل مكعبات خشب طبيعي", "Natural Wooden Blocks Bucket", PHOTOS.naturalBlocks, 720, { sold90: 52 }],
    ["safari-figures", "pretend", "مجسمات حيوانات السفاري", "Safari Animal Figures", PHOTOS.safari, 240, { sold90: 66 }],
    ["dinosaur-figures", "pretend", "مجسمات ديناصورات", "Dinosaur Figures", PHOTOS.dinosBrown, 260, { compareAtPrice: 320, sold90: 40 }],
    ["baby-stacking-rings", "baby", "حلقات تركيب للبيبي", "Baby Stacking Rings", PHOTOS.stacker, 280, { inStock: false, sold90: 70 }],
  ],
});

export const FARHA = libraryTemplate({
  key: FARHA_KEY,
  version: 2,
  changelog: "Farha v2: product page",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع للألعاب", "Back to the toys"), reviews: L("الأهالي قالوا", "What parents say"), related: L("ألعاب كمان للفرحة", "More toys to love") } },
  name: L("فرحة", "Farha"),
  description: L(
    "محل ألعاب: بانرات متحركة، اختار حسب السن، أحسن الأطقم، باكدج البداية، آمن للعب وآراء الأهالي. أربع صفحات جاهزة.",
    "Toy store: banner carousel, shop by age, top kits, a starter pack, safe to play and parents’ reviews. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 1080,
  palette: ["#fffaf2", "#fdeed6", "#ffc83d", "#c8432f"],
  colors: {
    primary: "#c8432f",
    secondary: "#fdeed6",
    background: "#fffaf2",
    foreground: "#2a2140",
    muted: "#6a5f7c",
    border: "#f4dcb8",
    accent: "#ffc83d",
  },
  fonts: { heading: "Lemonada", body: "Baloo Bhaijaan 2" },
  radius: 22,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن فرحة", "About"), seo: { title: L("عن فرحة", "About Farha") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("farha@farha.eg، القاهرة.", "farha@farha.eg, Cairo."),
        heading: L("محتار في هدية؟ قولنا السن", "Stuck on a gift? Tell us the age"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("السن والقطع الناقصة والتوصيل.", "Ages, missing pieces and delivery."),
        question: L("لو قطعة ناقصة أعمل إيه؟", "What if a piece is missing?"),
        answer: L("ابعتلنا اسم اللعبة وصورة، وبنبعت القطعة ببلاش في أي وقت.", "Send us the toy’s name and a photo and we send the piece free, any time."),
      }),
    },
  ],
  demo: DEMO,
});
