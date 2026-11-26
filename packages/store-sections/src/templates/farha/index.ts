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
  text: { "اسم متجرك": NAME, "المتجر": L("كل الألعاب", "All toys"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("الأسئلة", "FAQ") },
  links: { "/products": [undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا لزيارتك": L("ألعاب وكتب للأطفال", "Toys and books for kids"),
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
      "الموسم الجديد وصل": L("مكعبات وألعاب تركيب", "Blocks and building toys"),
      "قطع مختارة بعناية لكل يوم.": L("أطقم مكعبات من عمر ٣ سنوات فأكثر.", "Block sets for ages 3 and up."),
      "تسوّق الجديد": L("تسوّق ألعاب التركيب", "Shop building"),
      "صورة الحملة الأولى": L("مكعبات خشب ملونة عليها أرقام", "Colourful wooden blocks with numbers"),
      "الأكثر مبيعًا": L("لعب تمثيل", "Pretend play"),
      "المفضّلة عند عملائنا": L("ألعاب تمثيل الأدوار", "Role-play toys"),
      "القطع الأكثر طلبًا في المتجر.": L("أدوات خشبية ومطابخ ألعاب وأزياء.", "Wooden tool kits, play kitchens and costumes."),
      "تصفّح الأكثر مبيعًا": L("تسوّق ألعاب التمثيل", "Shop pretend play"),
      "صورة الحملة الثانية": L("أدوات لعب خشبية ومكعبات على الأرض", "A wooden toy tool kit and blocks on the floor"),
      "مختارات الأسبوع": L("كتب", "Books"),
      "قطع مختارة لهذا الأسبوع": L("كتب مصورة للأطفال", "Picture books for kids"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("كتب مصورة بالعربي والإنجليزي.", "Picture books in Arabic and English."),
      "تسوّق المختارات": L("تسوّق الكتب", "Shop books"),
      "صورة الحملة الثالثة": L("حيوانات خشبية فوق كومة كتب", "Wooden animals on a stack of books"),
    },
    links: { "/products": [search("مكعبات"), search("عدة"), search("حواديت")] },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("اكتشف الأقسام", "Explore the categories"), "كل الأقسام": L("كل الألعاب", "All toys") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("الأكثر طلبًا", "Most ordered"), "منتجات يكثر الطلب عليها": L("أفضل الأطقم", "Top kits") },
    links: { "/products": BEST },
  }),
  lib("finder-use", {
    text: {
      "ساعدني أختار": L("حسب السن", "By age"),
      "فيمَ ستستخدمها؟": L("ما عمر الطفل؟", "How old is the child?"),
      "اختر الاستخدام، ونعرض لك المنتجات المناسبة له.": L("اختر العمر، ونعرض لك الألعاب المناسبة له.", "Pick an age and we will show you the right toys."),
      "التنقل": L("من ٢ إلى ٤", "Ages 2–4"),
      "الرياضة": L("من ٥ إلى ٧", "Ages 5–7"),
      "المكالمات": L("من ٨ إلى ١٢", "Ages 8–12"),
      "العمل من المنزل": L("للرضّع", "For babies"),
      "الأكثر طلبًا الآن": L("الأكثر طلبًا الآن", "Most wanted right now"),
    },
    links: { "/products": [search("مكعبات"), search("حيوانات"), search("ديناصورات"), search("بيبي")] },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ما يميز منتجاتنا", "What sets our products apart"),
      "تسوّق وأنت مطمئن": L("تفاصيل واضحة", "Clear details"),
      "الشحن": L("الخامات", "Materials"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("الخامة مذكورة لكل لعبة.", "Material listed for every toy."),
      "الدفع عند الاستلام": L("القطع", "Pieces"),
      "أو بطرق الدفع المتاحة عند الطلب": L("عدد القطع مذكور لكل طقم.", "Piece count listed for every set."),
      "الاستبدال والاسترجاع": L("تشكيلة متنوعة", "A wide range"),
      "التفاصيل في صفحة السياسات": L("مكعبات وكتب وألعاب تمثيل.", "Blocks, books and pretend play."),
      "تواصل معنا": L("العمر لكل لعبة", "Age for every toy"),
      "لأي سؤال عن طلب أو منتج": L("لتختار اللعبة المناسبة.", "So you pick the right toy."),
    },
  }),
  // v5 (2026-11-25, owner): the store's 1st category as a carousel after the promises.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  // v4 (2026-11-16, owner): every home has at least one real products grid.
  lib("products-grid", {
    as: "new-in",
    text: { "وصل حديثًا": L("وصل حديثًا", "New in"), "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store.") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("من الأهالي", "From parents"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "لعبة متينة وألوانها جميلة.",
        "A sturdy toy with lovely colours.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هبة ر.", "Heba R."),
      "القاهرة": L("المعادي", "Maadi"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الألوان والتشطيب مطابقان للوصف تمامًا.", "The colours and finish match the description exactly."),
      "ي": L("م", "M"),
      "يوسف م.": L("مصطفى إ.", "Mostafa E."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("هدية جميلة، وأتمنى لو كانت العلبة أقوى.", "A great gift. The box could be sturdier."),
      "ع": L("آ", "A"),
      "عمر ك.": L("آية ل.", "Aya L."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("القطع كاملة ومرتبة داخل العلبة.", "All the pieces were there, neatly packed in the box."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("هدية عيد ميلاد مناسبة جدًا.", "A very good birthday present."),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("العمر مكتوب على كل لعبة، فالاختيار سهل.", "The age is printed on every toy, so choosing is easy."),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فرحة", "About Farha"), L("ألعاب وكتب للأطفال.", "Toys and books for kids.")),
  aboutStory(lib, {
    photo: PHOTOS.playCorner,
    alt: L("ركن لعب بطاولة صغيرة وخيمة قماش", "A play corner with a small table and a fabric canopy"),
    eyebrow: L("فرحة", "Farha"),
    title: L("ألعاب تكبر مع الطفل", "Toys that grow with a child"),
    text: L("نختار مكعبات وأدوات خشبية وقصصًا للأطفال من عمر سنتين حتى ١٢ سنة.", "We choose blocks, wooden tool kits and stories for ages 2 to 12."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق الألعاب", "Shop toys"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب وكتب للأطفال.", "Toys and books for kids."),
  categories: [
    ["build", "تركيب", "Building", PHOTOS.bricks],
    ["pretend", "لعب تمثيلي", "Pretend play", PHOTOS.toolKit],
    ["books", "كتب", "Books", PHOTOS.animalsOnBooks],
    ["baby", "الرضّع", "Baby", PHOTOS.rainbow],
    ["dinos", "ديناصورات", "Dinosaurs", PHOTOS.dinosOrange],
  ],
  products: [
    ["rainbow-block-set", "build", "مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["wooden-tool-kit", "pretend", "حقيبة أدوات خشبية", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["animal-friends-set", "pretend", "طقم الحيوانات", "Animal Friends Set", PHOTOS.woodenAnimals, 390, { sold90: 74 }],
    ["dinosaur-builders", "dinos", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinosOrange, 560, { sold90: 41 }],
    ["first-birthday-box", "baby", "علبة أول عيد ميلاد", "First Birthday Box", PHOTOS.rainbow, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["bedtime-stories-box", "books", "علبة قصص قبل النوم", "Bedtime Stories Box", PHOTOS.animalsOnBooks, 520, { rating: 4.8, sold90: 88 }],
    ["building-bricks-tub", "build", "علبة قطع تركيب ٣٠٠ قطعة", "Building Bricks Tub, 300 pieces", PHOTOS.bricks, 890, { rating: 4.8, sold90: 130 }],
    ["natural-blocks-bucket", "build", "دلو مكعبات خشب طبيعي", "Natural Wooden Blocks Bucket", PHOTOS.naturalBlocks, 720, { sold90: 52 }],
    // v5: a fourth building toy, so the category carousel (the 1st category) shows a full row.
    ["stack-and-build-set", "build", "طقم حلقات للتركيب", "Stack & Build Rings", PHOTOS.stacker, 340, { sold90: 36 }],
    ["safari-figures", "pretend", "مجسمات حيوانات السفاري", "Safari Animal Figures", PHOTOS.safari, 240, { sold90: 66 }],
    ["dinosaur-figures", "dinos", "مجسمات ديناصورات", "Dinosaur Figures", PHOTOS.dinosBrown, 260, { compareAtPrice: 320, sold90: 40 }],
    ["baby-stacking-rings", "baby", "حلقات تركيب للرضّع", "Baby Stacking Rings", PHOTOS.stacker, 280, { inStock: false, sold90: 70 }],
  ],
});

export const FARHA = libraryTemplate({
  key: FARHA_KEY,
  version: 6,
  changelog: "Farha v5: products by category as a carousel on the home",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("آراء الأهالي", "What parents say"), related: L("ألعاب أخرى قد تعجبك", "More toys to love") } },
  name: L("فرحة", "Farha"),
  description: L(
    "متجر ألعاب: لافتات متحركة، اختيار حسب العمر، أفضل الأطقم، ما يميز المنتجات وآراء الأهالي. أربع صفحات جاهزة.",
    "Toy store: banner carousel, shop by age, top kits, safe to play and parents’ reviews. Four ready pages.",
  ),
  category: "kids",
  style: ["playful"],
  sortOrder: 1080,
  palette: ["#fffaf2", "#fdeed6", "#ffc83d", "#c8432f"],
  colors: {
    primary: "#c8432f",
    secondary: "#fdeed6",
    background: "#ffffff",
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
        heading: L("اسأل عن عمر أو لعبة", "Ask about an age or a toy"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأعمار والقطع والطلب.", "Ages, pieces and ordering."),
        question: L("ماذا أفعل إذا كانت قطعة ناقصة؟", "What if a piece is missing?"),
        answer: L("تواصل معنا باسم اللعبة وصورة لها، وراجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "Contact us with the toy’s name and a photo, and see the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
