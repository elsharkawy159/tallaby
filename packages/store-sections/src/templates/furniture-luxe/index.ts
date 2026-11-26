/**
 * Furniture Luxe (2026-10-28, furniture niche, premium / minimal): ivory
 * paper, espresso ink and brass, Amiri headings over IBM Plex Sans Arabic,
 * square corners and a wide 1440px container. A quiet, gallery-like home:
 * top bar header, a background video of a marble-and-brass living room,
 * photo tiles, best sellers, the showroom story, four category rows,
 * a centred newsletter and the wordmark footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye (2026-10-28): furniture and
 * interiors only, no people, no brand labels, none used twice.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Marmar itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels, pexelsVideo, pexelsVideoPoster } from "../library-template";

export const FURNITURE_LUXE_KEY = "furniture-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FURNITURE_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(29466012, "12684183_1920_1080_60fps.mp4"),
  heroPoster: pexelsVideoPoster(29466012),
  palaceLounge: pexels(20418771, 1200),
  greyLounge: pexels(1648776, 1200),
  // Category tiles.
  catSofas: pexels(6312357, 1200),
  catArmchairs: pexels(13806257, 1200),
  catTables: pexels(7195595, 1200),
  catLighting: pexels(10821415, 1200),
  catBeds: pexels(14883343, 1200),
  catDecor: pexels(7119222, 1200),
};

const NAME = L("مرمر", "Marmar");

/**
 * Marmar's own content: what the look is built with when no edition is
 * applied (the template `furniture-luxe` has always meant). The store name
 * and description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The top bar: two short lines (a third, "Track your order", stays the look's).
  announcement: [L("كنب وفوتيهات وترابيزات وإضاءة", "Sofas, armchairs, tables and lighting"), L("مقاسات وخامات واضحة لكل قطعة", "Clear sizes and materials for every piece")],
  // The video hero (without a video file it shows its poster, `photos.hero.wide`). Its button goes to the whole catalog.
  hero: {
    alt: L("صالة بالرخام والنحاس", "A marble and brass living room"),
    eyebrow: L("مجموعة الخريف ٢٠٢٦", "The Autumn 2026 collection"),
    title: L("أثاث يدوم لسنوات", "Furniture made to last"),
    line: L(
      "خشب زان مجفف وأقمشة مقاومة للبقع وتشطيب يدوي لكل قطعة.",
      "Kiln-dried beech, stain-resistant fabrics and a hand finish on every piece.",
    ),
    cta: L("اكتشف المجموعة", "Explore the collection"),
  },
  categories: { title: L("تسوّق حسب الغرفة", "Shop by room") },
  // The tabbed product block's title (its tabs are best sellers, new in and top rated).
  products: { primary: { title: L("القطع الأكثر طلبًا", "Our most-loved pieces") } },
  // The showroom block on the home page: an eyebrow, a title, a short text and a button to the about page.
  story: {
    alt: L("صالون بسقف عالٍ وكراسٍ حمراء", "A high-ceilinged salon with red armchairs"),
    eyebrow: L("من داخل المتجر", "Inside the store"),
    title: L("قطع مختارة لكل غرفة", "Pieces chosen for every room"),
    text: L(
      "كنب وفوتيهات وترابيزات وإضاءة، مع صور ومقاسات وخامات واضحة لكل قطعة.",
      "Sofas, armchairs, tables and lighting, with clear photos, sizes and materials for every piece.",
    ),
    cta: L("اعرف أكثر", "Learn more"),
  },
  newsletter: {
    eyebrow: L("نشرة مرمر", "The Marmar letter"),
    title: L("كن أول من يعرف بالمجموعات الجديدة", "Hear about new collections first"),
    line: L(
      "رسالة واحدة في الشهر عن القطع والمجموعات الجديدة.",
      "One letter a month about new pieces and collections.",
    ),
    note: L("بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
  },
  about: {
    line: L("أثاث بتشطيب يدوي لكل غرف المنزل.", "Hand-finished furniture for every room."),
    alt: L("صالة بكنبة بنية وستائر خضراء", "A living room with a brown sofa and green curtains"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أثاث مختار بعناية", "Furniture chosen with care"),
    text: L("نختار الخشب والأقمشة بعناية، ونعرض مقاسات وخامات كل قطعة بوضوح.", "We choose the wood and fabrics with care and show every piece's sizes and materials clearly."),
    more: L("تواصل معنا لأي سؤال عن المقاسات أو الخامات.", "Contact us with any question about sizes or materials."),
    // Goes to the best sellers.
    cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L("٩٠ شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة.", "90 North 90th St, Fifth Settlement, New Cairo."),
    heading: L("اسألنا عن أي قطعة", "Ask us about any piece"),
  },
  faq: {
    line: L("المقاسات والخامات والعناية والطلب.", "Sizes, materials, care and ordering."),
    question: L("كيف أعرف أن القطعة تناسب المكان؟", "How do I know a piece fits my space?"),
    answer: L(
      "مقاسات كل قطعة بالسنتيمتر في صفحة المنتج. قِس المكان قبل الطلب، وتواصل معنا لأي سؤال.",
      "Every piece's size in centimetres is on its product page. Measure your space before ordering, and contact us with any question.",
    ),
  },
  custom: {
    // The header's link to the about page, one or two words.
    "about-label": L("من نحن", "About us"),
    // The link to the whole catalog (the header, the footer and the tabbed block), two words.
    "shop-all": L("كل القطع", "Shop all"),
    // The footer's phone and email: the same string on both sides (a seller replaces them).
    "contact-phone": L("٠١٢٢ ٤٨٦ ٣٩٠٥", "+20 122 486 3905"),
    "contact-email": L("‏hello@marmar.eg", "hello@marmar.eg"),
  },
  // hero.wide is the video's poster and hero.video the video (optional); story: the home's showroom block; about: the about page.
  photos: {
    hero: { wide: PHOTOS.heroPoster, video: PHOTOS.heroVideo },
    story: PHOTOS.palaceLounge,
    about: PHOTOS.greyLounge,
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New in, Best sellers, Top rated, Track your order, Help) and the layout
 * stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const shopAll = x["shop-all"]!;

  const header = lib("header-topbar", {
    text: {
      "تسوّق سهل من هاتفك": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
      "اسم متجرك": name,
      "المتجر": shopAll,
      "العروض": L("وصل حديثًا", "New in"),
      "المدونة": L("الأكثر طلبًا", "Best sellers"),
      "من نحن": x["about-label"]!,
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
  });

  const footer = lib("footer-wordmark", {
    text: {
      "تسوّق": L("تسوّق", "Shop"),
      "كل المنتجات": L(shopAll.ar, "All pieces"),
      "العروض": L("الأعلى تقييمًا", "Top rated"),
      "المساعدة": L("المساعدة", "Help"),
      "من نحن": aboutName,
      "٠١٠٠ ١٢٣ ٤٥٦٧": x["contact-phone"]!,
      "‏hello@store.com": x["contact-email"]!,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [SHOP, NEW, BEST, RATED] },
  });

  const video = c.photos.hero.video;
  const home: Design[] = [
    lib("hero-video", {
      photo: [c.photos.hero.wide],
      // Without a video the design shows its poster alone.
      nodes: { ...(video && { "الفيديو": { props: { url: video } } }), "التعتيم": { style: { opacity: 30 } } },
      text: {
        "فيديو الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "تصميم هادئ لكل يوم": c.hero.title,
        "قطع مختارة بعناية لكل يوم.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "اكتشف الجديد": L("وصل حديثًا", "New in"),
      },
      links: { "/products": SHOP, "/products?sort=newest": NEW },
    }),
    lib("categories-photo-tiles", {
      text: { "تسوّق حسب القسم": c.categories.title },
    }),
    lib("products-minimal", {
      text: {
        "الأكثر طلباً": c.products.primary.title,
        "الأكثر مبيعاً": L("الأكثر مبيعًا", "Best sellers"),
        "الجديد": L("وصل حديثًا", "New in"),
        "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
        "عرض الكل": shopAll,
      },
    }),
    lib("about-overlap", {
      person: [undefined, undefined, undefined, undefined, c.photos.story],
      text: {
        "صورة المتجر": c.story.alt,
        "من داخل المتجر": c.story.eyebrow,
        "منتجات نختارها بعناية": c.story.title,
        "نختار كل منتج بعناية، ونعرض صوره وتفاصيله بوضوح.": c.story.text,
        "اعرف أكثر": c.story.cta,
      },
    }),
    // Four category rows, places 1 to 4 in order (`journey.rows` is [1, 2, 3, 4]).
    ...categoryRows(lib, { viewAll: L("عرض الكل", "View all"), muted: [1, 3] }),
    lib("newsletter-centered", {
      text: {
        "النشرة": c.newsletter.eyebrow,
        "اشترك في نشرتنا البريدية": c.newsletter.title,
        "اشترك لتصلك أخبار المنتجات الجديدة.": c.newsletter.line,
        "بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.": c.newsletter.note,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.about ?? c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: BEST,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث بتشطيب يدوي لكل غرف المنزل.", "Hand-finished furniture for every room."),
  categories: [
    ["sofas", "الكنب والصالونات", "Sofas", PHOTOS.catSofas],
    ["armchairs", "الفوتيهات", "Armchairs", PHOTOS.catArmchairs],
    ["tables", "الترابيزات", "Tables", PHOTOS.catTables],
    ["lighting", "الإضاءة", "Lighting", PHOTOS.catLighting],
    ["beds", "غرف النوم", "Bedroom", PHOTOS.catBeds],
    ["decor", "الديكور", "Decor", PHOTOS.catDecor],
  ],
  products: [
    // Sofas
    ["noor-velvet-sofa", "sofas", "كنبة نور قطيفة زيتي", "Noor Velvet Sofa, Teal", P(30520758), 42500, { isFeatured: true, rating: 4.9, sold90: 64 }],
    ["zamalek-sand-sofa", "sofas", "كنبة الزمالك ٣ مقاعد", "Zamalek Three-Seater", P(12277196), 38900, { compareAtPrice: 44000, rating: 4.8, sold90: 51 }],
    ["midnight-velvet-sofa", "sofas", "كنبة ميدنايت كحلي", "Midnight Velvet Sofa", P(30386991), 36500, { rating: 4.7, sold90: 33 }],
    ["luna-curved-sofa", "sofas", "كنبة لونا منحنية", "Luna Curved Sofa", P(8987432), 47800, { rating: 5, sold90: 22 }],
    ["blush-linen-sofa", "sofas", "كنبة روز كتان", "Rose Linen Sofa", P(7018400), 33900, { rating: 4.6, sold90: 18 }],
    ["cloud-corner-sofa", "sofas", "ركنة كلاود رمادي", "Cloud Corner Sofa", P(6588592), 58500, { compareAtPrice: 64900, rating: 4.8, sold90: 41 }],
    ["channel-ivory-sofa", "sofas", "كنبة تشانل عاجي", "Channel Sofa, Ivory", P(8580720), 39500, { rating: 4.7, sold90: 12, inStock: false }],
    ["oval-lounge-sectional", "sofas", "ركنة أوفال مودرن", "Oval Lounge Sectional", P(12289396), 64900, { rating: 4.5, sold90: 9 }],
    // Armchairs
    ["wingback-leather-pair", "armchairs", "فوتيه جلد بظهر عالي", "Leather Wingback Armchair", P(33646085), 18900, { rating: 4.8, sold90: 47 }],
    ["charcoal-wing-chair", "armchairs", "فوتيه فحمي بمخدة", "Charcoal Wing Chair", P(18258470), 12500, { rating: 4.7, sold90: 29 }],
    ["emerald-shell-chair", "armchairs", "فوتيه زمردي صدفة", "Emerald Shell Chair", P(4278985), 9800, { compareAtPrice: 11500, rating: 4.9, sold90: 38 }],
    ["noir-lounge-chair", "armchairs", "فوتيه نوار", "Noir Lounge Chair", P(39680454), 14200, { rating: 4.6, sold90: 15 }],
    ["bordeaux-boucle-chair", "armchairs", "كرسي بوكليه نبيتي", "Bordeaux Bouclé Chair", P(5662650), 8900, { rating: 4.8, sold90: 26 }],
    ["patchwork-club-chair", "armchairs", "كرسي باتشورك خشب", "Patchwork Club Chair", P(8389905), 16500, { rating: 4.7, sold90: 19 }],
    ["caramel-lounge-chair", "armchairs", "فوتيه كراميل", "Caramel Lounge Chair", P(12269764), 10900, { rating: 4.5, sold90: 11 }],
    ["forest-cube-chair", "armchairs", "فوتيه كيوب أخضر", "Forest Cube Armchair", P(12961120), 9600, { rating: 4.4, sold90: 8 }],
    // Tables
    ["malachite-nesting-tables", "tables", "طقم ترابيزات مالاكيت", "Malachite Nesting Tables", P(15253318), 14800, { rating: 4.9, sold90: 36 }],
    ["travertine-side-table", "tables", "ترابيزة جانبية ترافرتين", "Travertine Side Table", P(6078539), 6900, { rating: 4.8, sold90: 44 }],
    ["glass-ring-coffee-table", "tables", "ترابيزة صالون زجاج", "Glass Ring Coffee Table", P(35741389), 8400, { compareAtPrice: 9900, rating: 4.6, sold90: 21 }],
    ["verde-marble-coffee-table", "tables", "ترابيزة رخام فيردي", "Verde Marble Coffee Table", P(19991831), 11200, { rating: 4.8, sold90: 30 }],
    ["blush-marble-nightstand", "tables", "كومودينو رخام روز", "Blush Marble Nightstand", P(35645257), 7400, { rating: 4.7, sold90: 14 }],
    ["round-walnut-dining", "tables", "سفرة جوز مدورة ٦ كراسي", "Round Walnut Dining Set", P(7195598), 52500, { rating: 4.9, sold90: 9 }],
    ["onyx-tray-tables", "tables", "ترابيزات أونيكس بصينية", "Onyx Tray Tables", P(7749060), 5800, { rating: 4.5, sold90: 17 }],
    ["black-glass-side-table", "tables", "ترابيزة جانبية زجاج أسود", "Black Glass Side Table", P(6044978), 3900, { rating: 4.4, sold90: 12 }],
    // Lighting
    ["brass-trio-floor-lamps", "lighting", "أباليك أرضي نحاس ثلاثي", "Brass Trio Floor Lamps", P(11850174), 9800, { rating: 4.8, sold90: 33 }],
    ["linen-drum-floor-lamp", "lighting", "أباجورة أرضي كتان", "Linen Drum Floor Lamp", P(32008152), 6400, { rating: 4.7, sold90: 25 }],
    ["crystal-cage-floor-lamp", "lighting", "أباجورة كريستال", "Crystal Cage Floor Lamp", P(17075439), 7900, { compareAtPrice: 8900, rating: 4.6, sold90: 19 }],
    ["classic-bronze-table-lamp", "lighting", "أباجورة برونز كلاسيك", "Classic Bronze Table Lamp", P(35392792), 4200, { rating: 4.9, sold90: 41 }],
    ["pleated-gold-lamp", "lighting", "أباجورة ذهبي بلسيه", "Pleated Gold Lamp", P(14540915), 3600, { rating: 4.7, sold90: 28 }],
    ["turned-wood-lamp", "lighting", "أباجورة خشب مخروط", "Turned Wood Table Lamp", P(5598270), 2900, { rating: 4.5, sold90: 13 }],
    ["amber-rib-pendant", "lighting", "نجفة معلقة عنبري", "Amber Ribbed Pendant", P(40493750), 3400, { rating: 4.8, sold90: 22 }],
    ["teal-enamel-pendants", "lighting", "إضاءة معلقة مينا تيل", "Teal Enamel Pendant", P(9628657), 2700, { rating: 4.4, sold90: 9 }],
    // Bedroom
    ["versailles-carved-bed", "beds", "سرير فرساي محفور", "Versailles Carved Bed", P(4682136), 46500, { rating: 4.8, sold90: 12 }],
    ["tufted-onyx-bed", "beds", "سرير كابيتونيه أسود", "Tufted Onyx Bed", P(29640156), 32900, { rating: 4.7, sold90: 16 }],
    ["emerald-panel-bed", "beds", "سرير بانيل زمردي", "Emerald Panel Bed", P(8135505), 28500, { compareAtPrice: 31900, rating: 4.6, sold90: 10 }],
    ["slate-upholstered-bed", "beds", "سرير منجد رصاصي", "Slate Upholstered Bed", P(6207451), 26900, { rating: 4.5, sold90: 8 }],
    // Decor
    ["monochrome-floor-vases", "decor", "طقم فازات أرضي أبيض", "Monochrome Floor Vases", P(38408974), 2400, { rating: 4.6, sold90: 14 }],
    ["matte-gourd-vases", "decor", "فازات قرعة مطفي", "Matte Gourd Vases", P(17619624), 1250, { rating: 4.7, sold90: 21 }],
    ["ivory-vase-trio", "decor", "ثلاثي فازات عاجي", "Ivory Vase Trio", P(8217492), 980, { rating: 4.8, sold90: 33 }],
    ["ring-vase-pampas", "decor", "فازة حلقة مع بامباس", "Ring Vase with Pampas", P(4207892), 750, { rating: 4.5, sold90: 19 }],
  ],
});

export const FURNITURE_LUXE = editionTemplate({
  key: FURNITURE_LUXE_KEY,
  version: 3,
  name: L("مرمر", "Marmar"),
  description: L(
    "أثاث فاخر بهدوء: فيديو صالة بالرخام، صور غرف كبيرة وأربع صفوف للأقسام. لمعارض الأثاث الراقي.",
    "Quiet luxury furniture: a marble living-room video, large room photos and four category rows. For premium furniture showrooms.",
  ),
  category: "home",
  style: ["luxe"],
  sortOrder: 1200,
  palette: ["#f7f4ee", "#ece6db", "#2b2622", "#b08d57"],
  colors: {
    primary: "#2b2622",
    secondary: "#ece6db",
    background: "#ffffff",
    foreground: "#1d1b18",
    muted: "#6b625a",
    border: "#ddd5c8",
    accent: "#b08d57",
  },
  fonts: { heading: "Amiri", body: "IBM Plex Sans Arabic" },
  radius: 0,
  containerMaxWidth: 1440,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "hero",
    "categories.title",
    "products.primary.title",
    "story",
    "newsletter.eyebrow",
    "newsletter.title",
    "newsletter.line",
    "newsletter.note",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
    "custom.about-label",
    "custom.shop-all",
    "custom.contact-phone",
    "custom.contact-email",
  ],
  // `photos.hero.video`: without it the hero shows its poster; `photos.about`: the about page's photo (falls back to the story's).
  // The tabbed block has its own tabs, so `primary` is not read; four category rows, places 1 to 4 (`categoryRows`).
  optional: ["photos.hero.video", "photos.about"],
  journey: { primary: "best-sellers", rows: [1, 2, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") },
  },
});
