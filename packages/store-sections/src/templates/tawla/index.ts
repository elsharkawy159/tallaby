/**
 * Tawla (template 67, table linen and textiles; Claude Design "Storefront
 * Templates"): oatmeal paper, an indigo blue for actions and a straw
 * highlight, El Messiri headings over Noto Sans Arabic text and crisp 8px
 * corners. A Mahalla weaver: dress the table, why our linen, the full
 * table set, fresh from the loom, care and reviews. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): runners on set tables,
 * folded napkins, placemats, tea towels and washed linen. No people, no
 * hands, no logos or printed labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TAWLA_KEY = "tawla";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TAWLA_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  greenTable: pexels(29051697),
  whiteRunner: pexels(16920748, 900),
  laceRunner: pexels(36858944, 900),
  stripedRunner: pexels(18556887, 900),
  stripedNapkins: pexels(4805238, 900),
  napkinTrio: pexels(4805775, 900),
  floralNapkins: pexels(7239438, 900),
  printedNapkins: pexels(6842168, 900),
  pastelNapkins: pexels(32795059, 900),
  placemat: pexels(34298802, 900),
  oliveStack: pexels(11733651, 900),
  blueTowel: pexels(30982093, 900),
  pinkTowel: pexels(30982829, 900),
  washedLinen: pexels(7232405, 900),
  rolledLinen: pexels(6850480, 900),
  foldedStack: pexels(6461392),
};

const NAME = L("طاولة تكستايل", "Tawla Textiles");

const header = lib("header-ruled", {
  text: { "م": L("ط", "T"), "اسم متجرك": NAME, "المتجر": L("كل المنسوجات", "All linen"), "العروض": L("وصل جديد", "New in") },
  links: { "/products": [SHOP, NEW, undefined, undefined] },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ط", "T"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ طاولة تكستايل. كل الحقوق محفوظة.", "© 2026 Tawla Textiles. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.greenTable],
    text: {
      "مجموعة الموسم": L("كتان وقطن", "Linen and cotton"),
      "صوت أنقى، كل يوم": L("منسوجات السفرة", "Linen for the table"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "مفارش ومناديل سفرة من الكتان المغسول والقطن.",
        "Runners, napkins and cloths in washed linen and cotton.",
      ),
      "تسوق الآن": L("تسوق الكتان", "Shop linen"),
      "العروض": L("وصل جديد", "New in"),
      "صورة الحملة": L("طاولة طعام خشبية عليها مفرش طولي أخضر وأطباق", "A wooden table with a green runner and plates"),
    },
    links: { "/products": [search("كتان"), NEW] },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("تسوّق حسب القطعة", "Shop by piece") } }),
  lib("products-rail", {
    text: { "المفضلة لدى العملاء": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("أحدث المنسوجات", "Latest linen") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("features-side-title", {
    text: {
      "لماذا تتسوق معنا": L("لماذا الكتان", "Why linen"),
      "أربعة أمور نهتم بها في كل طلب.": L("مصنوع للاستخدام اليومي.", "Made for daily use."),
      "الشحن": L("مغسول", "Pre-washed"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("خامة مغسولة مسبقًا وناعمة.", "Pre-washed and soft."),
      "الدفع عند الاستلام": L("قطن طبيعي", "Natural cotton"),
      "أو بطرق الدفع المتاحة عند الطلب": L("تيلة طويلة وملمس ناعم.", "Long fibre, soft hand."),
      "الاستبدال والاسترجاع": L("مقاسات", "Sizes"),
      "التفاصيل في صفحة السياسات": L("مقاسات واضحة لكل قطعة.", "Clear sizes for every piece."),
      "تواصل معنا": L("العناية", "Care"),
      "لأي سؤال عن طلب أو منتج": L("طريقة غسيل واضحة لكل قطعة.", "Clear wash care for every piece."),
    },
  }),
  lib("text-terms", {
    text: {
      "شروط الضمان": L("العناية", "Care"),
      "المدة": L("الغسيل", "Wash"),
      "سنة من تاريخ الفاتورة.": L("٣٠ درجة، برنامج لطيف.", "30°C, gentle cycle."),
      "يغطي": L("التجفيف", "Dry"),
      "عيوب الصناعة.": L("على الحبل في الظل.", "Line dry in the shade."),
      "لا يغطي": L("الكوي", "Iron"),
      "الكسر والمياه وسوء الاستخدام.": L("حرارة متوسطة والقماش رطب قليلًا.", "Medium, while slightly damp."),
      "المطلوب": L("التخزين", "Store"),
      "الفاتورة والعلبة الأصلية.": L("مطويًا في درج جاف، دون أكياس بلاستيك.", "Folded in a dry drawer, never in plastic."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عنا": L("من عملائنا", "From our customers"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "المفرش غُسل خمس مرات ولم يتغير لونه، والكتان يزداد نعومة مع الغسيل.",
        "The runner has been washed five times and kept its colour. The linen just gets softer.",
      ),
      "م": L("د", "D"),
      "مريم أ.": L("دينا س.", "Dina S."),
      "القاهرة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "المناديل مخيطة بعناية، والألوان كما في الصور.",
        "The napkins are neatly finished, and the colours match the photos.",
      ),
      "ع": L("ك", "K"),
      "عمر ك.": L("كريم ف.", "Karim F."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("القطن ثقيل وناعم، وجودته أفضل مما توقعت.", "Heavy, soft cotton, better than I expected."),
      "ن": L("ه", "H"),
      "نور ح.": L("هبة ع.", "Heba A."),
      "الجيزة": L("المنصورة", "Mansoura"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن طاولة تكستايل", "About Tawla Textiles"), L("منسوجات السفرة من الكتان والقطن.", "Table linen in linen and cotton.")),
  aboutStory(lib, {
    photo: PHOTOS.foldedStack,
    alt: L("مناديل كتان ملوّنة مطوية على طاولة خشبية", "Folded linen napkins in earthy colours on a wooden table"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("كتان وقطن للسفرة", "Linen and cotton for the table"),
    text: L(
      "نختار مفارش ومناديل ومناشف من الكتان والقطن، ونعرض مقاس وطريقة العناية بكل قطعة.",
      "We choose cloths, napkins and towels in linen and cotton, and list every piece's size and care.",
    ),
    more: L("تواصل معنا لأي سؤال عن مقاس أو خامة.", "Contact us with any question about a size or a fabric."),
    button: L("تسوق الكتان", "Shop linen"),
    href: search("كتان"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("منسوجات السفرة من الكتان والقطن.", "Table linen in linen and cotton."),
  categories: [
    ["runners", "مفارش طاولة", "Runners & cloths", PHOTOS.stripedRunner],
    ["napkins", "مناديل سفرة", "Napkins", PHOTOS.napkinTrio],
    ["kitchen-towels", "مناشف مطبخ", "Tea towels", PHOTOS.rolledLinen],
    ["placemats", "مفارش أطباق", "Placemats", PHOTOS.placemat],
    ["tablecloths", "مفارش سفرة", "Tablecloths", PHOTOS.washedLinen],
  ],
  products: [
    ["white-linen-runner", "runners", "مفرش طولي كتان أبيض ٢٫٤ متر", "White Linen Runner, 2.4 m", PHOTOS.whiteRunner, 450, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["striped-napkins", "napkins", "مناديل سفرة مخططة ٤ قطع", "Striped Napkins, Set of 4", PHOTOS.stripedNapkins, 380, { isFeatured: true, sold90: 140 }],
    ["linen-placemat", "placemats", "مفرش أطباق كتان", "Linen Placemat", PHOTOS.placemat, 290, { isFeatured: true, sold90: 96 }],
    ["napkin-trio", "napkins", "مناديل كتان ٣ ألوان", "Linen Napkin Trio", PHOTOS.napkinTrio, 340, { sold90: 74 }],
    ["floral-napkins", "napkins", "مناديل مشجرة ٦ قطع", "Floral Napkins, Set of 6", PHOTOS.floralNapkins, 560, { rating: 4.9, sold90: 58 }],
    ["block-print-napkins", "napkins", "مناديل مطبوعة يدويًا", "Block-Printed Napkins", PHOTOS.printedNapkins, 420, { compareAtPrice: 520, sold90: 47 }],
    ["pastel-napkins", "napkins", "مناديل باستيل ٤ قطع", "Pastel Napkins, Set of 4", PHOTOS.pastelNapkins, 360, { sold90: 66 }],
    ["striped-runner", "runners", "مفرش طولي مخطط ملوّن", "Striped Colour Runner", PHOTOS.stripedRunner, 480, { sold90: 52 }],
    ["lace-runner", "runners", "مفرش طولي قطن مشغول", "Cotton Lace Runner", PHOTOS.laceRunner, 520, { sold90: 31 }],
    ["washed-linen-tablecloth", "tablecloths", "مفرش سفرة كتان مغسول", "Washed Linen Tablecloth", PHOTOS.washedLinen, 1350, { compareAtPrice: 1550, sold90: 22 }],
    ["olive-napkin-stack", "napkins", "مناديل كتان زيتي ٦ قطع", "Olive Linen Napkins, Set of 6", PHOTOS.oliveStack, 540, { sold90: 39 }],
    ["blue-tea-towel", "kitchen-towels", "منشفة مطبخ مخططة زرقاء", "Blue Striped Tea Towel", PHOTOS.blueTowel, 160, { sold90: 110 }],
    ["pink-tea-towel", "kitchen-towels", "منشفة مطبخ مخططة وردية", "Pink Striped Tea Towel", PHOTOS.pinkTowel, 160, { inStock: false, sold90: 84 }],
  ],
});

export const TAWLA = libraryTemplate({
  key: TAWLA_KEY,
  version: 3,
  changelog: "Tawla v3: categories, section order",
  productPage: { gallery: "end", thumbs: "bottom", button: "outline", band: "paper", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل طاولتك", "Dress the whole table") } },
  name: L("طاولة", "Tawla"),
  description: L(
    "مفارش ومنسوجات: منسوجات السفرة، الأقسام، أحدث المنسوجات وطريقة العناية. أربع صفحات جاهزة.",
    "Table linen and textiles: the opening, categories, latest linen and care. Four ready pages.",
  ),
  category: "handmade",
  style: ["classic", "warm"],
  sortOrder: 670,
  palette: ["#f8f6f1", "#ebe7dc", "#f2c57c", "#355c7d"],
  colors: {
    primary: "#355c7d",
    secondary: "#ebe7dc",
    background: "#ffffff",
    foreground: "#202523",
    muted: "#5c625e",
    border: "#dcd6c7",
    accent: "#f2c57c",
  },
  fonts: { heading: "El Messiri", body: "Noto Sans Arabic" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("من نحن", "About"), seo: { title: L("عن طاولة تكستايل", "About Tawla Textiles") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن مقاس أو خامة، وسنرد عليك.", "Ask about a size or a fabric, and we will reply."),
        heading: L("عن مقاس أو خامة", "About a size or a fabric"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والخامات والعناية.", "Sizes, fabrics and care."),
        question: L("كيف أعتني بالكتان؟", "How do I care for linen?"),
        answer: L("يُغسل على ٣٠ درجة ويُجفف على الحبل، وطريقة العناية مكتوبة في صفحة كل منتج.", "Wash at 30°C and line dry; care details are on each product page."),
      }),
    },
  ],
  demo: DEMO,
});
