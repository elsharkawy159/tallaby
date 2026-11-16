/**
 * Tanzim (template 68, home organisation; Claude Design "Storefront
 * Templates"): cool near-white paper, a sky blue for actions and an ice-blue
 * highlight, Alexandria throughout and 16px corners. A pantry-organising
 * shop: a place for everything, the pantry kit, quantity savings, most
 * reordered, delivery days and questions. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): jars in cupboards,
 * canisters, woven baskets on shelves and open shelf units. No people, no
 * hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Tanzim Home itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const TANZIM_KEY = "tanzim";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TANZIM_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  jarCupboard: pexels(8580727),
  canisters: pexels(8580718, 900),
  basketPair: pexels(8581052, 900),
  clipJars: pexels(8287244, 900),
  orangeLids: pexels(8289906, 900),
  cabinetJars: pexels(8580742, 900),
  linedBaskets: pexels(21550127, 900),
  cupboardBaskets: pexels(33784616, 900),
  whiteShelf: pexels(31390646, 900),
  bathShelf: pexels(31390644, 900),
  jarMix: pexels(3847450, 900),
  snackJars: pexels(9475695, 900),
  pantryNook: pexels(4112620, 900),
  basketMugs: pexels(27693159),
};

const NAME = L("تنظيم", "Tanzim");

/**
 * Tanzim Home's own content: what the look is built with when no edition is
 * applied (the template `tanzim` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن برطمان، سلة، رف…", "Search jars, baskets, shelves…") },
  // Only `nav.0.href` is read: where the hero's and the about page's buttons go (the store's main category).
  nav: [{ label: L("برطمانات", "Jars"), href: search("برطمان") }],
  hero: {
    alt: L("خزانة مطبخ بها برطمانات حبوب مرتبة", "A kitchen cupboard with neatly lined jars of grains"),
    eyebrow: L("تنظيم المطبخ", "Kitchen organising"),
    title: L("مكان لكل شيء", "A place for everything"),
    line: L("برطمانات محكمة وسلال وعلب للرفوف بمقاسات مختلفة.", "Airtight jars, baskets and shelf boxes in many sizes."),
    // Goes to `nav.0.href`; the second button is `custom.best-label` (the best sellers).
    cta: L("تسوّق البرطمانات", "Shop jars"),
  },
  categories: { title: L("ماذا تريد أن تنظّم؟", "What are you organising?") },
  // Six compact rows of what `journey.primary` shows: the title must say the same.
  products: { primary: { title: L("الأكثر طلبًا", "Most ordered") } },
  // The footer's sign-up: a title and one line.
  newsletter: {
    title: L("أفكار للتنظيم في بريدك", "Organising ideas in your inbox"),
    line: L("أفكار للتنظيم وأحدث المنتجات.", "Organising ideas and new products."),
  },
  about: {
    line: L("برطمانات وعلب ورفوف لمطبخ مرتب.", "Jars, boxes and shelves for a tidy kitchen."),
    alt: L("سلة خوص وأكواب بيضاء على رف", "A woven basket and white mugs on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("منتجات لتنظيم المطبخ", "Products for an organised kitchen"),
    text: L(
      "نختار برطمانات وسلالًا وعلبًا بمقاسات تناسب رفوف المطبخ وخزائنه.",
      "We pick jars, baskets and boxes in sizes that fit kitchen shelves and cupboards.",
    ),
    more: L("ولكل منتج مقاسات واضحة في صفحته.", "And every product page lists its sizes."),
    // Goes to `nav.0.href`.
    cta: L("تسوّق البرطمانات", "Shop jars"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("اسألنا عن أي مقاس أو منتج.", "Ask us about any size or product."),
    heading: L("عن مقاس أو طقم", "About a size or a kit"),
  },
  faq: {
    line: L("الأطقم والمقاسات والتوصيل.", "Kits, sizes and delivery."),
    question: L("كيف أختار مقاس البرطمانات؟", "How do I choose jar sizes?"),
    answer: L("السعة والأبعاد مكتوبة في صفحة كل منتج، فقِس الرف قبل الطلب.", "Capacity and dimensions are on every product page, so measure your shelf before ordering."),
  },
  custom: {
    // The label of the hero's second button (the best sellers), two words.
    "best-label": L("الأكثر طلبًا", "Most ordered"),
    // The home page's six questions, in two columns: each a short question and a one-line answer.
    "faq-1-question": L("هل البرطمانات محكمة الإغلاق؟", "Are the jars airtight?"),
    "faq-1-answer": L("نعم، في كل غطاء حلقة سيليكون تحفظ البن والسكر جافين.", "Yes, each lid has a silicone seal, so coffee and sugar stay dry."),
    "faq-2-question": L("هل البرطمانات مناسبة لغسالة الأطباق؟", "Are the jars dishwasher safe?"),
    "faq-2-answer": L("تجد تعليمات العناية في صفحة كل منتج.", "Care instructions are on every product page."),
    "faq-3-question": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
    "faq-3-answer": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
    "faq-4-question": L("من أي خامة البرطمانات؟", "What are the jars made of?"),
    "faq-4-answer": L("الخامة مكتوبة في صفحة كل منتج: زجاج أو بلاستيك آمن للطعام.", "Each product page lists the material: glass or food-safe plastic."),
    "faq-5-question": L("كيف أعرف أن السلة تناسب الرف؟", "How do I know a basket fits my shelf?"),
    "faq-5-answer": L("قِس الرف وقارنه بأبعاد السلة في صفحة المنتج.", "Measure your shelf and compare it with the basket size on its page."),
    "faq-6-question": L("ما سياسة الاسترجاع؟", "What is the return policy?"),
    "faq-6-answer": L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page (4:5).
  photos: { hero: { tall: PHOTOS.jarCupboard }, story: PHOTOS.basketMugs },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Questions), the delivery days and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const x = c.custom;
  const main = c.nav[0]!.href;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-chips", {
    text: { "م": initial, "اسم متجرك": name, "ابحث عن منتج…": c.labels.search },
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

  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات مختارة بمواصفات واضحة لكل يوم.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["best-label"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [main, BEST] },
    }),
    lib("categories-chips", { text: { "عمّ تبحث؟": c.categories.title } }),
    lib("products-rows", {
      text: { "إكسسوارات بأسعار مناسبة": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
    }),
    lib("pay-days", {
      text: {
        "القاهرة، الجيزة": L("القاهرة والجيزة", "Cairo and Giza"),
        "الإسكندرية، الدلتا، مدن القناة": L("الإسكندرية والدلتا", "Alexandria and Delta"),
        "٤–٦": L("٤–٥", "4–5"),
        "الصعيد، البحر الأحمر، سيناء": L("الصعيد وسيناء", "Upper Egypt and Sinai"),
      },
    }),
    // v5: a products grid after the delivery days, the other list of the main rows.
    ...(journey.primary === "newest"
      ? [lib("products-grid", { text: { "وصل حديثًا": L("الأكثر طلبًا", "Best sellers"), "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The store's most ordered products.") }, links: { "/products": BEST }, lists: [{ source: "best-sellers", limit: 8 }] })]
      : [lib("products-grid", { text: { "وصل حديثًا": L("وصل حديثًا", "New in") }, links: { "/products": NEW }, lists: [{ source: "newest", limit: 8 }] })]),
    lib("faq-columns", {
      as: "faq-home",
      text: {
        "أسئلة شائعة": L("أسئلة", "Questions"),
        "كيف أعرف أن طلبي وصل إليكم؟": x["faq-1-question"]!,
        "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": x["faq-1-answer"]!,
        "هل يمكنني تعديل طلبي أو إلغاؤه؟": x["faq-2-question"]!,
        "تواصل معنا في أقرب وقت لنراجع طلبك.": x["faq-2-answer"]!,
        "كم يستغرق التوصيل؟": x["faq-3-question"]!,
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": x["faq-3-answer"]!,
        "إلى أين يتوفر التوصيل؟": x["faq-4-question"]!,
        "تظهر مناطق التوصيل المتاحة عند إتمام الطلب.": x["faq-4-answer"]!,
        "ما طرق الدفع المتاحة؟": x["faq-5-question"]!,
        "تظهر طرق الدفع المتاحة عند إتمام الطلب.": x["faq-5-answer"]!,
        "ما سياسة الاسترجاع؟": x["faq-6-question"]!,
        "راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.": x["faq-6-answer"]!,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: main,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("من نحن", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("برطمانات وعلب ورفوف لمطبخ مرتب.", "Jars, boxes and shelves for a tidy kitchen."),
  categories: [
    ["jars", "برطمانات وعلب", "Jars & boxes", PHOTOS.pantryNook],
    ["baskets", "سلال", "Baskets", PHOTOS.basketPair],
    ["shelves", "رفوف", "Shelves", PHOTOS.whiteShelf],
    ["containers", "علب حفظ", "Containers", PHOTOS.orangeLids],
    ["clip-jars", "برطمانات بمشبك", "Clip-top jars", PHOTOS.clipJars],
    ["cupboard", "الخزانة", "Cupboard", PHOTOS.cabinetJars],
    ["pantry", "المؤن", "Pantry", PHOTOS.snackJars],
    ["bathroom", "الحمام", "Bathroom", PHOTOS.bathShelf],
  ],
  products: [
    ["airtight-jar-set", "jars", "٦ برطمانات بغطاء محكم", "Airtight Jar Set of 6", PHOTOS.canisters, 560, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["woven-basket-pair", "baskets", "سلتان من الخوص للرف", "Woven Shelf Basket Pair", PHOTOS.basketPair, 480, { sold90: 120 }],
    ["clip-jar-trio", "clip-jars", "٣ برطمانات بمشبك", "Clip-Top Jar Trio", PHOTOS.clipJars, 390, { sold90: 150 }],
    ["orange-lid-containers", "containers", "١٢ علبة حفظ بغطاء برتقالي", "Orange-Lid Containers, 12 pcs", PHOTOS.orangeLids, 720, { compareAtPrice: 850, sold90: 96 }],
    ["cupboard-jar-set", "cupboard", "طقم برطمانات للخزانة ١٠ قطع", "Cupboard Jar Set of 10", PHOTOS.cabinetJars, 890, { isFeatured: true, sold90: 74 }],
    ["lined-baskets", "baskets", "سلال خوص ببطانة قماش", "Cloth-Lined Wicker Baskets", PHOTOS.linedBaskets, 650, { sold90: 58 }],
    ["cupboard-basket-set", "baskets", "طقم سلال للخزانة ٤ قطع", "Cupboard Basket Set of 4", PHOTOS.cupboardBaskets, 980, { rating: 4.9, sold90: 44 }],
    ["three-tier-shelf", "shelves", "رف أبيض ٣ أدوار", "White Three-Tier Shelf", PHOTOS.whiteShelf, 1450, { sold90: 31 }],
    ["bathroom-shelf", "bathroom", "رف حمام بسلال", "Bathroom Shelf with Baskets", PHOTOS.bathShelf, 1650, { inStock: false, sold90: 19 }],
    ["glass-jar-mix", "jars", "برطمانات زجاج متنوعة", "Mixed Glass Jars", PHOTOS.jarMix, 540, { sold90: 88 }],
    ["snack-jars", "pantry", "برطمانات للوجبات الخفيفة ٤ قطع", "Snack Jars, Set of 4", PHOTOS.snackJars, 420, { compareAtPrice: 480, sold90: 102 }],
  ],
});

export const TANZIM = editionTemplate({
  key: TANZIM_KEY,
  // v5 (2026-11-16, owner): every home has at least one real products grid.
  version: 5,
  changelog: "Tanzim v5: a products grid on the home",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("تنظيم", "Tanzim"),
  description: L(
    "تنظيم البيت: الأكتر إعادة طلب ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Home organisation: most reordered and delivery days. Four ready pages.",
  ),
  category: "home",
  style: ["minimal"],
  sortOrder: 680,
  palette: ["#fafafa", "#eef0f3", "#bae6fd", "#0ea5e9"],
  colors: {
    primary: "#0ea5e9",
    secondary: "#eef0f3",
    background: "#ffffff",
    foreground: "#1c2430",
    muted: "#566070",
    border: "#dfe3e8",
    accent: "#bae6fd",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 16,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "nav.0.href",
    "hero",
    "categories.title",
    "products.primary.title",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.best-label",
    "custom.faq-1-question",
    "custom.faq-1-answer",
    "custom.faq-2-question",
    "custom.faq-2-answer",
    "custom.faq-3-question",
    "custom.faq-3-answer",
    "custom.faq-4-question",
    "custom.faq-4-answer",
    "custom.faq-5-question",
    "custom.faq-5-answer",
    "custom.faq-6-question",
    "custom.faq-6-answer",
  ],
  // Six best sellers in compact rows; no category rows.
  optional: [],
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
