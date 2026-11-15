/**
 * Beauty Bold (2026-10-28, beauty niche, bold / colour-pop): blush paper,
 * a hot pink and a deep violet over near-black ink, Lalezar headings over
 * Tajawal, round 20px corners and a 1300px container. A loud, playful home
 * like a makeup counter: a scrolling ticker header, a three-slide hero
 * carousel of colour-block flat lays, big-type category rows, tabbed
 * products, the "with every order" promise list beside a dark flat lay,
 * four category rows with rounded frames, a WhatsApp-or-email newsletter
 * and the links footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye on a contact sheet (2026-10-28):
 * product flat lays and still lifes on colour, no people, no hands, no
 * brand labels, none used twice, none shared with another template.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Bombi itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const BEAUTY_BOLD_KEY = "beauty-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BEAUTY_BOLD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideLilac: pexels(7712475, 1920),
  slideSponges: pexels(7712467, 1920),
  slideBrushes: pexels(7512746, 1920),
  darkFlatLay: pexels(8558431, 1200),
  aboutPage: pexels(8558547, 1200),
  // Category tiles.
  catSerums: pexels(6694179, 1200),
  catMoisturizers: pexels(4841492, 1200),
  catMakeup: pexels(7256147, 1200),
  catHair: pexels(8468177, 1200),
  catCleansers: pexels(8015698, 1200),
  catBody: pexels(1298624, 1200),
  catTools: pexels(6963155, 1200),
};

const NAME = L("بمبي", "Bombi");

/**
 * Bombi's own content: what the look is built with when no edition is
 * applied (the template `beauty-bold` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header ticker: three short lines.
  announcement: [
    L("تفاصيل ومكونات واضحة لكل منتج", "Clear details and ingredients for every product"),
    L("تشكيلة للمكياج والعناية", "Makeup and care in one place"),
    L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
  ],
  // The carousel's first slide (it goes to the newest products); slides 2 and 3 are `custom.hero-2-*` (photo: `photos.banner`) and `custom.hero-3-*` (photo: `photos.custom.hero-3`).
  hero: {
    alt: L("فرش وأحمر خدود وإسفنجات على خلفية بنفسجية فاتحة", "Brushes, blush and sponges on lilac"),
    eyebrow: L("وصل حديثًا", "Just landed"),
    title: L("ألوان مكياج جريئة", "Bold makeup colours"),
    line: L("أحمر شفاه وأحمر خدود وظلال بدرجات جريئة.", "Lipsticks, blush and shadows in bold shades."),
    cta: L("تسوّق الجديد", "Shop new in"),
  },
  // The tabbed shelf's title, over its tabs (new in, best sellers, top rated).
  products: { primary: { title: L("اختر ما يناسبك", "Find your pick") } },
  // The promise list beside a photo: an eyebrow, a title, three points (`custom.story-point-1..3`) and a link to the about page.
  story: {
    alt: L("فرش وماسكارا وأحمر خدود على رخام أسود ووردي", "Brushes, a mascara wand and blush on black and pink marble"),
    eyebrow: L("مع كل منتج", "With every product"),
    title: L("تفاصيل واضحة لكل منتج", "Clear details for every product"),
    cta: L("اعرف أكثر", "Learn more"),
  },
  // The WhatsApp-or-email sign-up: a title, a line and the note under it.
  newsletter: {
    title: L("الدرجات الجديدة بالطريقة التي تفضّلها", "New shades, the way you like"),
    line: L(
      "عبر واتساب أو البريد الإلكتروني: أحدث الدرجات، دون رسائل مزعجة.",
      "On WhatsApp or by email: the newest shades, no spam.",
    ),
    note: L("يمكنك إلغاء الاشتراك في أي وقت.", "Unsubscribe any time."),
  },
  about: {
    line: L("مكياج ومنتجات عناية بألوان جريئة.", "Bold-colour makeup and care products."),
    alt: L("رموش صناعية وفرش وأدوات على خلفية وردية", "Lashes, brushes and tools on pink"),
    eyebrow: L("من نحن", "About us"),
    title: L("مكياج بألوان جريئة", "Makeup in bold colours"),
    text: L(
      "نختار أحمر الشفاه والظلال وأحمر الخدود بدرجات جريئة، ونعرض تفاصيل كل منتج بوضوح.",
      "We choose lipsticks, shadows and blush in bold shades, and show every product’s details clearly.",
    ),
    more: L("وفي كل صفحة منتج الدرجات المتاحة وطريقة الاستخدام.", "Every product page shows the available shades and how to use it."),
    // Goes to the best sellers.
    cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
  },
  contact: {
    title: L("هل تحتاج مساعدة في اختيار الدرجة؟", "Not sure about a shade?"),
    line: L("تواصل معنا لأي سؤال. ٧ شارع الأهرام، مصر الجديدة، القاهرة.", "Contact us with any question. 7 El Ahram St, Heliopolis, Cairo."),
    heading: L("تواصل معنا", "Contact us"),
  },
  faq: {
    line: L("الدرجات والمكونات والطلبات.", "Shades, ingredients and orders."),
    question: L("كيف أختار الدرجة المناسبة؟", "How do I choose the right shade?"),
    answer: L(
      "ستجد صور الدرجات ووصفها في صفحة كل منتج، ويمكنك التواصل معنا لأي سؤال.",
      "Each product page shows its shades and description, and you can contact us with any question.",
    ),
  },
  custom: {
    // Carousel slide 2 (the best sellers): its photo's alt, a title of a few words and one line.
    "hero-2-alt": L("إسفنجات مكياج ملونة ولوحة ظلال", "Colourful makeup sponges and an eyeshadow palette"),
    "hero-2-title": L("المنتجات الأكثر طلبًا", "Our most wanted"),
    "hero-2-line": L("أحمر شفاه وظلال وأحمر خدود بدرجات متعددة.", "Lipsticks, shadows and blush in many shades."),
    // Carousel slide 3 (the whole catalog): its photo's alt, an eyebrow, a title and one line.
    "hero-3-alt": L("فرش مكياج ذهبية وفضية على خلفية فوشيا", "Gold and silver makeup brushes on fuchsia"),
    "hero-3-eyebrow": L("أدوات المكياج", "The brush edit"),
    "hero-3-title": L("فرش لكل استخدام", "A brush for every use"),
    "hero-3-line": L("فرش للبودرة وأحمر الخدود والهايلايتر.", "Brushes for powder, blush and highlighter."),
    // The promise list's three points, one line each.
    "story-point-1": L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
    "story-point-2": L("تفاصيل ودرجات واضحة", "Clear details and shades"),
    "story-point-3": L("تواصل معنا لأي سؤال", "Contact us with any question"),
  },
  // The three carousel slides (wide, cropped tall on phones, so subjects sit in the middle): hero.wide, banner and custom hero-3; story: the promise list's photo; about: the about page.
  photos: {
    hero: { wide: PHOTOS.slideLilac },
    banner: PHOTOS.slideSponges,
    story: PHOTOS.darkFlatLay,
    about: PHOTOS.aboutPage,
    custom: { "hero-3": PHOTOS.slideBrushes },
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Shop all, New in, Best sellers, Track order, See all) and the layout stay
 * here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const p = c.photos.custom;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-centered-ticker", {
    text: {
      "تفاصيل ومقاسات واضحة لكل منتج": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تسوّق سهل من هاتفك": c.announcement[2]!,
      "اسم متجرك": name,
      "المتجر": L("كل المنتجات", "Shop all"),
      "العروض": L("وصل حديثًا", "New in"),
      "المدونة": L("الأكثر مبيعًا", "Best sellers"),
      "من نحن": L(aboutName.ar, "About"),
      "تواصل معنا": L("تتبّع طلبك", "Track order"),
    },
    links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
  });

  const footer = lib("footer-links", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "كل المنتجات": L("كل المنتجات", "All products"),
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [SHOP, NEW, BEST], "https://wa.me/": "https://wa.me/201117642380" },
  });

  const home: Design[] = [
    lib("hero-carousel", {
      photo: [c.photos.hero.wide, c.photos.banner, p["hero-3"]!],
      text: {
        "صورة الحملة الأولى": c.hero.alt,
        "وصل حديثًا": c.hero.eyebrow,
        "الموسم الجديد وصل": c.hero.title,
        "قطع مختارة بعناية لكل يوم.": c.hero.line,
        "تسوّق الجديد": c.hero.cta,
        "صورة الحملة الثانية": x["hero-2-alt"]!,
        "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
        "المفضّلة عند عملائنا": x["hero-2-title"]!,
        "القطع الأكثر طلبًا في المتجر.": x["hero-2-line"]!,
        "تصفّح الأكثر مبيعًا": L("تصفّح الأكثر مبيعًا", "Shop best sellers"),
        "صورة الحملة الثالثة": x["hero-3-alt"]!,
        "مختارات الأسبوع": x["hero-3-eyebrow"]!,
        "قطع مختارة لهذا الأسبوع": x["hero-3-title"]!,
        "تشكيلة مختارة من أحدث القطع في المتجر.": x["hero-3-line"]!,
        "تسوّق المختارات": L("تسوّق كل المنتجات", "Shop everything"),
      },
      links: { "/products": [NEW, BEST, SHOP] },
    }),
    lib("categories-big-type", {
      text: { "منتج": L("منتج", "products") },
    }),
    lib("products-tabbed", {
      text: {
        "المتجر": L("المتجر", "The shop"),
        "منتجاتنا": c.products.primary.title,
        "وصل جديد": L("وصل جديد", "New in"),
        "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
        "العروض": L("الأعلى تقييمًا", "Top rated"),
      },
      links: { "/products": [NEW, BEST, RATED] },
      lists: [{ source: "best-sellers" }],
    }),
    lib("about-list", {
      photo: [undefined, undefined, undefined, undefined, undefined, c.photos.story],
      text: {
        "صورة المتجر": c.story.alt,
        "مع كل منتج": c.story.eyebrow,
        "تفاصيل واضحة لكل منتج": c.story.title,
        "صور ومواصفات لكل منتج": x["story-point-1"]!,
        "تفاصيل ومقاسات واضحة": x["story-point-2"]!,
        "تواصل معنا لأي سؤال": x["story-point-3"]!,
        "اعرف أكثر": c.story.cta,
      },
    }),
    // Four category rows, places 1 to 4 in order (`journey.rows` is [1, 2, 3, 4]).
    ...categoryRows(lib, {
      viewAll: L("عرض الكل", "View all"),
      muted: [1, 3],
      nodes: { "صورة المنتج": { style: { radius: 20 } } },
    }),
    lib("newsletter-channels", {
      text: {
        "الجديد يصلك بالطريقة التي تفضّلها": c.newsletter.title,
        "عبر واتساب أو البريد الإلكتروني، وبدون رسائل مزعجة.": c.newsletter.line,
        "على رقم هاتفك": L("على رقم هاتفك", "On your phone"),
        "على بريدك": L("على بريدك", "In your inbox"),
        "يمكنك إلغاء الاشتراك في أي وقت.": c.newsletter.note,
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
  description: L("مكياج ومنتجات عناية بألوان جريئة.", "Bold-colour makeup and care products."),
  categories: [
    ["serums", "السيرومات والزيوت", "Serums and oils", PHOTOS.catSerums],
    ["moisturizers", "الكريمات", "Creams", PHOTOS.catMoisturizers],
    ["makeup", "المكياج", "Makeup", PHOTOS.catMakeup],
    ["hair-care", "العناية بالشعر", "Hair care", PHOTOS.catHair],
    ["cleansers", "الغسول", "Cleansers", PHOTOS.catCleansers],
    ["body-care", "العناية بالجسم", "Body care", PHOTOS.catBody],
    ["tools", "الأدوات", "Tools", PHOTOS.catTools],
  ],
  products: [
    // Serums and oils
    ["vitamin-c-serum-duo", "serums", "ثنائي سيروم فيتامين سي", "Vitamin C Serum Duo", P(8102129), 1150, { isFeatured: true, rating: 4.8, sold90: 141 }],
    ["gold-cap-glow-serum", "serums", "سيروم إشراقة بغطاء ذهبي", "Gold Cap Glow Serum", P(12449960), 1290, { compareAtPrice: 1490, rating: 4.9, sold90: 58 }],
    ["midnight-face-oil", "serums", "زيت ليلي للوجه", "Midnight Face Oil", P(18708753), 760, { rating: 4.6, sold90: 34 }],
    ["night-repair-serum", "serums", "سيروم إصلاح ليلي", "Night Repair Serum", P(8102021), 890, { rating: 4.7, sold90: 76 }],
    ["rose-petal-face-oil", "serums", "زيت للوجه بأوراق الورد", "Rose Petal Face Oil", P(4041231), 690, { rating: 4.7, sold90: 47 }],
    ["herbal-face-oil", "serums", "زيت للوجه بالأعشاب", "Herbal Face Oil", P(6694183), 540, { rating: 4.5, sold90: 22 }],
    ["amber-booster-drops", "serums", "قطرات معززة عنبرية", "Amber Booster Drops", P(6693978), 590, { rating: 4.6, sold90: 19 }],
    ["roll-on-eye-serum", "serums", "سيروم للعين رول أون", "Roll-On Eye Serum", P(6693878), 420, { rating: 4.8, sold90: 63 }],
    // Creams
    ["rain-pump-lotion", "moisturizers", "لوشن ترطيب بمضخة", "Hydra Pump Lotion", P(7814719), 520, { rating: 4.6, sold90: 44 }],
    ["pump-lotion-cream-duo", "moisturizers", "ثنائي لوشن وكريم", "Lotion and Cream Duo", P(27544682), 790, { isFeatured: true, rating: 4.8, sold90: 72 }],
    ["ruby-night-cream", "moisturizers", "كريم روبي الليلي", "Ruby Night Cream", P(17856248), 650, { rating: 4.7, sold90: 39 }],
    ["gold-cap-luxe-cream", "moisturizers", "كريم بغطاء ذهبي", "Gold Cap Luxe Cream", P(34544440), 1190, { rating: 4.9, sold90: 26 }],
    ["mini-hand-cream-duo", "moisturizers", "ثنائي كريم يدين صغير", "Mini Hand Cream Duo", P(7256065), 280, { rating: 4.5, sold90: 88 }],
    ["blush-moisturizer-tube", "moisturizers", "مرطب بلون الخدود في أنبوب", "Blush Moisturizer Tube", P(27544683), 390, { compareAtPrice: 450, rating: 4.6, sold90: 51 }],
    ["honey-balm-jar", "moisturizers", "بلسم العسل", "Honey Balm", P(8015480), 340, { rating: 4.7, sold90: 29 }],
    ["olive-hand-cream", "moisturizers", "كريم يدين بالزيتون", "Olive Hand Cream", P(7005933), 260, { rating: 4.4, sold90: 17 }],
    // Makeup
    ["nude-lip-gloss", "makeup", "ملمع شفاه بلون طبيعي", "Nude Lip Gloss", P(17806623), 240, { isFeatured: true, rating: 4.8, sold90: 156 }],
    ["lipstick-shade-scatter", "makeup", "مجموعة روج ميني", "Mini Lipstick Set", P(7256139), 690, { rating: 4.7, sold90: 61 }],
    ["hot-pink-lipstick", "makeup", "أحمر شفاه وردي فاقع", "Hot Pink Lipstick", P(7810567), 260, { rating: 4.5, sold90: 38 }],
    ["pearl-powder-brush", "makeup", "بودرة لؤلؤ مع فرشة", "Pearl Powder with Brush", P(7256134), 390, { rating: 4.6, sold90: 73 }],
    ["glitter-brush-set", "makeup", "طقم فرش لامعة", "Glitter Brush Set", P(12449962), 450, { rating: 4.8, sold90: 49 }],
    ["electric-blue-mascara", "makeup", "ماسكارا زرقاء", "Electric Blue Mascara", P(3373731), 310, { rating: 4.6, sold90: 27, inStock: false }],
    ["shimmer-eyeshadow-grid", "makeup", "ظلال لامعة ٩ درجات", "Shimmer Eyeshadow Nine", P(7256131), 480, { rating: 4.7, sold90: 44 }],
    ["peach-liquid-liner", "makeup", "آيلاينر سائل بلون الخوخ", "Peach Liquid Liner", P(16695682), 290, { compareAtPrice: 340, rating: 4.9, sold90: 52 }],
    // Hair
    ["gold-shine-shampoo", "hair-care", "شامبو اللمعة الذهبية", "Gold Shine Shampoo", P(13006784), 320, { rating: 4.6, sold90: 41 }],
    ["shampoo-conditioner-trio", "hair-care", "ثلاثي شامبو وبلسم", "Shampoo and Conditioner Trio", P(4176618), 690, { isFeatured: true, rating: 4.8, sold90: 57 }],
    ["heat-protect-mist", "hair-care", "سبراي حماية من الحرارة", "Heat Protect Mist", P(8166452), 290, { rating: 4.7, sold90: 46 }],
    ["pastel-hair-minis", "hair-care", "عبوات صغيرة للشعر بألوان هادئة", "Pastel Hair Minis", P(6690245), 360, { rating: 4.5, sold90: 23 }],
    ["comb-oil-gift-set", "hair-care", "طقم مشط وزيت شعر", "Comb and Hair Oil Set", P(8468166), 450, { rating: 4.7, sold90: 31 }],
    ["pick-comb", "hair-care", "مشط أفرو أزرق", "Blue Pick Comb", P(7123549), 120, { rating: 4.4, sold90: 19 }],
    ["hair-colour-brush-kit", "hair-care", "طقم فرش صبغة", "Hair Colour Brush Kit", P(8468178), 220, { rating: 4.5, sold90: 14 }],
    ["wooden-bristle-brush", "hair-care", "طقم فرشة خشب ومقص", "Bristle Brush and Scissors Set", P(11357067), 290, { rating: 4.6, sold90: 12 }],
    // Cleansers
    ["pastel-cleanser-set", "cleansers", "طقم غسول باستيل", "Pastel Cleanser Set", P(7321507), 690, { rating: 4.7, sold90: 39 }],
    ["gentle-pump-cleanser", "cleansers", "غسول لطيف بمضخة", "Gentle Pump Cleanser", P(8074069), 350, { rating: 4.6, sold90: 33 }],
    ["honey-cleansing-balm", "cleansers", "بلسم تنظيف بالعسل", "Honey Cleansing Balm", P(10650934), 420, { rating: 4.8, sold90: 28 }],
    ["pastel-gel-cleansers", "cleansers", "غسول جل باستيل", "Pastel Gel Cleansers", P(8533223), 560, { rating: 4.5, sold90: 16 }],
    // Body
    ["lemon-soap-cubes", "body-care", "صابون الليمون مكعبات", "Lemon Soap Cubes", P(7814808), 180, { rating: 4.6, sold90: 24 }],
    ["rose-soap-brush-stack", "body-care", "صابون الورد مع فرشة", "Rose Soap with Body Brush", P(9475428), 260, { rating: 4.7, sold90: 18 }],
    ["ocean-swirl-soap", "body-care", "صابون بتموجات زرقاء", "Ocean Swirl Soap", P(14017562), 150, { rating: 4.5, sold90: 21 }],
    ["matcha-swirl-soap", "body-care", "صابون ماتشا بتموجات", "Matcha Swirl Soap", P(14017553), 150, { rating: 4.8, sold90: 15 }],
    // Tools
    ["rose-quartz-roller", "tools", "رولر وجوا شا كوارتز", "Rose Quartz Roller and Gua Sha", P(6663677), 590, { rating: 4.7, sold90: 26 }],
    ["self-care-roller-kit", "tools", "طقم رولر للعناية", "Self-Care Roller Kit", P(8903614), 790, { rating: 4.8, sold90: 13 }],
    ["dark-jade-roller", "tools", "طقم رولر يشم غامق", "Dark Jade Roller Set", P(11595256), 650, { rating: 4.6, sold90: 11 }],
  ],
});

export const BEAUTY_BOLD = editionTemplate({
  key: BEAUTY_BOLD_KEY,
  version: 2,
  name: L("بمبي", "Bombi"),
  description: L(
    "مكياج بألوان جريئة: سلايدر ألوان، أقسام بخط كبير، تبويبات منتجات وصفوف بإطارات مدورة. لمتاجر المكياج والجمال.",
    "Bold-colour makeup: a colour-pop slider, big-type categories, tabbed products and rounded category rows. For makeup and beauty stores.",
  ),
  category: "beauty",
  style: ["bold"],
  sortOrder: 1330,
  palette: ["#fff6f9", "#fde3ee", "#c2185b", "#5e1f8c"],
  colors: {
    primary: "#c2185b",
    secondary: "#fde3ee",
    background: "#ffffff",
    foreground: "#1f0f19",
    muted: "#6d5664",
    border: "#f2cddc",
    accent: "#5e1f8c",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 20,
  containerMaxWidth: 1300,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "announcement.2",
    "hero",
    "products.primary.title",
    "story.alt",
    "story.eyebrow",
    "story.title",
    "story.cta",
    "newsletter.title",
    "newsletter.line",
    "newsletter.note",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
    "photos.banner",
    "photos.custom.hero-3",
    "custom.hero-2-alt",
    "custom.hero-2-title",
    "custom.hero-2-line",
    "custom.hero-3-alt",
    "custom.hero-3-eyebrow",
    "custom.hero-3-title",
    "custom.hero-3-line",
    "custom.story-point-1",
    "custom.story-point-2",
    "custom.story-point-3",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  // The tabbed shelf has its own tabs, so `primary` is not read; four category rows, places 1 to 4 (`categoryRows`).
  optional: ["photos.about"],
  journey: { primary: "best-sellers", rows: [1, 2, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") },
  },
});
