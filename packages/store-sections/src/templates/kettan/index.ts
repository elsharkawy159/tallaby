/**
 * Kettan (template 49, linen basics; Claude Design "Storefront Templates"):
 * warm off-white paper, near-black ink, a deep olive for actions and a sand
 * highlight, IBM Plex Sans Arabic throughout and tight 6px corners. A calm
 * linen shop: linen you live in, shop by piece, best sellers, two offers,
 * easy to order and return, and reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): linen shirts on wooden
 * hangers and rails, dresses on hangers, folded tees and knits, and canvas
 * totes. No people, no hands, no mannequins and no logos (the design's
 * photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KETTAN_KEY = "kettan";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KETTAN_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  shirtOnBranch: pexels(22441291),
  linenShirt: pexels(22441297, 900),
  whiteShirts: pexels(17293343, 900),
  colourShirts: pexels(8483478, 900),
  charcoalJacket: pexels(6461394, 900),
  linenRail: pexels(6461477),
  windowDress: pexels(16427119, 900),
  roseDress: pexels(31683080, 900),
  foldedTees: pexels(34156907, 900),
  foldedKnits: pexels(9603625, 900),
  blackTote: pexels(1214212, 900),
  whiteTote: pexels(3551355, 900),
};

const NAME = L("كتان ستوديو", "Kettan Studio");

const header = lib("header-line", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الستوديو", "Studio"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("كتان تعيش فيه طول الصيف، بـ٦ ألوان هادية.", "Linen you live in all summer, in six calm colours."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("الستوديو", "The studio"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كتان ستوديو. كل الحقوق محفوظة.", "© 2026 Kettan Studio. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.shirtOnBranch],
    text: {
      "كوليكشن الموسم": L("كتان الصيف", "Summer linen"),
      "صوت أنقى، كل يوم": L("كتان تعيش فيه", "Linen you live in"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "قمصان وفساتين وتيشيرتات كتان مغسول بـ٦ ألوان هادية.",
        "Washed linen shirts, dresses and tees in six calm colours.",
      ),
      "تسوق الآن": L("تسوق الكتان", "Shop linen"),
      "العروض": L("الجديد", "New in"),
      "صورة الحملة": L("قميص كتان بيج على شماعة خشب", "A beige linen shirt on a wooden hanger"),
    },
    links: { "/products": [SHOP, NEW] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("تسوق بالقطعة", "Shop by piece") } }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي الناس بترجعلها كل صيف.", "The pieces people come back for every summer."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("promo-twin", {
    photo: [undefined, undefined, PHOTOS.windowDress, PHOTOS.foldedKnits],
    text: {
      "لحد ٣٠٪": L("جديد", "New"),
      "تخفيضات الموسم": L("فساتين ميدي", "Midi dresses"),
      "باقة": L("خصم لحد ٢٠٪", "Up to 20% off"),
      "اشتري ٢ والتالت هدية": L("تريكو", "Knitwear"),
      "تسوق": L("تسوق", "Shop"),
    },
    links: { "/products": [search("فستان"), search("تريكو")] },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه كتان", "Why Kettan"),
      "تسوّق وأنت مطمئن": L("سهل تطلب وسهل ترجّع", "Easy to order, easy to return"),
      "توصيل سريع": L("توصيل ٢–٤ أيام", "2–4 day delivery"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("لكل المحافظات.", "To every governorate."),
      "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay at the door"),
      "أو ادفع بالبطاقة والمحفظة": L("كاش أو كارت لما يوصل.", "Cash or card when it arrives."),
      "استرجاع سهل": L("استرجاع ١٤ يوم", "14-day returns"),
      "١٤ يومًا لتغيّر رأيك": L("تبديل مقاس ببلاش.", "Free exchange on size."),
      "دعم على واتساب": L("بيتفحص قبل الشحن", "Checked before it ships"),
      "أشخاص حقيقيون طوال الأسبوع": L("كل طلب بيتراجع.", "Every order is inspected."),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("اتلبس واتحب", "Worn and loved"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الأوفرشيرت الكتان بقى أكتر حاجة بلبسها. بيهوّي في الحر وشكله أحلى بعد الغسيل.",
        "The linen overshirt is what I wear most now. It breathes in the heat and looks better after every wash.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هنا م.", "Hana M."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("تالت قميص أطلبه بلون مختلف.", "My third shirt, in a different colour."),
      "ي": L("ع", "A"),
      "يوسف م.": L("علي ف.", "Ali F."),
      "المنصورة": L("المنصورة", "Mansoura"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بدّلت مقاس الفستان ببلاش، والمندوب جه خد القديم وساب الجديد.",
        "Swapped the dress size for free; the courier took the old one and left the new.",
      ),
      "ع": L("ل", "L"),
      "عمر ك.": L("ليلى س.", "Laila S."),
      "سلمى ر.": L("يارا ح.", "Yara H."),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل أسيوط في ٣ أيام ومتغلف حلو.", "Reached Assiut in 3 days, nicely wrapped."),
      "س": L("ي", "Y"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الكتان تقيل ومش شفاف، وده كان أكتر حاجة قلقاني.", "The linen is substantial and not see-through, which was my worry."),
      "ن": L("د", "D"),
      "نور ح.": L("دينا ر.", "Dina R."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار المقاس على واتساب في دقايق.", "They helped me pick my size on WhatsApp in minutes."),
    },
    links: { "/products": BEST },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الستوديو", "The studio"), L("كتان ستوديو فريق صغير في الزمالك بيعمل أساسيات كتان.", "Kettan Studio is a small team in Zamalek making linen basics.")),
  aboutStory(lib, {
    photo: PHOTOS.linenRail,
    alt: L("قمصان وجواكت كتان بأربع ألوان على راك", "Linen shirts and jackets in four colours on a rail"),
    eyebrow: L("من ٢٠٢٠", "Since 2020"),
    title: L("قطع قليلة بتتلبس كتير", "Few pieces, worn often"),
    text: L("بنختار كتان مغسول تقيل يعيش سنين، وبنعمله بـ٦ ألوان بس عشان كل حاجة تتلبس مع كل حاجة.", "We pick heavy washed linen that lasts for years, in just six colours so everything goes with everything."),
    more: L("كل قطعة بتتقص وتتخيط في القاهرة.", "Every piece is cut and sewn in Cairo."),
    button: L("تسوق الكتان", "Shop linen"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كتان تعيش فيه طول الصيف.", "Linen you live in, all summer."),
  categories: [
    ["shirts", "قمصان", "Shirts", PHOTOS.colourShirts],
    ["dresses", "فساتين", "Dresses", PHOTOS.roseDress],
    ["tees", "تيشيرتات وتريكو", "Tees & knits", PHOTOS.foldedTees],
    ["bags", "شنط", "Bags", PHOTOS.blackTote],
  ],
  products: [
    ["washed-linen-overshirt", "shirts", "أوفرشيرت كتان مغسول", "Washed Linen Overshirt", PHOTOS.linenShirt, 1650, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["white-linen-shirt", "shirts", "قميص كتان أبيض", "White Linen Shirt", PHOTOS.whiteShirts, 1350, { rating: 4.7, sold90: 96 }],
    ["charcoal-linen-jacket", "shirts", "جاكت كتان فحمي", "Charcoal Linen Jacket", PHOTOS.charcoalJacket, 2250, { sold90: 34 }],
    ["floral-slip-dress", "dresses", "فستان حمالات مشجّر", "Floral Slip Dress", PHOTOS.windowDress, 1950, { rating: 4.8, sold90: 84 }],
    ["rose-midi-dress", "dresses", "فستان ميدي ورد", "Rose Print Midi Dress", PHOTOS.roseDress, 2150, { compareAtPrice: 2450, sold90: 40 }],
    ["cotton-linen-tee-pair", "tees", "تيشيرتين قطن وكتان", "Cotton-Linen Tee, Pair", PHOTOS.foldedTees, 890, { rating: 4.6, sold90: 160 }],
    ["knit-vest", "tees", "فيست تريكو خفيف", "Light Knit Vest", PHOTOS.foldedKnits, 890, { compareAtPrice: 1090, sold90: 40 }],
    ["black-canvas-tote", "bags", "شنطة كانفاس سودا", "Black Canvas Tote", PHOTOS.blackTote, 650, { sold90: 28 }],
    ["market-tote", "bags", "شنطة كانفاس بمسكات جلد", "Leather-Handle Canvas Tote", PHOTOS.whiteTote, 750, { inStock: false, sold90: 19 }],
  ],
});

export const KETTAN = libraryTemplate({
  key: KETTAN_KEY,
  version: 1,
  name: L("كتان", "Kettan"),
  description: L(
    "أساسيات كتان: صورة كبيرة، تسوق بالقطعة، الأكثر مبيعاً، عرضين وآراء العملاء. أربع صفحات جاهزة.",
    "Linen basics: a split hero, shop by piece, best sellers, two offers and reviews. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 490,
  palette: ["#f7f5f0", "#ebe6dc", "#d9cfb8", "#3f4a3c"],
  colors: {
    primary: "#3f4a3c",
    secondary: "#ebe6dc",
    background: "#f7f5f0",
    foreground: "#1f1d1a",
    muted: "#5f5a52",
    border: "#ddd6c8",
    accent: "#d9cfb8",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الستوديو", "Studio"), seo: { title: L("الستوديو", "The studio") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("كل يوم من ١١ الصبح لـ ٩ بالليل، على الإيميل أو واتساب.", "Every day, 11 am to 9 pm, by email or WhatsApp."),
        heading: L("اسأل عن مقاس أو لون", "Ask about a size or colour"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والغسيل والتوصيل.", "Sizes, washing and delivery."),
        question: L("الكتان بيكش في الغسيل؟", "Does the linen shrink?"),
        answer: L("لأ، كل القطع مغسولة قبل الخياطة. اغسله على ٣٠ درجة وانشره على شماعة.", "No, every piece is washed before sewing. Wash at 30° and dry on a hanger."),
      }),
    },
  ],
  demo: DEMO,
});
