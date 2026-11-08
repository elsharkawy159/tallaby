/**
 * Nasig (2026-11-08, Egyptian organic cotton basics, after the layout of
 * kotn.com; no code, copy or photos taken from it): warm off-white paper
 * (#F6F3EE), near-black ink (#1F1D1A) and one muted clay accent (#9A5B41)
 * kept to the announcement strip, Almarai throughout, 2px corners and a
 * 1320px container. A thin clay strip of store promises over a one-line
 * header, a large photo-led hero with a short headline, three category
 * tiles, a knitwear row, a wide feature photo with one link under it, a
 * new-arrivals row, the brand story beside a photo, an ink impact band with
 * three bold figures, a wide photo with a short caption card and a square
 * photo strip ("follow us"). The newsletter sits at the top of the dark
 * footer, over the link columns, the copyright and the payment methods. Built
 * from section library designs (`fromLibrary`); no design is new for it.
 *
 * Kept to the template rules (2026-10-27): categories come right after the
 * hero and the home page has at most nine sections, so the categories sit
 * before the knitwear row and the newsletter lives in the footer
 * (`footer-columns-signup`). Promotions are not allowed, so the feature
 * banner is `about-wide` (photo with the link under it).
 *
 * Photos: Pexels, picked by the curator and checked by eye on a contact
 * sheet (2026-11-08): garments on hangers and rails, folded knits, flat lays,
 * cotton bolls and fields, fabric close-ups and calm interiors; no people or
 * hands, no mannequins, no readable lettering, none shared with another
 * template, each URL checked for 200 (2026-11-08). Hero 10398726 (cotton
 * rows), feature 1937336, about 13924868, wide 40103327, story 3794749,
 * gallery 11125918, 35161309, 36346049, 39427053, 4210378, 5464587, tiles
 * 5531540, 6909817, 4883686, 14641424; products as listed in `DEMO`.
 * Turned down for lettering: 9594692 (hang tag), 37704838 and 37704841 (neck
 * labels), 4210864 (jeans patch). Pexels has few clean skirts, trousers or
 * chinos without a body, so the rows are mostly tops, knits and textiles.
 */
import { getDesign, type Design } from "../../designs";
import type { DesignText } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const NASIG_KEY = "nasig";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NASIG_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(10398726, 2000),
  feature: pexels(1937336, 1800),
  about: pexels(13924868, 1200),
  wide: pexels(40103327, 1800),
  story: pexels(3794749, 1200),
  // Folded linen, a cotton boll, woven fabric, sheets, towels on a stool, knits under woven baskets.
  gallery: [11125918, 35161309, 36346049, 39427053, 4210378, 5464587].map((id) => pexels(id, 600)),
  catWomen: pexels(5531540, 1000),
  catMen: pexels(6909817, 1000),
  catHome: pexels(4883686, 1000),
  catKnit: pexels(14641424, 1000),
};

const NAME = L("نسيج", "Nasig");
const TAGLINE = L("أساسيات من قطن مصري عضوي، معمولة تعيش.", "Organic Egyptian cotton basics, made to last.");

const header = lib("header-announcement-strip", {
  text: {
    "اسم متجرك": NAME,
    "أهلًا بيك في متجرنا": L("قطن مصري عضوي ١٠٠٪", "100% organic Egyptian cotton"),
    "شحن مجاني للطلبات الكبيرة": L("شحن مجاني للطلبات فوق ١٥٠٠ جنيه", "Free shipping on orders over EGP 1,500"),
    "تفاصيل بتفرق": L("تشكيلة الشتاء وصلت", "The winter range is here"),
    "الرئيسية": L("حريمي", "Women"),
    "المتجر": L("رجالي", "Men"),
    "العروض": L("الأساسيات", "Basics"),
    "المدونة": L("البيت", "Home"),
    "من نحن": L("حكايتنا", "About"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  // The logo keeps "/"; the menu reads women, men, basics, home, about, contact; then search.
  // Women and men search the word their product names carry; basics and home open the shop.
  links: { "/": [undefined, search("حريمي")], "/products": [search("رجالي"), SHOP, undefined], "/blog": SHOP },
  nodes: { "شريط الرسائل": { style: { background: "accent", paddingTop: 8, paddingBottom: 8 }, mobile: { paddingTop: 7, paddingBottom: 7 } } },
});

const footer = lib("footer-columns-signup", {
  text: {
    "اعرف العروض الأول": L("خليك قريب", "Stay close"),
    "إيميل واحد في الشهر، من غير إزعاج.": L(
      "رسالة واحدة في الشهر: قطع جديدة وحكايات من الحقل، من غير إزعاج.",
      "One letter a month: new pieces and notes from the fields, never noise.",
    ),
    "اسم متجرك": NAME,
    "قطع مختارة بعناية، بتوصل لحد باب البيت.": TAGLINE,
    "تسوق": L("عن نسيج", "About Nasig"),
    "كل المنتجات": L("حكايتنا", "Our story"),
    "وصل حديثًا": L("كلمنا", "Contact us"),
    "الأكثر مبيعًا": L("سياسة الخصوصية", "Privacy policy"),
    "العروض": L("الشروط والأحكام", "Terms of service"),
    "من نحن": L("تتبع طلبك", "Track your order"),
    "‏hello@store.com": L("‏hello@nasig.eg", "hello@nasig.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("المعادي، القاهرة", "Maadi, Cairo"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نسيج. كل الحقوق محفوظة.", "© 2026 Nasig. All rights reserved."),
  },
  links: { "/products": ["/about", "/contact", "/privacy", "/terms"], "/about": "/profile/orders", "mailto:hello@store.com": "mailto:hello@nasig.eg" },
});

/** A product row under a plain heading and a "View all" text link (`products-carousel`). */
const row = (as: string, title: DesignText, more: DesignText, href: string, lists: LibraryPatch["lists"]) =>
  lib("products-carousel", { as, text: { "الأكثر مبيعاً": title, "عرض الكل": more }, links: { "/products": href }, lists });

const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("صفوف قطن أبيض في حقل وقت الحصاد", "Rows of white cotton in a field at harvest"),
      "المجموعة الجديدة": L("شتاء ٢٠٢٦", "Winter 2026"),
      "صُنعت لتدوم معك": L("أساسيات تعيش معاك", "Basics that stay with you"),
      "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": L(
        "قطن مصري عضوي، مغزول ومنسوج على مهل، بألوان الأرض.",
        "Organic Egyptian cotton, spun and woven slowly, in the colours of the earth.",
      ),
      "تسوّق الآن": L("تسوّق الجديد", "Shop new in"),
      "شوف الجديد": L("حكايتنا", "Our story"),
    },
    links: { "/products": NEW, "/products?sort=newest": "/about" },
  }),
  // Three equal tiles: the store's first three categories (women, men, home).
  lib("categories-portrait-labels", {
    text: { "المجموعات": L("تسوّق حسب القسم", "Shop by category"), "تسوّق الآن": L("اكتشف", "Discover") },
    lists: [{ limit: 3 }],
    nodes: { "الأقسام": { style: { columns: 3, gap: 16 }, tablet: { columns: 3, gap: 12 } } },
  }),
  row("knitwear-row", L("تريكو الموسم الجديد", "New season knitwear"), L("كل التريكو", "All knitwear"), search("تريكو"), [
    { source: "category", categoryIndex: 4, limit: 4 },
  ]),
  lib("about-wide", {
    as: "feature",
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.feature],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("قطن يتنفس، لكل يوم", "Cotton that breathes, for every day"),
      "صورة المتجر": L("تريكو متطبق بألوان الكريمي والوردي والخردلي", "Folded knits in cream, blush and mustard"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "تيشيرتات وقمصان وتريكو من قطن طويل التيلة، بقصّات بسيطة تتلبس سنين.",
        "Tees, shirts and knits in long-staple cotton, in simple cuts you will wear for years.",
      ),
      "شوف إزاي بنشتغل": L("تسوّق الأساسيات", "Shop the basics"),
    },
    links: { "/about": SHOP },
  }),
  row("new-arrivals", L("وصل حديثًا", "New arrivals"), L("كل الجديد", "All new in"), NEW, [{ source: "newest", limit: 4 }]),
  lib("about-fullbleed", {
    photo: [undefined, undefined, PHOTOS.about],
    text: {
      "صورة القصة": L("لوز قطن مفتوح على فرعه", "Open cotton bolls on the branch"),
      "حكايتنا": L("عن نسيج", "About Nasig"),
      "تفاصيل صغيرة تصنع الفرق": L("بنزرع القطن قبل ما نخيّطه", "We grow the cotton before we sew it"),
      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": L(
        "نسيج بدأت من مزارع صغيرة في الدلتا. بنشتغل مع نفس العائلات كل موسم، وبنغزل القطن في مصر ونخيّطه في ورش بنعرفها بالاسم.",
        "Nasig began with small farms in the Delta. We work with the same families every season, spin the cotton in Egypt and sew it in workshops we know by name.",
      ),
      "اعرف أكثر": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  lib("team-numbers", {
    as: "impact",
    text: {
      "٧ سنين في أرقام": L("أثرنا في أرقام", "Our impact in numbers"),
      "٥٠ ألف": L("١٠٠٪", "100%"),
      "عميل رجعلنا تاني": L("قطن عضوي من غير مبيدات", "organic cotton, grown without pesticides"),
      "٢٧": L("٤٢", "42"),
      "محافظة بنوصلها": L("مزرعة شريكة في الدلتا", "partner farms in the Delta"),
      "٤٫٨": L("٩", "9"),
      "متوسط التقييم": L("سنين بنزرع ونغزل ونخيّط", "years of growing, spinning and sewing"),
    },
  }),
  lib("about-overlap", {
    as: "fields",
    person: [undefined, undefined, undefined, undefined, PHOTOS.wide],
    text: {
      "من داخل المتجر": L("من الدلتا", "From the Delta"),
      "صورة المتجر": L("حقل قطن في نور العصر", "A cotton field in the afternoon light"),
      "بدأنا من محل صغير": L("موسم القطن", "Cotton season"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "بنجمع القطن في سبتمبر، ومنه بيبدأ كل اللي بنعمله طول السنة.",
        "The cotton comes in every September, and everything we make all year starts there.",
      ),
      "اعرف أكثر": L("زور المزارع", "Visit the farms"),
    },
  }),
  lib("gallery-social-strip", {
    photo: PHOTOS.gallery,
    text: {
      "عليكم أحلى": L("تابعونا", "Follow us"),
      "اعملوا لنا تاج عشان صورتكم تظهر هنا.": L("صور من الحقل والورشة وقطعكم المفضلة.", "Notes from the fields, the workshop and your favourite pieces."),
      "@اسم_متجرك": handle("@nasig.eg"),
      "صورة من إنستجرام": L("صورة من حساب نسيج", "A photo from the Nasig feed"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نسيج", "About Nasig"), TAGLINE),
  aboutStory(lib, {
    photo: PHOTOS.story,
    alt: L("بكر خيط قطن ومكوك نول في صندوق خشب", "Cotton bobbins and a loom shuttle in a wooden box"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("من الحقل لدولابك", "From the field to your wardrobe"),
    text: L(
      "بنزرع قطن عضوي مع مزارع شريكة في الدلتا، وبنغزله وننسجه ونخيّطه في مصر. قصّات بسيطة وألوان هادية تتلبس كل يوم وتعيش سنين.",
      "We grow organic cotton with partner farms in the Delta, then spin, weave and sew it in Egypt. Simple cuts and calm colours to wear every day for years.",
    ),
    more: L("ولو المقاس مش مظبوط، بنبدله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
    button: L("تسوّق الأساسيات", "Shop the basics"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: TAGLINE,
  categories: [
    ["women", "حريمي", "Women", PHOTOS.catWomen],
    ["men", "رجالي", "Men", PHOTOS.catMen],
    ["home", "البيت", "Home", PHOTOS.catHome],
    ["knitwear", "تريكو", "Knitwear", PHOTOS.catKnit],
  ],
  products: [
    // Women
    ["green-floral-slip-dress", "women", "فستان سليب حريمي أخضر بورود", "Women's Green Floral Slip Dress", P(18984601), 1850, { isFeatured: true, rating: 4.8, sold90: 41 }],
    ["peach-poplin-shirt-dress", "women", "قميص حريمي طويل خوخي", "Women's Peach Long Shirt", P(9218533), 1450, { rating: 4.7, sold90: 33 }],
    ["white-cotton-camisole", "women", "بادي حريمي قطن أبيض", "Women's White Cotton Camisole", P(17305436), 590, { rating: 4.6, sold90: 58 }],
    ["blue-white-gauze-blouse", "women", "بلوزة حريمي شاش أزرق وأبيض", "Women's Blue and White Gauze Blouse", P(6850574), 990, { rating: 4.6, sold90: 27 }],
    ["white-henley-top", "women", "بلوزة حريمي هينلي بيضا", "Women's White Henley Top", P(22441295), 850, { rating: 4.8, sold90: 46 }],
    ["mint-organic-tee", "women", "تيشيرت حريمي قطن عضوي نعناعي", "Women's Mint Organic Tee", P(34156905), 550, { rating: 4.7, sold90: 72 }],
    // Men
    ["grey-oxford-shirt", "men", "قميص رجالي أكسفورد رمادي", "Men's Grey Oxford Shirt", P(13381986), 1250, { isFeatured: true, rating: 4.8, sold90: 52 }],
    ["white-heavy-crew-tee", "men", "تيشيرت رجالي تقيل أبيض", "Men's White Heavyweight Tee", P(18257675), 650, { rating: 4.7, sold90: 88 }],
    ["sand-overshirt", "men", "أوفرشيرت رجالي رملي", "Men's Sand Overshirt", P(6909817), 1650, { rating: 4.6, sold90: 24 }],
    ["slate-linen-cotton-shirt", "men", "قميص رجالي قطن وكتان أردوازي", "Men's Slate Cotton-Linen Shirt", P(8967723), 1350, { rating: 4.7, sold90: 31 }],
    ["washed-denim-overshirt", "men", "أوفرشيرت رجالي جينز مغسول", "Men's Washed Denim Overshirt", P(18189949), 1750, { rating: 4.5, sold90: 19 }],
    ["camel-belted-trench", "women", "ترينش حريمي جملي بحزام", "Women's Camel Belted Trench", P(5424917), 2950, { rating: 4.8, sold90: 12 }],
    // Home
    ["white-terry-towel-set", "home", "طقم فوط تيري بيضا", "White Terry Towel Set", P(7691101), 890, { isFeatured: true, rating: 4.9, sold90: 64 }],
    ["striped-peshtemal-towel", "home", "فوطة بشتمال مقلمة بشراشيب", "Striped Fringed Peshtemal Towel", P(30982437), 450, { rating: 4.7, sold90: 49 }],
    ["navy-gingham-duvet-cover", "home", "غطا لحاف كاروه كحلي", "Navy Gingham Duvet Cover", P(7765001), 1650, { rating: 4.6, sold90: 22 }],
    ["cream-gauze-throw", "home", "شال كنبة شاش كريمي", "Cream Gauze Throw", P(30618181), 950, { rating: 4.8, sold90: 30 }],
    ["earth-tone-cushion-covers", "home", "أكياس مخدات بألوان الأرض", "Earth-Tone Cushion Covers", P(37023127), 690, { rating: 4.6, sold90: 37 }],
    ["hemstitch-napkin-set", "home", "طقم فوط سفرة بتطريز مخرّم", "Hemstitch Napkin Set", P(4857618), 390, { rating: 4.7, sold90: 26 }],
    ["stone-waffle-robe", "home", "روب حمام وافل حجري", "Stone Waffle Bathrobe", P(27135366), 1450, { rating: 4.8, sold90: 18 }],
    // Knitwear
    ["cream-bobble-cardigan", "knitwear", "كارديجان تريكو كريمي بزراير", "Cream Bobble-Knit Cardigan", P(14641422), 1750, { isFeatured: true, rating: 4.9, sold90: 39 }],
    ["caramel-button-cardigan", "knitwear", "كارديجان تريكو كراميل", "Caramel Button Cardigan", P(14641438), 1650, { rating: 4.7, sold90: 28 }],
    ["rust-chunky-sweater", "knitwear", "بلوفر تريكو تقيل صدئي", "Rust Chunky Sweater", P(4210854), 1550, { rating: 4.8, sold90: 44 }],
    ["ribbed-knit-beanie", "knitwear", "طاقية تريكو ريب", "Ribbed Knit Beanie", P(30263570), 350, { rating: 4.6, sold90: 67 }],
    ["marled-knit-scarf", "knitwear", "كوفية تريكو مبرقشة", "Marled Knit Scarf", P(19814912), 590, { rating: 4.7, sold90: 35 }],
    ["speckled-crew-knit", "knitwear", "بلوفر تريكو منقّط رقبة دايرة", "Speckled Crew-Neck Knit", P(5710046), 1450, { rating: 4.6, sold90: 23 }],
    ["oat-rib-sweater", "knitwear", "بلوفر تريكو ريب شوفاني", "Oat Rib Sweater", P(14641440), 1350, { rating: 4.7, sold90: 31 }],
  ],
});

export const NASIG = libraryTemplate({
  key: NASIG_KEY,
  version: 1,
  name: NAME,
  description: L(
    "أساسيات قطن بأسلوب تحريري هادي: شريط رسائل رفيع، صورة كبيرة، ثلاث أقسام، صفوف منتجات، حكاية البراند وأرقام أثرها، وشريط صور. لمتاجر الملابس الأساسية والقطن.",
    "Calm editorial cotton basics: a thin message strip, a large photo, three category tiles, product rows, the brand story with its impact figures and a photo strip. For basics and cotton clothing stores.",
  ),
  category: "fashion",
  sortOrder: 1610,
  palette: ["#f6f3ee", "#ece7df", "#1f1d1a", "#9a5b41"],
  colors: {
    primary: "#1f1d1a",
    secondary: "#ece7df",
    background: "#f6f3ee",
    foreground: "#1f1d1a",
    muted: "#6e6a63",
    border: "#ddd6cb",
    accent: "#9a5b41",
  },
  fonts: { heading: "Almarai", body: "Almarai" },
  radius: 2,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نسيج", "About"), seo: { title: L("عن نسيج", "About Nasig") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L(`المعادي، القاهرة، ${phone("٠١٠٠ ١٢٣ ٤٥٦٧")}، ${handle("hello@nasig.eg")}`, "Maadi, Cairo | +20 100 123 4567 | hello@nasig.eg"),
        heading: L("سؤال عن المقاس أو العناية بالقطن؟ اسألنا", "A question about sizing or cotton care? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والعناية بالقطن والشحن والاستبدال.", "Sizing, cotton care, shipping and exchanges."),
        question: L("القطن بينكمش في الغسيل؟", "Does the cotton shrink in the wash?"),
        answer: L(
          "قطعنا مغسولة قبل الخياطة، فالانكماش بسيط جدًا. اغسلها على ٣٠ درجة ونشّفها في الهوا، وهتفضل محافظة على مقاسها ولونها.",
          "Our pieces are washed before sewing, so shrinkage is very small. Wash at 30°C and dry in the air, and they keep their size and colour.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    gallery: "end",
    thumbs: "side",
    band: "shelf",
    extras: ["product-shipping"],
    copy: { reviews: L("آراء اللي جربوا", "What wearers say"), related: L("يتلبس معاه", "Wear it with") },
  },
});
