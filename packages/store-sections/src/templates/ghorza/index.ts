/**
 * Ghorza (shoes & bags, the mens-shoes niche template; one template per
 * niche, ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a men's
 * shoe shop with a shine and repair bench. White paper and a cool steel grey,
 * an espresso leather brown for actions and a pale shoe-horn steel for the
 * price tag; Noto Kufi Arabic headings (square and stamped, like the mark on
 * a heel) over Tajawal; 2px corners. Built from section library designs
 * (`fromLibrary`).
 *
 * v4 (2026-11-12): rebuilt look-first around a polished shoe. Home, nine
 * sections:
 *   1. `hero-product`                one black cap-toe shoe on a dark stage
 *                                    with a price tag over its corner, the
 *                                    copy and three facts beside it (the stage
 *                                    first on phones). The rating row is
 *                                    hidden: no invented reviews. The page's
 *                                    one motion: the shoe drifts slowly as the
 *                                    page scrolls
 *   2. `categories-captioned`        four tall tiles by type, name and count under each
 *   3. `products-grid`               eight best sellers on the white stage
 *   4. `about-list`                  the shine-bench story: oxfords on shoe
 *                                    trees in a workshop, three ticked points
 *   5. `service-cards`               the bench's prices: shine, soles and
 *                                    heels, stretching, suede care (the
 *                                    trade's own section)
 *   6. `products-category-carousel`  loafers (the store's 1st category)
 *   7. `products-spotlight`          oxfords and derbies beside a tall photo
 *                                    (the photo-led break between the rows)
 *   8. `features-trust-band`         four promises with their own icons
 *   9. `newsletter-strip`            one espresso row
 * Chrome: `header-centered` (the store name in the middle, its tagline the
 * footer line) and `footer-links`. Eyebrows are set in sentence case
 * (`calm`), never capitals.
 *
 * Content: the `mens-shoes` pack is Ghorza's own shop ("Qaleb"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store. Custom slots: `hero-cta-2`, `stats-N-*` (the hero's
 * facts), `hero-tag-*` (the price tag), `story-point-N`, `service-*` (the
 * bench), `banner-*` (the spotlight).
 *
 * Guard: `ghorza.v3.json` was captured from the v3 template (ready-to-wear
 * with a tailoring studio) before any edit. v4 is the deliberate redesign,
 * so its fixture is a new capture (`ghorza.v4.json`) and the v3 one is
 * deleted (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import { MENS_SHOES } from "../editions/packs/shoes-bags/mens-shoes";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const GHORZA_KEY = "ghorza";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GHORZA_KEY, getDesign(id)!, { corners: 2, ...patch });

/**
 * A library design with props and styles changed node by node (what a
 * `nodes` patch cannot reach: nodes with no label, or several sharing one).
 * The tree keeps its shape, so the section still stores as a library ref.
 * `index` counts the nodes of `type` (every node when undefined) in tree
 * order, per build.
 */
function retouch(design: Design, type: string | undefined, change: (node: NodeTemplate, index: number) => NodeTemplate): Design {
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const next = type === undefined || node.type === type ? change(node, index++) : node;
        return next.children ? { ...next, children: next.children.map(visit) } : next;
      };
      return visit(design.tree(t));
    },
  };
}

/** Eyebrows in sentence case: the library sets some in spaced capitals. */
const calm = (design: Design): Design =>
  retouch(design, undefined, (node) =>
    node.props?.role === "eyebrow"
      ? {
          ...node,
          style: {
            ...node.style,
            textTransform: "none",
            letterSpacing: "normal",
          },
        }
      : node,
  );

/** The icons of a design's `icon` nodes, in tree order. */
const icons = (design: Design, names: readonly string[]): Design =>
  retouch(design, "icon", (node, index) => ({
    ...node,
    props: { ...node.props, name: names[index] ?? node.props?.name },
  }));

const HIDDEN = { style: { hidden: true }, tablet: { hidden: true }, mobile: { hidden: true } } as const;

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const VIEW_ALL = L("عرض الكل", "View all");

/** Ghorza's own content is the mens-shoes pack's shop (Qaleb): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...MENS_SHOES.copy,
  photos: {
    hero: MENS_SHOES.photos.hero,
    story: MENS_SHOES.photos.story,
    banner: MENS_SHOES.photos.banner,
    ...(MENS_SHOES.photos.about && { about: MENS_SHOES.photos.about }),
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/**
 * The hero: one shoe on a dark stage with a price tag over its corner, the
 * copy and three facts beside it. The stage comes first on phones; the shoe
 * drifts with the scroll (transform only, so LCP is unaffected).
 */
function hero(c: LookContent): Design {
  const x = c.custom;
  const product = lib("hero-product", {
    photo: [undefined, undefined, undefined, c.photos.hero.tall],
    text: {
      "الأكثر مبيعًا": c.hero.eyebrow,
      "اسم المنتج المميز هنا": c.hero.title,
      "اكتب هنا ما يميز المنتج في سطرين: الخامة، والمدة، ولماذا سيحبه العميل.": c.hero.line,
      "٤٨ ساعة": x["stats-1-value"]!,
      توصيل: x["stats-1-label"]!,
      سنتين: x["stats-2-value"]!,
      ضمان: x["stats-2-label"]!,
      "١٤ يومًا": x["stats-3-value"]!,
      استرجاع: x["stats-3-label"]!,
      "اطلب الآن": c.hero.cta,
      "كل التفاصيل": x["hero-cta-2"]!,
      "صورة المنتج": c.hero.alt,
      "عرض الإطلاق": x["hero-tag-label"]!,
      "خصم ٢٠٪": x["hero-tag-price"]!,
      "لأول ١٠٠ طلب": x["hero-tag-line"]!,
    },
    links: { "/products": [SHOP, "/faq"] },
    nodes: {
      // No invented reviews: the stars and their count stay hidden.
      التقييم: HIDDEN,
      // The shoe's own black stage, and first on phones.
      المسرح: { style: { background: "black" }, mobile: { order: -1, minHeight: 0 } },
    },
  });
  return calm(retouch(product, "image", (node, index) => (index === 0 ? { ...node, props: { ...node.props, scrollEffect: "parallax" } } : node)));
}

/** The shine-bench story: a tall workshop photo (tall on phones too) beside the heading and three ticked points. */
function story(c: LookContent): Design {
  const list = lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, c.photos.story],
    text: {
      "صورة المتجر": c.story.alt,
      "مع كل طلب": c.story.eyebrow,
      "كل منتج بيتراجع قبل ما يوصلك": c.story.title,
      "فاتورة رسمية وضمان": c.custom["story-point-1"]!,
      "تغليف محمي من الصدمات": c.custom["story-point-2"]!,
      "رقم تتبع على واتساب": c.custom["story-point-3"]!,
      "اعرف أكتر": c.story.cta,
    },
  });
  return calm(
    retouch(list, "image", (node, index) =>
      index === 0
        ? {
            ...node,
            breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "portrait" } },
          }
        : node,
    ),
  );
}

/** The bench's prices: four services, each a link to the contact page. */
function bench(c: LookContent): Design {
  const s = (key: string) => c.custom[`service-${key}`]!;
  const cards = lib("service-cards", {
    text: {
      الخدمات: L("بعد ما تشتري", "After you buy"),
      "خدمات بعد البيع": s("title"),
      "عشان جهازك يفضل شغال زي الجديد.": s("line"),
      "تركيب في البيت": s("1-title"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": s("1-line"),
      "من ٢٥٠ ج.م": s("1-price"),
      "صيانة وإصلاح": s("2-title"),
      "تغيير بطارية أو شاشة في نفس اليوم.": s("2-line"),
      "من ١٥٠ ج.م": s("2-price"),
      "استبدل القديم": s("3-title"),
      "جيب جهازك القديم وخد خصم على الجديد.": s("3-line"),
      مجانًا: s("3-price"),
      "مد الضمان": s("4-title"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": s("4-line"),
      "من ١٩٩ ج.م": s("4-price"),
    },
  });
  // Shine, soles and heels, stretching, suede care; the arrows stay.
  return calm(
    retouch(cards, "icon", (node, index) =>
      index % 2 === 0 ? { ...node, props: { ...node.props, name: ["sparkles", "wrench", "plus", "shield"][index / 2] ?? node.props?.name } } : node,
    ),
  );
}

/** Oxfords and derbies (the row's place in `journey.rows[1]`) beside a tall photo: the photo-led break. */
function spotlight(c: LookContent, place: number): Design {
  const x = c.custom;
  const spot = lib("products-spotlight", {
    photo: [undefined, undefined, c.photos.banner],
    text: {
      "صورة المجموعة": x["banner-alt"]!,
      مجموعة: x["banner-eyebrow"]!,
      "مجموعة الموسم": x["banner-title"]!,
      "قطع مختارة بعناية، بخامات حلوة وتفاصيل هادية.": x["banner-line"]!,
      "تسوّق المجموعة": x["banner-cta"]!,
      "من المجموعة": L("من القسم", "From the range"),
    },
    lists: [{ source: "category", categoryIndex: place, limit: 3 }],
    // The row's small title in sentence case, like the eyebrows.
    nodes: { "عنوان الصف": { style: { textTransform: "none", letterSpacing: "normal" } } },
  });
  // On phones the photo is a short banner: the line stays off it so the copy does not cover the shoe.
  return calm(
    retouch(spot, undefined, (node) =>
      node.props?.role === "subtitle" ? { ...node, breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, hidden: true } } } : node,
    ),
  );
}

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Contact) and the
 * layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-centered", {
    text: {
      "اسم متجرك": name,
      "مختارات بعناية منذ ٢٠١٨": c.footer.line,
      المتجر: L("كل الأحذية", "All shoes"),
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("الأسئلة", "FAQ"),
      "تواصل معنا": L("تواصل", "Contact"),
    },
    links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/faq" },
  });

  const footer = lib("footer-links", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST] },
  });

  const home: Design[] = [
    hero(c),
    // Four tall tiles, one per type, four across from tablets up (two on tablets), a swipe row on phones.
    retouch(
      lib("categories-captioned", {
        text: {
          "اكتشف الأقسام": c.categories.title,
          "كل الأقسام": L("كل الأحذية", "All shoes"),
          منتج: L("جوز", "pairs"),
        },
        lists: [{ limit: 4 }],
      }),
      "categoryList",
      (node) => ({
        ...node,
        style: { ...node.style, columns: 4 },
        breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 2 } },
      }),
    ),
    lib("products-grid", {
      text: {
        "وصل حديثًا": c.products.primary.title,
        "أحدث المنتجات اللي نزلت المتجر.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 8 }],
    }),
    story(c),
    bench(c),
    categoryRow(journey.rows[0]!, 1),
    spotlight(c, journey.rows[1]!),
    icons(
      lib("features-trust-band", {
        text: {
          "توصيل سريع": c.trust[0]!.title,
          "من ٢ لـ ٤ أيام لكل المحافظات": c.trust[0]!.line,
          "الدفع عند الاستلام": c.trust[1]!.title,
          "أو ادفع بالمحافظ وإنستاباي": c.trust[1]!.line,
          "استبدال سهل": c.trust[2]!.title,
          "خلال ١٤ يوم": c.trust[2]!.line,
          "مساعدة على واتساب": c.trust[3]!.title,
          "كل يوم من ١٠ ص لـ ١٠ م": c.trust[3]!.line,
        },
      }),
      // The promises' own icons: delivery, size exchange, sizing help, pay on delivery.
      ["truck", "rotate", "chat", "credit-card"],
    ),
    // The form on one row (email, name, button) inside its white box, so the band stays one row.
    retouch(
      lib("newsletter-strip", {
        text: {
          "اعرف الجديد الأول": c.newsletter.title,
          "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": c.newsletter.line,
        },
      }),
      "storeForm",
      (node) => ({ ...node, props: { ...node.props, layout: "inline" } }),
    ),
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
      {
        slug: "about",
        name: L(aboutName.ar, "About"),
        seo: { title: aboutName },
        sections: about,
      },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, {
          title: c.contact.title,
          text: c.contact.line,
          heading: c.contact.heading,
        }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, {
          text: c.faq.line,
          question: c.faq.question,
          answer: c.faq.answer,
        }),
      },
    ],
  };
}

export const GHORZA = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(GHORZA_KEY, "mens-shoes", { ar: 2694, en: 2694 }),
  key: GHORZA_KEY,
  version: 4,
  changelog: "Ghorza v4: the men's shoes template, rebuilt look-first",
  productPage: {
    surface: "flat",
    thumbs: "side",
    button: "outline",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("رأي اللي لبسوها", "From those who wear them"), related: L("تمشي معاها", "Goes well with") },
  },
  name: L("غُرزة", "Ghorza"),
  description: L(
    "أحذية رجالي: جزمة على مسرح غامق جنب الكلام، أقسام بصور طولية، شبكة على خلفية بيضا، بنك التلميع والتصليح بأسعاره وصفوف منتجات. لمحلات الجزم الرجالي.",
    "Men's shoes: a shoe on a dark stage beside the copy, tall category photos, a white-stage grid, the shine and repair bench with its prices and product rows. For men's shoe shops.",
  ),
  category: "shoes-bags",
  style: ["classic", "luxe"],
  sortOrder: 480,
  palette: ["#ffffff", "#eceef0", "#c5d0da", "#3a2419"],
  colors: {
    primary: "#3a2419",
    secondary: "#eceef0",
    background: "#ffffff",
    foreground: "#1b1714",
    muted: "#5c6166",
    border: "#d9dde1",
    accent: "#c5d0da",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Tajawal" },
  radius: 2,
  productStage: MENS_SHOES.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "story.alt",
    "story.eyebrow",
    "story.title",
    "story.cta",
    "trust.0",
    "trust.1",
    "trust.2",
    "trust.3",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "photos.banner",
    // The hero: the second link, three facts (a short figure and a word or two), and the price tag (a small label, a price, a short line).
    "custom.hero-cta-2",
    "custom.stats-1-value",
    "custom.stats-1-label",
    "custom.stats-2-value",
    "custom.stats-2-label",
    "custom.stats-3-value",
    "custom.stats-3-label",
    "custom.hero-tag-label",
    "custom.hero-tag-price",
    "custom.hero-tag-line",
    // The story's three ticked points (one short line each).
    "custom.story-point-1",
    "custom.story-point-2",
    "custom.story-point-3",
    // The bench: a heading, a line, then four services (a title of one or two words, one line, a price).
    "custom.service-title",
    "custom.service-line",
    "custom.service-1-title",
    "custom.service-1-line",
    "custom.service-1-price",
    "custom.service-2-title",
    "custom.service-2-line",
    "custom.service-2-price",
    "custom.service-3-title",
    "custom.service-3-line",
    "custom.service-3-price",
    "custom.service-4-title",
    "custom.service-4-line",
    "custom.service-4-price",
    // The spotlight on `photos.banner` (its alt, a small label, a title, one line, the button to the whole catalog).
    "custom.banner-alt",
    "custom.banner-eyebrow",
    "custom.banner-title",
    "custom.banner-line",
    "custom.banner-cta",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // Eight best sellers, then the store's 1st category as a row (loafers) and its 2nd beside the spotlight photo (oxfords and derbies).
  journey: { primary: "best-sellers", rows: [1, 2] },
  defaultContent: DEFAULT_CONTENT,
  demo: MENS_SHOES.demo,
});
