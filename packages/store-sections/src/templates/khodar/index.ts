/**
 * Khodar (template 70, fresh produce; Claude Design "Storefront
 * Templates"): white paper, a market green for actions and a sunny yellow
 * highlight, Tajawal throughout and soft 16px corners. A same-day produce
 * shop: a search hero, the aisles, the most ordered, the 3 pm cut-off
 * promise and a regular's word. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): a market of vegetable
 * baskets, a fruit and veg tote, fresh herbs, a juicer with oranges,
 * tomatoes, mangoes, oranges, bananas, potatoes, aubergines and lemons. No
 * people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Khodar Express itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const KHODAR_KEY = "khodar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KHODAR_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  market: pexels(37321079, 900),
  marketWide: pexels(37321079),
  tote: pexels(16999667, 900),
  herbs: pexels(4113927, 900),
  juicer: pexels(14510445, 900),
  tomatoes: pexels(29479888, 900),
  mango: pexels(30620864, 900),
  oranges: pexels(8639570, 900),
  bananas: pexels(31558745, 900),
  potatoes: pexels(36400786, 900),
  aubergines: pexels(39206252, 900),
  lemons: pexels(31428126, 900),
};

const NAME = L("خضار إكسبريس", "Khodar Express");

/**
 * Khodar Express's own content: what the look is built with when no edition
 * is applied (the template `khodar` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's delivery chip: one short line.
  announcement: [L("خضار وفاكهة وورقيات", "Fruit, veg and greens")],
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن طماطم، مانجو، ورقيات…", "Search tomatoes, mango, greens…") },
  // Four header links (one or two words each) to catalog routes; the about page's button goes to `nav.2`.
  nav: [
    { label: L("خضار وفاكهة", "Fruit & veg"), href: search("خضار") },
    { label: L("ورقيات", "Greens"), href: search("ورقيات") },
    { label: L("صناديق", "Boxes"), href: search("بوكس") },
    { label: L("عصائر", "Juicing"), href: search("عصير") },
  ],
  // A search hero: `title` is the question over the search box, `line` its placeholder.
  hero: { title: L("ماذا تحتاج اليوم؟", "What do you need today?"), line: L("طماطم، مانجو، ورقيات", "Tomatoes, mango, greens") },
  categories: { title: L("تسوّق حسب القسم", "Shop by section") },
  // Six compact rows of what `journey.primary` shows: the title must say the same.
  products: { primary: { title: L("الأكثر طلبًا", "Most ordered") } },
  // Optional, with `custom.reviews-city`: one buyer quote under a title, its name and city. Without them the home page ends on the delivery promise.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      {
        quote: L(
          "«الخضار طازج والمانجو ناضجة كما توقعت.»",
          "«The veg was fresh and the mangoes were as ripe as I hoped.»",
        ),
        name: L("سارة ح.", "Sara H."),
      },
    ],
  },
  about: {
    line: L("خضار وفاكهة طازجة.", "Fresh fruit and veg."),
    alt: L("سلال خضار في السوق", "Baskets of vegetables at the market"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("خضار وفاكهة مختارة بعناية", "Fruit and veg chosen with care"),
    text: L("نفرز الخضار والفاكهة بعناية، ونعرض الوزن والنوع لكل منتج بوضوح.", "We sort fruit and veg with care and show every product's weight and variety clearly."),
    more: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
    // Goes to `nav.2`.
    cta: L("تسوّق الصناديق", "Shop boxes"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("يوميًا من ٨ ص حتى ١٠ م.", "Every day, 8 am to 10 pm."),
    heading: L("اسأل عن طلب أو صندوق", "Ask about an order or a box"),
  },
  faq: {
    line: L("الطلب والصناديق والشحن.", "Ordering, boxes and shipping."),
    question: L("كيف أحفظ الخضار والفاكهة؟", "How should I store fruit and veg?"),
    answer: L("احفظ الورقيات في الثلاجة، والطماطم والموز في مكان بارد بعيدًا عن الشمس.", "Keep greens in the fridge, and tomatoes and bananas somewhere cool, out of the sun."),
  },
  custom: {
    // The header's link to the best sellers, two words.
    "best-label": L("الأكثر طلبًا", "Most ordered"),
    // The delivery promise: a title, then three steps, each a time (or a day) and a short label.
    "promise-title": L("اطلب قبل ٣ عصرًا", "Order by 3 pm"),
    "promise-time-1": L("٣:٠٠ م", "3:00 pm"),
    "promise-step-1": L("آخر موعد للطلب", "Order cut-off"),
    "promise-time-2": L("٥:٠٠ م", "5:00 pm"),
    "promise-step-2": L("يُغلّف مبردًا", "Packed cold"),
    "promise-time-3": L("٨:٠٠ م", "8:00 pm"),
    "promise-step-3": L("يصلك", "Delivered"),
    // With `reviews`: the quote's city.
    "reviews-city": L("المعادي", "Maadi"),
  },
  // The about page's photo (4:5).
  photos: { story: PHOTOS.marketWide },
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
 * (Top rated) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const x = c.custom;
  const nav = c.nav;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-search", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
      "وصل حديثًا": nav[0]!.label,
      "الأكثر مبيعًا": x["best-label"]!,
      "العروض": nav[1]!.label,
      "هدايا": nav[2]!.label,
      "إكسسوارات": nav[3]!.label,
      "صور ومواصفات لكل منتج": c.announcement[0]!,
    },
    links: { "/products": [undefined, nav[0]!.href, BEST, nav[1]!.href, nav[2]!.href, nav[3]!.href] },
  });

  const footer = lib("footer-help", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED], "/contact": "/profile/orders" },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const city: LookContent["custom"][string] | undefined = x["reviews-city"];
  const home: Design[] = [
    lib("hero-search", {
      text: {
        "عمّ تبحث اليوم؟": c.hero.title,
        "اكتب اسم المنتج": c.hero.line,
      },
    }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    // v6 (2026-11-25, owner): the store's 1st category as a carousel (`journey.rows`), right under the categories, three across: the look's packs hold three products a category (the row rule).
    lib("products-category-carousel", {
      lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 6 }],
      nodes: { "منتجات القسم": { style: { columns: 3 } } },
    }),
    lib("products-rows", {
      text: { "إكسسوارات بأسعار مناسبة": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
    }),
    lib("pay-promise", {
      text: {
        "اطلب قبل ٢ ظهرًا ليصلك غدًا": x["promise-title"]!,
        "٢:٠٠ م": x["promise-time-1"]!,
        "تطلب اليوم": x["promise-step-1"]!,
        "٦:٠٠ م": x["promise-time-2"]!,
        "يُشحن": x["promise-step-2"]!,
        "غدًا": x["promise-time-3"]!,
        "يصلك": x["promise-step-3"]!,
      },
    }),
    // v5 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
    lib("products-grid", gridPatch(journey.primary)),
    ...(reviews && city
      ? [
          lib("testimonials-quote", {
            text: {
              "آراء العملاء": reviews.title,
              "«من أفضل تجارب الشراء عبر الإنترنت. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": reviews.items[0]!.quote,
              "مريم أ.": reviews.items[0]!.name,
              "القاهرة": city,
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
      href: nav[2]!.href,
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
  description: L("خضار وفاكهة وورقيات طازجة.", "Fresh fruit, veg and greens."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.tomatoes],
    ["greens", "ورقيات", "Greens", PHOTOS.herbs],
    ["boxes", "صناديق", "Boxes", PHOTOS.market],
    ["citrus", "موالح", "Citrus", PHOTOS.oranges],
    ["juice", "عصائر", "Juice", PHOTOS.juicer],
  ],
  products: [
    ["weekly-veg-box", "boxes", "بوكس خضار الأسبوع", "Weekly Veg Box", PHOTOS.market, 260, { isFeatured: true, rating: 4.8, sold90: 320 }],
    ["fruit-veg-basket", "boxes", "سلة خضار وفاكهة", "Fruit & Veg Basket", PHOTOS.tote, 320, { sold90: 144 }],
    ["greens-bundle", "greens", "باقة ورقيات", "Greens Bundle", PHOTOS.herbs, 140, { sold90: 96 }],
    ["juice-box", "juice", "بوكس العصير", "Juice Box", PHOTOS.juicer, 290, { compareAtPrice: 340, sold90: 41 }],
    ["tomatoes-1kg", "produce", "طماطم بلدي ١ كيلو", "Local Tomatoes, 1 kg", PHOTOS.tomatoes, 25, { sold90: 410 }],
    ["mango-1kg", "produce", "مانجو عويس ١ كيلو", "Awees Mango, 1 kg", PHOTOS.mango, 70, { rating: 4.9, sold90: 230 }],
    ["oranges-3kg", "citrus", "برتقال أبو سُرة ٣ كيلو", "Navel Oranges, 3 kg", PHOTOS.oranges, 60, { sold90: 180 }],
    ["bananas-1kg", "produce", "موز ١ كيلو", "Bananas, 1 kg", PHOTOS.bananas, 35, { sold90: 260 }],
    ["potatoes-2kg", "produce", "بطاطس ٢ كيلو", "Potatoes, 2 kg", PHOTOS.potatoes, 40, { sold90: 200 }],
    ["aubergines-peppers", "produce", "باذنجان وفلفل رومي", "Aubergines & Peppers", PHOTOS.aubergines, 45, { inStock: false, sold90: 70 }],
    ["lemons-1kg", "produce", "ليمون بلدي ١ كيلو", "Local Lemons, 1 kg", PHOTOS.lemons, 30, { compareAtPrice: 40, sold90: 150 }],
  ],
});

export const KHODAR = editionTemplate({
  key: KHODAR_KEY,
  version: 7,
  changelog: "Khodar v6: products by category as a carousel on the home",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("خضار", "Khodar"),
  description: L(
    "خضار وفاكهة طازة: هدف التوصيل المجاني، بحث سريع، بوكس الأسبوع، آخر ميعاد ٣ العصر وتتبع الطلب. أربع صفحات جاهزة.",
    "Fresh produce: free-delivery goal, quick search, the weekly box, a 3 pm cut-off and order tracking. Four ready pages.",
  ),
  category: "food",
  style: ["minimal"],
  sortOrder: 700,
  palette: ["#ffffff", "#eef7ec", "#ffd43b", "#16803c"],
  colors: {
    primary: "#16803c",
    secondary: "#eef7ec",
    background: "#ffffff",
    foreground: "#13261a",
    muted: "#4c5e51",
    border: "#dcebd8",
    accent: "#ffd43b",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 16,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.search",
    "nav.0",
    "nav.1",
    "nav.2",
    "nav.3",
    "hero.title",
    "hero.line",
    "categories.title",
    "products.primary.title",
    "about",
    "contact",
    "faq",
    "photos.story",
    "custom.best-label",
    "custom.promise-title",
    "custom.promise-time-1",
    "custom.promise-step-1",
    "custom.promise-time-2",
    "custom.promise-step-2",
    "custom.promise-time-3",
    "custom.promise-step-3",
  ],
  // A buyer quote is a demo claim: a pack writes a real one (with its city) or leaves it out (the section is then not built).
  // Six best sellers in compact rows; the category carousel shows the store's 1st category.
  optional: ["reviews", "custom.reviews-city"],
  journey: { primary: "best-sellers", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
