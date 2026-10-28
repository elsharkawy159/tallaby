/**
 * Bashra (template 40, skincare by concern with rewards; Claude Design
 * "Storefront Templates"): warm blush paper, a peach highlight and a deep
 * rose for actions, Noto Naskh Arabic headings on Almarai and 18px corners.
 * A small skincare shop (v3, section order): the ritual set in an arch,
 * shop by skin need, our pick with three reasons, how we help you choose,
 * new on the shelf and member reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): amber bottles on a
 * wooden tray, two dropper bottles, a white dropper bottle on marble, three
 * soap bars, a pump bottle on a bath stool, an amber bottle with a dry
 * brush, a whipped cream jar with leaves, a gua sha stone with blank
 * serums and a row of handmade soap bars. No people, no hands and no
 * brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BASHRA_KEY = "bashra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BASHRA_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ritualTray: pexels(7795790),
  ritualSet: pexels(7795790, 900),
  faceOil: pexels(12146904, 900),
  toner: pexels(4735943, 900),
  soapTrio: pexels(6690863, 900),
  bodyOil: pexels(6811698, 900),
  hairOil: pexels(7796159, 900),
  faceCream: pexels(6690234, 900),
  guaSha: pexels(8102128, 900),
  soapRow: pexels(6621467, 900),
  soapRowWide: pexels(6621467),
};

const NAME = L("بشرة", "Bashra");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الوش", "Face"),
    "المدونة": L("الشعر", "Hair"),
  },
  links: { "/products": [SHOP, search("وش")], "/blog": search("شعر") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("نصايح للبشرة، مرة في الشهر", "Skin notes, once a month"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("روتين، منتجات جديدة وعروض الأعضاء.", "Routines, new arrivals and member offers."),
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بشرة. كل الحقوق محفوظة.", "© 2026 Bashra. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-classic", {
    photo: [PHOTOS.ritualSet],
    text: {
      "موسم جديد": L("طقم الروتين الجديد", "New ritual set"),
      "كل ما تحتاجه، في مكان واحد": L("عناية متختارة لبشرتك", "Skincare picked for your skin"),
      "منتجات مختارة بعناية بضمان وتوصيل لكل المحافظات والدفع عند الاستلام.": L(
        "قوليلنا بشرتك محتاجة إيه وإحنا نرشحلك ٣ منتجات، مش ٣٠.",
        "Tell us what your skin needs and we will match you to three products, not thirty.",
      ),
      "تسوّق الآن": L("تسوقي الروتين", "Shop the ritual"),
      "شوف العروض": L("الأعلى تقييمًا", "Top rated"),
      "صورة المنتج": L("قزايز كهرمان على صينية خشب", "Amber bottles on a wooden tray"),
    },
    links: { "/products": [SHOP, RATED] },
  }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("بشرتك محتاجة إيه؟", "What does your skin need?") } }),
  lib("finder-pick", {
    text: {
      "لو هتشتري واحدة بس": L("لو هتشتري حاجة واحدة", "If you buy just one"),
      "أحسن عزل ضوضاء في الفئة": L("بيغطي الوش والجسم في ٤ خطوات", "Covers face and body in four steps"),
      "بطارية ٣٠ ساعة": L("بيكفيكي حوالي ٣ شهور", "Lasts about three months"),
      "ضمان سنتين": L("جاي في علبة هدية", "Comes in a gift box"),
      "أوفر اختيار": L("ابدأي بده", "Start here"),
      "الأفخم": L("الألطف", "Gentlest"),
    },
    lists: [{ source: "featured" }],
  }),
  lib("text-steps", {
    name: L("بنساعدك تختاري إزاي", "How we help you choose"),
    text: {
      "إزاي ترجّع منتج": L("اختاري بثقة", "Choose with confidence"),
      "ابعتلنا على واتساب": L("اسألي خبيرة", "Ask an expert"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("على واتساب قبل ما تطلبي.", "On WhatsApp before you order."),
      "جهّز المنتج": L("جرّبي عينة", "Try a sample"),
      "في علبته الأصلية بكل الإكسسوارات.": L("مع طلبك، عشان تختاري لونك صح.", "With your order, so you pick the right shade."),
      "المندوب يستلم": L("رجّعيها بسهولة", "Easy returns"),
      "خلال يومين شغل من عنوانك.": L("لو المنتج ما ناسبكيش، بنبدّله خلال ١٤ يوم.", "If a product doesn’t suit you, we exchange it within 14 days."),
      "فلوسك ترجع": L("استلمي بسهولة", "Easy delivery"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("توصيل لكل المحافظات والدفع عند الاستلام.", "Delivery everywhere, cash on delivery."),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("جديد على الرف", "New on the shelf"),
      "أحدث المنتجات اللي نزلت المتجر.": L("زيوت وكريمات وصلت الموسم ده.", "Oils and creams that arrived this season."),
    },
    links: { "/products": NEW },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("من أعضائنا", "From our members"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الاختيار حسب البشرة وداني للتونر والاحمرار هدي في أسبوعين.",
        "Choosing by skin type led me to the toner, and my redness calmed in two weeks.",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نور ع.", "Nour A."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("العينة خلتني أختار الدرجة الصح من أول مرة.", "The sample helped me pick the right shade first time."),
      "ع": L("ي", "Y"),
      "عمر ك.": L("ياسمين ك.", "Yasmine K."),
      "الإسكندرية": L("الزمالك", "Zamalek"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("زيوت حلوة جدًا. نفسي الإزازة تبقى أكبر.", "Lovely oils. I wish the bottles were bigger."),
      "ن": L("ر", "R"),
      "نور ح.": L("رنا س.", "Rana S."),
      "الجيزة": L("٦ أكتوبر", "6th of October"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بشرة", "About Bashra"), L("محل عناية صغير في المعادي بيختار المنتج حسب نوع البشرة.", "A small skincare shop in Maadi that matches products to skin types.")),
  aboutStory(lib, {
    photo: PHOTOS.soapRowWide,
    alt: L("صف صابون هاند ميد على رخام", "A row of handmade soap bars on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("٣ منتجات، مش ٣٠", "Three products, not thirty"),
    text: L("بدأنا عشان الرفوف مليانة وكل بشرة محتاجة حاجة مختلفة. بنسألك عن بشرتك الأول، وبعدين نرشح.", "We started because shelves are crowded and every skin needs something different. We ask about your skin first, then suggest."),
    more: L("وكل طلب بيوصلك متغلف بعناية ومعاه عينة.", "And every order arrives carefully packed, with a sample."),
    button: L("كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عناية متختارة لبشرتك، مش للرف.", "Skincare picked for your skin, not for the shelf."),
  categories: [
    ["face", "الوش", "Face", PHOTOS.faceOil],
    ["body", "الجسم", "Body", PHOTOS.soapTrio],
    ["hair", "الشعر", "Hair", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
    ["soap", "صابون", "Soap", PHOTOS.soapRow],
    ["tools", "أدوات", "Tools", PHOTOS.guaSha],
  ],
  products: [
    ["olive-oil-soap-trio", "soap", "٣ صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.soapTrio, 240, { sold90: 210 }],
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي للوش", "Prickly Pear Face Oil", PHOTOS.faceOil, 690, { rating: 4.8, sold90: 164 }],
    ["rose-water-toner", "face", "تونر ماء الورد", "Rose Water Toner", PHOTOS.toner, 320, { sold90: 120 }],
    ["sesame-body-oil", "body", "زيت سمسم للجسم", "Sesame Body Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت روزماري للشعر", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, isFeatured: true, sold90: 62 }],
    ["whipped-face-cream", "face", "كريم وش مخفوق", "Whipped Face Cream", PHOTOS.faceCream, 450, { sold90: 70 }],
    ["gua-sha-serum-set", "sets", "طقم جواشا وسيروم", "Gua Sha and Serum Set", PHOTOS.guaSha, 780, { sold90: 35 }],
    ["handmade-soap-bars", "soap", "٧ صابونات هاند ميد", "Seven Handmade Soap Bars", PHOTOS.soapRow, 320, { sold90: 90 }],
    ["rose-quartz-gua-sha", "tools", "جواشا كوارتز وردي", "Rose Quartz Gua Sha", PHOTOS.guaSha, 350, { sold90: 52 }],
  ],
});

export const BASHRA = libraryTemplate({
  key: BASHRA_KEY,
  version: 3,
  changelog: "Bashra v3: classic hero, skin-need categories, section order",
  productPage: { surface: "shelf", thumbs: "bottom", band: "brand", copy: { reviews: L("رأي أعضاء بشرة", "Member reviews"), related: L("كمّلي روتينك", "Complete your routine") } },
  name: L("بشرة", "Bashra"),
  description: L(
    "عناية حسب نوع البشرة: لاقي روتينك، اختيارنا وآراء العميلات. أربع صفحات جاهزة.",
    "Skincare by concern: find your routine, our pick and customer reviews. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 400,
  palette: ["#fbf6f2", "#f3e4dc", "#f6c9b8", "#9c3d54"],
  colors: {
    primary: "#9c3d54",
    secondary: "#f3e4dc",
    background: "#fbf6f2",
    foreground: "#2e1a20",
    muted: "#6b555b",
    border: "#ead8d0",
    accent: "#f6c9b8",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بشرة", "About"), seo: { title: L("عن بشرة", "About Bashra") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع ٢٣٣، دجلة، المعادي.", "Road 233, Degla, Maadi."),
        heading: L("قوليلنا بشرتك محتاجة إيه", "Tell us what your skin needs"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطلبات والعينات والاستبدال.", "Orders, samples and exchanges."),
        question: L("أختار درجة اللون إزاي؟", "How do I choose my shade?"),
        answer: L("ابعتيلنا صورة لبشرتك في ضوء النهار على واتساب ونرشحلك الدرجة المناسبة.", "Send us a daylight photo of your skin on WhatsApp and we suggest the right shade."),
      }),
    },
  ],
  demo: DEMO,
});
