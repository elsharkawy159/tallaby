/**
 * Mafrash (template 79, bedding and textiles; Claude Design "Storefront
 * Templates"): warm white paper, a calm denim blue for actions and a pale sky
 * highlight, Noto Kufi Arabic throughout and 14px corners. A bedding shop
 * that lets you sleep on it first: the 30-night trial, the bed set bundle,
 * why Egyptian cotton, new colours, share a good night, one category as a
 * carousel and reviews from people who slept on it. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): made and unmade beds,
 * linen sets, folded duvets, knitted throws and cushions. No people, no
 * hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Mafrash Home itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 * v5 (owner, 2026-11-25: every home has products by category and a
 * carousel) adds the category carousel after the promises.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const MAFRASH_KEY = "mafrash";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MAFRASH_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/**
 * One category's products as a carousel (`journey.rows[0]`: its place in
 * the store, 1 = the first), three across: this niche's pack has three
 * products per category, and a category row needs one full row (editions
 * README §3). On desktop the carousel still sizes its cards four in view.
 */
const categoryCarousel = (place: number): Design =>
  lib("products-category-carousel", {
    lists: [place > 1 ? { offset: place - 1 } : undefined, { categoryIndex: place, limit: 3 }],
    nodes: { "منتجات القسم": { style: { columns: 3 } } },
  });

const PHOTOS = {
  leafBedroom: pexels(5152681),
  unmadeLinen: pexels(3847588, 900),
  blanketStool: pexels(5881237, 900),
  sofaCushions: pexels(4846450, 900),
  basketThrow: pexels(5789581),
  cottonSheets: pexels(3755590, 900),
  waffleThrow: pexels(4577654, 900),
  velvetCushions: pexels(4271665, 900),
  duvetCover: pexels(189293, 900),
  folded: pexels(3872927, 900),
  greyLinen: pexels(7445081, 900),
  beigeLinen: pexels(27439405, 900),
  oliveLinen: pexels(20801059, 900),
  gingham: pexels(7765000, 900),
  chunkyKnit: pexels(10321569, 900),
  redKnit: pexels(3996529, 900),
  blushPillow: pexels(18501199, 900),
};

const NAME = L("مفرش هوم", "Mafrash Home");

/**
 * Mafrash Home's own content: what the look is built with when no edition
 * is applied (the template `mafrash` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header bar: two short lines.
  announcement: [L("مفارش وملايات وبطاطين ومخدات", "Bedding, sheets, throws and cushions"), L("مقاسات وخامات واضحة لكل منتج", "Clear sizes and materials for every product")],
  // The header's first link, one or two words: the store's main category. The hero's button goes there too.
  nav: [{ label: L("المفارش", "Bedding"), href: search("طقم") }],
  hero: {
    alt: L("سرير بمفرش بنقشة أوراق الشجر بجوار كومودينو وورد", "A bed with leaf-print bedding beside a nightstand with flowers"),
    eyebrow: L("مفروشات قطن وكتان", "Cotton and linen bedding"),
    title: L("مفارش وملايات لكل سرير", "Bedding and sheets for every bed"),
    line: L("ملايات قطن وأطقم كتان ولحف بكل المقاسات.", "Cotton sheets, linen sets and duvets in every size."),
    // Goes to `nav.0`; also the reviews wall's button.
    cta: L("تسوق المفارش", "Shop bedding"),
  },
  categories: { title: L("تسوّق حسب القسم", "Shop by section") },
  // A rail of eight of what `journey.primary` shows: a small eyebrow over the title.
  products: { primary: { eyebrow: L("وصل حديثًا", "New in"), title: L("ألوان جديدة", "New colours") } },
  // Four promises, a title of one or two words and a short line each.
  trust: [
    { title: L("قطن مصري", "Egyptian cotton"), line: L("قطن جيزة طويل التيلة", "Long-staple Giza cotton") },
    { title: L("مغسول", "Pre-washed"), line: L("أقمشة ناعمة الملمس", "Soft-finish fabrics") },
    { title: L("مقاسات واضحة", "Clear sizes"), line: L("مقاس كل طقم موضح في صفحته", "Every set's size is on its page") },
    { title: L("تواصل معنا", "Contact us"), line: L("لأي سؤال عن المقاسات أو الألوان", "With any question about sizes or colours") },
  ],
  // Optional: a wall of six short buyer quotes under a title (no names shown). Without them the home page ends on the promises.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      { quote: L("الملايات ناعمة من أول غسلة ولا تتجعد بسهولة.", "The sheets were soft from the first wash and do not crease easily.") },
      { quote: L("طقم الكتان البيج بلون هادئ وخامة جيدة.", "The beige linen set has a calm colour and good fabric.") },
      { quote: L("المقاسات مطابقة للموضح في صفحة المنتج.", "The sizes match the product page.") },
      { quote: L("البطانية الوافل خفيفة ومناسبة للصيف.", "The waffle throw is light and good for summer.") },
      { quote: L("كفر اللحاف سهل الغسيل ولونه ثابت.", "The duvet cover is easy to wash and holds its colour.") },
      { quote: L("المخدات القطيفة بألوان جميلة.", "The velvet cushions come in lovely colours.") },
    ],
  },
  // The footer's sign-up: a title and one line.
  newsletter: {
    title: L("ألوان جديدة كل موسم", "New colours every season"),
    line: L("اعرف الألوان الجديدة أولًا، مع نصائح لغسيل القطن.", "Hear about new colours first, plus cotton washing tips."),
  },
  about: {
    line: L("ملايات قطن مصري، مغسولة وناعمة.", "Egyptian cotton sheets, washed soft."),
    alt: L("بطانية تريكو في سبت خوص", "A knitted throw in a wicker basket"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("مفروشات من قطن جيزة", "Bedding in Giza cotton"),
    text: L("نختار ملايات من قطن جيزة طويل التيلة، ونعرض المقاسات والخامات لكل طقم بوضوح.", "We choose sheets in long-staple Giza cotton and show every set's sizes and materials clearly."),
    more: L("تواصل معنا لأي سؤال عن المقاسات أو الألوان.", "Contact us with any question about sizes or colours."),
    // Goes to the whole catalog.
    cta: L("تسوق المفارش", "Shop bedding"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("اسألنا عن المقاسات والألوان والخامات.", "Ask us about sizes, colours and materials."),
    heading: L("اسأل عن مقاس سريرك", "Ask about your bed size"),
  },
  faq: {
    line: L("المقاسات والغسيل والعناية.", "Sizes, washing and care."),
    question: L("كيف أغسل الملايات القطن؟", "How should I wash cotton sheets?"),
    answer: L("اغسلها بماء فاتر على دورة هادئة، وجففها في الظل للحفاظ على لونها.", "Wash in lukewarm water on a gentle cycle and dry in the shade to keep the colour."),
  },
  custom: {
    // The store's short name inside "About …" (header and about page).
    "store-short": L("مفرش", "Mafrash"),
    // The categories section's link to the whole catalog, two words.
    "shop-all": L("كل المفروشات", "All bedding"),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page (4:5).
  photos: { hero: { tall: PHOTOS.leafBedroom }, story: PHOTOS.basketThrow },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Best sellers, FAQ, Top rated) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const short = c.custom["store-short"]!;
  const aboutShort = L(`عن ${short.ar}`, `About ${short.en}`);
  const main = c.nav[0]!;
  const tiles = c.photos.tiles.length;

  const header = lib("header-announcement", {
    text: {
      "تشكيلة الموسم الجديد وصلت": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "م": initial,
      "اسم متجرك": name,
      "المتجر": main.label,
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "المدونة": L("الأسئلة", "FAQ"),
      "من نحن": L(aboutShort.ar, "About"),
    },
    links: { "/products": [main.href, BEST, undefined, main.href, BEST], "/blog": "/faq" },
  });

  const footer = lib("footer-signup", {
    text: {
      "اشترك في النشرة": c.newsletter.title,
      "منتجات جديدة وأخبار المتجر.": c.newsletter.line,
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات مختارة بمواصفات واضحة لكل يوم.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": L("الأكثر مبيعاً", "Best sellers"),
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [main.href, BEST] },
    }),
    lib("categories-captioned", {
      text: { "اكتشف الأقسام": c.categories.title, "كل الأقسام": c.custom["shop-all"]! },
      // Five across by design; a store with another number of categories gets one full row of them (phones swipe).
      ...(tiles !== 5 && { nodes: { "الأقسام": { style: { columns: tiles }, tablet: { columns: tiles } } } }),
    }),
    lib("products-rail", {
      text: { "المفضلة لدى العملاء": c.products.primary.eyebrow, "الأكثر مبيعًا": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 8 }],
    }),
    lib("features-ruled", {
      text: {
        "الشحن": c.trust[0]!.title,
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب": c.trust[0]!.line,
        "الدفع عند الاستلام": c.trust[1]!.title,
        "أو بطرق الدفع المتاحة عند الطلب": c.trust[1]!.line,
        "الاستبدال والاسترجاع": c.trust[2]!.title,
        "التفاصيل في صفحة السياسات": c.trust[2]!.line,
        "تواصل معنا": c.trust[3]!.title,
        "لأي سؤال عن طلب أو منتج": c.trust[3]!.line,
      },
    }),
    categoryCarousel(journey.rows[0] ?? 1),
    ...(reviews
      ? [
          lib("testimonials-wall", {
            text: {
              "ماذا يقولون عنا": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[1]!.quote,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[2]!.quote,
              "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": reviews.items[3]!.quote,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[4]!.quote,
              "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": reviews.items[5]!.quote,
              "كل الآراء": c.hero.cta,
            },
          }),
        ]
      : []),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutShort, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: SHOP,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutShort.ar, "About"), seo: { title: aboutShort }, sections: about },
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
  description: L("ملايات قطن مصري، مغسولة وناعمة.", "Egyptian cotton sheets, washed soft."),
  categories: [
    ["bedding", "مفارش", "Bedding", PHOTOS.unmadeLinen],
    ["throws", "بطاطين", "Throws", PHOTOS.blanketStool],
    ["cushions", "مخدات", "Cushions", PHOTOS.sofaCushions],
    ["sheets", "ملايات", "Sheets", PHOTOS.cottonSheets],
    ["duvets", "لحف وكفرات", "Duvets & covers", PHOTOS.duvetCover],
  ],
  products: [
    ["cotton-sheet-set", "sheets", "طقم ملايات قطن", "Cotton Sheet Set", PHOTOS.cottonSheets, 1450, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["waffle-knit-throw", "throws", "بطانية وافل", "Waffle Knit Throw", PHOTOS.waffleThrow, 890, { rating: 4.7, sold90: 96 }],
    ["velvet-cushion-pair", "cushions", "مخدتان من القطيفة", "Velvet Cushion Pair", PHOTOS.velvetCushions, 650, { sold90: 120 }],
    ["beige-linen-set", "bedding", "طقم كتان بيج", "Beige Linen Set", PHOTOS.beigeLinen, 1750, { sold90: 48 }],
    ["olive-linen-set", "bedding", "طقم كتان زيتي", "Olive Linen Set", PHOTOS.oliveLinen, 1750, { sold90: 31 }],
    ["grey-linen-set", "bedding", "طقم كتان رمادي", "Grey Linen Set", PHOTOS.greyLinen, 1890, { sold90: 40 }],
    ["gingham-bedding", "sheets", "طقم ملايات كاروهات", "Gingham Sheet Set", PHOTOS.gingham, 1290, { sold90: 27 }],
    ["duvet-cover", "duvets", "كفر لحاف", "Duvet Cover", PHOTOS.duvetCover, 1190, { compareAtPrice: 1390, sold90: 41 }],
    ["light-duvet", "duvets", "لحاف خفيف", "Light Duvet", PHOTOS.folded, 1690, { inStock: false, sold90: 22 }],
    ["chunky-knit-blanket", "throws", "بطانية تريكو سميكة", "Chunky Knit Blanket", PHOTOS.chunkyKnit, 1150, { isFeatured: true, sold90: 35 }],
    ["red-knit-throw", "throws", "بطانية تريكو حمراء", "Red Knit Throw", PHOTOS.redKnit, 950, { compareAtPrice: 1100, sold90: 19 }],
    ["blush-pillow", "cushions", "مخدة وردي فاتح", "Blush Pillow", PHOTOS.blushPillow, 390, { sold90: 64 }],
  ],
});

export const MAFRASH = editionTemplate({
  key: MAFRASH_KEY,
  version: 6,
  changelog: "Mafrash v5: a carousel of one category (the store's 1st) on the home",
  productPage: { thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("مفرش", "Mafrash"),
  description: L(
    "مفارش وملايات: تجربة ٣٠ ليلة، طقم السرير، قطن مصري، ألوان جديدة وشارك نومة حلوة. أربع صفحات جاهزة.",
    "Bedding and textiles: a 30-night trial, the bed set, Egyptian cotton, new colours and share a good night. Four ready pages.",
  ),
  category: "home",
  style: ["warm"],
  sortOrder: 790,
  palette: ["#fbfaf8", "#efece6", "#dbe7f5", "#4a6fa5"],
  colors: {
    primary: "#4a6fa5",
    secondary: "#efece6",
    background: "#ffffff",
    foreground: "#1f2328",
    muted: "#5b6168",
    border: "#e2ded5",
    accent: "#dbe7f5",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "nav.0",
    "hero",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "trust",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.store-short",
    "custom.shop-all",
  ],
  // Buyer quotes are demo claims: a pack writes real ones or leaves the group out (the section is then not built).
  // A rail of eight newest products; one category row, the carousel (the store's 1st category).
  optional: ["reviews"],
  journey: { primary: "newest", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
