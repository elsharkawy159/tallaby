/**
 * Kabl (template 55, charging and cables; Claude Design "Storefront
 * Templates"): cool grey paper, navy ink, an electric blue for actions and a
 * soft yellow highlight, IBM Plex Sans Arabic throughout and 12px corners.
 * A search-led accessories shop: "what do you need to charge?", shop by
 * type, best sellers in compact rows, help choosing, where you charge most
 * (newest) and buyer reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wall chargers, power
 * banks, cables on marble and wood, a vent mount and a phone on a dashboard
 * mount. No people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Kabl Store itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";
import { templatePreview } from "../preview";

export const KABL_KEY = "kabl";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KABL_KEY, getDesign(id)!, { corners: 12, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dualCharger: pexels(4865059, 900),
  whiteCharger: pexels(35921904, 900),
  usbCharger: pexels(36012993, 900),
  slimBank: pexels(3921696, 900),
  solarBank: pexels(518530, 900),
  miniSticks: pexels(38649063, 900),
  ventMount: pexels(13536013, 900),
  dashMount: pexels(10731974, 900),
  cableC: pexels(3921711, 900),
  cableOrange: pexels(4219863, 900),
  cableWhite: pexels(914915, 900),
  flatLay: pexels(3921710),
};

const NAME = L("كابل ستور", "Kabl Store");

/**
 * Kabl Store's own content: what the look is built with when no edition is
 * applied (the template `kabl` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's delivery chip: one short line.
  announcement: [L("شواحن وكابلات لكل الأجهزة", "Chargers and cables for every device")],
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن USB-C، ٦٥ وات، شاحن سيارة…", "Search USB-C, 65W, car charger…") },
  // The header's three trade links, one or two words each. The about page's button goes to the first one.
  nav: [
    { label: L("شواحن", "Chargers"), href: search("شاحن") },
    { label: L("شواحن متنقلة", "Power banks"), href: search("باور بانك") },
    { label: L("كابلات", "Cables"), href: search("كابل") },
  ],
  // A search hero: `title` is the question over the search box, `line` its placeholder.
  hero: {
    title: L("ماذا تريد أن تشحن؟", "What do you need to charge?"),
    line: L("موديل الهاتف أو الوات أو نوع الكابل", "Phone model, watts or cable type"),
  },
  categories: { title: L("تسوّق حسب النوع", "Shop by type") },
  // Six compact rows of what `journey.primary` shows: the title must say the same.
  products: { primary: { title: L("الأكثر مبيعاً", "Best sellers") } },
  // Three contact cards (WhatsApp, phone, visit). `line` is the WhatsApp card's promise; `points.0` is where the shop is and `points.1` why to come, both on the "Visit the shop" card.
  help: {
    title: L("لست متأكدًا من المنتج المناسب؟", "Not sure which one fits?"),
    line: L("أرسل لنا موديل هاتفك لنساعدك", "Send us your phone model and we will help"),
    points: [L("وسط البلد، القاهرة", "Downtown Cairo"), L("السبت إلى الخميس، ١٠ ص – ١٠ م", "Saturday to Thursday, 10am to 10pm")],
  },
  // Four tiles of two or three words, each to a catalog route, over a row of the newest products.
  finder: {
    title: L("أين تشحن أجهزتك غالبًا؟", "Where do you charge most?"),
    line: L("اختر المكان لتجد الشاحن المناسب له.", "Pick the place to find the charger that fits."),
    options: [
      { label: L("في المنزل", "At home"), href: search("شاحن") },
      { label: L("أثناء التنقل", "On the go"), href: search("باور بانك") },
      { label: L("في السيارة", "In the car"), href: search("عربية") },
      { label: L("على المكتب", "At the desk"), href: search("كابل") },
    ],
  },
  // Optional: three buyer quotes with their names (the avatar letter is the name's first letter). Without them the home page ends on the finder.
  reviews: {
    title: L("آراء العملاء", "What buyers say"),
    items: [
      {
        quote: L("الشاحن ٦٥ وات يشحن اللابتوب والهاتف معًا.", "The 65 W charger runs my laptop and phone together."),
        name: L("ياسمين ع.", "Yasmin A."),
      },
      {
        quote: L("الكابل المضفّر متين ومناسب لهاتفي.", "The braided cable is sturdy and fits my phone."),
        name: L("حسام ر.", "Hossam R."),
      },
      {
        quote: L("الشاحن المتنقل خفيف ومناسب للسفر.", "The power bank is light and good for travel."),
        name: L("دينا م.", "Dina M."),
      },
    ],
  },
  about: {
    line: L("شواحن وكابلات بمواصفات واضحة.", "Chargers and cables with clear specs."),
    alt: L("شاحن أبيض وكابل USB-C على رخام", "A white charger and a USB-C cable on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("شواحن وكابلات مختارة بعناية", "Chargers and cables chosen with care"),
    text: L("نعرض لكل شاحن وكابل قدرته بالوات ونوع المنفذ والأجهزة التي تناسبه.", "Every charger and cable shows its watts, port type and the devices it suits."),
    more: L("تواصل معنا لأي سؤال عن التوافق.", "Contact us with any question about compatibility."),
    // Goes to the first header link (`nav.0`), so it names that category.
    cta: L("تسوق الشواحن", "Shop chargers"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("أرسل لنا موديل هاتفك لنساعدك في اختيار الشاحن المناسب.", "Send us your phone model and we will help you pick the right charger."),
    heading: L("اسأل عن شاحن أو كابل", "Ask about a charger or cable"),
  },
  faq: {
    line: L("الوات والتوافق والطلب.", "Watts, compatibility and ordering."),
    question: L("كيف أعرف أن الشاحن يناسب هاتفي؟", "How do I know a charger fits my phone?"),
    answer: L("تجد نوع المنفذ والقدرة بالوات في صفحة كل منتج، ويمكنك التواصل معنا لأي سؤال.", "The port type and watts are on every product page, and you can contact us with any question."),
  },
  // The look's only photo block is the about page's (4:5).
  photos: { story: PHOTOS.flatLay },
};

/**
 * The home's products grid (owner, 2026-11-16: every home has one): the
 * newest products, or the best sellers when the main list already shows the
 * newest, so an edition never repeats its main list.
 */
function gridPatch(primary: LookJourney["primary"]): LibraryPatch {
  return primary === "newest"
    ? {
        text: {
          "وصل حديثًا": L("الأكثر طلبًا", "Best sellers"),
          "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The store's most ordered products."),
        },
        links: { "/products": BEST },
        lists: [{ source: "best-sellers", limit: 8 }],
      }
    : {
        text: {
          "وصل حديثًا": L("وصل حديثًا", "New in"),
          "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store."),
        },
        links: { "/products": NEW },
        lists: [{ source: "newest", limit: 8 }],
      };
}

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Visit the shop, Just in) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-search", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
      "العروض": c.nav[0]!.label,
      "هدايا": c.nav[1]!.label,
      "إكسسوارات": c.nav[2]!.label,
      "صور ومواصفات لكل منتج": c.announcement[0]!,
    },
    links: { "/products": [undefined, NEW, BEST, c.nav[0]!.href, c.nav[1]!.href, c.nav[2]!.href] },
  });

  const footer = lib("footer-help", {
    text: {
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
    lib("hero-search", {
      text: {
        "عمّ تبحث اليوم؟": c.hero.title,
        "اكتب اسم المنتج": c.hero.line,
      },
    }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    // v6 (2026-11-25, owner): the store's 1st category as a carousel (`journey.rows`), right under the categories.
    lib("products-category-carousel", {
      lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 4 }],
    }),
    lib("products-rows", {
      text: { "إكسسوارات بأسعار مناسبة": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
    }),
    lib("service-support", {
      text: {
        "هل تحتاج إلى مساعدة؟": c.help.title,
        "نرد خلال أقل من ساعة": c.help.line,
        "زُر أحد فروعنا": L("زُر المتجر", "Visit the store"),
        "٣ فروع في القاهرة": c.help.points[0]!,
        "بدون موعد": c.help.points[1]!,
      },
    }),
    // v5 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
    lib("products-grid", gridPatch(journey.primary)),
    lib("finder-use", {
      text: {
        "فيمَ ستستخدمها؟": c.finder.title,
        "اختر الاستخدام، ونعرض لك المنتجات المناسبة له.": c.finder.line,
        "التنقل": c.finder.options[0]!.label,
        "الرياضة": c.finder.options[1]!.label,
        "المكالمات": c.finder.options[2]!.label,
        "العمل من المنزل": c.finder.options[3]!.label,
        "الأكثر طلبًا الآن": L("وصل حديثاً", "Just in"),
      },
      links: { "/products": [c.finder.options[0]!.href, c.finder.options[1]!.href, c.finder.options[2]!.href, c.finder.options[3]!.href] },
      lists: [{ source: "newest" }],
    }),
    ...(reviews
      ? [
          lib("testimonials-classic", {
            text: {
              "آراء العملاء": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "ن": initialOf(reviews.items[2]!.name),
              "نور ح.": reviews.items[2]!.name,
            },
          }),
        ]
      : []),
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
      href: c.nav[0]!.href,
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
  description: L("شواحن وكابلات بمواصفات واضحة.", "Chargers and cables with clear specs."),
  categories: [
    ["chargers", "شواحن", "Chargers", PHOTOS.dualCharger],
    ["power", "شواحن متنقلة", "Power banks", PHOTOS.slimBank],
    ["car", "للسيارة", "For the car", PHOTOS.dashMount],
    ["cables", "كابلات", "Cables", PHOTOS.cableOrange],
    ["kits", "أطقم", "Bundles", PHOTOS.flatLay],
  ],
  products: [
    ["dual-usb-c-charger-35w", "chargers", "شاحن USB-C مزدوج ٣٥ وات", "Dual USB-C Charger 35W", PHOTOS.dualCharger, 390, { isFeatured: true, rating: 4.8, sold90: 410 }],
    ["slim-20k-power-bank", "power", "باور بانك سليم 20K", "Slim 20K Power Bank", PHOTOS.slimBank, 1080, { sold90: 220 }],
    ["solar-power-bank", "power", "باور بانك بالطاقة الشمسية", "Solar Power Bank", PHOTOS.solarBank, 1290, { rating: 4.6, sold90: 64 }],
    ["car-mount-360", "car", "حامل عربية ٣٦٠°", "360° Car Mount", PHOTOS.dashMount, 420, { sold90: 301 }],
    ["mini-power-stick", "power", "باور ستيك ميني", "Mini Power Stick", PHOTOS.miniSticks, 480, { compareAtPrice: 560, sold90: 61 }],
    ["fast-charger-20w", "chargers", "شاحن سريع ٢٠ وات", "20W Fast Charger", PHOTOS.whiteCharger, 290, { sold90: 180 }],
    // v6: a fourth charger, so the category carousel (the 1st category) shows a full row.
    ["wall-charger-usb-c-cable", "chargers", "شاحن حائط مع كابل USB-C", "Wall Charger with USB-C Cable", PHOTOS.flatLay, 340, { sold90: 58 }],
    ["usb-a-charger", "chargers", "شاحن USB-A مع كابل", "USB-A Charger with Cable", PHOTOS.usbCharger, 220, { compareAtPrice: 260, sold90: 95 }],
    ["magnetic-vent-mount", "car", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 350, { sold90: 140 }],
    ["braided-usb-c-cable", "cables", "كابل USB-C مضفّر", "Braided USB-C Cable", PHOTOS.cableC, 260, { isFeatured: true, rating: 4.9, sold90: 260 }],
    ["usb-cable-2m", "cables", "كابل USB برتقالي ٢ متر", "2 m Orange USB Cable", PHOTOS.cableOrange, 180, { sold90: 120 }],
    ["usb-cable-1m", "cables", "كابل USB أبيض ١ متر", "1 m White USB Cable", PHOTOS.cableWhite, 120, { inStock: false, sold90: 70 }],
    ["charger-cable-bundle", "kits", "طقم شاحن وكابل", "Charger & Cable Bundle", PHOTOS.flatLay, 490, { compareAtPrice: 580, sold90: 86 }],
  ],
});

export const KABL = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(KABL_KEY, "chargers-cables", { ar: 1625, en: 1625 }),
  key: KABL_KEY,
  version: 6,
  changelog: "Kabl v6: products by category as a carousel on the home",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("كابل", "Kabl"),
  description: L(
    "شواحن وكابلات: بحث بالموديل أو الوات، الأكثر مبيعاً واختيار حسب المكان. أربع صفحات جاهزة.",
    "Chargers and cables: search by model or watts, best sellers and pick by place. Four ready pages.",
  ),
  category: "mobile-accessories",
  style: ["minimal"],
  sortOrder: 550,
  palette: ["#f6f7f9", "#e7ebf0", "#fde68a", "#2563eb"],
  colors: {
    primary: "#2563eb",
    secondary: "#e7ebf0",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#4b5563",
    border: "#d7dde5",
    accent: "#fde68a",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 12,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.search",
    "nav.0",
    "nav.1",
    "nav.2",
    "hero.title",
    "hero.line",
    "categories.title",
    "products.primary.title",
    "help.title",
    "help.line",
    "help.points.0",
    "help.points.1",
    "finder.title",
    "finder.line",
    "finder.options.0",
    "finder.options.1",
    "finder.options.2",
    "finder.options.3",
    "about",
    "contact",
    "faq",
    "photos.story",
  ],
  // Buyer quotes are demo claims: a pack writes real ones or leaves the group out (the section is then not built).
  optional: ["reviews"],
  // Six best sellers in compact rows; the category carousel shows the store's 1st category.
  journey: { primary: "best-sellers", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
