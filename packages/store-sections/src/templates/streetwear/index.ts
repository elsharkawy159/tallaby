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
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Hara Supply itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 4.
 */
import type { Localized } from "../../core/types";
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels } from "../library-template";
import { templatePreview } from "../preview";

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

/** A text that reads the same in both languages (a social handle) is patched as one string. */
const oneString = (text: Localized): Localized | string => (text.ar === text.en ? text.en : text);

const pageHeader = (as: string, title: Localized, text: Localized) =>
  lib("page-header", { as, text: { "من نحن": title, "فريق صغير يختار منتجات نشتريها نحن أنفسنا.": text } });

/**
 * Hara Supply's own content: what the look is built with when no edition is
 * applied (the template `streetwear` has always meant). The store name and
 * description and the category photos come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's search placeholder.
  labels: { search: L("دوّر في الدروب", "Search the drop") },
  // The footer's large sign-off line: three to five words.
  footer: { line: L("نتقابل في الدروب الجاي", "See you at the next drop") },
  hero: {
    eyebrow: L("دروب ٠٧", "Drop 07"),
    alt: L("شارع جانبي مليان جرافيتي", "A side street covered in graffiti"),
    title: L("معمول في شارعنا", "Made on our street"),
    line: L("هوديز وتيشيرتات قطن تقيل، مطبوعة باليد في شبرا بكميات ١٢٠ قطعة.", "Heavy cotton hoodies and tees, printed by hand in Shubra in runs of 120."),
    // The button goes to the newest products.
    cta: L("تسوق الدروب", "Shop the drop"),
  },
  categories: { title: L("اختار ستايلك", "Pick your fit") },
  products: {
    // The rail of the newest products. Its eyebrow is the current collection's name: it is also the footer's link to the newest products.
    primary: { eyebrow: L("دروب ٠٧", "Drop 07"), title: L("كل حاجة في الدروب", "Everything in the drop") },
  },
  // The bento of best sellers: its title, two or three words.
  rows: [{ title: L("بيخلص بسرعة", "Going fast") }],
  // Optional (all three quotes, or none). Three quotes on the about page. Each card shows the first letter of the name.
  reviews: {
    title: L("من عملائنا", "From our customers"),
    items: [
      {
        quote: L("أتقل هودي عندي. اتغسل عشر مرات والطباعة لسه زي ما هي.", "Heaviest hoodie I own. Washed it ten times and the print is still sharp."),
        name: L("يوسف ع.", "Youssef A."),
      },
      {
        quote: L("لحقت الدروب بعد خمس دقايق من نزوله. يستاهل السهر.", "Got the drop five minutes after it went live. Worth staying up for."),
        name: L("ملك ر.", "Malak R."),
      },
      { quote: L("المقاسات واسعة، انزل مقاس لو عايز قصّة عادية.", "Runs big, size down if you want a normal fit."), name: L("زياد ح.", "Ziad H.") },
    ],
  },
  about: {
    // Also the about page's SEO description.
    line: L("صاحبين وترابيزة طباعة وشارع في شبرا.", "Two friends, one print table and a street in Shubra."),
    alt: L("محل لبس ستريت مليان رفوف", "A streetwear shop full of rails"),
    eyebrow: L("من ٢٠٢٠", "Since 2020"),
    title: L("كل دروب ١٢٠ قطعة بس", "Every drop is 120 pieces"),
    text: L(
      "بنطبع كل تصميم بإيدينا على قطن تقيل، وبنصوّر الدروب في شارعنا بعد ما المحلات تقفل.",
      "We print every design by hand on heavy cotton and shoot each drop on our street after the shops close.",
    ),
    more: L("ولما الدروب يخلص، مش بيرجع تاني.", "And when a drop sells out, it never comes back."),
    // The button goes to the newest products.
    cta: L("تسوق الدروب", "Shop the drop"),
  },
  contact: {
    title: L("كلمنا", "Talk to us"),
    line: L("عن مقاس أو طلب أو الدروب الجاي.", "About a size, an order or the next drop."),
    heading: L("ابعتلنا وهنرد عليك", "Send us a message"),
  },
  faq: {
    line: L("المقاسات والدروبات والتوصيل.", "Sizes, drops and delivery."),
    question: L("هل في ريستوك؟", "Do you restock?"),
    answer: L(
      "لأ. كل دروب ١٢٠ قطعة ولما يخلص مش بيرجع. الاستبدال متاح خلال ١٤ يوم لو المقاس مش مظبوط.",
      "No. Each drop is 120 pieces and never comes back. Size exchanges are open for 14 days.",
    ),
  },
  custom: {
    // The store's short name, as it reads inside a sentence: "About Hara", "— The Hara team", "A photo from Hara's Instagram".
    "store-short": L("حارة", "Hara"),
    // The hero's small line beside its eyebrow (a season, a date, how long it lasts).
    "hero-note": L("متاح دلوقتي · لحد ما الكمية تخلص", "Live now · while stock lasts"),
    // The hero's round sticker, three short lines: a word, one big figure (at most 4 characters), a word.
    "hero-sticker-1": L("بس", "Only"),
    "hero-sticker-2": L("١٢٠", "120"),
    "hero-sticker-3": L("قطعة", "pieces"),
    // The wide photo band after the rail: a product type as its big title (one or two words; in Arabic without "ال"), and one line of facts under it.
    "banner-alt": L("هوديز بألوان هادية على الشماعة", "Soft-coloured hoodies on a rail"),
    "banner-title": L("هوديز", "Hoodies"),
    "banner-line": L("قطن مشطوف ٤٥٠ جرام بقصّة واسعة.", "450 gsm brushed cotton, boxy cut."),
    // The big statement: one or two short sentences in the store's voice, signed by its team; then its link to the newest products.
    "craft-statement": L("مفيش ريستوك. الدروب لما يخلص، يخلص.", "No restocks. When a drop is gone, it is gone."),
    "craft-statement-cta": L("كل الدروب", "Shop the drop"),
    // The Instagram bento's brand tile: the store's handle, then one short line under it.
    "lookbook-handle": L(handle("@harasupply"), handle("@harasupply")),
    "lookbook-line": L("٣٨ ألف متابع", "38K followers"),
  },
  photos: {
    // The poster's photo, 16:9, with the copy over a dark fade.
    hero: { wide: PHOTOS.alley },
    // The wide photo band, with `banner-title` over it.
    banner: PHOTOS.pastelHoodies,
    // The about page's photo (the look has no story block on its home page).
    story: PHOTOS.shop,
    // The Instagram bento, square: one large photo, then four small ones (styled shots, not packshots).
    custom: {
      "lookbook-1": PHOTOS.passage,
      "lookbook-2": PHOTOS.hoodiePair,
      "lookbook-3": PHOTOS.shirtRack,
      "lookbook-4": PHOTOS.blackHoodieRack,
      "lookbook-5": PHOTOS.printTees,
    },
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade or the demo store is a slot of `c`;
 * generic shop labels (Top rated, Write to us, the reviewers' cities) and
 * the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const short = x["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  // Optional: a pack without buyer quotes gets the about page without the quotes section.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const bannerTitle = x["banner-title"]!;

  const header = lib("header-brand-bar", {
    text: { "م": initialOf(name), "اسم متجرك": name, "ابحث في المتجر": c.labels.search },
  });

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا إنك عدّيت علينا": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "وصل حديثًا": c.products.primary.eyebrow,
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutName,
    },
    links: { "/products": [undefined, NEW, BEST, "/products?sort=rating"] },
  });

  const home: Design[] = [
    lib("hero-poster", {
      photo: [undefined, undefined, c.photos.hero.wide],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "من ١ إلى ٣٠ نوفمبر": x["hero-note"]!,
        "صورة الحملة": c.hero.alt,
        "خصم": x["hero-sticker-1"]!,
        "٣٠٪": x["hero-sticker-2"]!,
        "لفترة محدودة": x["hero-sticker-3"]!,
        "الموسم الجديد وصل": c.hero.title,
        "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": c.hero.line,
        "اكتشف المجموعة": c.hero.cta,
      },
      links: { "/products": NEW },
    }),
    lib("categories-chips", {
      text: { "إيه اللي في بالك؟": c.categories.title },
    }),
    lib("products-rail", {
      as: "drop-rail",
      text: { "بيحبوها": c.products.primary.eyebrow, "الأكثر مبيعًا": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    lib("page-image", {
      as: "hoodies-banner",
      // The section's name in the builder: "<product type> banner".
      name: L(`بانر قسم ${bannerTitle.ar.startsWith("ال") ? "" : "ال"}${bannerTitle.ar}`, `${bannerTitle.en} banner`),
      photo: [c.photos.banner],
      text: {
        "صورة البانر": x["banner-alt"]!,
        "اسم القسم": bannerTitle,
        "تشكيلة مختارة لهذا الموسم": x["banner-line"]!,
      },
    }),
    lib("products-bento", {
      text: { "الكل بيسأل عليهم": c.rows[0]!.title },
      links: { "/products": BEST },
    }),
    lib("text-statement", {
      text: {
        "كل سنة وانتم طيبين. الطلبات شغالة طول أيام العيد.": x["craft-statement"]!,
        "— فريق المتجر": L(`— فريق ${short.ar}`, `— The ${short.en} team`),
        "مواعيد التوصيل": x["craft-statement-cta"]!,
      },
      links: { "/shipping": NEW },
    }),
    lib("gallery-bento", {
      photo: [
        c.photos.custom["lookbook-1"]!,
        c.photos.custom["lookbook-2"]!,
        c.photos.custom["lookbook-3"]!,
        c.photos.custom["lookbook-4"]!,
        c.photos.custom["lookbook-5"]!,
      ],
      text: {
        "صورة إنستجرام": L(`صورة من إنستجرام ${short.ar}`, `A photo from ${short.en}'s Instagram`),
        "@اسم_متجرك": oneString(x["lookbook-handle"]!),
        "صور جديدة كل أسبوع": x["lookbook-line"]!,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader("about-header", aboutName, c.about.line),
    lib("about-classic", {
      person: [undefined, undefined, c.photos.story],
      text: {
        "صورة المتجر": c.about.alt,
        "حكايتنا": c.about.eyebrow,
        "بدأنا بسؤال واحد: هل سيدوم؟": c.about.title,
        "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": c.about.text,
        "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": c.about.more,
        "تعرّف علينا": c.about.cta,
      },
      links: { "/about": NEW },
    }),
    ...(reviews
      ? [
          lib("testimonials-classic", {
            text: {
              "آراء العملاء": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "الإسكندرية": L("الجيزة", "Giza"),
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "ن": initialOf(reviews.items[2]!.name),
              "نور ح.": reviews.items[2]!.name,
              "الجيزة": L("الإسكندرية", "Alexandria"),
            },
          }),
        ]
      : []),
  ];

  const contact: Design[] = [
    pageHeader("contact-header", c.contact.title, c.contact.line),
    lib("contact-form", { text: { "راسلنا": L("راسلنا", "Write to us"), "ابعتلنا وهنرجعلك": c.contact.heading } }),
  ];

  const faq: Design[] = [
    pageHeader("faq-header", L("الأسئلة الشائعة", "FAQ"), c.faq.line),
    lib("faq-columns", {
      text: {
        "ما سياسة الاسترجاع؟": c.faq.question,
        "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": c.faq.answer,
      },
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      {
        slug: "about",
        name: L(aboutName.ar, "About"),
        seo: { title: aboutName, description: c.about.line },
        sections: about,
      },
      { slug: "contact", name: L("تواصل", "Contact"), seo: { title: c.contact.title }, sections: contact },
      { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("قطن تقيل وطباعة عالية، معمول في شبرا.", "Heavy cotton, loud prints, made in Shubra."),
  categories: [
    ["hoodies", "هوديز", "Hoodies", PHOTOS.pastelHoodies],
    ["tees", "تيشيرتات", "Tees", PHOTOS.teeRail],
    ["bottoms", "بناطيل", "Bottoms", PHOTOS.sweatpants],
    ["shoes", "شوزات", "Shoes", PHOTOS.sneakers],
    ["bags", "شنط", "Bags", PHOTOS.messenger],
    ["shirts", "قمصان", "Shirts", PHOTOS.shirtRack],
    ["prints", "طباعات", "Graphic prints", PHOTOS.printTees],
    ["blanks", "سادة", "Blanks", PHOTOS.blackHoodieRack],
  ],
  products: [
    ["drop07-heavy-hoodie", "hoodies", "هودي دروب ٠٧ تقيل", "Drop 07 Heavy Hoodie", PHOTOS.sageHoodie, 1650, { isFeatured: true, rating: 4.9, sold90: 132 }],
    ["washed-hoodie-duo", "hoodies", "هودي مغسول", "Washed Hoodie", PHOTOS.hoodiePair, 1450, { compareAtPrice: 1750, sold90: 58 }],
    ["black-logo-hoodie", "blanks", "هودي أسود سادة", "Black Blank Hoodie", PHOTOS.blackHoodieRack, 1550, { rating: 4.8, sold90: 44 }],
    ["camo-tee", "tees", "تيشيرت مموّه", "Camo Tee", pexels(12262102, 900), 700, { sold90: 40 }],
    ["plant-print-tee", "prints", "تيشيرت طباعة نبات", "Plant Print Tee", PHOTOS.printTees, 650, { rating: 4.7, sold90: 61 }],
    ["heavy-tee-pair", "tees", "تيشيرتين تقال", "Heavy Tee Pair", pexels(18186105, 900), 1100, { compareAtPrice: 1300, sold90: 33 }],
    ["lounge-joggers", "bottoms", "بنطلون جوجر", "Lounge Joggers", pexels(31961168, 900), 950, { rating: 4.7, sold90: 97 }],
    ["drawstring-sweatpants", "bottoms", "بنطلون سويت برباط", "Drawstring Sweatpants", PHOTOS.sweatpants, 900, { sold90: 21 }],
    ["grey-canvas-sneakers", "shoes", "كوتشي كانفاس رمادي", "Grey Canvas Sneakers", PHOTOS.sneakers, 1300, { sold90: 18 }],
    ["leather-messenger", "bags", "شنطة كروس جلد", "Leather Messenger", PHOTOS.messenger, 1300, { inStock: false, sold90: 39 }],
    ["oversized-work-shirt", "shirts", "قميص أوفر سايز", "Oversized Work Shirt", PHOTOS.shirtRack, 1150, { sold90: 26 }],
  ],
});

export const STREETWEAR = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(STREETWEAR_KEY, "tshirts", { ar: 2577, en: 2610 }),
  key: STREETWEAR_KEY,
  version: 4,
  changelog: "Streetwear v4: categories, section order",
  name: L("ستريت وير", "Streetwear"),
  description: L(
    "موضة شارع جريئة: أبيض وأسود وأخضر ليموني، زوايا حادة وخط عريض. أربع صفحات جاهزة.",
    "Bold urban fashion: black, white and acid lime, square corners and heavy type. Four ready pages.",
  ),
  category: "fashion",
  style: ["bold"],
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
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "footer.line",
    "custom.store-short",
    "hero",
    "custom.hero-note",
    "custom.hero-sticker-1",
    "custom.hero-sticker-2",
    "custom.hero-sticker-3",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "custom.banner-alt",
    "custom.banner-title",
    "custom.banner-line",
    "rows.0.title",
    "custom.craft-statement",
    "custom.craft-statement-cta",
    "custom.lookbook-handle",
    "custom.lookbook-line",
    "photos.custom.lookbook-1",
    "photos.custom.lookbook-2",
    "photos.custom.lookbook-3",
    "photos.custom.lookbook-4",
    "photos.custom.lookbook-5",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
  ],
  // The about page's three buyer quotes: without `reviews` the section is not built.
  optional: ["reviews"],
  // The rail shows the newest products; the look has no category rows.
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { thumbs: "side", headingCase: "upper", band: "brand", copy: { reviews: L("الشارع بيقول إيه", "What the street says"), related: L("كمّل اللوك", "Run the full fit") } },
});
