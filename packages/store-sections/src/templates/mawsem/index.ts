/**
 * Mawsem (template 101, everyday fashion; Claude Design "Storefront
 * Templates"): warm off-white paper, near-black ink, a bottle green for
 * actions and a saffron highlight, Reem Kufi headings on IBM Plex Sans
 * Arabic and tight 4px corners. New pieces every season: banners for
 * shirts, dresses and tees, shop by piece, best sellers, two offers, easy
 * to order and return, and reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): linen shirts and
 * jackets on rails and hangers, dresses on hangers, folded tees and knits,
 * a knit vest on a hanger, canvas totes and a leather messenger bag. No
 * people, no hands, no mannequins and no logos (the design's three model
 * photos and its bag photo with a branded perfume bottle were replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MAWSEM_KEY = "mawsem";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MAWSEM_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  shirtsBanner: pexels(6461398),
  dressesBanner: pexels(9594684),
  teesBanner: pexels(8015312),
  colourRack: pexels(8400600),
  linenShirt: pexels(22441297, 900),
  whiteShirts: pexels(17293343, 900),
  colourShirts: pexels(8483478, 900),
  charcoalJacket: pexels(6461394, 900),
  windowDress: pexels(16427119, 900),
  roseDress: pexels(31683080, 900),
  foldedTees: pexels(34156907, 900),
  foldedKnits: pexels(9603625, 900),
  knitVest: pexels(2850487, 900),
  blackTote: pexels(1214212, 900),
  whiteTote: pexels(3551355, 900),
  messenger: pexels(1152077, 900),
};

const NAME = L("موسم", "Mawsem");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اعرف الجديد قبل أي حد", "Hear about new pieces first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("قطع جديدة كل موسم وأسعار عادلة طول السنة.", "New pieces every season, fair prices all year."),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ موسم. كل الحقوق محفوظة.", "© 2026 Mawsem. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.shirtsBanner, PHOTOS.dressesBanner, PHOTOS.teesBanner],
    text: {
      "وصل حديثًا": L("الموسم الجديد", "New season"),
      "الموسم الجديد وصل": L("قمصان لكل يوم في الأسبوع", "Shirts for every day of the week"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("قطن وكتان، تتلبس واسعة أو جوه البنطلون.", "Cotton and linen, cut to wear loose or tucked in."),
      "تسوّق الجديد": L("تسوق القمصان", "Shop shirts"),
      "صورة الحملة الأولى": L("قمصان وجواكت كتان على راك خشب", "Linen shirts and jackets on a wooden rail"),
      "الأكثر مبيعًا": L("فساتين", "Dresses"),
      "المفضّلة عند عملائنا": L("فساتين خفيفة لويك إند مريح", "Light dresses, easy weekends"),
      "القطع اللي بترجع لها كل مرة.": L("أطوال ميدي وماكسي بألوان هادية.", "Midi and maxi lengths in soft colours."),
      "شوف الأكثر مبيعًا": L("تسوق الفساتين", "Shop dresses"),
      "صورة الحملة الثانية": L("فساتين بألوان هادية على راك معدن", "Dresses in soft colours on a metal rail"),
      "عروض الأسبوع": L("أساسيات", "Basics"),
      "خصومات لفترة محدودة": L("التيشيرت اللي بتلبسه الأول", "The tee you reach for first"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("قطن تقيل بيحافظ على شكله بعد الغسيل.", "Heavy cotton that keeps its shape after washing."),
      "تسوّق العروض": L("تسوق التيشيرتات", "Shop tees"),
      "صورة الحملة الثالثة": L("تيشيرتات ملونة متطبقة على رف", "Colourful tees folded on a shelf"),
    },
    links: { "/products": [search("قميص"), search("فستان"), search("تيشيرت")] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("تسوق بالقطعة", "Shop by piece") } }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي الناس بترجعلها كل موسم.", "The pieces people come back for every season."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه موسم", "Why Mawsem"),
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
        "الأوفرشيرت بقى بيتلبس معايا كل أسبوع، وقماشته أحلى بعد كل غسلة.",
        "I wear the overshirt every week, and the fabric gets nicer with every wash.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رنا ع.", "Rana A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("طلبت التيشيرت بلونين، ورجعت طلبت التالت.", "Ordered the tee in two colours, then came back for a third."),
      "ي": L("ك", "K"),
      "يوسف م.": L("كريم س.", "Karim S."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بدّلت مقاس الفستان ببلاش، والمندوب خد القديم وساب الجديد.",
        "Swapped the dress size for free; the courier took the old one and left the new.",
      ),
      "ع": L("ه", "H"),
      "عمر ك.": L("هدى م.", "Hoda M."),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل أسيوط في ٣ أيام ومتغلف كويس.", "Reached Assiut in 3 days, well wrapped."),
      "س": L("ن", "N"),
      "سلمى ر.": L("نورا ح.", "Noura H."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الفيست التريكو خفيف ومناسب لليالي الصيف.", "The knit vest is light and right for summer evenings."),
      "ن": L("ي", "Y"),
      "نور ح.": L("ياسمين ف.", "Yasmine F."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار المقاس على واتساب في دقايق.", "They helped me pick my size on WhatsApp in minutes."),
      "ك": L("ع", "O"),
      "كريم ع.": L("عمرو ط.", "Amr T."),
    },
    links: { "/products": BEST },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن موسم", "About Mawsem"), L("قطع جديدة كل موسم وأسعار عادلة طول السنة.", "New pieces every season, fair prices all year.")),
  aboutStory(lib, {
    photo: PHOTOS.colourRack,
    alt: L("راك هدوم ملونة جنب دولاب خشب", "A rail of colourful clothes beside a wooden cabinet"),
    eyebrow: L("كل موسم", "Every season"),
    title: L("هدوم كل يوم، من غير مبالغة", "Everyday clothes, nothing overdone"),
    text: L("بنختار قمصان وفساتين وتيشيرتات من قطن وكتان، بقصات سهلة تتلبس مع بعض.", "We pick cotton and linen shirts, dresses and tees in easy cuts that go together."),
    more: L("ومع كل موسم بننزل ألوان جديدة، بنفس الأسعار العادلة.", "Every season brings new colours, at the same fair prices."),
    button: L("تسوق الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع جديدة كل موسم وأسعار عادلة طول السنة.", "New pieces every season, fair prices all year."),
  categories: [
    ["shirts", "قمصان", "Shirts", PHOTOS.colourShirts],
    ["dresses", "فساتين", "Dresses", PHOTOS.windowDress],
    ["tees", "تيشيرتات وتريكو", "Tees & knits", PHOTOS.foldedTees],
    ["bags", "شنط", "Bags", PHOTOS.blackTote],
  ],
  products: [
    ["washed-linen-overshirt", "shirts", "أوفرشيرت كتان مغسول", "Washed Linen Overshirt", PHOTOS.linenShirt, 1650, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["white-linen-shirt", "shirts", "قميص كتان أبيض", "White Linen Shirt", PHOTOS.whiteShirts, 1290, { sold90: 70 }],
    ["charcoal-linen-jacket", "shirts", "جاكت كتان فحمي", "Charcoal Linen Jacket", PHOTOS.charcoalJacket, 2150, { sold90: 26 }],
    ["linen-midi-dress", "dresses", "فستان ميدي مشجّر", "Floral Midi Dress", PHOTOS.roseDress, 1950, { rating: 4.7, sold90: 84 }],
    ["floral-slip-dress", "dresses", "فستان حمالات مشجّر", "Floral Slip Dress", PHOTOS.windowDress, 1590, { sold90: 38 }],
    ["cotton-linen-tee", "tees", "تيشيرت قطن وكتان", "Cotton-Linen Tee", PHOTOS.foldedTees, 490, { rating: 4.8, sold90: 160 }],
    ["knit-vest", "tees", "فيست تريكو", "Knit Vest", PHOTOS.knitVest, 890, { compareAtPrice: 1090, sold90: 40 }],
    ["canvas-tote", "bags", "شنطة كانفاس", "Canvas Tote", PHOTOS.whiteTote, 650, { sold90: 28 }],
    ["leather-messenger", "bags", "شنطة ماسنجر جلد", "Leather Messenger Bag", PHOTOS.messenger, 990, { inStock: false, sold90: 19 }],
  ],
});

export const MAWSEM = libraryTemplate({
  key: MAWSEM_KEY,
  version: 2,
  changelog: "Mawsem v2: product page",
  productPage: { surface: "flat", thumbs: "side", band: "paper", extras: ["product-shipping"], copy: { back: L("رجوع للموسم", "Back to the season"), reviews: L("لبسوه وقالوا", "Worn and reviewed"), related: L("كمّل الإطلالة", "Complete the look") } },
  name: L("موسم", "Mawsem"),
  description: L(
    "موضة كل يوم: بانرات متحركة، تسوق بالقطعة، الأكثر مبيعاً وآراء العملاء. أربع صفحات جاهزة.",
    "Everyday fashion: a banner carousel, shop by piece, best sellers and reviews. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 1010,
  palette: ["#f7f5f1", "#ebe6de", "#e8b04a", "#2f4a3a"],
  colors: {
    primary: "#2f4a3a",
    secondary: "#ebe6de",
    background: "#f7f5f1",
    foreground: "#1f1d1a",
    muted: "#6a645c",
    border: "#ddd6ca",
    accent: "#e8b04a",
  },
  fonts: { heading: "Reem Kufi", body: "IBM Plex Sans Arabic" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن موسم", "About"), seo: { title: L("عن موسم", "About Mawsem") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا على mawsem@mawsem.eg أو على واتساب.", "Write to mawsem@mawsem.eg or on WhatsApp."),
        heading: L("اسأل عن مقاس أو لون", "Ask about a size or colour"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتبديل والتوصيل.", "Sizes, exchanges and delivery."),
        question: L("أقدر أبدّل المقاس؟", "Can I exchange the size?"),
        answer: L("أيوه، التبديل ببلاش خلال ١٤ يوم طالما القطعة بالتيكت بتاعها.", "Yes, exchanges are free within 14 days while the piece still has its tag."),
      }),
    },
  ],
  demo: DEMO,
});
