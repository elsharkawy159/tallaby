/**
 * Mode (template 02, modern fashion boutique; Claude Design "Storefront
 * Templates"): warm paper, near-black ink for actions and a vivid orange
 * highlight, Readex Pro throughout and soft 14px corners. Built from section
 * library designs (`fromLibrary`), so every element is a tree node the seller
 * can select, restyle and move.
 *
 * Photos: Pexels, each checked by eye (2026-10-20): clothes on rails and
 * hangers, folded tees and knits, bags and the workshop. No people, bodies
 * or mannequins (owner rule).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MODE_KEY = "mode";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MODE_KEY, getDesign(id)!, { corners: 14, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const SHOP = "/products";

const PHOTOS = {
  colourRack: pexels(8400600),
  wheeledRack: pexels(26761341),
  saleHanger: pexels(5625049),
  blazers: pexels(13160289, 900),
  dressRail: pexels(8386652, 900),
  coats: pexels(35714493, 900),
  foldedTees: pexels(8015312, 900),
  leatherBags: pexels(6650001, 900),
  peachDress: pexels(15893780, 900),
  tanTote: pexels(36364964, 900),
  workshop: pexels(4621659),
};

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل مجاني فوق ٢٬٠٠٠ ج.م · مجموعة جديدة كل خميس", "Free delivery over EGP 2,000 · New drop every Thursday"),
    "الدفع عند الاستلام": L("تبديل خلال ١٤ يوم", "Exchange within 14 days"),
    "م": L("س", "S"),
    "اسم متجرك": L("سايرة ستوديو", "Sayra Studio"),
    "المتجر": L("الجديد", "New in"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("تواصل", "Contact"),
    "من نحن": L("الستوديو", "Studio"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/contact" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اعرفي المجموعة الجديدة قبل الكل", "Get the Thursday drop first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L(
      "إيميل واحد في الأسبوع فيه القطع الجديدة وأكواد خاصة بالمشتركات.",
      "One email a week with the new pieces and members-only codes.",
    ),
    "م": L("س", "S"),
    "اسم متجرك": L("سايرة ستوديو", "Sayra Studio"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سايرة ستوديو. كل الحقوق محفوظة.", "© 2026 Sayra Studio. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("الستوديو", "The studio"),
  },
  links: { "/products": [undefined, NEW, BEST, "/products?sort=rating"] },
});

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.colourRack, PHOTOS.wheeledRack, PHOTOS.saleHanger],
    text: {
      "صورة الحملة": L("بلايزر وجواكت بألوان جريئة على الشماعة", "Bold-coloured blazers and jackets on a rail"),
      "مجموعة الخريف": L("مجموعة الخريف", "The autumn drop"),
      "ألوان هادئة لأيام أطول": L("ألوان بتتكلم عنك", "Colour that does the talking"),
      "تسوّق المجموعة": L("تسوقي الجديد", "Shop new in"),
      "عروض الأسبوع": L("بدل وأطقم: قطعتين وعشر لبسات", "Suits & sets: two pieces, ten outfits"),
      "هدايا مختارة": L("القطع الأساسية اللي بتتلبس كل يوم", "The everyday essentials"),
    },
    links: { "/products": [NEW, SHOP, BEST] },
  }),
  lib("categories-bento", {
    photo: [PHOTOS.blazers, PHOTOS.dressRail, PHOTOS.coats, PHOTOS.foldedTees, PHOTOS.leatherBags],
    text: {
      "أقسامنا": L("تسوقي بالقسم", "Shop by category"),
      "الأكثر طلبًا": L("الأكثر طلباً", "Most wanted"),
      "الأكثر مبيعًا": L("بدل وأطقم", "Suits & sets"),
      "تسوّق": L("تسوقي", "Shop"),
      "العروض": L("فساتين", "Dresses"),
      "هدايا": L("جواكت وبالطوهات", "Jackets & coats"),
      "إكسسوارات": L("أساسيات", "Basics"),
      "أساسيات": L("شنط", "Bags"),
    },
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("اختاري مزاجك", "Pick your mood"),
      "عليه خصم": L("بأعلى تقييم", "Top rated"),
    },
    links: { "/products": [NEW, BEST, "/products?sort=rating", SHOP] },
  }),
  lib("products-rail", {
    text: {
      "بيحبوها": L("اختيارات الستوديو", "Editors’ picks"),
      "الأكثر مبيعًا": L("قطع بنرجعلها دايماً", "Pieces we keep reaching for"),
    },
    links: { "/products": BEST },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("عميلاتنا بيقولوا إيه", "What our customers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "البدلة الحمرا مقاسها كأنها متفصّلة عليا. لبستها في فرح واجتماع في نفس الأسبوع.",
        "The red suit fits like it was made for me. I wore it to a wedding and a meeting in the same week.",
      ),
      "م": L("ف", "F"),
      "مريم أ.": L("فريدة ك.", "Farida K."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الاستبدال كان سهل وسريع.", "Exchange was easy and fast."),
      "ي": L("م", "M"),
      "يوسف م.": L("ملك ع.", "Malak A."),
      "المنصورة": L("الإسكندرية", "Alexandria"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "الألوان زي الصور بالظبط. الفستان الماكسي طويل شوية، أنا طولي ١٦٠ سم.",
        "Colours are exactly like the photos. The maxi dress runs a little long, I am 160 cm.",
      ),
      "ع": L("ن", "N"),
      "عمر ك.": L("ندى ح.", "Nada H."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل في علبة حلوة ومعاه كارت شكر.", "Came in a lovely box with a thank-you card."),
      "س": L("ج", "J"),
      "سلمى ر.": L("جنى س.", "Jana S."),
      "أسيوط": L("المنصورة", "Mansoura"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L(
        "تالت طلب الموسم ده. التيشيرتات بتتغسل كويس وبتحافظ على شكلها.",
        "Third order this season. The tees wash really well and keep their shape.",
      ),
      "ن": L("ر", "R"),
      "نور ح.": L("رنا م.", "Rana M."),
      "الجيزة": L("القاهرة", "Cairo"),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L(
        "التوصيل خد أربع أيام لطنطا، بس خدمة العملاء كانت بتطمني على واتساب.",
        "Delivery took four days to Tanta, but customer service kept me updated on WhatsApp.",
      ),
      "ك": L("س", "S"),
      "كريم ع.": L("سلمى ط.", "Salma T."),
      "كل الآراء": L("تسوقي الأكثر مبيعاً", "Shop best sellers"),
    },
    links: { "/products": BEST },
  }),
];

const pageHeader = (as: string, title: ReturnType<typeof L>, text: ReturnType<typeof L>) =>
  lib("page-header", {
    as,
    text: {
      "من نحن": title,
      "فريق صغير يختار منتجات نشتريها نحن أنفسنا.": text,
    },
  });

const about: Design[] = [
  pageHeader("about-header", L("الستوديو", "The studio"), L("سايرة ستوديو فريق صغير في المعادي بيصمم لبس جريء ومريح.", "Sayra Studio is a small team in Maadi designing bold, easy clothes.")),
  lib("about-classic", {
    person: [undefined, undefined, PHOTOS.workshop],
    text: {
      "صورة المتجر": L("ماكينات خياطة وبكر خيط في الورشة", "Sewing machines and thread in the workshop"),
      "حكايتنا": L("من ٢٠١٩", "Since 2019"),
      "بدأنا بسؤال واحد: هل سيدوم؟": L("مجموعة جديدة كل خميس", "A new drop every Thursday"),
      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": L(
        "بنعمل كميات صغيرة عشان القطع تفضل مميزة ومفيش حاجة تترمي.",
        "We make small runs so pieces stay special and nothing goes to waste.",
      ),
      "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": L("كل قطعة بتتقص وتتخيط في القاهرة.", "Every piece is cut and sewn in Cairo."),
      "تعرّف علينا": L("تسوقي الجديد", "Shop new in"),
    },
    links: { "/about": NEW },
  }),
];

const contact: Design[] = [
  pageHeader("contact-header", L("تواصلي معانا", "Contact us"), L("كل يوم من ١٢ ظهراً حتى ١٠ مساءً، على الإيميل أو واتساب.", "Every day, 12pm to 10pm, by email or WhatsApp.")),
  lib("contact-form", {
    text: {
      "راسلنا": L("راسلينا", "Write to us"),
      "ابعتلنا وهنرجعلك": L("عن مقاس أو طلب أو قطعة", "About a size, an order or a piece"),
    },
  }),
];

const faq: Design[] = [
  pageHeader("faq-header", L("الأسئلة الشائعة", "FAQ"), L("المقاسات والتوصيل والاستبدال والدفع.", "Sizes, delivery, exchanges and payment.")),
  lib("faq-columns", {
    text: {
      "ما سياسة الاسترجاع؟": L("إزاي أبدّل المقاس؟", "How do I exchange a size?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "الاستبدال مجاني خلال ١٤ يوم لأي قطعة بالتيكت بتاعها. ابعتيلنا وإحنا نرتب الاستلام.",
        "Exchanges are free within 14 days for any piece with its tags on. Message us and we arrange the pick-up.",
      ),
    },
  }),
];

const DEMO = demoStore({
  name: L("سايرة ستوديو", "Sayra Studio"),
  description: L("ألوان جريئة وقصّات مريحة، صُنعت في القاهرة.", "Bold colour, easy cuts, made in Cairo."),
  categories: [
    ["suits", "بدل وأطقم", "Suits & sets", PHOTOS.blazers],
    ["dresses", "فساتين", "Dresses", PHOTOS.dressRail],
    ["outerwear", "جواكت وبالطوهات", "Jackets & coats", PHOTOS.coats],
    ["basics", "أساسيات", "Basics", PHOTOS.foldedTees],
    ["bags", "شنط", "Bags", PHOTOS.leatherBags],
  ],
  products: [
    ["camel-trench", "outerwear", "بالطو تِرنش جملي", "Camel Trench Coat", pexels(4057673, 900), 4100, { isFeatured: true, rating: 4.9, sold90: 27 }],
    ["peach-corset-dress", "dresses", "فستان كورسيه خوخي", "Peach Corset Dress", PHOTOS.peachDress, 2650, { compareAtPrice: 3100, rating: 4.8, sold90: 41 }],
    ["sand-blazer", "suits", "بليزر رملي واسع", "Relaxed Sand Blazer", pexels(11829573, 900), 2950, { sold90: 22 }],
    ["pinstripe-blazer", "suits", "بليزر مقلّم", "Pinstripe Blazer", pexels(7711070, 900), 2400, { compareAtPrice: 2900, sold90: 18 }],
    ["satin-slip-dress", "dresses", "فستان ساتان أبيض", "White Satin Slip Dress", pexels(35538618, 900), 1750, { sold90: 14 }],
    ["ditsy-slip-dress", "dresses", "فستان ميدي مشجّر", "Ditsy Print Midi Dress", pexels(18984601, 900), 1950, { rating: 4.7, sold90: 36 }],
    ["plaid-jacket", "outerwear", "جاكيت صوف كاروهات", "Plaid Wool Jacket", pexels(34888429, 900), 2650, { sold90: 16 }],
    ["boxy-tee-duo", "basics", "تيشيرتين قطن واسعين", "Boxy Cotton Tee, Pair", pexels(18186105, 900), 550, { rating: 4.5, sold90: 64 }],
    ["mint-tee", "basics", "تيشيرت قطن نعناعي", "Mint Organic Tee", pexels(34156905, 900), 450, { sold90: 30 }],
    ["chunky-knit", "basics", "بلوفر تريكو تقيل", "Chunky Knit Sweater", pexels(30263570, 900), 1650, { compareAtPrice: 1900, rating: 4.7, sold90: 49 }],
    ["tan-tote", "bags", "شنطة جلد جملي", "Tan Leather Tote", PHOTOS.tanTote, 2300, { rating: 4.8, sold90: 20 }],
    ["buckle-bag", "bags", "شنطة كتف بأبزيم", "Buckle Shoulder Bag", pexels(8502482, 900), 1850, { inStock: false, sold90: 8 }],
  ],
});

export const MODE = libraryTemplate({
  key: MODE_KEY,
  version: 3,
  changelog: "Mode v3: product page",
  name: L("مود", "Mode"),
  description: L(
    "بوتيك موضة عصري: ألوان جريئة وزوايا ناعمة وأزرار دائرية. أربع صفحات جاهزة.",
    "Modern fashion boutique: bold colour, soft corners and pill buttons. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 20,
  palette: ["#f4f1ee", "#e8e2dc", "#e4572e", "#1d1d1f"],
  colors: {
    primary: "#1d1d1f",
    secondary: "#e8e2dc",
    background: "#f4f1ee",
    foreground: "#1d1d1f",
    muted: "#5f5a55",
    border: "#ddd5cc",
    accent: "#e4572e",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    {
      slug: "about",
      name: L("الستوديو", "Studio"),
      seo: { title: L("الستوديو", "The studio"), description: L("فريق صغير في المعادي بيصمم لبس جريء ومريح.", "A small team in Maadi designing bold, easy clothes.") },
      sections: about,
    },
    { slug: "contact", name: L("تواصل", "Contact"), seo: { title: L("تواصلي معانا", "Contact us") }, sections: contact },
    { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
  ],
  demo: DEMO,
  productPage: { thumbs: "bottom", band: "paper", copy: { back: L("رجوع للمجموعة", "Back to the drop"), reviews: L("عميلاتنا بيقولوا إيه", "What our customers say"), related: L("كمّلي اللوك", "Complete the look") } },
});
