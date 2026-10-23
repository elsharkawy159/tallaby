/**
 * Streetwear (template 03, bold urban fashion; Claude Design "Storefront
 * Templates"): white, concrete grey, acid lime and pure black, square
 * corners and heavy Rubik type. Built from section library designs
 * (`fromLibrary`), so every element is a tree node the seller can select,
 * restyle and move.
 *
 * Photos: Pexels, each checked by eye (2026-10-20): hoodies and tees on
 * rails, folded joggers, sneakers, a streetwear shop and graffiti walls. No
 * people, bodies or mannequins (owner rule), and no third-party logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const STREETWEAR_KEY = "streetwear";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(STREETWEAR_KEY, getDesign(id)!, { corners: 0, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  alley: pexels(11251399),
  passage: pexels(36263839, 900),
  pastelHoodies: pexels(9594667),
  sageHoodie: pexels(9594669, 900),
  hoodiePair: pexels(9594679, 900),
  blackHoodieRack: pexels(30095399, 900),
  teeRail: pexels(36025541, 900),
  shirtRack: pexels(5698856, 900),
  printTees: pexels(31995223, 900),
  sweatpants: pexels(31961167, 900),
  sneakers: pexels(7916058, 900),
  messenger: pexels(29464416, 900),
  shop: pexels(4903412),
};

const NAME = L("حارة سبلاي", "Hara Supply");

const header = lib("header-brand-bar", {
  text: { "م": L("ح", "H"), "اسم متجرك": NAME, "ابحث في المتجر": L("دوّر في الدروب", "Search the drop") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("نتقابل في الدروب الجاي", "See you at the next drop"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حارة سبلاي. كل الحقوق محفوظة.", "© 2026 Hara Supply. All rights reserved."),
    "وصل حديثًا": L("دروب ٠٧", "Drop 07"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن حارة", "About Hara"),
  },
  links: { "/products": [undefined, NEW, BEST, "/products?sort=rating"] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.alley],
    text: {
      "مجموعة الموسم": L("دروب ٠٧", "Drop 07"),
      "من ١ إلى ٣٠ نوفمبر": L("متاح دلوقتي · لحد ما الكمية تخلص", "Live now · while stock lasts"),
      "صورة الحملة": L("شارع جانبي مليان جرافيتي", "A side street covered in graffiti"),
      "خصم": L("بس", "Only"),
      "٣٠٪": L("١٢٠", "120"),
      "لفترة محدودة": L("قطعة", "pieces"),
      "الموسم الجديد وصل": L("معمول في شارعنا", "Made on our street"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "هوديز وتيشيرتات قطن تقيل، مطبوعة باليد في شبرا بكميات ١٢٠ قطعة.",
        "Heavy cotton hoodies and tees, printed by hand in Shubra in runs of 120.",
      ),
      "اكتشف المجموعة": L("تسوق الدروب", "Shop the drop"),
    },
    links: { "/products": NEW },
  }),
  lib("products-bento", {
    text: { "الكل بيسأل عليهم": L("بيخلص بسرعة", "Going fast") },
    links: { "/products": BEST },
  }),
  lib("products-rail", {
    as: "drop-rail",
    text: { "بيحبوها": L("دروب ٠٧", "Drop 07"), "الأكثر مبيعًا": L("كل حاجة في الدروب", "Everything in the drop") },
    links: { "/products": NEW },
    lists: [{ source: "newest" }],
  }),
  lib("page-image", {
    as: "hoodies-banner",
    name: L("بانر قسم الهوديز", "Hoodies banner"),
    photo: [PHOTOS.pastelHoodies],
    text: {
      "صورة البانر": L("هوديز بألوان هادية على الشماعة", "Soft-coloured hoodies on a rail"),
      "اسم القسم": L("هوديز", "Hoodies"),
      "تشكيلة مختارة لهذا الموسم": L("قطن مشطوف ٤٥٠ جرام بقصّة واسعة.", "450 gsm brushed cotton, boxy cut."),
    },
  }),
  lib("text-statement", {
    text: {
      "كل سنة وانتم طيبين. الطلبات شغالة طول أيام العيد.": L("مفيش ريستوك. الدروب لما يخلص، يخلص.", "No restocks. When a drop is gone, it is gone."),
      "— فريق المتجر": L("— فريق حارة", "— The Hara team"),
      "مواعيد التوصيل": L("كل الدروب", "Shop the drop"),
    },
    links: { "/shipping": NEW },
  }),
  lib("gallery-bento", {
    photo: [PHOTOS.passage, PHOTOS.hoodiePair, PHOTOS.shirtRack, PHOTOS.blackHoodieRack, PHOTOS.printTees],
    text: {
      "صورة إنستجرام": L("صورة من إنستجرام حارة", "A photo from Hara's Instagram"),
      "@اسم_متجرك": handle("@harasupply"),
      "صور جديدة كل أسبوع": L("٣٨ ألف متابع", "38K followers"),
    },
  }),
];

const pageHeader = (as: string, title: ReturnType<typeof L>, text: ReturnType<typeof L>) =>
  lib("page-header", { as, text: { "من نحن": title, "فريق صغير يختار منتجات نشتريها نحن أنفسنا.": text } });

const about: Design[] = [
  pageHeader("about-header", L("عن حارة", "About Hara"), L("صاحبين وترابيزة طباعة وشارع في شبرا.", "Two friends, one print table and a street in Shubra.")),
  lib("about-classic", {
    person: [undefined, undefined, PHOTOS.shop],
    text: {
      "صورة المتجر": L("محل لبس ستريت مليان رفوف", "A streetwear shop full of rails"),
      "حكايتنا": L("من ٢٠٢٠", "Since 2020"),
      "بدأنا بسؤال واحد: هل سيدوم؟": L("كل دروب ١٢٠ قطعة بس", "Every drop is 120 pieces"),
      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": L(
        "بنطبع كل تصميم بإيدينا على قطن تقيل، وبنصوّر الدروب في شارعنا بعد ما المحلات تقفل.",
        "We print every design by hand on heavy cotton and shoot each drop on our street after the shops close.",
      ),
      "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": L("ولما الدروب يخلص، مش بيرجع تاني.", "And when a drop sells out, it never comes back."),
      "تعرّف علينا": L("تسوق الدروب", "Shop the drop"),
    },
    links: { "/about": NEW },
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("من عملائنا", "From our customers"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "أتقل هودي عندي. اتغسل عشر مرات والطباعة لسه زي ما هي.",
        "Heaviest hoodie I own. Washed it ten times and the print is still sharp.",
      ),
      "م": L("ي", "Y"),
      "مريم أ.": L("يوسف ع.", "Youssef A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "لحقت الدروب بعد خمس دقايق من نزوله. يستاهل السهر.",
        "Got the drop five minutes after it went live. Worth staying up for.",
      ),
      "ع": L("م", "M"),
      "عمر ك.": L("ملك ر.", "Malak R."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المقاسات واسعة، انزل مقاس لو عايز قصّة عادية.", "Runs big, size down if you want a normal fit."),
      "ن": L("ز", "Z"),
      "نور ح.": L("زياد ح.", "Ziad H."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const contact: Design[] = [
  pageHeader("contact-header", L("كلمنا", "Talk to us"), L("عن مقاس أو طلب أو الدروب الجاي.", "About a size, an order or the next drop.")),
  lib("contact-form", { text: { "راسلنا": L("راسلنا", "Write to us"), "ابعتلنا وهنرجعلك": L("ابعتلنا وهنرد عليك", "Send us a message") } }),
];

const faq: Design[] = [
  pageHeader("faq-header", L("الأسئلة الشائعة", "FAQ"), L("المقاسات والدروبات والتوصيل.", "Sizes, drops and delivery.")),
  lib("faq-columns", {
    text: {
      "ما سياسة الاسترجاع؟": L("هل في ريستوك؟", "Do you restock?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "لأ. كل دروب ١٢٠ قطعة ولما يخلص مش بيرجع. الاستبدال متاح خلال ١٤ يوم لو المقاس مش مظبوط.",
        "No. Each drop is 120 pieces and never comes back. Size exchanges are open for 14 days.",
      ),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطن تقيل وطباعة عالية، معمول في شبرا.", "Heavy cotton, loud prints, made in Shubra."),
  categories: [
    ["hoodies", "هوديز", "Hoodies", PHOTOS.pastelHoodies],
    ["tees", "تيشيرتات", "Tees", PHOTOS.teeRail],
    ["bottoms", "بناطيل", "Bottoms", PHOTOS.sweatpants],
    ["shoes", "شوزات", "Shoes", PHOTOS.sneakers],
    ["bags", "شنط", "Bags", PHOTOS.messenger],
  ],
  products: [
    ["drop07-heavy-hoodie", "hoodies", "هودي دروب ٠٧ تقيل", "Drop 07 Heavy Hoodie", PHOTOS.sageHoodie, 1650, { isFeatured: true, rating: 4.9, sold90: 132 }],
    ["washed-hoodie-duo", "hoodies", "هودي مغسول", "Washed Hoodie", PHOTOS.hoodiePair, 1450, { compareAtPrice: 1750, sold90: 58 }],
    ["black-logo-hoodie", "hoodies", "هودي أسود سادة", "Black Blank Hoodie", PHOTOS.blackHoodieRack, 1550, { rating: 4.8, sold90: 44 }],
    ["camo-tee", "tees", "تيشيرت مموّه", "Camo Tee", pexels(12262102, 900), 700, { sold90: 40 }],
    ["plant-print-tee", "tees", "تيشيرت طباعة نبات", "Plant Print Tee", PHOTOS.printTees, 650, { rating: 4.7, sold90: 61 }],
    ["heavy-tee-pair", "tees", "تيشيرتين تقال", "Heavy Tee Pair", pexels(18186105, 900), 1100, { compareAtPrice: 1300, sold90: 33 }],
    ["lounge-joggers", "bottoms", "بنطلون جوجر", "Lounge Joggers", pexels(31961168, 900), 950, { rating: 4.7, sold90: 97 }],
    ["drawstring-sweatpants", "bottoms", "بنطلون سويت برباط", "Drawstring Sweatpants", PHOTOS.sweatpants, 900, { sold90: 21 }],
    ["grey-canvas-sneakers", "shoes", "كوتشي كانفاس رمادي", "Grey Canvas Sneakers", PHOTOS.sneakers, 1300, { sold90: 18 }],
    ["leather-messenger", "bags", "شنطة كروس جلد", "Leather Messenger", PHOTOS.messenger, 1300, { inStock: false, sold90: 39 }],
  ],
});

export const STREETWEAR = libraryTemplate({
  key: STREETWEAR_KEY,
  version: 3,
  changelog: "Streetwear v3: product page",
  name: L("ستريت وير", "Streetwear"),
  description: L(
    "موضة شارع جريئة: أبيض وأسود وأخضر ليموني، زوايا حادة وخط عريض. أربع صفحات جاهزة.",
    "Bold urban fashion: black, white and acid lime, square corners and heavy type. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 30,
  palette: ["#ffffff", "#e9e9e9", "#d7ff3a", "#0b0b0b"],
  colors: {
    primary: "#0b0b0b",
    secondary: "#e9e9e9",
    background: "#ffffff",
    foreground: "#0b0b0b",
    muted: "#555555",
    border: "#d6d6d6",
    accent: "#d7ff3a",
  },
  fonts: { heading: "Rubik", body: "Rubik" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    {
      slug: "about",
      name: L("عن حارة", "About"),
      seo: { title: L("عن حارة", "About Hara"), description: L("صاحبين وترابيزة طباعة وشارع في شبرا.", "Two friends, one print table and a street in Shubra.") },
      sections: about,
    },
    { slug: "contact", name: L("تواصل", "Contact"), seo: { title: L("كلمنا", "Talk to us") }, sections: contact },
    { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
  ],
  demo: DEMO,
  productPage: { thumbs: "side", headingCase: "upper", tracking: 0.06, band: "brand", copy: { back: L("رجوع للشارع", "Back to the street"), reviews: L("الشارع بيقول إيه", "What the street says"), related: L("كمّل اللوك", "Run the full fit") } },
});
