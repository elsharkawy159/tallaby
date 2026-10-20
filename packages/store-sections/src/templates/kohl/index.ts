/**
 * Kohl (template 61, bold makeup; Claude Design "Storefront Templates"):
 * blush paper, a deep magenta for actions and a sunny yellow highlight,
 * Lalezar display type over Tajawal and 18px corners. A loud colour store:
 * one giant word behind the featured kit, story rings by step, a segmented
 * shelf, this week's flash deal, spend tiers, a refer-a-friend card and a
 * review wall. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): lipsticks, lip pencils,
 * eyeshadow palettes, crushed pigments, nail polish, mascara and brushes
 * on plain surfaces. No faces, no hands and no brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KOHL_KEY = "kohl";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KOHL_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  lipFan: pexels(7256145, 900),
  lipPeach: pexels(7256118, 900),
  lipPencilPink: pexels(7256137, 900),
  lipTrio: pexels(7256096, 900),
  lipDuo: pexels(7256136, 900),
  lipVelvet: pexels(7810564, 900),
  mascara: pexels(3373728, 900),
  nudePalette: pexels(4774061, 900),
  brightPalette: pexels(324656, 900),
  pigments: pexels(15657763, 900),
  polish: pexels(3631691, 900),
  brushes: pexels(205923, 900),
  lipPattern: pexels(7256149),
};

const NAME = L("كحل بيوتي", "Kohl Beauty");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("الجديد", "New in"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [NEW, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كحل بيوتي. كل الحقوق محفوظة.", "© 2026 Kohl Beauty. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "‏hello@store.com": "‏kohl@kohlbeauty.eg",
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const STEPS: [ar: string, en: string, q: string][] = [
  ["الشفايف", "Lips", "روج"],
  ["العيون", "Eyes", "ظلال"],
  ["الماسكرا", "Mascara", "ماسكرا"],
  ["الضوافر", "Nails", "مناكير"],
  ["الفرش", "Brushes", "فرش"],
  ["قلم الشفايف", "Lip liner", "قلم"],
  ["لامع", "Glitter", "لامع"],
  ["روج مطفي", "Matte lips", "مطفي"],
];

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("لون", "COLOUR") } }),
  lib("categories-stories", {
    photo: [PHOTOS.lipFan, PHOTOS.brightPalette, PHOTOS.mascara, PHOTOS.polish, PHOTOS.brushes, PHOTOS.lipPencilPink, PHOTOS.pigments, PHOTOS.lipPeach],
    text: {
      "الأقسام": L("تسوقي بالخطوة", "Shop by step"),
      "وصل حديثًا": L(STEPS[0]![0], STEPS[0]![1]),
      "الأكثر مبيعًا": L(STEPS[1]![0], STEPS[1]![1]),
      "العروض": L(STEPS[2]![0], STEPS[2]![1]),
      "هدايا": L(STEPS[3]![0], STEPS[3]![1]),
      "إكسسوارات": L(STEPS[4]![0], STEPS[4]![1]),
      "أساسيات": L(STEPS[5]![0], STEPS[5]![1]),
      "مجموعات": L(STEPS[6]![0], STEPS[6]![1]),
      "الموسم الجديد": L(STEPS[7]![0], STEPS[7]![1]),
      "جديد": L("جديد", "New"),
    },
    links: { "/products": [SHOP, ...STEPS.map(([, , q]) => search(q))] },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختاري مزاجك", "Pick your mood"), "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("promo-sticker", { text: { "عرض اليوم بس": L("الأسبوع ده بس", "This week only") } }),
  lib("promo-tiers", {
    text: {
      "عرض الشهر": L("الشهر ده", "This month"),
      "كل ما تزود، توفّر أكتر": L("كل ما تزودي توفّري", "Spend more, save more"),
      "لما تشتري بـ": L("لما تشتري بـ", "Spend"),
      "١٠٠٠ ج.م": L("٨٠٠ ج.م", "EGP 800"),
      "٢٠٠٠ ج.م": L("١٦٠٠ ج.م", "EGP 1,600"),
      "٣٥٠٠ ج.م": L("٢٥٠٠ ج.م", "EGP 2,500"),
      "٥٠٠ ج.م": L("٤٠٠ ج.م", "EGP 400"),
      "خصم على الفاتورة": L("خصم بكود KOHL", "off with a KOHL code"),
    },
  }),
  lib("popup-reward", {
    as: "refer-friend",
    name: L("ادعي صاحبتك", "Refer a friend"),
    text: {
      "جرّب حظك": L("ادّي ١٠٠ وخدي ١٠٠", "Give 100, get 100"),
      "المرة دي كسبت، وده كودك.": L("شاركي كودك. صاحبتك توفر ١٠٠ على طلب ٨٠٠، وانتي كمان.", "Share your code. Your friend saves EGP 100 on EGP 800, and so do you."),
      "كسبت": L("ليكي ولصاحبتك", "For you and a friend"),
      "شحن مجاني": L("خصم ١٠٠ ج.م", "EGP 100 off"),
      "الكود: FREESHIP": L("الكود: KOHL100", "Code: KOHL100"),
      "استخدمه دلوقتي": L("تسوقي دلوقتي", "Shop now"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("اتحط طول اليوم", "Worn all day"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الروج المطفي فضل من الصبح لحد فرح بالليل، ومن غير ما ينشف الشفايف.",
        "The matte lipstick lasted from morning to a wedding at night, without drying my lips.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رنا م.", "Rana M."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الماسكرا مابتسيحش في الحر. دي تالت مرة أطلبها.", "The mascara does not run in the heat. My third time ordering it."),
      "ي": L("ه", "H"),
      "يوسف م.": L("هنا ع.", "Hana A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بعتلهم صورة لون بشرتي ورشحولي الباليت الصح في دقايق.", "I sent a photo of my skin tone and they picked the right palette in minutes."),
      "ع": L("ش", "S"),
      "عمر ك.": L("شهد ك.", "Shahd K."),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل أسيوط في ٣ أيام والتغليف حلو جداً.", "It reached Assiut in 3 days, beautifully packed."),
      "ن": L("م", "M"),
      "نور ح.": L("ملك ح.", "Malak H."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المناكير بيقعد أسبوع من غير ما يتقشر.", "The nail polish lasts a week without chipping."),
      "ك": L("ي", "Y"),
      "كريم ع.": L("يارا ع.", "Yara A."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("الألوان في الحقيقة زي الصور بالظبط.", "The shades look exactly like the photos."),
      "كل الآراء": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كحل", "About Kohl"), L("مكياج بألوان جريئة بيعيش صيف القاهرة.", "Bold makeup that lasts through a Cairo summer.")),
  aboutStory(lib, {
    photo: PHOTOS.lipPattern,
    alt: L("صفوف روج على خلفية وردي", "Rows of lipsticks on a pink background"),
    eyebrow: L("القاهرة", "Cairo"),
    title: L("ألوان بتعيش صيف القاهرة", "Colour that lasts a Cairo summer"),
    text: L("كل لون بنجربه يوم كامل في الحر قبل ما ينزل المتجر.", "We wear every shade for a full day in the heat before it reaches the shop."),
    more: L("وكل شهر بننزل ألوان جديدة، بكميات محدودة.", "And new shades land every month, in limited runs."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألوان بتعيش صيف القاهرة.", "Colour that lasts through a Cairo summer."),
  categories: [
    ["lips", "الشفايف", "Lips", PHOTOS.lipTrio],
    ["eyes", "العيون", "Eyes", PHOTOS.nudePalette],
    ["nails", "الضوافر", "Nails", PHOTOS.polish],
    ["tools", "الأدوات والأطقم", "Tools & kits", PHOTOS.brushes],
  ],
  products: [
    ["matte-lip-trio", "lips", "٣ روج مطفي", "Matte Lip Trio", PHOTOS.lipTrio, 690, { isFeatured: true, rating: 4.8, sold90: 164 }],
    ["lip-liner-duo", "lips", "روج وقلم شفايف", "Lipstick & Liner Duo", PHOTOS.lipDuo, 420, { rating: 4.7, sold90: 120 }],
    ["velvet-lipstick-ruby", "lips", "روج فيلفت روبي", "Velvet Lipstick, Ruby", PHOTOS.lipVelvet, 290, { compareAtPrice: 340, sold90: 188 }],
    ["volume-mascara", "eyes", "ماسكرا فوليوم", "Volume Mascara", PHOTOS.mascara, 320, { rating: 4.9, sold90: 210 }],
    ["nude-eyeshadow-palette", "eyes", "باليت ظلال نود", "Nude Eyeshadow Palette", PHOTOS.nudePalette, 780, { sold90: 74 }],
    ["bright-eyeshadow-palette", "eyes", "باليت ظلال ألوان", "Bright Eyeshadow Palette", PHOTOS.brightPalette, 850, { sold90: 52 }],
    ["glitter-pigments", "eyes", "بودرة ظلال لامعة", "Glitter Pigments", PHOTOS.pigments, 380, { compareAtPrice: 450, sold90: 48 }],
    ["nail-polish-trio", "nails", "٣ مناكير", "Nail Polish Trio", PHOTOS.polish, 240, { sold90: 96 }],
    ["wooden-brush-set", "tools", "طقم فرش خشب", "Wooden Brush Set", PHOTOS.brushes, 1290, { compareAtPrice: 1520, isFeatured: true, rating: 4.9, sold90: 62 }],
  ],
});

export const KOHL = libraryTemplate({
  key: KOHL_KEY,
  version: 1,
  name: L("كحل", "Kohl"),
  description: L(
    "مكياج جريء: كلمة كبيرة، عرض الأسبوع، وفّري مع كل ما تزودي وادعي صاحبتك. أربع صفحات جاهزة.",
    "Bold makeup: a big word hero, this week's deal, spend tiers and refer a friend. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 610,
  palette: ["#fff5f3", "#ffe1db", "#ffd166", "#c2185b"],
  colors: {
    primary: "#c2185b",
    secondary: "#ffe1db",
    background: "#fff5f3",
    foreground: "#2a0f14",
    muted: "#6e4a50",
    border: "#f5cdc5",
    accent: "#ffd166",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كحل", "About"), seo: { title: L("عن كحل", "About Kohl") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("ابعتيلنا صورة لون بشرتك ونرشحلك الألوان.", "Send us a photo of your skin tone and we will suggest shades."),
        heading: L("اسألي عن لون", "Ask about a shade"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الألوان والأكواد والتوصيل.", "Shades, codes and delivery."),
        question: L("ينفع أرجّع روج اتفتح؟", "Can I return an opened lipstick?"),
        answer: L("للأمان مش بنرجّع المكياج المفتوح، بس لو اللون مختلف عن الصورة بنبدّله.", "For hygiene we cannot take back opened makeup, but if a shade differs from its photo we swap it."),
      }),
    },
  ],
  demo: DEMO,
});
