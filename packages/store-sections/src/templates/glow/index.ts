/**
 * Glow (template 10, modern cosmetics; Claude Design "Storefront
 * Templates"): blush paper, a coral red for actions and a peach highlight,
 * Lalezar display type over Tajawal and 20px corners. A playful,
 * shade-led store: an editorial collage, story rings, a segmented shelf,
 * gifts, a flash deal, photo reviews and customer photos. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): lipsticks, glosses,
 * blush and highlighter compacts and pigments on plain surfaces. No faces,
 * hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const GLOW_KEY = "glow";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GLOW_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  blushLip: pexels(2533266, 900),
  lipTrio: pexels(7256082, 900),
  gloss: pexels(19572463, 900),
  lipRow: pexels(7810600, 900),
  lipMarble: pexels(4889718, 900),
  lipQuartet: pexels(1625037, 900),
  blushDuo: pexels(14483746, 900),
  highlighter: pexels(4938507, 900),
  pigments: pexels(7256109, 900),
  lashTools: pexels(8558546, 900),
};

const NAME = L("وردي بيوتي", "Wardi Beauty");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("الجديد", "New"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [NEW, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ وردي بيوتي. كل الحقوق محفوظة.", "© 2026 Wardi Beauty. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "‏hello@store.com": "‏hello@wardibeauty.com",
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-collage", {
    photo: [PHOTOS.blushLip, PHOTOS.lipTrio, PHOTOS.gloss],
    text: {
      "حكاية الموسم": L("مجموعة الخريف", "The autumn edit"),
      "٣ قطع تكفي أسبوعًا كاملًا": L("٣ منتجات ووش جاهز", "Three products, one easy face"),
      "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.": L(
        "روج مطفي وبلاشر كريمي وجلوس لامع. خمس دقايق الصبح وخلاص.",
        "A matte lip, a cream blush and a high-shine gloss. Five minutes in the morning and done.",
      ),
      "تسوّق اللوك": L("تسوقي اللوك", "Shop the look"),
      "القطعة الأولى": L("ثنائي الخدود والشفايف", "Cheek & lip duo"),
      "القطعة الثانية": L("فيلفت مطفي، ٣ درجات", "Velvet Matte, three shades"),
      "القطعة الثالثة": L("جلوس لامع", "Glass Shine Gloss"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-stories", {
    photo: [PHOTOS.lipRow, PHOTOS.gloss, PHOTOS.blushDuo, PHOTOS.highlighter, PHOTOS.pigments, PHOTOS.lashTools, PHOTOS.lipMarble, PHOTOS.lipQuartet],
    text: {
      "الأقسام": L("تسوقي بالقسم", "Shop by category"),
      "وصل حديثًا": L("الشفايف", "Lips"),
      "الأكثر مبيعًا": L("جلوس", "Gloss"),
      "العروض": L("بلاشر", "Blush"),
      "هدايا": L("هايلايتر", "Highlighter"),
      "إكسسوارات": L("ظلال", "Eyes"),
      "أساسيات": L("أدوات", "Tools"),
      "مجموعات": L("روج مطفي", "Matte lips"),
      "الموسم الجديد": L("بوكسات هدايا", "Gift sets"),
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختاري مزاجك", "Pick your mood"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا تحت ١٠٠٠ جنيه": L("هدايا تحت ٥٠٠ ج.م", "Gifts under EGP 500"),
      "اختيارات مضمونة لأي مناسبة.": L("اختيارات مضمونة لصاحبتك أو أختك أو ليكي.", "Safe picks for a friend, a sister or yourself."),
    },
    links: { "/products": SHOP },
  }),
  lib("promo-sticker", { text: { "عرض اليوم بس": L("الأسبوع ده بس", "This week only") } }),
  lib("testimonials-photos", {
    photo: [undefined, undefined, PHOTOS.lipMarble, PHOTOS.gloss, PHOTOS.blushLip, PHOTOS.lipQuartet],
    text: {
      "من عملائنا": L("من عميلاتنا", "From our customers"),
      "صورة العميل": L("المنتج اللي اشترته", "The product she bought"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "روزوود بقى لوني كل يوم. فضل ثابت طول الفرح.",
        "Rosewood is my everyday shade now. It lasted through a whole wedding.",
      ),
      "م": L("ح", "H"),
      "مريم أ.": L("حبيبة م.", "Habiba M."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "لامع ومش لزج. شعري مش بيلزق فيه على الكورنيش.",
        "Shiny without being sticky. My hair does not stick to it on the corniche.",
      ),
      "ع": L("ر", "R"),
      "عمر ك.": L("ريم ت.", "Reem T."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("البلاشر تحفة، الروج أغمق شوية من الصورة.", "The blush is beautiful; the lipstick is a little darker than the photo."),
      "ن": L("ل", "L"),
      "نور ح.": L("لينا ع.", "Lina A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("اشتريت البوكس هدية وفي الآخر خدت منه اتنين.", "Bought the box as a gift and ended up keeping two."),
      "ي": L("م", "M"),
      "يوسف م.": L("مايا س.", "Maya S."),
      "اشترى من المتجر": L("اشترت من المتجر", "Verified buyer"),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.lipRow, PHOTOS.highlighter, PHOTOS.pigments, PHOTOS.lashTools, PHOTOS.lipQuartet],
    text: {
      "عملاؤنا": L("اعملي لنا تاج تظهري هنا", "Tag us to be featured"),
      "أرسل لنا صورتك": L("ابعتيلنا صورتك", "Send us your photo"),
      "مريم": handle("@farah"),
      "عمر": handle("@salma.k"),
      "نور": handle("@habiba"),
      "يوسف": handle("@nour.m"),
      "سلمى": handle("@jana"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وردي", "About Wardi"), L("براند مكياج من القاهرة بيجرّب كل درجة على ألوان البشرة المصرية.", "A Cairo make-up brand testing every shade on Egyptian skin tones.")),
  aboutStory(lib, {
    photo: PHOTOS.lipQuartet,
    alt: L("أربع درجات روج جنب بعض", "Four lipstick shades side by side"),
    eyebrow: L("سيتي ستارز", "City Stars"),
    title: L("كل درجة اتجربت على بشرتنا", "Every shade tested on our skin tones"),
    text: L("بنطوّر الألوان في القاهرة ونجرّبها على ألوان البشرة المصرية قبل ما تنزل.", "We develop our shades in Cairo and test them on Egyptian skin tones before launch."),
    more: L("وبتعيش صيف القاهرة كله.", "And they last through a Cairo summer."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألوان بتعيش صيف القاهرة كله.", "Colour that lasts through a Cairo summer."),
  categories: [
    ["lips", "الشفايف", "Lips", PHOTOS.lipMarble],
    ["gloss", "جلوس", "Gloss", PHOTOS.gloss],
    ["face", "الوش", "Face", PHOTOS.blushDuo],
    ["eyes", "العيون", "Eyes", PHOTOS.pigments],
    ["sets", "بوكسات هدايا", "Gift sets", PHOTOS.lipQuartet],
  ],
  products: [
    ["velvet-matte-lipstick", "lips", "روج مطفي فيلفت", "Velvet Matte Lipstick", PHOTOS.lipMarble, 320, { isFeatured: true, rating: 4.8, sold90: 520 }],
    ["glass-shine-gloss", "gloss", "جلوس لامع", "Glass Shine Gloss", PHOTOS.gloss, 260, { rating: 4.7, sold90: 310 }],
    ["lip-tint-row", "lips", "تينت شفايف", "Lip Tint", PHOTOS.lipRow, 300, { sold90: 76 }],
    ["nude-lipstick-trio", "lips", "ثلاثي روج نود", "Nude Lipstick Trio", PHOTOS.lipTrio, 690, { compareAtPrice: 820, sold90: 144 }],
    ["cheek-lip-duo", "face", "ثنائي خدود وشفايف", "Cheek & Lip Duo", PHOTOS.blushLip, 450, { isFeatured: true, rating: 4.9, sold90: 205 }],
    ["blush-duo", "face", "بلاشر دبل", "Blush Duo", PHOTOS.blushDuo, 380, { compareAtPrice: 440, sold90: 98 }],
    ["glow-highlighter", "face", "هايلايتر جلو", "Glow Highlighter", PHOTOS.highlighter, 420, { sold90: 167 }],
    ["pigment-pots", "eyes", "ظلال بيجمنت", "Pigment Pots", PHOTOS.pigments, 350, { sold90: 62 }],
    ["lipstick-party-box", "sets", "بوكس الروج", "Lipstick Party Box", PHOTOS.lipQuartet, 890, { compareAtPrice: 1040, rating: 4.8, sold90: 62 }],
  ],
});

export const GLOW = libraryTemplate({
  key: GLOW_KEY,
  version: 3,
  changelog: "Glow v3: product page",
  name: L("جلو", "Glow"),
  description: L(
    "مستحضرات تجميل: كولاج للوك، أقسام دائرية، عرض الأسبوع وصور العميلات. أربع صفحات جاهزة.",
    "Modern cosmetics: a look collage, story rings, a weekly deal and customer photos. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 100,
  palette: ["#fff6f1", "#ffe1d6", "#ff6f59", "#2b1b1f"],
  colors: {
    primary: "#d8432c",
    secondary: "#ffe1d6",
    background: "#fff6f1",
    foreground: "#2b1b1f",
    muted: "#6e5458",
    border: "#f1d4c9",
    accent: "#ffc7b4",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن وردي", "About Wardi") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("سيتي ستارز، كشك ١٤، مدينة نصر.", "City Stars, Kiosk 14, Nasr City."),
        heading: L("محتارة في درجة؟", "Unsure about a shade?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الدرجات والتوصيل والاسترجاع.", "Shades, delivery and returns."),
        question: L("لو الدرجة طلعت مش مناسبة؟", "What if the shade is not right?"),
        answer: L(
          "ابعتيلنا صورة خلال ٧ أيام والمنتج مقفول، ونبدّله بدرجة تانية مجاناً.",
          "Send us a photo within 7 days with the product sealed and we swap it for another shade for free.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "bottom", band: "brand", copy: { back: L("رجوع للشيدات", "Back to the shades"), reviews: L("صور وآراء حقيقية", "Real photos and reviews"), related: L("شيدات تحبيها كمان", "Shades you may love too") } },
});
