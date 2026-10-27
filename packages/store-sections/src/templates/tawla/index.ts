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
      "كوليكشن الموسم": L("منسوج في المحلة", "Woven in Mahalla"),
      "صوت أنقى، كل يوم": L("لبّس السفرة", "Dress the table"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "رانرات وفوط ومفارش كتان مغسول وقطن مصري.",
        "Runners, napkins and cloths in washed linen and Egyptian cotton.",
      ),
      "تسوق الآن": L("تسوق الكتان", "Shop linen"),
      "العروض": L("وصل جديد", "New in"),
      "صورة الحملة": L("سفرة خشب عليها رانر أخضر وأطباق", "A wooden table with a green runner and plates"),
    },
    links: { "/products": [search("كتان"), NEW] },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("لبّس السفرة حتة حتة", "Dress the table piece by piece") } }),
  lib("products-rail", {
    text: { "بيحبوها": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("لسه من النول", "Fresh from the loom") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 6 }],
  }),
  lib("features-side-title", {
    text: {
      "ليه الناس بترجع لنا تاني": L("ليه الكتان بتاعنا", "Why our linen"),
      "أربع حاجات بنلتزم بيها في كل طلب.": L("معمول للاستعمال اليومي، مش للدرج.", "Made for daily use, not for a drawer."),
      "توصيل سريع": L("مغسول", "Pre-washed"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("مش هينكمش في البيت.", "No shrinking at home."),
      "الدفع عند الاستلام": L("قطن مصري", "Egyptian cotton"),
      "أو ادفع بالبطاقة والمحفظة": L("تيلة طويلة وملمس ناعم.", "Long fibre, soft hand."),
      "استرجاع سهل": L("تطريز", "Embroidery"),
      "١٤ يومًا لتغيّر رأيك": L("حروف ببلاش على الفوط.", "Free initials on napkins."),
      "دعم على واتساب": L("توصيل في ٣ أيام", "Delivery in 3 days"),
      "أشخاص حقيقيون طوال الأسبوع": L("لكل المحافظات، وادفع عند الاستلام.", "To every governorate, pay on delivery."),
    },
  }),
  lib("text-terms", {
    text: {
      "شروط الضمان": L("العناية", "Care"),
      "المدة": L("الغسيل", "Wash"),
      "سنة من تاريخ الفاتورة.": L("٣٠ درجة، برنامج هادي.", "30°C, gentle cycle."),
      "بيغطي": L("التنشيف", "Dry"),
      "عيوب الصناعة.": L("على الحبل في الضل.", "Line dry in the shade."),
      "مش بيغطي": L("الكوي", "Iron"),
      "الكسر والمياه وسوء الاستخدام.": L("متوسط وهو مبلول شوية.", "Medium, while slightly damp."),
      "المطلوب": L("التخزين", "Store"),
      "الفاتورة والعلبة الأصلية.": L("مطبّق في درج ناشف، من غير نايلون.", "Folded in a dry drawer, never in plastic."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("على سفرهم", "At their tables"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الرانر اتغسل خمس مرات ولسه لونه زي ما هو، والكتان بيحلى مع الغسيل.",
        "The runner has been washed five times and kept its colour. The linen just gets softer.",
      ),
      "م": L("د", "D"),
      "مريم أ.": L("دينا س.", "Dina S."),
      "القاهرة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "طلبت ١٢ فوطة بحروف العيلة ووصلوا في ٣ أيام، التطريز نضيف جداً.",
        "I ordered 12 napkins with our family initials and they came in 3 days. Very neat embroidery.",
      ),
      "ع": L("ك", "K"),
      "عمر ك.": L("كريم ف.", "Karim F."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("القطن تقيل وناعم، أحسن من المستورد بكتير.", "Heavy, soft cotton, much better than the imported ones."),
      "ن": L("ه", "H"),
      "نور ح.": L("هبة ع.", "Heba A."),
      "الجيزة": L("المنصورة", "Mansoura"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن طاولة تكستايل", "About Tawla Textiles"), L("كتان وقطن للسفرة، منسوج في المحلة.", "Linen and cotton for the table, woven in Mahalla.")),
  aboutStory(lib, {
    photo: PHOTOS.foldedStack,
    alt: L("فوط كتان ملونة متطبقة على ترابيزة خشب", "Folded linen napkins in earthy colours on a wooden table"),
    eyebrow: L("المحلة الكبرى", "El Mahalla El Kubra"),
    title: L("نول العيلة من ١٩٨٢", "The family loom since 1982"),
    text: L(
      "بننسج الكتان والقطن المصري على نول العيلة في المحلة، وبنغسل كل قطعة قبل ما تتشحن عشان ما تنكمش عندك.",
      "We weave linen and Egyptian cotton on the family loom in Mahalla, and pre-wash every piece so it never shrinks at home.",
    ),
    more: L("وتطريز الحروف على الفوط ببلاش.", "And initials embroidered on napkins are free."),
    button: L("تسوق الكتان", "Shop linen"),
    href: search("كتان"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كتان وقطن للسفرة، منسوج في المحلة.", "Linen and cotton for the table, woven in Mahalla."),
  categories: [
    ["runners", "رانرات ومفارش", "Runners & cloths", PHOTOS.stripedRunner],
    ["napkins", "فوط سفرة", "Napkins", PHOTOS.napkinTrio],
    ["kitchen-towels", "فوط مطبخ", "Tea towels", PHOTOS.rolledLinen],
  ],
  products: [
    ["white-linen-runner", "runners", "رانر كتان أبيض ٢٫٤ متر", "White Linen Runner, 2.4 m", PHOTOS.whiteRunner, 450, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["striped-napkins", "napkins", "فوط سفرة مقلمة ٤ قطع", "Striped Napkins, Set of 4", PHOTOS.stripedNapkins, 380, { isFeatured: true, sold90: 140 }],
    ["linen-placemat", "runners", "مفرش أطباق كتان", "Linen Placemat", PHOTOS.placemat, 290, { isFeatured: true, sold90: 96 }],
    ["napkin-trio", "napkins", "فوط كتان ٣ ألوان", "Linen Napkin Trio", PHOTOS.napkinTrio, 340, { sold90: 74 }],
    ["floral-napkins", "napkins", "فوط مشجرة ٦ قطع", "Floral Napkins, Set of 6", PHOTOS.floralNapkins, 560, { rating: 4.9, sold90: 58 }],
    ["block-print-napkins", "napkins", "فوط مطبوعة يدوي", "Block-Printed Napkins", PHOTOS.printedNapkins, 420, { compareAtPrice: 520, sold90: 47 }],
    ["pastel-napkins", "napkins", "فوط باستيل ٤ قطع", "Pastel Napkins, Set of 4", PHOTOS.pastelNapkins, 360, { sold90: 66 }],
    ["striped-runner", "runners", "رانر مخطط ألوان", "Striped Colour Runner", PHOTOS.stripedRunner, 480, { sold90: 52 }],
    ["lace-runner", "runners", "رانر قطن مشغول", "Cotton Lace Runner", PHOTOS.laceRunner, 520, { sold90: 31 }],
    ["washed-linen-tablecloth", "runners", "مفرش سفرة كتان مغسول", "Washed Linen Tablecloth", PHOTOS.washedLinen, 1350, { compareAtPrice: 1550, sold90: 22 }],
    ["olive-napkin-stack", "napkins", "فوط كتان زيتي ٦ قطع", "Olive Linen Napkins, Set of 6", PHOTOS.oliveStack, 540, { sold90: 39 }],
    ["blue-tea-towel", "kitchen-towels", "فوطة مطبخ مقلمة أزرق", "Blue Striped Tea Towel", PHOTOS.blueTowel, 160, { sold90: 110 }],
    ["pink-tea-towel", "kitchen-towels", "فوطة مطبخ مقلمة وردي", "Pink Striped Tea Towel", PHOTOS.pinkTowel, 160, { inStock: false, sold90: 84 }],
  ],
});

export const TAWLA = libraryTemplate({
  key: TAWLA_KEY,
  version: 3,
  changelog: "Tawla v3: categories, section order",
  productPage: { gallery: "end", thumbs: "bottom", button: "outline", band: "paper", copy: { back: L("رجوع للسُفرة", "Back to the table"), reviews: L("رأي اللي جهّزوا سُفرتهم", "From laid tables"), related: L("كمّل السُفرة", "Dress the whole table") } },
  name: L("طاولة", "Tawla"),
  description: L(
    "مفارش ومنسوجات: لبّس السفرة، طقم السفرة كاملة، لسه من النول وطريقة العناية. أربع صفحات جاهزة.",
    "Table linen and textiles: dress the table, the full table set, fresh from the loom and care. Four ready pages.",
  ),
  category: "home",
  sortOrder: 670,
  palette: ["#f8f6f1", "#ebe7dc", "#f2c57c", "#355c7d"],
  colors: {
    primary: "#355c7d",
    secondary: "#ebe7dc",
    background: "#f8f6f1",
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
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن طاولة تكستايل", "About Tawla Textiles") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا الحروف اللي عايز تطرزها أو مقاس سفرتك.", "Send us the initials to embroider or the size of your table."),
        heading: L("عن مقاس أو تطريز", "About a size or embroidery"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتطريز والعناية.", "Sizes, embroidery and care."),
        question: L("التطريز بياخد قد إيه؟", "How long does embroidery take?"),
        answer: L("يوم شغل زيادة بس، والطلب يوصلك في ٣ أيام.", "Just one extra working day; your order still arrives in 3 days."),
      }),
    },
  ],
  demo: DEMO,
});
