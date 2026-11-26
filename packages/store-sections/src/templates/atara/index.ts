/**
 * Atara (template 73, spices and herbs; Claude Design "Storefront
 * Templates"): warm parchment paper, a burnt paprika for actions and a
 * saffron highlight, El Messiri headings over Almarai text and 10px
 * corners. A neighbourhood attar: ground on the day you order, the kitchen
 * set, the most reordered, a first-order coupon and the neighbours'
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): bowls of ground spices
 * with cinnamon, whole spices and star anise, cinnamon sticks, cloves,
 * dried thyme, grains in small bowls, herbal tea, a dried fruit counter and
 * pantry jars. No people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Attar El Hay itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const ATARA_KEY = "atara";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ATARA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  groundBowls: pexels(32281706, 900),
  groundBowlsWide: pexels(32281706),
  wholeSpices: pexels(32281630, 900),
  cinnamon: pexels(14381804, 900),
  cloves: pexels(12142752, 900),
  thyme: pexels(6103377, 900),
  grains: pexels(7420513, 900),
  herbalTea: pexels(34344554, 900),
  driedFruitWide: pexels(11135641),
  driedFruit: pexels(11135641, 900),
  pantryJars: pexels(3737639, 900),
  refillShelf: pexels(4440173, 900),
};

const NAME = L("عطار الحي", "Attar El Hay");

/**
 * Attar El Hay's own content: what the look is built with when no edition is
 * applied (the template `atara` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header bar: two short lines.
  announcement: [L("توابل وأعشاب وحبوب في مكان واحد", "Spices, herbs and grains in one place"), L("توابل صحيحة ومطحونة", "Whole and ground spices")],
  // The header's two links (one word each): the main shelf and a second one; the hero's second button goes to `nav.1`.
  nav: [
    { label: L("التوابل", "Spices"), href: SHOP },
    { label: L("الأطقم", "Sets"), href: search("طقم") },
  ],
  // The split hero: its first button goes to the whole catalog, the second (`custom.hero-cta-2`) to `nav.1`.
  hero: {
    alt: L("أطباق توابل مطحونة وعيدان قرفة", "Bowls of ground spices and cinnamon sticks"),
    eyebrow: L("توابل صحيحة ومطحونة", "Whole and ground spices"),
    title: L("توابل بنكهة أصيلة", "Spices full of flavour"),
    line: L("توابل صحيحة ومطحونة وخلطات جاهزة للمطبخ.", "Whole and ground spices and ready blends for the kitchen."),
    cta: L("تسوق التوابل", "Shop spices"),
  },
  categories: { title: L("تسوّق بالرف", "Shop by shelf") },
  // A numbered list of four of what `journey.primary` shows: an eyebrow, a title and a line.
  products: {
    primary: {
      eyebrow: L("الأكثر طلبًا", "Best sellers"),
      title: L("الأكثر طلبًا", "Most ordered"),
      line: L("التوابل الأكثر طلبًا في المتجر.", "The store's most ordered spices."),
    },
  },
  // Optional, with `custom.reviews-city-1..3`: three short buyer quotes (no names shown) under a title. Without them the home page ends on the lead text.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      { quote: L("الكمون برائحة قوية ونكهة واضحة.", "The cumin has a strong aroma and clear flavour.") },
      { quote: L("البرطمانات محكمة الغلق وتحفظ التوابل جيدًا.", "The jars close tightly and keep spices well.") },
      { quote: L("خلطة البهارات مناسبة لأطباق كثيرة.", "The spice blend suits many dishes.") },
    ],
  },
  footer: { line: L("توابل صحيحة ومطحونة وأعشاب وحبوب.", "Whole and ground spices, herbs and grains.") },
  about: {
    line: L("توابل وأعشاب وحبوب للمطبخ.", "Spices, herbs and grains for the kitchen."),
    alt: L("رفوف فواكه مجففة ومكسرات", "Shelves of dried fruit and nuts"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("توابل مختارة بعناية", "Spices chosen with care"),
    text: L("نختار التوابل والأعشاب بعناية، ونعرض الوزن والمكونات بوضوح لكل منتج.", "We choose spices and herbs with care and show the weight and ingredients of every product."),
    more: L("تواصل معنا لأي سؤال عن منتج أو كمية.", "Contact us with any question about a product or a quantity."),
    // Goes to the whole catalog.
    cta: L("تسوق التوابل", "Shop spices"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("٢٢ شارع بورسعيد، السيدة زينب.", "22 Port Said St, Sayeda Zeinab."),
    heading: L("اسأل عن خلطة أو كمية", "Ask about a blend or a quantity"),
  },
  faq: {
    line: L("التخزين والأوزان والطلب.", "Storage, weights and ordering."),
    question: L("كيف أحفظ التوابل؟", "How should I store spices?"),
    answer: L("في برطمان محكم الغلق بعيدًا عن الضوء والحرارة.", "In a closed jar away from light and heat."),
  },
  custom: {
    // The hero's second button (to `nav.1`), two words.
    "hero-cta-2": L("طقم المبتدئين", "Starter set"),
    // The small label over the categories' title, two words.
    "categories-eyebrow": L("الرفوف", "The shelves"),
    // The lead text: three short paragraphs about how the shop works.
    "lead-1": L(
      "نجمع التوابل الصحيحة والمطحونة والأعشاب في مكان واحد.",
      "We bring whole and ground spices and herbs together in one place.",
    ),
    "lead-2": L("لكل منتج وزنه ومكوناته موضحة في صفحته.", "Every product shows its weight and ingredients on its page."),
    "lead-3": L("وإذا كان لديك أي سؤال، تواصل معنا.", "And if you have any question, contact us."),
    // With `reviews`: each quote's area.
    "reviews-city-1": L("السيدة زينب", "Sayeda Zeinab"),
    "reviews-city-2": L("المنيل", "Manial"),
    "reviews-city-3": L("جاردن سيتي", "Garden City"),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page.
  photos: { hero: { tall: PHOTOS.groundBowlsWide }, story: PHOTOS.driedFruitWide },
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
 * (FAQ, Top rated, Reviews) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const x = c.custom;
  const first = c.nav[0]!;
  const second = c.nav[1]!;
  // The ruled list shows up to six categories in three columns; fewer that do not fill rows of three get two columns (or one).
  const shown = Math.min(c.photos.tiles.length, 6);
  const ruledColumns = shown % 3 === 0 ? 3 : shown % 2 === 0 ? 2 : 1;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-announcement", {
    text: {
      "تشكيلة الموسم الجديد وصلت": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "م": initial,
      "اسم متجرك": name,
      "المتجر": first.label,
      "العروض": second.label,
      "المدونة": L("الأسئلة", "FAQ"),
    },
    links: { "/products": [first.href, second.href, undefined, first.href, second.href], "/blog": "/faq" },
  });

  const footer = lib("footer-ruled", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "منتجات مختارة بعناية لكل يوم.": c.footer.line,
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const city: LookContent["custom"][string] | undefined = x["reviews-city-1"];
  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات مختارة بمواصفات واضحة لكل يوم.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["hero-cta-2"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [SHOP, second.href] },
    }),
    lib("categories-ruled", {
      text: { "الأقسام": x["categories-eyebrow"]!, "تسوق بالقسم": c.categories.title },
      // Three columns by design; a store whose categories do not fill rows of three gets the widest grid they fill (four in two columns).
      ...(ruledColumns !== 3 && { nodes: { "الأقسام": { style: { columns: ruledColumns }, tablet: { columns: Math.min(ruledColumns, 2) } } } }),
    }),
    lib("products-list", {
      text: {
        "الكتالوج": c.products.primary.eyebrow,
        "كل الإكسسوارات": c.products.primary.title,
        "كل ما تحتاجه في مكان واحد.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 4 }],
    }),
    // v7 (2026-11-25, owner): the store's 1st category as a carousel (`journey.rows`), three across: the look's packs hold three products a category (the row rule).
    lib("products-category-carousel", {
      lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 3 }],
      nodes: { "منتجات القسم": { style: { columns: 3 } } },
    }),
    lib("text-lead", {
      text: {
        "بدأنا المتجر لنجمع منتجات جيدة بسعر عادل في مكان واحد.": x["lead-1"]!,
        "نختار كل منتج بعناية، ونعرض تفاصيله ومقاساته بوضوح.": x["lead-2"]!,
        "وإذا كان لديك أي سؤال، تواصل معنا.": x["lead-3"]!,
      },
    }),
    // v6 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
    lib("products-grid", gridPatch(journey.primary)),
    ...(reviews && city
      ? [
          lib("testimonials-ruled", {
            text: {
              "آراء العملاء": L("الآراء", "Reviews"),
              "قالوا عنا": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "القاهرة": city,
              "الإسكندرية": x["reviews-city-2"]!,
              "الجيزة": x["reviews-city-3"]!,
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
  description: L("توابل صحيحة ومطحونة وأعشاب وحبوب.", "Whole and ground spices, herbs and grains."),
  categories: [
    // v7: whole spices first, so the category carousel (the 1st category) shows a full row.
    ["whole-spices", "توابل صحيحة", "Whole spices", PHOTOS.cinnamon],
    ["spices", "توابل", "Spices", PHOTOS.groundBowls],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantryJars],
    ["jars", "برطمانات", "Jars", PHOTOS.refillShelf],
    ["herbs", "أعشاب", "Herbs", PHOTOS.thyme],
    ["herbal-tea", "مشروبات أعشاب", "Herbal teas", PHOTOS.herbalTea],
    ["grains", "حبوب", "Grains", PHOTOS.grains],
    ["dried-fruit", "مجففات ومكسرات", "Dried fruit & nuts", PHOTOS.driedFruit],
  ],
  products: [
    ["spice-starter-set", "spices", "طقم توابل للمبتدئين", "Spice Starter Set", PHOTOS.wholeSpices, 210, { isFeatured: true, rating: 4.8, sold90: 180 }],
    ["rice-lentils-pasta", "pantry", "أرز وعدس ومعكرونة", "Rice, Lentils & Pasta", PHOTOS.pantryJars, 280, { isFeatured: true, sold90: 96 }],
    ["refill-jars", "jars", "برطمانات قابلة لإعادة التعبئة", "Refill Jars", PHOTOS.refillShelf, 160, { isFeatured: true, sold90: 40 }],
    ["baharat-mix", "spices", "بهارات مشكلة ٢٥٠ جم", "Baharat Mix, 250 g", PHOTOS.groundBowls, 95, { compareAtPrice: 120, sold90: 210 }],
    ["cinnamon-sticks", "whole-spices", "قرفة عيدان ١٠٠ جم", "Cinnamon Sticks, 100 g", PHOTOS.cinnamon, 60, { sold90: 150 }],
    ["whole-cloves", "whole-spices", "قرنفل صحيح ٥٠ جم", "Whole Cloves, 50 g", PHOTOS.cloves, 55, { sold90: 90 }],
    ["whole-spice-mix", "whole-spices", "توابل صحيحة مشكلة ٢٥٠ جم", "Whole Spice Mix, 250 g", PHOTOS.wholeSpices, 130, { sold90: 64 }],
    ["dried-thyme", "herbs", "زعتر مجفف ١٠٠ جم", "Dried Thyme, 100 g", PHOTOS.thyme, 45, { rating: 4.9, sold90: 120 }],
    ["grain-sampler", "grains", "حبوب مشكلة", "Grain Sampler", PHOTOS.grains, 150, { sold90: 44 }],
    ["herbal-tea", "herbal-tea", "شاي أعشاب مشكل", "Herbal Tea Mix", PHOTOS.herbalTea, 85, { sold90: 70 }],
    ["dried-fruit", "dried-fruit", "فواكه مجففة ومكسرات", "Dried Fruit & Nuts", PHOTOS.driedFruit, 240, { inStock: false, sold90: 60 }],
  ],
});

export const ATARA = editionTemplate({
  key: ATARA_KEY,
  // v5 (2026-11-16, owner): El Messiri headings replace Reem Kufi, which read oddly to shoppers.
  // v7 (2026-11-25, owner): products by category as a carousel after the best sellers.
  version: 8,
  changelog: "Atara v7: products by category as a carousel on the home",
  productPage: { thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("عطارة", "Atara"),
  description: L(
    "توابل وأعشاب: بيتطحن طازة، الأكتر إعادة طلب وآراء الجيران. أربع صفحات جاهزة.",
    "Spices and herbs: ground fresh, the most reordered and the neighbours’ reviews. Four ready pages.",
  ),
  category: "food",
  style: ["warm"],
  sortOrder: 730,
  palette: ["#fbf7ef", "#f3e6cf", "#e9b949", "#a63d10"],
  colors: {
    primary: "#a63d10",
    secondary: "#f3e6cf",
    background: "#ffffff",
    foreground: "#2a1a0e",
    muted: "#6c5642",
    border: "#e6d4b2",
    accent: "#e9b949",
  },
  fonts: { heading: "El Messiri", body: "Almarai" },
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
    "products.primary.eyebrow",
    "products.primary.title",
    "products.primary.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.hero-cta-2",
    "custom.categories-eyebrow",
    "custom.lead-1",
    "custom.lead-2",
    "custom.lead-3",
  ],
  // Buyer quotes are demo claims: a pack writes real ones (with three areas) or leaves them out (the section is then not built).
  // A numbered list of four best sellers; the category carousel shows the store's 1st category.
  optional: ["reviews", "custom.reviews-city-1", "custom.reviews-city-2", "custom.reviews-city-3"],
  journey: { primary: "best-sellers", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
