/**
 * Mafrash (template 79, bedding and textiles; Claude Design "Storefront
 * Templates"): warm white paper, a calm denim blue for actions and a pale sky
 * highlight, Noto Kufi Arabic throughout and 14px corners. A bedding shop
 * that lets you sleep on it first: the 30-night trial, the bed set bundle,
 * why Egyptian cotton, new colours, share a good night and reviews from
 * people who slept on it. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): made and unmade beds,
 * linen sets, folded duvets, knitted throws and cushions. No people, no
 * hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Mafrash Home itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
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
  announcement: [L("جرّب ٣٠ ليلة · استرجاع ببلاش على المفارش", "Try for 30 nights · Free returns on bedding"), L("الدفع عند الاستلام", "Cash on delivery")],
  // The header's first link, one or two words: the store's main category. The hero's button goes there too.
  nav: [{ label: L("المفارش", "Bedding"), href: search("طقم") }],
  hero: {
    alt: L("سرير بمفرش ورق شجر جنب كومودينو وورد", "A bed with leaf-print bedding beside a nightstand with flowers"),
    eyebrow: L("تجربة ٣٠ ليلة", "30-night trial"),
    title: L("نام عليها الأول", "Sleep on it first"),
    line: L("لو ما حبيتش الملايات بعد ٣٠ ليلة، بنرجّعها ببلاش.", "If you do not love the sheets after 30 nights, we collect them for free."),
    // Goes to `nav.0`; also the reviews wall's button.
    cta: L("تسوق المفارش", "Shop bedding"),
  },
  categories: { title: L("جهّز سريرك", "Make your bed") },
  // A rail of eight of what `journey.primary` shows: a small eyebrow over the title.
  products: { primary: { eyebrow: L("وصل جديد", "New in"), title: L("ألوان جديدة", "New colours") } },
  // Four promises, a title of one or two words and a short line each.
  trust: [
    { title: L("قطن مصري", "Egyptian cotton"), line: L("قطن جيزة طويل التيلة", "Long-staple Giza cotton") },
    { title: L("مغسول", "Pre-washed"), line: L("ناعم من أول ليلة", "Soft from the first night") },
    { title: L("٣٠ ليلة", "30 nights"), line: L("استرجاع ببلاش على المفارش", "Free returns on bedding") },
    { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("أو بالبطاقة والمحفظة", "Or by card and wallet") },
  ],
  // Optional: a wall of six short buyer quotes under a title (no names shown). Without them the home page ends on the promises.
  reviews: {
    title: L("ناموا عليها", "Slept on it"),
    items: [
      { quote: L("الملايات ناعمة من أول غسلة وما كرمشتش زي اللي كانت عندي.", "The sheets were soft from the first wash and do not crease like my old ones.") },
      { quote: L("تاني طقم أطلبه، المرة دي الكتان البيج.", "My second set; this time the beige linen.") },
      { quote: L("طلبت مقاس غلط، جم أخدوه وبعتولي الصح في يومين.", "I ordered the wrong size; they collected it and sent the right one in two days.") },
      { quote: L("البطانية الوافل خفيفة ومناسبة للصيف بالظبط.", "The waffle throw is light and just right for summer.") },
      { quote: L("جربتها ٣٠ ليلة وما رجعتهاش طبعاً.", "I tried them for 30 nights and of course kept them.") },
      { quote: L("ساعدوني أختار اللون اللي يمشي مع الحيطة.", "They helped me pick a colour that suits the wall.") },
    ],
  },
  // The footer's sign-up: a title and one line.
  newsletter: {
    title: L("ألوان جديدة كل موسم", "New colours every season"),
    line: L("اعرف الألوان الجديدة قبل الكل، ونصايح غسيل القطن.", "Hear about new colours first, plus cotton washing tips."),
  },
  about: {
    line: L("ملايات قطن مصري، مغسولة وناعمة.", "Egyptian cotton sheets, washed soft."),
    alt: L("بطانية تريكو في سبت خوص", "A knitted throw in a wicker basket"),
    eyebrow: L("من المحلة", "From El Mahalla"),
    title: L("قطن جيزة من المصنع لسريرك", "Giza cotton from the mill to your bed"),
    text: L("بننسج ملاياتنا من قطن جيزة طويل التيلة في المحلة، وبنغسلها قبل ما تتغلف عشان تبقى ناعمة من أول ليلة.", "We weave our sheets from long-staple Giza cotton in El Mahalla and wash them before packing, so they are soft from the first night."),
    more: L("وعندك ٣٠ ليلة تجربها قبل ما تقرر.", "And you have 30 nights to try them before you decide."),
    // Goes to the whole catalog.
    cta: L("تسوق المفارش", "Shop bedding"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("اسألنا عن المقاسات والألوان والتجربة.", "Ask us about sizes, colours and the trial."),
    heading: L("اسأل عن مقاس سريرك", "Ask about your bed size"),
  },
  faq: {
    line: L("المقاسات والغسيل وتجربة ٣٠ ليلة.", "Sizes, washing and the 30-night trial."),
    question: L("تجربة الـ٣٠ ليلة بتشتغل إزاي؟", "How does the 30-night trial work?"),
    answer: L("نام على المفارش ٣٠ ليلة، ولو ما حبيتهاش اطلب استرجاع وبنيجي ناخدها ببلاش.", "Sleep on the bedding for 30 nights; if you do not love it, request a return and we collect it free."),
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
      "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": c.announcement[0]!,
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
      "عروض ومنتجات جديدة، مرة في الأسبوع.": c.newsletter.line,
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
        "كوليكشن الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
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
      text: { "بيحبوها": c.products.primary.eyebrow, "الأكثر مبيعًا": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 8 }],
    }),
    lib("features-ruled", {
      text: {
        "توصيل سريع": c.trust[0]!.title,
        "من يوم إلى ٤ أيام لكل المحافظات": c.trust[0]!.line,
        "الدفع عند الاستلام": c.trust[1]!.title,
        "أو ادفع بالبطاقة والمحفظة": c.trust[1]!.line,
        "استرجاع سهل": c.trust[2]!.title,
        "١٤ يومًا لتغيّر رأيك": c.trust[2]!.line,
        "دعم على واتساب": c.trust[3]!.title,
        "أشخاص حقيقيون طوال الأسبوع": c.trust[3]!.line,
      },
    }),
    ...(reviews
      ? [
          lib("testimonials-wall", {
            text: {
              "ماذا يقولون عنا": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[1]!.quote,
              "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews.items[2]!.quote,
              "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": reviews.items[3]!.quote,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[4]!.quote,
              "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": reviews.items[5]!.quote,
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
    ["velvet-cushion-pair", "cushions", "مخدتين قطيفة", "Velvet Cushion Pair", PHOTOS.velvetCushions, 650, { sold90: 120 }],
    ["beige-linen-set", "bedding", "طقم كتان بيج", "Beige Linen Set", PHOTOS.beigeLinen, 1750, { sold90: 48 }],
    ["olive-linen-set", "bedding", "طقم كتان زيتي", "Olive Linen Set", PHOTOS.oliveLinen, 1750, { sold90: 31 }],
    ["grey-linen-set", "bedding", "طقم كتان رمادي", "Grey Linen Set", PHOTOS.greyLinen, 1890, { sold90: 40 }],
    ["gingham-bedding", "sheets", "طقم ملايات كاروهات", "Gingham Sheet Set", PHOTOS.gingham, 1290, { sold90: 27 }],
    ["duvet-cover", "duvets", "كفر لحاف", "Duvet Cover", PHOTOS.duvetCover, 1190, { compareAtPrice: 1390, sold90: 41 }],
    ["light-duvet", "duvets", "لحاف خفيف", "Light Duvet", PHOTOS.folded, 1690, { inStock: false, sold90: 22 }],
    ["chunky-knit-blanket", "throws", "بطانية تريكو تقيلة", "Chunky Knit Blanket", PHOTOS.chunkyKnit, 1150, { isFeatured: true, sold90: 35 }],
    ["red-knit-throw", "throws", "بطانية تريكو حمرا", "Red Knit Throw", PHOTOS.redKnit, 950, { compareAtPrice: 1100, sold90: 19 }],
    ["blush-pillow", "cushions", "مخدة بينك فاتح", "Blush Pillow", PHOTOS.blushPillow, 390, { sold90: 64 }],
  ],
});

export const MAFRASH = editionTemplate({
  key: MAFRASH_KEY,
  version: 3,
  changelog: "Mafrash v3: categories, section order",
  productPage: { thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي اللي نام عليها", "From people who slept on it"), related: L("يكمّل السرير", "Finish the bed") } },
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
  // A rail of eight newest products; no category rows.
  optional: ["reviews"],
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
