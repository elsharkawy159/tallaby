/**
 * Jewelry Bold (2026-10-28, jewelry niche, bold / dramatic): white paper,
 * near-black ink, a deep ruby brand and a bright gold accent, Reem Kufi
 * headings over Rubik, rounded 14px corners and a 1320px container. A
 * showroom-at-night home: a scrolling ticker header, a three-slide hero
 * carousel of gold on dark grounds, categories as a big-type list, a grid of
 * best sellers from every category, the workshop story in a wide photo, four
 * category rows with rounded frames on dark studio shots, a big newsletter
 * and the sign-off footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28, again at
 * 2000px after browser QA): jewelry, brooches, hair accessories, sunglasses
 * and bags on black, navy and red, no people or body parts, no figures, no
 * readable brand or model lettering, none used twice. Slides 20521805,
 * 12579906, 10414985; about 37485302, about page 31757022; tiles 38728728,
 * 28976815, 7541804, 38966130, 5534844, 704241, 4627902; products as listed
 * in `DEMO`.
 * Swapped before QA: ring 19525059 (size tag); necklace 4595722 (same shoot
 * as 4595727); bracelets 37401772, 37401774, 37401771 (one shoot with
 * 37401770); bags 31929486 (a person), 6167276 (brand plate); about 23325165
 * (framed photo). Swapped after QA: slides 8705773 (CASIO watches) and
 * 12865908 (deity medallion) for 20521805 and 12579906; about page 4004225
 * (face-shaped earrings, script name) for 31757022; ring 9953656 (posed on
 * lips) for 18451698; watches (brand lettering on every dial) became
 * brooches and hair accessories; earrings tile 34365842 (eye charm) for
 * 7541804; bracelets tile 37401769 (same shoot as two bracelets) for
 * 38966130; necklaces 39326362 (skull) and 39326384 (same slate shoot as
 * 39326355) for 20518711 and 4295005; bag 7953286 (embossed brand) dropped;
 * sunglasses 10837793 (temple monogram) for 14849415.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const JEWELRY_BOLD_KEY = "jewelry-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(JEWELRY_BOLD_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201068213497";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideBangles: pexels(20521805, 1920),
  slideStack: pexels(12579906, 1920),
  slideStone: pexels(10414985, 1920),
  story: pexels(37485302, 1200),
  aboutPage: pexels(31757022, 1200),
  // Category photos.
  catRings: pexels(38728728, 1200),
  catNecklaces: pexels(28976815, 1200),
  catEarrings: pexels(7541804, 1200),
  catBracelets: pexels(38966130, 1200),
  catBrooches: pexels(5534844, 1200),
  catSunglasses: pexels(704241, 1200),
  catBags: pexels(4627902, 1200),
};

const NAME = L("لمعة", "Lamaa");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("علبة هدية مع كل طلب", "A gift box with every order"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order in My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن لمعة", "About"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("خلّي كل يوم يلمع", "Make every day shine"),
    "كلمنا على واتساب": L("اسألنا على واتساب", "Ask us on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل القطع", "All pieces"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("عن لمعة", "About Lamaa"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ لمعة. كل الحقوق محفوظة.", "© 2026 Lamaa. All rights reserved."),
  },
  links: { "https://wa.me/": WHATSAPP, "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideBangles, PHOTOS.slideStack, PHOTOS.slideStone],
    text: {
      "صورة الحملة الأولى": L("غوايش دهب بفصوص خضرا جنب ورد أبيض على خلفية غامقة", "Gold bangles set with green stones beside white flowers on a dark ground"),
      "وصل حديثًا": L("المجموعة الجديدة", "Just landed"),
      "الموسم الجديد وصل": L("دهب بيعلّي صوتك", "Gold that speaks up"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("غوايش وسلاسل وخواتم بتصميمات جريئة، بتوصل في علبة هدية خلال يومين.", "Bold bangles, chains and rings, delivered in a gift box within two days."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("غوايش دهب متراصة وحلق على ترابيزة رخام", "Stacked gold bangles and earrings on a marble table"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("القطع اللي الكل بيسأل عليها", "The pieces everyone asks about"),
      "القطع اللي بترجع لها كل مرة.": L("غوايش وأطقم بتلفت النظر في أي فرح أو خروجة.", "Bangles and sets that turn heads at every wedding and night out."),
      "شوف الأكثر مبيعًا": L("شوف الأكثر مبيعًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("أساور دهب محفورة على حجر أسود", "Engraved gold cuffs on a black stone"),
      "عروض الأسبوع": L("الطقم الكامل", "The full set"),
      "خصومات لفترة محدودة": L("نسّقي طقمك في طلب واحد", "Build your set in one order"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("خاتم وحلق وأسورة من نفس الخط، متنسقين مع بعض.", "A ring, earrings and a bracelet from the same line, made to match."),
      "تسوّق العروض": L("تسوّق كل القطع", "Shop everything"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-big-type", {
    text: { "منتج": L("قطعة", "pieces") },
    lists: [{ limit: 7 }],
  }),
  // Best sellers from every category (12 fills 4, 3 and 2 columns), so the grid never repeats the rings row.
  lib("products-tabbed", {
    text: {
      "المتجر": L("المتجر", "The shop"),
      "منتجاتنا": L("اختاري لمعتك", "Pick your shine"),
      "وصل جديد": L("الأكثر مبيعًا", "Best sellers"),
      "الأكثر مبيعًا": L("وصل حديثًا", "New in"),
      "العروض": L("الأعلى تقييمًا", "Top rated"),
    },
    links: { "/products": [BEST, NEW, RATED] },
    lists: [{ source: "best-sellers", limit: 12 }],
  }),
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.story],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("من ورشتنا في الصاغة لعلبة الهدية", "From our goldsmith's bench to your gift box"),
      "صورة المتجر": L("عقود وغوايش دهب مفرودة على قماش بني", "Gold necklaces and bangles laid out on brown cloth"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "أكتر من ٣٠ ألف قطعة اتلبست في أفراح وخطوبات في مصر. بنصمم في الصاغة، بنختبر كل قفل وكل حجر، وبنضمن اللون سنة كاملة.",
        "More than 30,000 pieces worn at Egyptian weddings and engagements. We design in the goldsmiths' quarter, test every clasp and stone, and guarantee the colour for a full year.",
      ),
      "شوف إزاي بنشتغل": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 14 } } },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("اعرفي القطع الجديدة قبل الكل", "See new pieces before anyone"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("إيميل واحد في الأسبوع بالقطع الجديدة وأفكار تنسّقي بيها الدهب مع لبسك.", "One email a week with new pieces and ideas to style gold with your outfits."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن لمعة", "About Lamaa"), L("مجوهرات وإكسسوارات جريئة، مصممة في الصاغة.", "Bold jewelry and accessories, designed in Cairo's goldsmiths' quarter.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("أسورتين ألماس على قماش أسود جنب ورد مجفف", "Two diamond tennis bracelets on black cloth beside dried flowers"),
    eyebrow: L("من ٢٠١٦", "Since 2016"),
    title: L("الإكسسوار مش لازم يكون هادي", "Accessories don't have to whisper"),
    text: L(
      "بدأنا بترابيزة صغيرة في سوق الصاغة وتلات تصميمات بس. الناس حبت الألوان والأحجام الكبيرة، ومن ساعتها وإحنا بنعمل قطع تتشاف من بعيد.",
      "We started with a small table in the goldsmiths' market and three designs. People loved the colour and the scale, and we have made pieces you notice from across the room ever since.",
    ),
    more: L("كل قطعة بتتغلف في علبة هدية، وبنوصلها لكل محافظات مصر.", "Every piece is wrapped in a gift box and delivered across Egypt."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مجوهرات وإكسسوارات جريئة، مصممة في الصاغة.", "Bold jewelry and accessories, designed in Cairo's goldsmiths' quarter."),
  categories: [
    ["rings", "الخواتم", "Rings", PHOTOS.catRings],
    ["necklaces", "السلاسل", "Necklaces", PHOTOS.catNecklaces],
    ["earrings", "الحلقان", "Earrings", PHOTOS.catEarrings],
    ["bracelets", "الأساور", "Bracelets", PHOTOS.catBracelets],
    ["brooches", "البروشات والشعر", "Brooches & hair", PHOTOS.catBrooches],
    ["sunglasses", "النضارات", "Sunglasses", PHOTOS.catSunglasses],
    ["bags", "الشنط", "Bags", PHOTOS.catBags],
  ],
  products: [
    // Rings
    ["pave-solitaire-ring", "rings", "خاتم سوليتير بافيه", "Pavé Solitaire Ring", P(2732096), 9800, { rating: 4.9, sold90: 74 }],
    ["princess-cut-ring", "rings", "خاتم برنسيس", "Princess-Cut Ring", P(32836033), 7600, { compareAtPrice: 8900, rating: 4.8, sold90: 44 }],
    ["gold-crown-solitaire", "rings", "خاتم سوليتير دهب", "Gold Crown Solitaire", P(18451698), 11500, { rating: 4.8, sold90: 38 }],
    ["rose-halo-pair", "rings", "طقم هالة روز", "Rose Halo Pair", P(17068457), 12900, { rating: 4.9, sold90: 33 }],
    ["emerald-cut-ring", "rings", "خاتم إمرالد كت", "Emerald-Cut Ring", P(19376176), 8400, { rating: 4.7, sold90: 29 }],
    ["pear-stone-silver-ring", "rings", "خاتم فضة كمثرى", "Silver Pear-Stone Ring", P(33343064), 3900, { rating: 4.6, sold90: 45 }],
    ["slim-solitaire-ring", "rings", "خاتم سوليتير رفيع", "Slim Solitaire Ring", P(18252230), 5900, { rating: 4.7, sold90: 27 }],
    ["diamond-accent-ring", "rings", "خاتم فضة بفصوص", "Diamond Accent Ring", P(7700273), 4600, { rating: 4.5, sold90: 19, inStock: false }],
    // Necklaces
    ["ruby-heart-pendant", "necklaces", "سلسلة قلب روبي", "Ruby Heart Pendant", P(4595727), 3400, { rating: 4.9, sold90: 66 }],
    ["triple-halo-necklaces", "necklaces", "سلاسل هالة فضة", "Triple Halo Necklaces", P(12427695), 6800, { compareAtPrice: 7900, rating: 4.7, sold90: 31 }],
    ["clover-box-pendant", "necklaces", "سلسلة برسيم في علبة", "Clover Pendant in a Box", P(20518711), 5200, { isFeatured: true, rating: 4.8, sold90: 52 }],
    ["turquoise-cameo-necklace", "necklaces", "سلسلة فيروز", "Turquoise Necklace", P(13037683), 1900, { rating: 4.7, sold90: 28 }],
    ["interlocking-rings-pendant", "necklaces", "سلسلة حلقتين", "Twin Rings Pendant", P(39326355), 2400, { rating: 4.6, sold90: 37 }],
    ["gold-knot-necklace", "necklaces", "عقد عقدة دهب", "Gold Knot Necklace", P(24815712), 5600, { rating: 4.8, sold90: 23 }],
    ["peacock-leaf-necklace", "necklaces", "عقد ورق دهبي وفضي", "Gold Leaf Necklace", P(4295005), 4400, { rating: 4.5, sold90: 18 }],
    ["dragon-tail-pendant", "necklaces", "دلاية ذيل التنين", "Dragon-Tail Pendant", P(15967458), 7400, { rating: 4.9, sold90: 14 }],
    // Earrings
    ["halo-crystal-studs", "earrings", "حلق هالة كريستال", "Halo Crystal Studs", P(5370644), 2900, { rating: 4.9, sold90: 58 }],
    ["key-pattern-huggies", "earrings", "حلق هاجي محفور", "Engraved Huggies", P(39076774), 1800, { rating: 4.7, sold90: 41 }],
    ["gold-claw-studs", "earrings", "حلق سوليتير دهب", "Gold Claw Studs", P(35961143), 6400, { isFeatured: true, rating: 4.8, sold90: 26 }],
    ["blue-mosaic-drops", "earrings", "حلق موزاييك أزرق", "Blue Mosaic Drops", P(34010218), 2300, { rating: 4.8, sold90: 35 }],
    ["aquamarine-oval-studs", "earrings", "حلق أكوامارين", "Aquamarine Studs", P(5370701), 3600, { compareAtPrice: 4200, rating: 4.6, sold90: 22 }],
    ["ribbed-black-huggies", "earrings", "حلق هاجي أسود", "Ribbed Black Huggies", P(38999386), 1500, { rating: 4.5, sold90: 30 }],
    ["screw-back-studs", "earrings", "حلق سوليتير فضة", "Silver Solitaire Studs", P(25403219), 4800, { rating: 4.7, sold90: 19 }],
    ["amethyst-topaz-drops", "earrings", "حلق جمشت وتوباز", "Amethyst Drops", P(35933225), 3200, { rating: 4.6, sold90: 16 }],
    // Bracelets
    ["red-enamel-chevrons", "bracelets", "أساور مينا حمرا", "Red Enamel Bracelets", P(37401770), 1200, { rating: 4.8, sold90: 69 }],
    ["moon-star-bead-bracelet", "bracelets", "أسورة هلال ونجمة", "Moon & Star Bracelet", P(20768646), 950, { rating: 4.7, sold90: 47 }],
    ["stone-set-bangles", "bracelets", "غوايش بفصوص", "Stone-Set Bangles", P(37485309), 4900, { isFeatured: true, rating: 4.9, sold90: 34 }],
    ["lava-stone-bracelet", "bracelets", "أسورة حجر بركاني", "Lava Stone Bracelet", P(9660442), 750, { rating: 4.6, sold90: 52 }],
    ["gold-link-stack", "bracelets", "أساور جنزير دهبي", "Gold Link Stack", P(37401773), 1600, { compareAtPrice: 1900, rating: 4.7, sold90: 38 }],
    ["rose-charm-cuff", "bracelets", "أسورة روز بتشارمز", "Rose Charm Cuff", P(25283498), 3800, { rating: 4.8, sold90: 25 }],
    ["emerald-pave-bangles", "bracelets", "غوايش زمرد", "Emerald Bangles", P(32988535), 8900, { rating: 4.9, sold90: 17 }],
    ["silver-bead-bracelet", "bracelets", "أسورة خرز فضة", "Silver Bead Bracelet", P(9827127), 850, { rating: 4.5, sold90: 29 }],
    // Brooches & hair
    ["mantis-brooch", "brooches", "بروش فرس النبي", "Gold Mantis Brooch", P(16219537), 2900, { rating: 4.8, sold90: 21 }],
    ["pearl-crystal-brooch", "brooches", "بروش لولي وكريستال", "Pearl Crystal Brooch", P(36198510), 1900, { rating: 4.7, sold90: 33 }],
    ["tortoise-claw-clips", "brooches", "مشابك شعر ترتر", "Tortoise Claw Clips", P(20166056), 550, { rating: 4.6, sold90: 48 }],
    ["enamel-brooch-set", "brooches", "طقم بروشات مينا", "Enamel Brooch Set", P(40361552), 2400, { rating: 4.8, sold90: 19 }],
    // Sunglasses
    ["blue-lens-round", "sunglasses", "نضارة عدسة زرقا", "Blue-Lens Round", P(5472300), 1450, { rating: 4.6, sold90: 39 }],
    ["gold-frame-oversized", "sunglasses", "نضارة إطار دهبي", "Gold-Frame Oversized", P(10837794), 1850, { rating: 4.8, sold90: 31 }],
    ["red-lens-slim", "sunglasses", "نضارة عدسة حمرا", "Red-Lens Slim", P(8433381), 1250, { rating: 4.5, sold90: 27 }],
    ["black-rectangle-sunglasses", "sunglasses", "نضارة مستطيلة سودا", "Black Rectangle", P(8360292), 1350, { rating: 4.6, sold90: 22 }],
    ["smoke-aviators", "sunglasses", "نضارة أفياتور سودا", "Smoke Aviators", P(14849415), 1650, { rating: 4.7, sold90: 24 }],
    // Bags
    ["quilted-chain-clutch", "bags", "كلاتش بجنزير", "Quilted Chain Clutch", P(20591025), 2900, { isFeatured: true, rating: 4.8, sold90: 33 }],
    ["croc-hobo-bag", "bags", "شنطة هوبو كروكو", "Croc Hobo Bag", P(30975839), 4600, { rating: 4.6, sold90: 15 }],
    ["buckle-crossbody-spotlit", "bags", "شنطة كروس بإبزيم", "Buckle Crossbody", P(8502484), 3400, { rating: 4.7, sold90: 19 }],
    ["red-satchel-bag", "bags", "شنطة ساتشل حمرا", "Red Satchel", P(27820201), 3100, { rating: 4.8, sold90: 24 }],
  ],
});

export const JEWELRY_BOLD = libraryTemplate({
  key: JEWELRY_BOLD_KEY,
  version: 1,
  name: L("لمعة", "Lamaa"),
  description: L(
    "مجوهرات جريئة: سلايدر بثلاث صور دهب على خلفيات غامقة، أقسام بخط كبير وأربع صفوف منتجات. للمتاجر اللي عايزة لمعة وبيع سريع.",
    "Bold jewelry: a three-slide hero of gold on dark grounds, big-type categories and four product rows. For stores that want shine and fast sales.",
  ),
  category: "jewelry",
  sortOrder: 1420,
  palette: ["#ffffff", "#f6edf0", "#9b1b3a", "#e8b931"],
  colors: {
    primary: "#9b1b3a",
    secondary: "#f6edf0",
    background: "#ffffff",
    foreground: "#121114",
    muted: "#5c5560",
    border: "#ecdde3",
    accent: "#e8b931",
  },
  fonts: { heading: "Reem Kufi", body: "Rubik" },
  radius: 14,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن لمعة", "About"), seo: { title: L("عن لمعة", "About Lamaa") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L("٢٤ شارع الصاغة، الجمالية، القاهرة.", "24 El Sagha St, El Gamaleya, Cairo."),
        heading: L("محتارة في الهدية؟ ابعتيلنا وإحنا نختار معاكي", "Stuck on a gift? Message us and we'll choose with you"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("اللون والهدايا والتوصيل.", "Colour, gifts and delivery."),
        question: L("اللون هيفضل زي ما هو؟", "Will the colour last?"),
        answer: L(
          "القطع المطلية بالدهب عليها ضمان لون سنة. ابعدي عنها البرفان والمية، ولو بهتت قبل السنة نبدلها ببلاش.",
          "Gold-plated pieces carry a one-year colour guarantee. Keep them away from perfume and water, and if one fades within the year we replace it free.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("قالوا عن لمعة", "What they said"), related: L("هتحبيها برضه", "You'll love these too") },
  },
});
