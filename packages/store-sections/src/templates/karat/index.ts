/**
 * Karat (template 26, everyday accessories; Claude Design "Storefront
 * Templates"): blush paper, a deep plum for actions and a mustard gold
 * highlight, Lalezar display type over Tajawal and round 18px corners. A
 * playful accessories shop: a poster with a sticker, story rings, a
 * segmented shelf, the week's deal, photo reviews and an Instagram bento.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): earrings, bracelets,
 * rings, jewellery boxes, a watch and bags. No hands, ears, necks, busts
 * or brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const KARAT_KEY = "karat";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KARAT_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  jewelBox: pexels(14882422),
  hoops: pexels(12194350, 900),
  studs: pexels(12194361, 900),
  chain: pexels(12124617, 900),
  braided: pexels(12124662, 900),
  ringBox: pexels(6167403, 900),
  colourRings: pexels(29967978, 900),
  necklaceRack: pexels(7679654, 900),
  tray: pexels(4155254, 900),
  ringDishes: pexels(32442408, 900),
  vintageTray: pexels(7679447, 900),
  dish: pexels(4735888, 900),
  watch: pexels(13007642, 900),
  tote: pexels(36364964, 900),
  buckleBag: pexels(8502482, 900),
};

const NAME = L("زينة أكسسوار", "Zeina Accessories");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("الجديد", "New"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [NEW, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ زينة أكسسوار. كل الحقوق محفوظة.", "© 2026 Zeina Accessories. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.jewelBox],
    text: {
      "مجموعة الموسم": L("مجموعة اللمعة", "The shine edit"),
      "من ١ إلى ٣٠ نوفمبر": L("الأسبوع ده بس", "This week only"),
      "صورة الحملة": L("علبة مجوهرات مفتوحة فيها سلاسل", "An open jewellery box with chains"),
      "خصم": L("اشتري", "Buy"),
      "٣٠٪": L("٢+١", "2+1"),
      "لفترة محدودة": L("حلقان", "earrings"),
      "الموسم الجديد وصل": L("لمعة كل يوم", "Everyday shine"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "إكسسوارات دهبي وساعات وشنط، كلها أقل من ٢٬٠٠٠ ج.م.",
        "Gold-tone jewellery, watches and bags, all under EGP 2,000.",
      ),
      "اكتشف المجموعة": L("تسوقي الجديد", "Shop new in"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-stories", {
    photo: [PHOTOS.hoops, PHOTOS.studs, PHOTOS.chain, PHOTOS.ringBox, PHOTOS.colourRings, PHOTOS.necklaceRack, PHOTOS.watch, PHOTOS.tote],
    text: {
      "الأقسام": L("تسوقي بالقسم", "Shop by category"),
      "وصل حديثًا": L("هوب", "Hoops"),
      "الأكثر مبيعًا": L("حلق صغير", "Studs"),
      "العروض": L("أساور", "Bracelets"),
      "هدايا": L("خواتم", "Rings"),
      "إكسسوارات": L("ستاكات", "Stacks"),
      "أساسيات": L("سلاسل", "Necklaces"),
      "مجموعات": L("ساعات", "Watches"),
      "الموسم الجديد": L("شنط", "Bags"),
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختاري مزاجك", "Pick your mood"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("testimonials-photos", {
    photo: [undefined, undefined, PHOTOS.hoops, PHOTOS.braided, PHOTOS.watch, PHOTOS.tote],
    text: {
      "من عملائنا": L("من عميلاتنا", "From our customers"),
      "صورة العميل": L("المنتج اللي اشترته", "The product she bought"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("الهوب لسه بيلمع بعد ٣ شهور لبس كل يوم.", "The hoops still shine after three months of daily wear."),
      "م": L("ج", "J"),
      "مريم أ.": L("جنى ك.", "Jana K."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بوكس هدية مثالي، أختي حبت الغويشة.", "A perfect gift box; my sister loved the bracelet."),
      "ع": L("ف", "F"),
      "عمر ك.": L("فرح ع.", "Farah A."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الساعة حلوة، الأبلكيشن خد وقت عشان يتظبط.", "The watch is pretty; the app took a while to set up."),
      "ن": L("ل", "L"),
      "نور ح.": L("ليلى ر.", "Laila R."),
      "الجيزة": L("المنصورة", "Mansoura"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الشنطة جلدها حلو والمقاس عملي جداً.", "The bag’s leather is lovely and the size is very practical."),
      "ي": L("س", "S"),
      "يوسف م.": L("سلمى ط.", "Salma T."),
      "المنصورة": L("القاهرة", "Cairo"),
      "اشترى من المتجر": L("اشترت من المتجر", "Verified buyer"),
    },
  }),
  lib("gallery-bento", {
    photo: [PHOTOS.vintageTray, PHOTOS.tray, PHOTOS.ringBox, PHOTOS.ringDishes, PHOTOS.dish],
    text: {
      "صورة إنستجرام": L("صورة من إنستجرام زينة", "A photo from Zeina’s Instagram"),
      "@اسم_متجرك": handle("@zeina.shop"),
      "صور جديدة كل أسبوع": L("٦٤ ألف متابع", "64K followers"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن زينة", "About Zeina"), L("إكسسوارات بأسعار حلوة بتختارها أختين في مدينة نصر.", "Affordable accessories picked by two sisters in Nasr City.")),
  aboutStory(lib, {
    photo: PHOTOS.ringDishes,
    alt: L("خواتم في أطباق خزف ملوّنة", "Rings in colourful ceramic dishes"),
    eyebrow: L("سيتي ستارز", "City Stars"),
    title: L("لمعة كل يوم بسعر حلو", "Everyday shine at a fair price"),
    text: L("بنختار كل قطعة بنفسنا: ستانلس مطلي دهب ضد المية ومضاد للحساسية.", "We pick every piece ourselves: water-resistant, hypoallergenic gold-plated steel."),
    more: L("وكل طلب بيوصل في علبة هدية.", "And every order arrives in a gift box."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("لمعة كل يوم بأقل من ٢٬٠٠٠ ج.م.", "Everyday shine under EGP 2,000."),
  categories: [
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "أساور", "Bracelets", PHOTOS.chain],
    ["rings", "خواتم", "Rings", PHOTOS.colourRings],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
    ["bags", "شنط", "Bags", PHOTOS.tote],
  ],
  products: [
    ["gold-tone-hoops", "earrings", "حلق هوب دهبي", "Gold-tone Hoops", PHOTOS.hoops, 390, { isFeatured: true, rating: 4.8, sold90: 410 }],
    ["mini-studs", "earrings", "حلق صغير دهبي", "Mini Studs", PHOTOS.studs, 290, { sold90: 120 }],
    ["chain-bracelet", "bracelets", "غويشة سلسلة", "Chain Bracelet", PHOTOS.chain, 450, { rating: 4.7, sold90: 260 }],
    ["braided-bracelet", "bracelets", "غويشة مضفّرة", "Braided Bracelet", PHOTOS.braided, 490, { sold90: 80 }],
    ["colour-stack-rings", "rings", "ستاك خواتم ألوان", "Colour Stack Rings", PHOTOS.colourRings, 520, { sold90: 98 }],
    ["ring-box-set", "rings", "طقم خواتم بالعلبة", "Ring Set with Box", PHOTOS.ringBox, 690, { sold90: 44 }],
    ["layered-necklaces", "rings", "سلاسل طبقات", "Layered Necklaces", PHOTOS.necklaceRack, 560, { sold90: 70 }],
    ["everyday-smartwatch", "watches", "ساعة ذكية يومية", "Everyday Smartwatch", PHOTOS.watch, 1450, { compareAtPrice: 1690, isFeatured: true, sold90: 132 }],
    ["tan-tote", "bags", "شنطة توت جملي", "Tan Tote", PHOTOS.tote, 1850, { sold90: 44 }],
    ["buckle-shoulder-bag", "bags", "شنطة كتف بأبزيم", "Buckle Shoulder Bag", PHOTOS.buckleBag, 1600, { compareAtPrice: 1900, inStock: false, sold90: 37 }],
  ],
});

export const KARAT = libraryTemplate({
  key: KARAT_KEY,
  version: 3,
  changelog: "Karat v3: product page",
  name: L("قيراط", "Karat"),
  description: L(
    "إكسسوارات يومية: بوستر، أقسام دائرية وصور العميلات. أربع صفحات جاهزة.",
    "Everyday accessories: a poster, story rings and customer photos. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 260,
  palette: ["#fff8f2", "#f7e6da", "#e2b450", "#2a1e2c"],
  colors: {
    primary: "#2a1e2c",
    secondary: "#f7e6da",
    background: "#fff8f2",
    foreground: "#2a1e2c",
    muted: "#6a5a6b",
    border: "#efdccd",
    accent: "#e2b450",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن زينة", "About Zeina") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("سيتي ستارز، كشك ٢٢، مدينة نصر.", "City Stars, Kiosk 22, Nasr City."),
        heading: L("عن هدية أو طلب", "About a gift or an order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الخامات والتوصيل والهدايا.", "Materials, delivery and gifts."),
        question: L("الإكسسوارات بتسوّد؟", "Does the jewellery tarnish?"),
        answer: L("لأ. كلها ستانلس مطلي دهب ضد المية ومضاد للحساسية.", "No. Everything is water-resistant, hypoallergenic gold-plated steel."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "brand", copy: { reviews: L("بنات قالوا إيه", "What you said"), related: L("كمل الإطلالة", "Finish the look") } },
});
