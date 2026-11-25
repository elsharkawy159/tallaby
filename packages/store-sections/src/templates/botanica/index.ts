/**
 * Sage, formerly Botanica (template 12, natural hair and body care; Claude Design
 * "Storefront Templates"): cream paper, a deep olive for actions and a
 * honey highlight, Noto Naskh Arabic headings over IBM Plex Sans Arabic and
 * soft 24px corners. A farm-to-bottle store: the farm as a split hero,
 * categories, best sellers, seed to bottle, the promise, product reviews,
 * the year in numbers and the founder's letter. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): rosemary, amber oil
 * bottles, handmade soaps and rose water. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BOTANICA_KEY = "botanica";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BOTANICA_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  rosemaryPots: pexels(17679558),
  rosemaryField: pexels(17677894, 900),
  rosemaryTin: pexels(135168, 900),
  amberBottles: pexels(6694145, 900),
  oilRow: pexels(5682924, 900),
  oilsDisplay: pexels(6693946, 900),
  dropper: pexels(10819538, 900),
  eucalyptusOil: pexels(4857813, 900),
  soapRow: pexels(6621470, 900),
  soapMix: pexels(6930879, 900),
  soapStack: pexels(3735152, 900),
  roseWater: pexels(18331626, 900),
};

const NAME = L("نايل بوتانكس", "Nile Botanics");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("من نحن", "About us"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد الزيوت والصابون.", "Subscribe for new oils and soaps."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نايل بوتانكس. كل الحقوق محفوظة.", "© 2026 Nile Botanics. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("من نحن", "About us"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

/**
 * Home (v5, template-rules §2a): the farm as a split hero, the categories,
 * then the care journey: best sellers, how it is made, the promise behind
 * it, real results, the year in one line and the founder's letter.
 */
const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.rosemaryPots],
    text: {
      "المجموعة الجديدة": L("عناية طبيعية", "Natural care"),
      "مختارة بعناية": L("زيوت طبيعية وصابون يدوي", "Natural oils and handmade soap"),
      "قطع مختارة بعناية، لكل قطعة تفاصيلها المميزة.": L("زيوت روزماري وسمسم وتين شوكي معصورة على البارد.", "Rosemary, sesame and prickly pear oils, cold-pressed."),
      "تسوّق المجموعة": L("تسوق الأكثر طلباً", "Shop best sellers"),
      "حكايتنا": L("من نحن", "About us"),
      "صورة الواجهة": L("أصص روزماري على رف خشب", "Rosemary pots on a wooden stand"),
    },
    links: { "/products": BEST },
  }),
  lib("categories-circles", {
    text: { "ما الذي تبحث عنه؟": L("عمّ تبحث؟", "What are you looking for?") },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر طلباً", "Best sellers"),
      "أحدث المنتجات في المتجر.": L("الزيوت والصابون الأكثر طلبًا في المتجر.", "The most-ordered oils and soaps in the store."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.rosemaryField, PHOTOS.amberBottles, PHOTOS.soapRow],
    text: {
      "كيف نعمل": L("كيف تُصنع", "How it is made"),
      "من اختيارنا إلى طلبك": L("من النبتة إلى العبوة", "From plant to bottle"),
      "نختار": L("النبتة", "The plant"),
      "كل منتج بعناية.": L("روزماري وسمسم وأعشاب مختارة.", "Rosemary, sesame and chosen herbs."),
      "نراجع": L("العصر", "The press"),
      "تفاصيل كل منتج قبل عرضه.": L("زيوت معصورة على البارد.", "Oils pressed cold."),
      "نساعدك": L("التعبئة", "The bottle"),
      "في أي سؤال عن منتجاتنا.": L("في عبوات زجاجية عسلية اللون.", "In amber glass bottles."),
    },
  }),
  // v6 (2026-11-25, owner): the store's 1st category as a carousel after the stories.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("features-bento", {
    text: {
      "وعدنا لك": L("ما يميز منتجاتنا", "What sets our products apart"),
      "نختار كل منتج كأننا نختاره لأنفسنا": L("مكونات واضحة في كل عبوة", "Clear ingredients on every bottle"),
      "اعرف أكثر": L("اقرأ المكونات", "Read the ingredients"),
      "الشحن": L("مكونات قليلة", "Few ingredients"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("قائمة المكونات مكتوبة على كل عبوة.", "Every bottle lists its ingredients."),
      "الدفع عند الاستلام": L("أحجام متعددة", "Several sizes"),
      "أو بطرق الدفع المتاحة عند الطلب": L("عبوات بأحجام مختلفة لكل منتج.", "Several sizes for every product."),
      "الاستبدال والاسترجاع": L("معصور على البارد", "Cold-pressed"),
      "التفاصيل في صفحة السياسات": L("زيوت معصورة على البارد بكميات صغيرة.", "Oils cold-pressed in small batches."),
    },
  }),
  lib("testimonials-products", {
    photo: [PHOTOS.amberBottles, PHOTOS.dropper, PHOTOS.soapRow, PHOTOS.roseWater],
    text: {
      "تقييمات": L("التقييمات", "Reviews"),
      "تقييمات على منتجات حقيقية": L("آراء المشترين", "Buyer reviews"),
      "الطقم الكلاسيك": L("زيت شعر روزماري", "Rosemary Hair Oil"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("زيت الروزماري عبوته عملية ورائحته هادئة.", "The rosemary oil comes in a practical bottle with a mild scent."),
      "م": L("م", "M"),
      "مريم أ.": L("منى ك.", "Mona K."),
      "الحقيبة اليومية": L("زيت التين الشوكي للوجه", "Prickly Pear Face Oil"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("زيت التين الشوكي خفيف وعبوته بقطّارة.", "The prickly pear oil is light and comes with a dropper."),
      "ع": L("د", "D"),
      "عمر ك.": L("داليا س.", "Dalia S."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "العلبة الهدية": L("٣ قطع صابون بزيت الزيتون", "Olive Oil Soap Trio"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("صابون جميل، وأتمنى أن يتوفر بحجم أكبر.", "Lovely soaps; I wish they came in a bigger bar."),
      "ن": L("ر", "R"),
      "نور ح.": L("رنا ح.", "Rana H."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
      "الإصدار الجديد": L("تونر ماء ورد", "Rose Water Toner"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("ماء ورد برائحة طبيعية هادئة.", "Rose water with a soft natural scent."),
      "ي": L("ه", "H"),
      "يوسف م.": L("هالة ف.", "Hala F."),
    },
    links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP] },
  }),
  lib("stats-sentence", {
    text: {
      "وصّلنا": L("عصرنا", "We pressed"),
      "٢٥ ألف": L("١٨ ألف", "18,000"),
      "طلب لـ": L("عبوة هذا العام لعملاء في", "bottles this year for customers in"),
      "محافظة، ومتوسط تقييم عملائنا": L("محافظة، وتقييمنا", "governorates, rated"),
    },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة كل شهر", "A monthly letter"),
      "أهلًا،": L("أهلاً،", "Hello,"),
      "نكتب رسالة قصيرة عن أحدث المنتجات في المتجر.": L("مرة كل شهر نكتب عن الزيوت والصابون الجديد في المتجر.", "Once a month we write about the new oils and soaps in the store."),
      "أ": L("س", "S"),
      "أحمد": L("سلمى", "Salma"),
      "صاحب المتجر": L("صاحبة المتجر", "Store owner"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("من نحن", "About us"), L("زيوت طبيعية وصابون يدوي للعناية اليومية.", "Natural oils and handmade soap for everyday care.")),
  aboutStory(lib, {
    photo: PHOTOS.rosemaryTin,
    alt: L("نبتة روزماري في أصيص صفيح", "A rosemary plant in a tin pot"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("زيوت طبيعية معصورة على البارد", "Natural cold-pressed oils"),
    text: L("نختار زيوت الروزماري والسمسم والتين الشوكي المعصورة على البارد، ونكتب مكونات كل منتج بوضوح.", "We choose cold-pressed rosemary, sesame and prickly pear oils and list every product's ingredients clearly."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("زيوت معصورة على البارد وصابون طبيعي.", "Cold-pressed oils and natural soap."),
  categories: [
    ["hair", "زيوت الشعر", "Hair oils", PHOTOS.amberBottles],
    ["body", "عناية الجسم", "Body care", PHOTOS.soapMix],
    ["face", "عناية الوجه", "Face care", PHOTOS.eucalyptusOil],
    ["sets", "أطقم الروتين", "Ritual sets", PHOTOS.oilsDisplay],
    ["soap", "صابون طبيعي", "Natural soap", PHOTOS.soapStack],
    ["herbs", "أعشاب", "Dried herbs", PHOTOS.rosemaryTin],
  ],
  products: [
    ["rosemary-hair-oil", "hair", "زيت شعر روزماري", "Rosemary Hair Oil", PHOTOS.amberBottles, 420, { isFeatured: true, rating: 4.8, sold90: 520 }],
    ["black-seed-hair-oil", "hair", "زيت شعر حبة البركة", "Black Seed Hair Oil", PHOTOS.oilRow, 390, { sold90: 120 }],
    // v6: two more hair oils, so the category carousel (the 1st category) shows a full row.
    ["eucalyptus-hair-oil", "hair", "زيت شعر بالكافور", "Eucalyptus Hair Oil", PHOTOS.eucalyptusOil, 360, { sold90: 66 }],
    ["hair-oil-trio", "hair", "ثلاثي زيوت الشعر", "Hair Oil Trio", PHOTOS.oilsDisplay, 990, { sold90: 41 }],
    ["sesame-body-oil", "body", "زيت جسم سمسم", "Sesame Body Oil", PHOTOS.eucalyptusOil, 380, { sold90: 88 }],
    ["olive-oil-soap-trio", "soap", "٣ قطع صابون بزيت الزيتون", "Olive Oil Soap Trio", PHOTOS.soapRow, 240, { compareAtPrice: 290, sold90: 206 }],
    ["siwa-soap-selection", "soap", "تشكيلة صابون سيوة", "Siwa Soap Selection", PHOTOS.soapStack, 320, { sold90: 74 }],
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي للوجه", "Prickly Pear Face Oil", PHOTOS.dropper, 690, { rating: 4.8, sold90: 140 }],
    ["rose-water-toner", "face", "تونر ماء ورد", "Rose Water Toner", PHOTOS.roseWater, 260, { sold90: 173 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.oilsDisplay, 1350, { compareAtPrice: 1590, isFeatured: true, rating: 4.9, sold90: 64 }],
    ["dried-rosemary-tin", "herbs", "علبة روزماري مجفف", "Dried Rosemary Tin", PHOTOS.rosemaryTin, 150, { sold90: 95 }],
  ],
});

export const BOTANICA = libraryTemplate({
  key: BOTANICA_KEY,
  version: 6,
  changelog: "Sage v6: products by category as a carousel on the home",
  name: L("سيج", "Sage"),
  description: L("عناية طبيعية بالشعر والجسم: من النبتة إلى العبوة، أحجام متعددة، تقييمات ورسالة المتجر. أربع صفحات جاهزة.", "Natural hair and body care: plant to bottle, several sizes, reviews and the store's letter. Four ready pages."),
  category: "beauty",
  style: ["warm", "minimal"],
  sortOrder: 120,
  palette: ["#f6f1e3", "#e9e0c8", "#d9b45a", "#2d3a22"],
  colors: {
    primary: "#2d3a22",
    secondary: "#e9e0c8",
    background: "#ffffff",
    foreground: "#2d3a22",
    muted: "#5e6650",
    border: "#ddd2b6",
    accent: "#e6c97e",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "IBM Plex Sans Arabic" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("من نحن", "About us"), seo: { title: L("من نحن", "About us") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
        heading: L("اسألنا عن أي منتج", "Ask us about any product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المكونات والأحجام والطلبات.", "Ingredients, sizes and orders."),
        question: L("أين أجد مكونات كل منتج؟", "Where can I find each product's ingredients?"),
        answer: L("تجد قائمة المكونات في صفحة كل منتج وعلى عبوته.", "Each product's page and bottle list its ingredients."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء من جرّبوه", "From those who tried it"), related: L("من نفس القسم", "From the same range") } },
});
