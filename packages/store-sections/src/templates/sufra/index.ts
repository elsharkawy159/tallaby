/**
 * Sufra (template 41, tableware led by delivery and payment; Claude Design
 * "Storefront Templates"): warm cream paper, a sand-gold highlight and a
 * deep green for actions, Reem Kufi headings on Almarai and 10px corners.
 * A family tableware shop (v3, section order): a feast table edge to edge,
 * the departments, the feast pick with the newest pieces, open before you
 * pay, shop by budget and delivery and payment questions. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a laid table of mixed
 * plates and bowls from above, stoneware on a wooden counter with boards,
 * painted mugs and plates, wooden boards, wooden spoons on a board, jar
 * shelves, a shelf of jars over white tiles, candles on a linen cloth,
 * striped tea towels on a stool and stacked colour plates. No people, no
 * hands and no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Sufret Teta itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const SUFRA_KEY = "sufra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SUFRA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const TABLEWARE = search("أطباق");

const PHOTOS = {
  tableFlatLay: pexels(3847465),
  counter: pexels(6213678),
  dinnerSet: pexels(6213678, 900),
  mugPair: pexels(7674564, 900),
  boards: pexels(6208155, 900),
  utensils: pexels(6692134, 900),
  pantry: pexels(4440173, 900),
  shelfJars: pexels(6654122, 900),
  linenCloth: pexels(10610004, 900),
  teaTowels: pexels(4794849, 900),
  colourPlates: pexels(8903358, 900),
};

const NAME = L("سفرة تيتا", "Sufret Teta");

/**
 * Sufret Teta's own content: what the look is built with when no edition is
 * applied (the template `sufra` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header bar: two short lines.
  announcement: [L("افتح الطلب قبل ما تدفع", "Open your order before you pay"), L("التوصيل تاني يوم في القاهرة", "Next-day delivery in Cairo")],
  // The header's two trade links, one or two words each, to catalog routes. The hero's button goes to the first.
  nav: [
    { label: L("أدوات السفرة", "Tableware"), href: TABLEWARE },
    { label: L("التحضير", "Prep"), href: search("خشب") },
  ],
  // A full-bleed hero (the copy sits on the photo; phones crop it from the centre).
  hero: {
    alt: L("سفرة متجهزة بأطباق وسلطانيات", "A laid table of plates and bowls"),
    eyebrow: L("موسم العزايم", "Feast season"),
    title: L("جهّز السفرة لـ١٢", "Set the table for twelve"),
    line: L("ستون وير بيدخل الفرن ويطلع على السفرة، وكتان بيستحمل الغسيل.", "Stoneware that goes from oven to table, and linen that survives the wash."),
    cta: L("تسوق أدوات السفرة", "Shop tableware"),
  },
  categories: { title: L("جهّز سفرتك", "Set your table") },
  // The featured block: its title and the small badge on the featured product.
  products: { primary: { title: L("طقم العزومة", "The feast set"), eyebrow: L("اختيار تيتا", "Teta’s pick") } },
  // The footer's sign-up: a title and one line.
  newsletter: { title: L("وصفات وقطع جديدة", "Recipes and new pieces"), line: L("إيميل واحد قبل كل موسم عزايم.", "One email before every feast season.") },
  about: {
    line: L("أدوات سفرة بتختارها عيلة بتعزم كل جمعة.", "Tableware chosen by a family that hosts every Friday."),
    alt: L("ستون وير وألواح خشب على رخامة المطبخ", "Stoneware and wooden boards on a kitchen counter"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("عيلة بتعزم كل جمعة", "A family that hosts every Friday"),
    text: L("بنختار الأطباق اللي بتستحمل عزومة ١٢ نفر والغسيل بعدها، والكتان اللي بيعيش سنين.", "We pick plates that survive lunch for twelve and the washing-up after, and linen that lasts for years."),
    more: L("بنوصل تاني يوم في القاهرة، وتفتح الطلب قدام المندوب قبل ما تدفع.", "We deliver next day in Cairo, and you open the order in front of the courier before you pay."),
    // Goes to the whole catalog.
    cta: L("كل المنتجات", "Shop all"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("ميدان الجامع، مصر الجديدة.", "Midan El Gamea, Heliopolis."),
    heading: L("اسأل عن طلبك أو عن قطعة", "Ask about your order or a piece"),
  },
  faq: {
    line: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
    question: L("لو طبق وصل مكسور؟", "What if a plate arrives chipped?"),
    answer: L("افتح العلبة قدام المندوب. لو فيه حاجة مكسورة رجّعها معاه وبنبدلها تاني يوم.", "Open the box in front of the courier. If anything is chipped, send it back with him and we replace it the next day."),
  },
  // hero.wide: the full-bleed hero; story: the about page (4:5).
  photos: { hero: { wide: PHOTOS.tableFlatLay }, story: PHOTOS.counter },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Shop all, New in, Top rated, Delivery and payment), the open-box and
 * budget blocks and the layout stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const first = c.nav[0]!;
  const second = c.nav[1]!;

  const header = lib("header-announcement", {
    text: {
      "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "م": initial,
      "اسم متجرك": name,
      "المتجر": L("كل المنتجات", "Shop all"),
      "العروض": first.label,
      "المدونة": second.label,
    },
    links: { "/products": [SHOP, first.href, undefined, SHOP, first.href], "/blog": second.href },
  });

  const footer = lib("footer-signup", {
    text: {
      "اشترك في النشرة": c.newsletter.title,
      "عروض ومنتجات جديدة، مرة في الأسبوع.": c.newsletter.line,
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييمًا", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-fullbleed", {
      photo: [c.photos.hero.wide],
      text: {
        "صورة الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "صُنعت لتدوم معك": c.hero.title,
        "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "شوف الجديد": L("وصل جديد", "New in"),
      },
      links: { "/products": first.href },
    }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    lib("products-feature", {
      text: { "اختيارنا ليك": c.products.primary.title, "اختيار الأسبوع": c.products.primary.eyebrow },
    }),
    lib("pay-open-box"),
    lib("finder-budget"),
    lib("faq-columns", { as: "faq-home", text: { "أسئلة شائعة": L("التوصيل والدفع", "Delivery and payment") } }),
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
      href: SHOP,
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
  description: L("أدوات سفرة للعزومات الكبيرة.", "Tableware for big family lunches."),
  categories: [
    ["tableware", "أدوات السفرة", "Tableware", PHOTOS.colourPlates],
    ["prep", "ألواح وتحضير", "Boards & prep", PHOTOS.boards],
    ["storage", "التخزين", "Storage", PHOTOS.pantry],
    ["linen", "مفارش", "Table linen", PHOTOS.linenCloth],
    ["mugs", "مجات وكوبايات", "Mugs & cups", PHOTOS.mugPair],
  ],
  products: [
    ["stoneware-dinner-set", "tableware", "طقم أطباق عشا ستون وير لـ٦", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["linen-tablecloth", "linen", "مفرش سفرة كتان", "Linen Tablecloth", PHOTOS.linenCloth, 450, { sold90: 47 }],
    ["hand-painted-mug-pair", "mugs", "كوبايتين مرسومين باليد", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { sold90: 88 }],
    ["olive-wood-board-set", "prep", "طقم ألواح خشب زيتون", "Olive Wood Board Set", PHOTOS.boards, 690, { sold90: 300 }],
    ["beech-utensil-set", "prep", "طقم معالق خشب زان", "Beech Utensil Set", PHOTOS.utensils, 340, { compareAtPrice: 420, sold90: 280 }],
    ["glass-jar-set", "storage", "٦ برطمانات إزاز", "Glass Jar Set of 6", PHOTOS.pantry, 560, { sold90: 260 }],
    ["shelf-jar-pair", "storage", "برطمانات للرف", "Shelf Jars", PHOTOS.shelfJars, 380, { sold90: 22 }],
    ["striped-tea-towels", "linen", "فوط مطبخ مقلمة", "Striped Tea Towels", PHOTOS.teaTowels, 260, { sold90: 64 }],
    ["colour-stoneware-plates", "tableware", "أطباق ستون وير ملونة", "Colour Stoneware Plates", PHOTOS.colourPlates, 1150, { sold90: 76 }],
  ],
});

export const SUFRA = editionTemplate({
  key: SUFRA_KEY,
  version: 3,
  changelog: "Sufra v3: full-bleed hero, categories, products high, section order",
  productPage: { surface: "card", thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي اللي جرّبوا السفرة", "From tables like yours"), related: L("يكمّل السفرة", "Set the rest of the table") } },
  name: L("سفرة", "Sufra"),
  description: L(
    "أدوات سفرة بتركيز على التوصيل والدفع: يوصل بكره، موسم العزايم، طقم الجمعة، حسب ميزانيتك، طرق الدفع، افتح قبل ما تدفع وطقم المطبخ. أربع صفحات جاهزة.",
    "Tableware led by delivery and payment: tomorrow delivery, feast season, the Friday set, shop by budget, ways to pay, open before you pay and a kitchen kit. Four ready pages.",
  ),
  category: "kitchen",
  style: ["classic", "warm"],
  sortOrder: 410,
  palette: ["#f8f4ec", "#ece3d2", "#f0c987", "#2f5d50"],
  colors: {
    primary: "#2f5d50",
    secondary: "#ece3d2",
    background: "#ffffff",
    foreground: "#1f2a26",
    muted: "#5d655f",
    border: "#e0d6c4",
    accent: "#f0c987",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 10,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "nav.0",
    "nav.1",
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.eyebrow",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
  ],
  // The featured block shows the store's featured products, so `primary` is not read; no category rows.
  optional: [],
  journey: { primary: "featured", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
