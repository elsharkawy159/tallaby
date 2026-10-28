/**
 * Dar (template 43, family furniture house; Claude Design "Storefront
 * Templates"): warm linen paper, a sand highlight and a walnut brown for
 * actions, Amiri headings on Noto Sans Arabic and 4px corners. A Damietta
 * workshop with showrooms (v3, section order): a three-room slideshow, the
 * rooms of the house, the most ordered, an installment calculator, our
 * story, the showrooms and customer reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Installments are an estimate (the payment provider sets the real plan at
 * checkout). The calculator and the feature card show the featured sofa;
 * the four beside it are the best sellers. Showroom hours are copy (the
 * library design has no open/closed clock).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a navy velvet sofa in
 * a living room, a cream sofa with a wooden coffee table, a green velvet
 * sofa, a teal sofa in a living room, a bedroom with a leaf-print duvet, a
 * pale wood bed, a tan armchair, a furniture showroom, a marble table top,
 * a floor lamp in a dark room, a bedside lamp, wooden dining chairs, two
 * round grey armchairs, a brown living room and a sitting corner under
 * round mirrors. No people, no hands, no portraits and no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DAR_KEY = "dar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DAR_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const SOFAS = search("كنبة");
const MAPS = "https://maps.google.com/";

const PHOTOS = {
  navySofaRoom: pexels(6312357),
  linenSofa: pexels(30440152, 900),
  velvetSofa: pexels(30520758, 900),
  tealSofaRoom: pexels(4857768, 900),
  leafBedroom: pexels(5152681, 900),
  oakBed: pexels(31173588, 900),
  armchair: pexels(12269764, 900),
  showroom: pexels(6969830, 900),
  marbleTable: pexels(6078539, 900),
  floorLamp: pexels(32684360, 900),
  bedsideLamp: pexels(545012, 900),
  diningChairs: pexels(29917912, 900),
  swivelChairs: pexels(8066334, 900),
  livingRoom: pexels(1648776, 1200),
  bedroomWide: pexels(5152681),
  mirrorsCorner: pexels(5490341),
};

const NAME = L("دار حمدي", "Dar Hamdy");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("أثاث دمياطي من ١٩٨٢", "Damietta furniture since 1982"),
    "المتجر": L("كل الأثاث", "All furniture"),
    "العروض": L("الكنب", "Sofas"),
    "المدونة": L("غرف النوم", "Bedroom"),
    "من نحن": L("قصتنا", "Our story"),
    "تواصل معنا": L("المعارض", "Showrooms"),
  },
  links: { "/products": [SHOP, SOFAS, undefined, SHOP, SOFAS], "/blog": search("سرير") },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("د", "D"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("أثاث دمياطي، بتعمله نفس العيلة من ١٩٨٢.", "Damietta furniture, made by the same family since 1982."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ دار حمدي. كل الحقوق محفوظة.", "© 2026 Dar Hamdy. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-thumbs", {
    photo: [PHOTOS.navySofaRoom, PHOTOS.bedroomWide, PHOTOS.mirrorsCorner],
    text: {
      "درجات جديدة": L("من ١٩٨٢", "Since 1982"),
      "لون بيتكلم عنك": L("أثاث هيقعد عليه أحفادك", "Furniture for your grandchildren"),
      "درجات هادية لكل يوم وألوان جريئة للمناسبات.": L("كنب بهياكل زان صلب وقماش تختاره بنفسك.", "Sofas on solid beech frames, in the fabric you choose."),
      "تسوّق الآن": L("تسوق الكنب", "Shop sofas"),
      "صورة الشريحة الأولى": L("كنبة قطيفة كحلي في صالة", "A navy velvet sofa in a living room"),
      "المجموعة الجديدة": L("أوض النوم", "Bedrooms"),
      "جريء ومريح وليك": L("نوم هادي في خشب صلب", "Quiet sleep in solid wood"),
      "اختيارات جديدة وصلت للموسم ده.": L("سراير ودواليب بمقاسات أوضتك.", "Beds and wardrobes sized to your room."),
      "تسوّق الجديد": L("تسوق السراير", "Shop beds"),
      "صورة الشريحة الثانية": L("أوضة نوم بغطا ورق شجر", "A bedroom with a leaf-print duvet"),
      "أطقم كاملة": L("بالطلب من دمياط", "Made to order in Damietta"),
      "قطعتين وعشر إطلالات": L("بيوصل بتركيب مجاني", "Delivered and assembled free"),
      "قطع بتتنسّق مع بعض بسهولة.": L("ورشتنا بتعمل كل قطعة بعد ما تطلبها.", "Our workshop builds every piece after you order it."),
      "تسوّق الأطقم": L("كل الأثاث", "All furniture"),
      "صورة الشريحة الثالثة": L("ركنة قعدة تحت مرايات مدورة", "A sitting corner under round mirrors"),
    },
    links: { "/products": [SOFAS, search("سرير"), SHOP] },
  }),
  lib("categories-feature-list", { text: { "الأقسام": L("أوض البيت", "Rooms of the house") } }),
  lib("products-feature", {
    text: {
      "اختيارنا ليك": L("الأكتر طلبًا", "Most ordered"),
      "اختيار الأسبوع": L("الأكثر مبيعًا", "Best seller"),
    },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("pay-installments", {
    text: {
      "٣": L("٦", "6"),
      "٦": L("١٢", "12"),
      "١٢": L("١٨", "18"),
    },
    lists: [{ source: "featured" }],
  }),
  lib("team-story", {
    photo: [PHOTOS.livingRoom],
    text: {
      "بدأنا من أوضة في الدقي بعشر سماعات وموبايل واحد.": L(
        "جدو حمدي فتح ورشة بـ٤ نجارين سنة ١٩٨٢.",
        "Grandfather Hamdy opened a workshop of four carpenters in 1982.",
      ),
      "صورة من المتجر": L("صالة بكنبة وفوتيهات", "A living room with a sofa and armchairs"),
      "كنا بنبيع لأصحابنا على واتساب، وكل طلب كنا بنوصله بنفسنا. النهارده بقينا فريق من ١٢ شخص وبنوصل لكل محافظات مصر.": L(
        "لسه بنقطع ونجمع ونشطب كل قطعة في نفس الشارع في دمياط. ٣ أجيال من العيلة شغالين في الورشة النهارده.",
        "We still cut, join and finish every piece in the same street in Damietta. Three generations of the family work in the shop today.",
      ),
      "لسه بنختار كل منتج بإيدينا، ولسه بنرد على كل رسالة.": L(
        "مفيش حاجة مستنية في مخزن. انت بتختار الخشب والقماش، وإحنا بنعمل.",
        "Nothing waits in a warehouse. You choose the wood and fabric, we make it.",
      ),
      "— منى، المؤسسة": L("— حمدي، الجيل التالت", "— Hamdy, third generation"),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("المعارض", "Showrooms"),
      "زورنا": L("اقعد عليها الأول", "Sit on it first"),
      "فرع الدقي": L("ورشة دمياط", "Damietta workshop"),
      "٢٤ شارع التحرير، الدقي": L("شارع بورسعيد، دمياط", "Port Said St, Damietta"),
      "يوميًا من ١٢ الضهر لـ ١١ م": L("يوميًا من ٩ ص لـ ٩ م", "Daily, 9 am – 9 pm"),
      "فرع مدينة نصر": L("التجمع", "New Cairo"),
      "سيتي ستارز، الدور الأول": L("شارع التسعين، التجمع", "90th St, New Cairo"),
      "يوميًا من ١٠ ص لـ ١٠ م": L("يوميًا من ١٢ الضهر لـ ١١ م", "Daily, 12 pm – 11 pm"),
      "فرع المعادي": L("الإسكندرية", "Alexandria"),
      "شارع ٩، المعادي": L("شارع فؤاد، الإسكندرية", "Fouad St, Alexandria"),
      "السبت – الخميس، ١٢ – ١٠ م": L("يوميًا من ١٢ الضهر لـ ١٠ م", "Daily, 12 pm – 10 pm"),
    },
    links: { "https://maps.google.com": MAPS },
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("من بيوت عملائنا", "From our customers’ homes"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الكنبة اتعملت بالقماش اللي اخترته، ووصلت متركبة في أسبوعين.",
        "The sofa was made in the fabric I chose and arrived assembled in two weeks.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هالة م.", "Hala M."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("السرير تقيل وثابت، مفيش أي صوت بعد سنة.", "The bed is heavy and solid, not a creak after a year."),
      "ع": L("ش", "S"),
      "عمر ك.": L("شريف ع.", "Sherif A."),
      "الإسكندرية": L("التجمع", "New Cairo"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("قسطت السفرة على سنة. التسليم أخد وقت بس يستاهل.", "Paid for the dining set over a year. Delivery took time but it was worth it."),
      "ن": L("د", "D"),
      "نور ح.": L("دينا ف.", "Dina F."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن دار حمدي", "About Dar Hamdy"), L("ورشة أثاث دمياطي بتديرها عيلة واحدة من ١٩٨٢.", "A Damietta furniture workshop run by one family since 1982.")),
  aboutStory(lib, {
    photo: PHOTOS.mirrorsCorner,
    alt: L("ركنة قعدة تحت مرايات مدورة", "A sitting corner under round mirrors"),
    eyebrow: L("من ١٩٨٢", "Since 1982"),
    title: L("نفس العيلة، نفس الشارع", "Same family, same street"),
    text: L("كل قطعة بتتعمل بالطلب في ورشتنا في دمياط، من خشب زان وأرو صلب.", "Every piece is made to order in our Damietta workshop, in solid beech and oak."),
    more: L("وبنوصل ونركب ببلاش في كل مصر، وتقدر تقسط على ٢٤ شهر من غير مقدم.", "We deliver and assemble free across Egypt, and you can pay over 24 months with no down payment."),
    button: L("تسوق الأثاث", "Shop furniture"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث دمياطي، بتعمله نفس العيلة من ١٩٨٢.", "Damietta furniture, made by the same family since 1982."),
  categories: [
    ["sofas", "الكنب", "Sofas", PHOTOS.tealSofaRoom],
    ["bedroom", "غرف النوم", "Bedroom", PHOTOS.leafBedroom],
    ["chairs", "الفوتيهات", "Armchairs", PHOTOS.showroom],
    ["dining", "السفرة", "Dining", PHOTOS.diningChairs],
    ["lighting", "إضاءة وترابيزات", "Lighting & tables", PHOTOS.bedsideLamp],
    ["decor", "ديكور ومرايات", "Decor & mirrors", PHOTOS.mirrorsCorner],
    ["living-sets", "أطقم ليفينج", "Living room sets", PHOTOS.navySofaRoom],
  ],
  products: [
    ["low-linen-sofa", "sofas", "كنبة كتان واطية", "Low Linen Sofa", PHOTOS.linenSofa, 26500, { isFeatured: true, rating: 4.9, sold90: 30 }],
    ["velvet-lounge-sofa", "sofas", "كنبة قطيفة", "Velvet Lounge Sofa", PHOTOS.velvetSofa, 31900, { sold90: 21 }],
    ["oak-bed-frame", "bedroom", "سرير خشب أرو", "Oak Bed Frame", PHOTOS.oakBed, 18900, { sold90: 60 }],
    ["reading-armchair", "chairs", "فوتيه قراية", "Reading Armchair", PHOTOS.armchair, 8900, { sold90: 55 }],
    ["round-armchair-pair", "chairs", "فوتيهين مدورين", "Round Armchair Pair", PHOTOS.swivelChairs, 14800, { sold90: 50 }],
    ["marble-side-table", "lighting", "ترابيزة جنب رخام", "Marble Side Table", PHOTOS.marbleTable, 4200, { compareAtPrice: 4900, sold90: 19 }],
    ["linen-floor-lamp", "lighting", "أباجورة أرضي كتان", "Linen Floor Lamp", PHOTOS.floorLamp, 2600, { sold90: 45 }],
    ["oak-dining-set", "dining", "سفرة أرو لـ٦", "Oak Dining Set for Six", PHOTOS.diningChairs, 34500, { sold90: 26 }],
    ["round-wall-mirrors", "decor", "طقم مرايات حيطة مدورة", "Round Wall Mirror Set", PHOTOS.mirrorsCorner, 5400, { sold90: 28 }],
    ["navy-living-set", "living-sets", "طقم ليفينج كحلي", "Navy Living Room Set", PHOTOS.navySofaRoom, 42500, { compareAtPrice: 47000, sold90: 12 }],
  ],
});

export const DAR = libraryTemplate({
  key: DAR_KEY,
  version: 3,
  changelog: "Dar v3: room slideshow hero, categories, reviews, section order",
  productPage: { surface: "shelf", thumbs: "side", band: "paper", extras: ["product-shipping"], copy: { reviews: L("رأي أصحاب البيوت", "From homes we furnished"), related: L("قطع تناسب نفس الغرفة", "Pieces for the same room") } },
  name: L("دار", "Dar"),
  description: L(
    "بيت أثاث عائلي: من ١٩٨٢، الأكتر طلبًا، حاسبة التقسيط، زيارة مصمم، قصتنا ورحلتنا، بنشتغل إزاي والمعارض. أربع صفحات جاهزة.",
    "Family furniture house: since 1982, most ordered, installment calculator, designer home visit, our story and journey, how we work and showrooms. Four ready pages.",
  ),
  category: "home",
  sortOrder: 430,
  palette: ["#f5f1ea", "#e8e0d3", "#d8c3a5", "#5a4632"],
  colors: {
    primary: "#5a4632",
    secondary: "#e8e0d3",
    background: "#f5f1ea",
    foreground: "#2a241e",
    muted: "#655c52",
    border: "#ddd3c4",
    accent: "#d8c3a5",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن دار حمدي", "About"), seo: { title: L("عن دار حمدي", "About Dar Hamdy") }, sections: about },
    {
      slug: "contact",
      name: L("المعارض", "Showrooms"),
      seo: { title: L("المعارض", "Showrooms") },
      sections: contactPage(lib, {
        title: L("المعارض", "Showrooms"),
        text: L("دمياط والتجمع والإسكندرية.", "Damietta, New Cairo and Alexandria."),
        heading: L("احجز زيارة أو اسأل عن قطعة", "Book a visit or ask about a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التصنيع والتقسيط والتوصيل.", "Making, installments and delivery."),
        question: L("التصنيع بياخد قد إيه؟", "How long does making take?"),
        answer: L("من ٤ لـ ٦ أسابيع حسب القطعة، والتوصيل والتركيب ببلاش.", "Four to six weeks depending on the piece, with free delivery and assembly."),
      }),
    },
  ],
  demo: DEMO,
});
