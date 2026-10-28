/**
 * Kholkhal (template 107, gold-plated jewellery; Claude Design "Storefront
 * Templates"): warm ivory paper, a bronze brown for actions and a soft gold
 * highlight, El Messiri headings over Noto Sans Arabic text and square
 * corners. An everyday jewellery shop: banners for rings, earrings and gift
 * bracelets, shop-by-type rings, a segmented shelf, gifts by budget, give
 * 10% get 10% and a wall of reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * The design's "Refer a friend" block has no library design yet: it uses
 * the reward card (`popup-reward`) with the referral copy and code. The
 * shelf's "On sale" tab shows top rated (there is no sale sort).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): rings on a gold tray,
 * diamond hoops, a braided chain bracelet, a showcase set, rings on a
 * plinth, rings on white blocks, hoops on lilac flowers, a rose-gold
 * bangle, a leaf set, a ginkgo set, a necklace on an embroidery hoop, hoops
 * in a box, a gift-boxed set, small hoops on a stone disc, silver rings and
 * a ring with a pendant on a dish. The design's two photos of hands wearing
 * rings were replaced. No people, no hands, ears, necks or wrists, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KHOLKHAL_KEY = "kholkhal";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KHOLKHAL_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ringTray: pexels(9590858),
  ringTraySmall: pexels(9590858, 900),
  hoopsWide: pexels(20943477),
  hoops: pexels(20943477, 900),
  braidedWide: pexels(12124662),
  braided: pexels(12124662, 900),
  showcase: pexels(20858959, 900),
  plinthRings: pexels(30541169, 900),
  blockRings: pexels(27597577, 900),
  lilacHoops: pexels(12452943, 900),
  pedestal: pexels(25283502, 900),
  leafSet: pexels(29502436, 900),
  ginkgoSet: pexels(29503018, 900),
  hoopNecklace: pexels(19783942, 900),
  boxHoops: pexels(7882737, 900),
  giftBox: pexels(34399026, 900),
  giftBoxWide: pexels(34399026),
  huggies: pexels(12168883, 900),
  silverRings: pexels(15684127, 900),
  dishRing: pexels(16664386, 900),
};

const NAME = L("خلخال", "Kholkhal");

const header = lib("header-centered", {
  text: {
    "المتجر": L("وصل جديد", "New in"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("إكسسوارات كل يوم متغلفة هدية", "Everyday jewellery, gift-wrapped"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عننا", "About"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/faq" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ خلخال. كل الحقوق محفوظة.", "© 2026 Kholkhal. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.ringTray, PHOTOS.hoopsWide, PHOTOS.braidedWide],
    text: {
      "وصل حديثًا": L("خواتم", "Rings"),
      "الموسم الجديد وصل": L("خواتم تتلبس فوق بعض", "Rings made for stacking"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("مطلية دهب ومناسبة للبشرة الحساسة.", "Gold-plated and gentle on sensitive skin."),
      "تسوّق الجديد": L("تسوقي خواتم", "Shop rings"),
      "صورة الحملة الأولى": L("خواتم دهبي في صينية خزف", "Gold rings on a ceramic tray"),
      "الأكثر مبيعًا": L("حلقان", "Earrings"),
      "المفضّلة عند عملائنا": L("حلق صغير وفرق كبير", "Small hoops, big difference"),
      "القطع اللي بترجع لها كل مرة.": L("خفيفة وتتلبس طول اليوم.", "Light enough to wear all day."),
      "شوف الأكثر مبيعًا": L("تسوقي حلقان", "Shop earrings"),
      "صورة الحملة الثانية": L("حلق هوب دهبي بفصوص", "Gold hoop earrings with stones"),
      "عروض الأسبوع": L("هدايا", "Gifts"),
      "خصومات لفترة محدودة": L("إسورة في علبة هدية", "A bracelet in a gift box"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كل طلب بيوصل متغلف هدية.", "Every order ships gift-wrapped."),
      "تسوّق العروض": L("تسوقي غوايش", "Shop bracelets"),
      "صورة الحملة الثالثة": L("غويشة دهبي مضفّرة على قطيفة كحلي", "A braided gold bracelet on navy velvet"),
    },
    links: { "/products": [search("خاتم"), search("حلق"), search("غويشة")] },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.plinthRings,
      PHOTOS.lilacHoops,
      PHOTOS.pedestal,
      PHOTOS.leafSet,
      PHOTOS.hoopNecklace,
      PHOTOS.boxHoops,
      PHOTOS.giftBox,
      PHOTOS.blockRings,
    ],
    text: {
      "الأقسام": L("تسوقي بالنوع", "Shop by type"),
      "وصل حديثًا": L("خواتم", "Rings"),
      "الأكثر مبيعًا": L("حلقان", "Earrings"),
      "العروض": L("غوايش", "Bracelets"),
      "هدايا": L("أطقم", "Sets"),
      "إكسسوارات": L("سلاسل", "Necklaces"),
      "أساسيات": L("هوب", "Hoops"),
      "مجموعات": L("هدايا", "Gifts"),
      "الموسم الجديد": L("دبل", "Bands"),
    },
    links: {
      "/products": [
        SHOP,
        search("خاتم"),
        search("حلق"),
        search("غويشة"),
        search("طقم"),
        search("سلسلة"),
        search("هوب"),
        search("هدية"),
        search("دبلة"),
      ],
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختاري", "Pick"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("finder-price-bands", {
    text: {
      "تسوق حسب ميزانيتك": L("هدايا حسب الميزانية", "Gifts by budget"),
      "أقل من ٦٠٠": L("أقل من ٤٠٠", "Under 400"),
      "٦٠٠ – ١٬٥٠٠": L("٤٠٠ – ٧٠٠", "400 – 700"),
      "أكتر من ١٬٥٠٠": L("أكتر من ٧٠٠", "Over 700"),
      "تسوق الشريحة دي": L("تسوقي الهدايا دي", "Shop these gifts"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("بيتلبس كل يوم", "Worn every day"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "تشطيب تحفة، وجه في علبة هدية.",
        "Beautiful finish, and it came in a gift box.",
      ),
      "م": L("س", "S"),
      "مريم أ.": L("سحر ك.", "Sahar K."),
      "القاهرة": L("الجيزة", "Giza"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("بلبسه كل يوم ولسه بيلمع.", "I wear it every day and it still shines."),
      "ي": L("م", "M"),
      "يوسف م.": L("مي ي.", "Mai Y."),
      "المنصورة": L("شبرا", "Shubra"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بدّلت مقاس الخاتم في يومين من غير أي تعب.", "I swapped my ring size in two days, no hassle."),
      "ع": L("ر", "R"),
      "عمر ك.": L("رنا ك.", "Rana K."),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("قطعة حلوة، أصغر شوية من اللي توقعته.", "A lovely piece, a little smaller than I expected."),
      "س": L("ن", "N"),
      "سلمى ر.": L("نادين ع.", "Nadine A."),
      "أسيوط": L("طنطا", "Tanta"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الحلق خفيف جداً ومش بيعمل حساسية خالص.", "The hoops are very light and cause no irritation at all."),
      "ن": L("ه", "H"),
      "نور ح.": L("هنا م.", "Hana M."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار هدية لماما على الواتساب.", "They helped me pick a gift for my mum on WhatsApp."),
      "ك": L("ل", "L"),
      "كريم ع.": L("لمياء ع.", "Lamia A."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن خلخال", "About Kholkhal"), L("إكسسوارات كل يوم متغلفة هدية.", "Everyday jewellery, gift-wrapped.")),
  aboutStory(lib, {
    photo: PHOTOS.giftBoxWide,
    alt: L("طقم سلسلة وحلق دهبي في علبة هدية حمرا", "A gold necklace and earring set in a red gift box"),
    eyebrow: L("متغلف هدية", "Gift-wrapped"),
    title: L("دهب تلبسيه كل يوم", "Gold for every day"),
    text: L("قطع مطلية دهب مناسبة للبشرة الحساسة، خفيفة وتتلبس من الصبح لبالليل.", "Gold-plated pieces that are gentle on sensitive skin, light enough to wear from morning to night."),
    more: L("وكل طلب بيوصل في علبة هدية ببلاش.", "And every order arrives in a free gift box."),
    button: L("تسوقي الإكسسوارات", "Shop jewellery"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إكسسوارات كل يوم متغلفة هدية.", "Everyday jewellery, gift-wrapped."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.plinthRings],
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "غوايش", "Bracelets", PHOTOS.braided],
    ["sets", "أطقم", "Sets", PHOTOS.showcase],
  ],
  products: [
    ["stacking-ring-set", "rings", "طقم خواتم ستاك", "Stacking Ring Set", PHOTOS.ringTraySmall, 578, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["hoop-earrings", "earrings", "حلق هوب", "Hoop Earrings", PHOTOS.hoops, 347, { sold90: 120 }],
    ["rope-chain-bracelet", "bracelets", "غويشة سلسلة مبرومة", "Rope Chain Bracelet", PHOTOS.braided, 507, { sold90: 88 }],
    ["sculpted-ring", "rings", "خاتم منحوت", "Sculpted Ring", PHOTOS.dishRing, 333, { sold90: 44 }],
    ["evening-set", "sets", "طقم سهرة", "Evening Set", PHOTOS.showcase, 1015, { compareAtPrice: 1190, isFeatured: true, sold90: 31 }],
    ["promise-ring", "rings", "خاتم وعد", "Promise Ring", PHOTOS.silverRings, 420, { compareAtPrice: 490, sold90: 52 }],
    ["huggie-earrings", "earrings", "حلق صغير لازق", "Huggie Earrings", PHOTOS.huggies, 299, { sold90: 74 }],
    ["leaf-set", "sets", "طقم ورق الشجر", "Leaf Set", PHOTOS.leafSet, 890, { rating: 4.9, sold90: 40 }],
    ["ginkgo-set", "sets", "طقم جنكو", "Ginkgo Set", PHOTOS.ginkgoSet, 960, { sold90: 28 }],
    ["pave-bangle", "bracelets", "غويشة بفصوص", "Pavé Bangle", PHOTOS.pedestal, 640, { inStock: false, sold90: 36 }],
  ],
});

export const KHOLKHAL = libraryTemplate({
  key: KHOLKHAL_KEY,
  version: 2,
  changelog: "Kholkhal v2: product page",
  productPage: { thumbs: "side", gallery: "end", button: "outline", band: "shelf", extras: ["product-perks"], copy: { reviews: L("كلام العميلات", "Words from our customers"), related: L("قطع تحلّي معاها", "Pieces to wear with it") } },
  name: L("خلخال", "Kholkhal"),
  description: L(
    "إكسسوارات مطلية دهب: بانرات متحركة، أقسام دائرية، هدايا حسب الميزانية وآراء العميلات. أربع صفحات جاهزة.",
    "Gold-plated jewellery: banner carousel, story rings, gifts by budget and reviews. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 1070,
  palette: ["#fbf9f5", "#f1ebe1", "#e6c77f", "#7a5a2e"],
  colors: {
    primary: "#7a5a2e",
    secondary: "#f1ebe1",
    background: "#fbf9f5",
    foreground: "#2a2420",
    muted: "#6d635a",
    border: "#e4dbcd",
    accent: "#e6c77f",
  },
  fonts: { heading: "El Messiri", body: "Noto Sans Arabic" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن خلخال", "About Kholkhal") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("kholkhal@kholkhal.eg، وبنرد كل يوم.", "kholkhal@kholkhal.eg, and we reply every day."),
        heading: L("عن مقاس أو هدية", "About a size or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطلاء والمقاسات والتغليف.", "Plating, sizes and gift wrap."),
        question: L("التغليف الهدية بفلوس؟", "Is gift wrap extra?"),
        answer: L("لأ، كل طلب بيوصل متغلف هدية ببلاش، وتقدري تكتبي كارت.", "No, every order arrives gift-wrapped free, and you can add a card."),
      }),
    },
  ],
  demo: DEMO,
});
