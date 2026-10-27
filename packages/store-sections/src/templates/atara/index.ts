/**
 * Atara (template 73, spices and herbs; Claude Design "Storefront
 * Templates"): warm parchment paper, a burnt paprika for actions and a
 * saffron highlight, Reem Kufi headings over Almarai text and 10px
 * corners. A neighbourhood attar: ground on the day you order, the kitchen
 * set, the most reordered, a first-order coupon and the neighbours'
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): bowls of ground spices
 * with cinnamon, whole spices and star anise, cinnamon sticks, cloves,
 * dried thyme, grains in small bowls, herbal tea, a dried fruit counter and
 * pantry jars. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ATARA_KEY = "atara";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ATARA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  groundBowls: pexels(32281706, 900),
  groundBowlsWide: pexels(32281706),
  wholeSpices: pexels(32281630, 900),
  cinnamon: pexels(14381804, 900),
  cloves: pexels(12142752, 900),
  thyme: pexels(6103377, 900),
  grains: pexels(7420513, 900),
  herbalTea: pexels(34344554, 900),
  driedFruitWide: pexels(11135641),
  driedFruit: pexels(11135641, 900),
  pantryJars: pexels(3737639, 900),
  refillShelf: pexels(4440173, 900),
};

const NAME = L("عطار الحي", "Attar El Hay");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("بتتطحن طازة بالطلب · توصيل مجاني فوق ٣٥٠ ج.م", "Ground fresh on order · Free delivery over EGP 350"),
    "الدفع عند الاستلام": L("بيتطحن طازة", "Ground fresh"),
    "م": L("ع", "A"),
    "اسم متجرك": NAME,
    "المتجر": L("التوابل", "Spices"),
    "العروض": L("الأطقم", "Sets"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [SHOP, search("طقم"), undefined, SHOP, search("طقم")], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ع", "A"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("توابل صحيحة، بتتطحن يوم ما تطلب.", "Whole spices, ground on the day you order."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ عطار الحي. كل الحقوق محفوظة.", "© 2026 Attar El Hay. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.groundBowlsWide],
    text: {
      "كوليكشن الموسم": L("بيتطحن طازة", "Ground fresh"),
      "صوت أنقى، كل يوم": L("توابل ريحتها توابل", "Spices that smell like spices"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "بذور صحيحة من الصعيد، بتتطحن وتتقفل يوم ما تطلب.",
        "Whole seeds from Upper Egypt, ground and sealed the day you order.",
      ),
      "تسوق الآن": L("تسوق التوابل", "Shop spices"),
      "العروض": L("طقم المبتدئين", "Starter set"),
      "صورة الحملة": L("طواجن توابل مطحونة وعيدان قرفة", "Bowls of ground spices and cinnamon sticks"),
    },
    links: { "/products": [SHOP, search("طقم")] },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("الرفوف", "The shelves"), "تسوق بالقسم": L("تسوّق بالرف", "Shop by shelf") } }),
  lib("products-list", {
    text: {
      "الكتالوج": L("أحسن ٤", "Top 4"),
      "كل الإكسسوارات": L("الأكتر إعادة طلب", "Most reordered"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("اللي الجيران بيرجعوا يطلبوه كل شهر.", "What the neighbours reorder every month."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("text-lead", {
    text: {
      "بدأنا المتجر عشان نلاقي منتجات أصلية بسعر عادل، من غير لف على المحلات.": L(
        "التوابل المطحونة بتفقد نص ريحتها في ٣ شهور. عشان كده مفيش حاجة عندنا بتتطحن قبل الطلب.",
        "Ground spice loses half its smell in three months. That is why nothing on our shelf is ground in advance.",
      ),
      "النهارده بنشحن لكل المحافظات، وكل منتج بيتراجع قبل ما يخرج.": L(
        "كل طلب بيتوزن ويتطحن ويتقفل فاكيوم قدام كاميرا تقدر تشوفها.",
        "Every order is weighed, ground and vacuum-sealed in front of a camera you can watch.",
      ),
      "بنشتغل مع موردين معتمدين بس، وكل طلب معاه فاتورة رسمية.": L(
        "وبنكتب على كل كيس يوم الطحن، عشان تعرف إمتى تجدد.",
        "And every bag carries its grinding date, so you know when to restock.",
      ),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("الجيران", "Neighbours"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الكمون ريحته ملت المطبخ أول ما فتحت الكيس.",
        "The cumin filled the kitchen the moment I opened the bag.",
      ),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "رجّعت البرطمانات الفاضية وملوها بنص التمن.",
        "I brought back my empty jars and they refilled them for half the price.",
      ),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("خلطة البيت بقت أساسية في كل أكلة عندنا.", "The house blend is now in everything we cook."),
      "القاهرة": L("السيدة زينب", "Sayeda Zeinab"),
      "الإسكندرية": L("المنيل", "Manial"),
      "الجيزة": L("جاردن سيتي", "Garden City"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن عطار الحي", "About Attar El Hay"), L("عطارة الحي من ١٩٦٢.", "The neighbourhood attar since 1962.")),
  aboutStory(lib, {
    photo: PHOTOS.driedFruitWide,
    alt: L("رفوف فواكه مجففة ومكسرات", "Shelves of dried fruit and nuts"),
    eyebrow: L("السيدة زينب", "Sayeda Zeinab"),
    title: L("نفس الهون من ٣ أجيال", "The same mortar for three generations"),
    text: L("جدنا كان بيطحن التوابل بالهون قدام الزبون، وإحنا لسه بنطحن بالطلب بس بماكينة حجر.", "Our grandfather ground spices by mortar in front of each customer; we still grind to order, on a stone mill."),
    more: L("ورجّع برطمانك الفاضي وخد ريفيل بنص التمن.", "Bring back your empty jar for a refill at half the price."),
    button: L("تسوق التوابل", "Shop spices"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("توابل صحيحة، بتتطحن يوم ما تطلب.", "Whole spices, ground on the day you order."),
  categories: [
    ["spices", "توابل", "Spices", PHOTOS.groundBowls],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantryJars],
    ["jars", "برطمانات", "Jars", PHOTOS.refillShelf],
  ],
  products: [
    ["spice-starter-set", "spices", "طقم توابل للمبتدئين", "Spice Starter Set", PHOTOS.wholeSpices, 210, { isFeatured: true, rating: 4.8, sold90: 180 }],
    ["rice-lentils-pasta", "pantry", "رز وعدس ومكرونة", "Rice, Lentils & Pasta", PHOTOS.pantryJars, 280, { isFeatured: true, sold90: 96 }],
    ["refill-jars", "jars", "برطمانات ريفيل", "Refill Jars", PHOTOS.refillShelf, 160, { isFeatured: true, sold90: 40 }],
    ["baharat-mix", "spices", "بهارات مشكلة ٢٥٠ جم", "Baharat Mix, 250 g", PHOTOS.groundBowls, 95, { compareAtPrice: 120, sold90: 210 }],
    ["cinnamon-sticks", "spices", "قرفة عيدان ١٠٠ جم", "Cinnamon Sticks, 100 g", PHOTOS.cinnamon, 60, { sold90: 150 }],
    ["whole-cloves", "spices", "قرنفل صحيح ٥٠ جم", "Whole Cloves, 50 g", PHOTOS.cloves, 55, { sold90: 90 }],
    ["dried-thyme", "spices", "زعتر ناشف ١٠٠ جم", "Dried Thyme, 100 g", PHOTOS.thyme, 45, { rating: 4.9, sold90: 120 }],
    ["grain-sampler", "pantry", "حبوب مشكلة", "Grain Sampler", PHOTOS.grains, 150, { sold90: 44 }],
    ["herbal-tea", "pantry", "شاي أعشاب مشكل", "Herbal Tea Mix", PHOTOS.herbalTea, 85, { sold90: 70 }],
    ["dried-fruit", "pantry", "فواكه مجففة ومكسرات", "Dried Fruit & Nuts", PHOTOS.driedFruit, 240, { inStock: false, sold90: 60 }],
  ],
});

export const ATARA = libraryTemplate({
  key: ATARA_KEY,
  version: 3,
  changelog: "Atara v3: categories, no coupon, section order",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للعطارة", "Back to the spices"), reviews: L("رأي الجيران", "The neighbours say"), related: L("يتحط جنبه في المطبخ", "Pair it in your kitchen") } },
  name: L("عطارة", "Atara"),
  description: L(
    "توابل وأعشاب: بيتطحن طازة، الأكتر إعادة طلب وآراء الجيران. أربع صفحات جاهزة.",
    "Spices and herbs: ground fresh, the most reordered and the neighbours’ reviews. Four ready pages.",
  ),
  category: "food",
  sortOrder: 730,
  palette: ["#fbf7ef", "#f3e6cf", "#e9b949", "#a63d10"],
  colors: {
    primary: "#a63d10",
    secondary: "#f3e6cf",
    background: "#fbf7ef",
    foreground: "#2a1a0e",
    muted: "#6c5642",
    border: "#e6d4b2",
    accent: "#e9b949",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن عطار الحي", "About"), seo: { title: L("عن عطار الحي", "About Attar El Hay") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٢٢ شارع بورسعيد، السيدة زينب.", "22 Port Said St, Sayeda Zeinab."),
        heading: L("اسأل عن خلطة أو كمية", "Ask about a blend or a quantity"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطحن والتخزين والريفيل.", "Grinding, storage and refills."),
        question: L("أخزن التوابل إزاي؟", "How should I store spices?"),
        answer: L("في برطمان مقفول بعيد عن النور والحرارة، وجددها كل ٣ شهور.", "In a closed jar away from light and heat, and restock every three months."),
      }),
    },
  ],
  demo: DEMO,
});
