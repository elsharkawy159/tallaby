/**
 * Alwan (fashion, the pants-jeans niche template; one template per niche,
 * ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a denim and
 * trousers shop. White paper, a deep indigo for actions and panels, a pale
 * chambray tint, and the gold of denim top-stitching as the one accent;
 * Lalezar headings (a heavy poster face, like a stamped waistband patch) over
 * IBM Plex Sans Arabic (plain and technical, for sizes in centimetres); 18px
 * corners and a 1300px container. Built from section library designs
 * (`fromLibrary`).
 *
 * v2 (2026-11-11): rebuilt look-first around denim. Home, nine sections:
 *   1. `hero-carousel`               three slides (rolled jeans in every
 *                                    wash, jeans on hangers dark to light,
 *                                    indigo folds and the hemming service);
 *                                    the page's one motion is its autoplay
 *   2. `categories-portrait-labels`  four tall tiles, one per cut
 *   3. `products-tabs-grid`          eight best sellers on the white stage
 *   4. `about-inset`                 the fabric story in an indigo panel
 *   5. `products-category-carousel`  jeans (the store's 1st category), on
 *                                    the chambray tint
 *   6. `image-text-steps`            your fit in three steps: measure, pick
 *                                    the wash and size, we hem to your
 *                                    length (the trade's own section, and
 *                                    the photo-led break)
 *   7. `products-category-carousel`  wide-leg (the store's 2nd category)
 *   8. `features-side-title`         four promises beside "Why Qassa?"
 *   9. `newsletter-strip`            one row, indigo
 * Chrome: `header-topbar` and `footer-wordmark` (the store name set huge on
 * the gold band). Eyebrows are set in sentence case (`calm`), never capitals.
 *
 * Content: the `pants-jeans` pack is Alwan's own shop ("Qassa"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store.
 *
 * Guard: `fashion-bold.v1.json` was captured from the v1 look before any
 * edit, and the edition-ready v1 matched it byte for byte (commit 526c50ea).
 * v2 is the deliberate redesign, so its fixture is a new capture
 * (`fashion-bold.v2.json`) and the v1 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import {
  copyrightLine,
  editionTemplate,
  primaryHref,
  type LookParts,
} from "../editions/apply";
import { PANTS_JEANS } from "../editions/packs/fashion/pants-jeans";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const FASHION_BOLD_KEY = "fashion-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design =>
  fromLibrary(FASHION_BOLD_KEY, getDesign(id)!, { corners: 18, ...patch });

/**
 * A library design with props and styles changed node by node (what a
 * `nodes` patch cannot reach: nodes with no label, or several sharing one).
 * The tree keeps its shape, so the section still stores as a library ref.
 * `index` counts the nodes of `type` (every node when undefined) in tree
 * order, per build.
 */
function retouch(
  design: Design,
  type: string | undefined,
  change: (node: NodeTemplate, index: number) => NodeTemplate,
): Design {
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const next =
          type === undefined || node.type === type
            ? change(node, index++)
            : node;
        return next.children
          ? { ...next, children: next.children.map(visit) }
          : next;
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

/**
 * Headings at the face's own spacing: the library tightens display headings,
 * which joins Lalezar's Latin words and crowds its Arabic.
 */
const untrack = (design: Design): Design =>
  retouch(design, "heading", (node) =>
    node.style?.letterSpacing
      ? { ...node, style: { ...node.style, letterSpacing: "normal" } }
      : node,
  );

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const VIEW_ALL = L("شوف الكل", "See all");

/** Alwan's own content is the pants-jeans pack's shop (Qassa): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...PANTS_JEANS.copy,
  photos: {
    hero: PANTS_JEANS.photos.hero,
    story: PANTS_JEANS.photos.story,
    ...(PANTS_JEANS.photos.banner && { banner: PANTS_JEANS.photos.banner }),
    ...(PANTS_JEANS.photos.custom && { custom: PANTS_JEANS.photos.custom }),
  },
};

/** One row of four of a category's products, by the category's place in the store; `tint` sets it on the chambray band. */
const categoryRow = (place: number, n: number, tint: boolean): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
    ...(tint && {
      nodes: { "منتجات قسم": { style: { background: "secondary" } } },
    }),
  });

/** The four promises' icons, in the pack's order: delivery, size exchange, sizing help, pay on delivery. */
const PROMISE_ICONS = ["truck", "rotate", "chat", "credit-card"] as const;

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Shipping) and the
 * layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const short = c.custom?.["store-short"] ?? name;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  const shopAll = c.custom?.["shop-all"];
  const s = (n: 2 | 3, part: string) => c.custom[`slide-${n}-${part}`]!;
  const fit = (n: 1 | 2 | 3, part: string) => c.custom[`fit-${n}-${part}`]!;

  const header = lib("header-topbar", {
    text: {
      "توصيل سريع لكل محافظات مصر": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
      "اسم متجرك": name,
      المتجر: shopAll ?? L("كل القطع", "Shop all"),
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about,
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
  });

  // The store name set huge on the gold band, over the shop and help columns and the demo contact.
  const footer = lib("footer-wordmark", {
    text: {
      "اسم متجرك": name,
      "٠١٠٠ ١٢٣ ٤٥٦٧": c.custom["contact-phone"]!,
      "‏hello@store.com": c.custom["contact-email"]!,
      العروض: L("الأعلى تقييمًا", "Top rated"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    calm(
      lib("hero-carousel", {
        photo: [
          c.photos.hero.wide,
          c.photos.custom["slide-2"]!,
          c.photos.banner,
        ],
        text: {
          "صورة الحملة الأولى": c.hero.alt,
          "وصل حديثًا": c.hero.eyebrow,
          "الموسم الجديد وصل": c.hero.title,
          "قطع مختارة بعناية، وتوصيل لحد باب البيت.": c.hero.line,
          "تسوّق الجديد": c.hero.cta,
          "صورة الحملة الثانية": s(2, "alt"),
          "الأكثر مبيعًا": s(2, "eyebrow"),
          "المفضّلة عند عملائنا": s(2, "title"),
          "القطع اللي بترجع لها كل مرة.": s(2, "line"),
          "شوف الأكثر مبيعًا": s(2, "cta"),
          "صورة الحملة الثالثة": s(3, "alt"),
          "عروض الأسبوع": s(3, "eyebrow"),
          "خصومات لفترة محدودة": s(3, "title"),
          "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": s(3, "line"),
          "تسوّق العروض": s(3, "cta"),
        },
        links: { "/products": [SHOP, BEST, NEW] },
      }),
    ),
    lib("categories-portrait-labels", {
      text: {
        المجموعات: c.categories.title,
        "تسوّق الآن": L("تسوّق القسم", "Shop this cut"),
      },
    }),
    // The first chip is the lit one: with best sellers in the grid, it names them (the design lists "New in" first).
    lib("products-tabs-grid", {
      text: {
        "وصل حديثاً": c.products.primary.title,
        ...(journey.primary === "best-sellers" && {
          الجديد: L("الأكثر طلبًا", "Best sellers"),
          "الأكثر مبيعاً": L("وصل حديثًا", "New in"),
        }),
      },
      links: {
        "/products": primaryHref(journey.primary),
        ...(journey.primary === "best-sellers" && {
          "/products?sort=newest": BEST,
          "/products?sort=popularity": NEW,
        }),
      },
      lists: [{ source: journey.primary }],
    }),
    retouch(
      calm(
        lib("about-inset", {
          photo: [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            c.photos.story,
          ],
          text: {
            "إزاي بنشتغل": c.story.eyebrow,
            "كل منتج بيتراجع قبل ما يوصلك": c.story.title,
            "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": c.story.text,
            "اعرف أكتر": c.story.cta,
            "صورة المتجر": c.story.alt,
          },
          links: { "/about": NEW },
        }),
      ),
      undefined,
      // The button in gold with ink text: the library's ink pill hardly shows on the indigo panel.
      (node) =>
        node.props?.role === "cta" && node.style?.background === "foreground"
          ? { ...node, style: { ...node.style, background: "accent", color: "foreground" } }
          : node.style?.color === "background"
            ? { ...node, style: { ...node.style, color: "foreground" } }
            : node,
    ),
    categoryRow(journey.rows[0]!, 1, true),
    // The trade's own section: how to get the right pair, measure, pick, hem.
    calm(
      lib("image-text-steps", {
        photo: [
          undefined,
          undefined,
          undefined,
          undefined,
          c.photos.custom["fit-1"]!,
          c.photos.custom["fit-2"]!,
          c.photos.custom["fit-3"]!,
        ],
        text: {
          "إزاي بنشتغل": c.custom["fit-eyebrow"]!,
          "من الخامة لحد بابك": c.custom["fit-title"]!,
          "نختار الخامة": fit(1, "title"),
          "نجرّب كل خامة بنفسنا قبل ما تدخل المتجر.": fit(1, "line"),
          "خامات مختارة": fit(1, "alt"),
          "نجهّز طلبك بعناية": fit(2, "title"),
          "كل طلب بيتراجع ويتغلّف كويس عشان يوصل سليم.": fit(2, "line"),
          "طلب متغلّف": fit(2, "alt"),
          "يوصلك لحد الباب": fit(3, "title"),
          "توصيل لكل المحافظات، وتدفع عند الاستلام لو تحب.": fit(3, "line"),
          "طلب جاهز للتوصيل": fit(3, "alt"),
        },
      }),
    ),
    categoryRow(journey.rows[1]!, 2, false),
    retouch(
      lib("features-side-title", {
        text: {
          "ليه الناس بترجع لنا تاني": L(`ليه ${short.ar}؟`, `Why ${short.en}?`),
          "أربع حاجات بنلتزم بيها في كل طلب.": c.custom["promises-line"]!,
          "توصيل سريع": c.trust[0]!.title,
          "من يوم إلى ٤ أيام لكل المحافظات": c.trust[0]!.line,
          "الدفع عند الاستلام": c.trust[1]!.title,
          "أو ادفع بالبطاقة والمحفظة": c.trust[1]!.line,
          "استرجاع سهل": c.trust[2]!.title,
          "١٤ يومًا لتغيّر رأيك": c.trust[2]!.line,
          "دعم على واتساب": c.trust[3]!.title,
          "أشخاص حقيقيون طوال الأسبوع": c.trust[3]!.line,
        },
        nodes: { المميزات: { style: { background: "secondary" } } },
      }),
      "icon",
      (node, index) => ({
        ...node,
        props: {
          ...node.props,
          name: PROMISE_ICONS[index] ?? node.props?.name,
        },
      }),
    ),
    lib("newsletter-strip", {
      text: {
        "اعرف الجديد الأول": c.newsletter.title,
        "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": c.newsletter.line,
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
      href: SHOP,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      {
        slug: "home",
        name: L("الرئيسية", "Home"),
        sections: home.map(untrack),
      },
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

export const FASHION_BOLD = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(FASHION_BOLD_KEY, "pants-jeans", { ar: 2812, en: 2812 }),
  key: FASHION_BOLD_KEY,
  version: 2,
  changelog:
    "Alwan v2: the pants and jeans template, rebuilt look-first around denim",
  name: L("ألوان", "Alwan"),
  description: L(
    "جينز وبناطيل: سلايدر بثلاث صور دنيم، أقسام بصور طولية لكل قَصّة، مقاسك في تلات خطوات وصفوف منتجات على خلفية بيضا. لمحلات الجينز والبناطيل.",
    "Jeans and trousers: a three-slide denim hero, tall photo tiles for each cut, your fit in three steps and product rows on a white stage. For jeans and trouser shops.",
  ),
  category: "fashion",
  style: ["bold"],
  sortOrder: 1240,
  palette: ["#ffffff", "#e8edf6", "#1e2b5f", "#d9a441"],
  colors: {
    primary: "#1e2b5f",
    secondary: "#e8edf6",
    background: "#ffffff",
    foreground: "#141a33",
    muted: "#555c76",
    border: "#d6dceb",
    accent: "#d9a441",
  },
  fonts: { heading: "Lalezar", body: "IBM Plex Sans Arabic" },
  radius: 18,
  containerMaxWidth: 1300,
  productStage: PANTS_JEANS.productStage,
  productPage: {
    thumbs: "side",
    band: "brand",
    extras: ["product-perks"],
    copy: PANTS_JEANS.productPage?.copy ?? {
      reviews: L("آراء اللي لبسوه", "From people who wear it"),
      related: L("بناطيل ممكن تعجبك", "Trousers you may like"),
    },
  },
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "labels.about",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story",
    "trust.0",
    "trust.1",
    "trust.2",
    "trust.3",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    // The hero's second and third slides (the first is `hero`; the third's photo is `photos.banner`).
    "custom.slide-2-alt",
    "custom.slide-2-eyebrow",
    "custom.slide-2-title",
    "custom.slide-2-line",
    "custom.slide-2-cta",
    "custom.slide-3-alt",
    "custom.slide-3-eyebrow",
    "custom.slide-3-title",
    "custom.slide-3-line",
    "custom.slide-3-cta",
    "photos.custom.slide-2",
    // The fit steps: a heading, then three steps (title, one line, the photo's alt) with a square photo each.
    "custom.fit-eyebrow",
    "custom.fit-title",
    "custom.fit-1-title",
    "custom.fit-1-line",
    "custom.fit-1-alt",
    "custom.fit-2-title",
    "custom.fit-2-line",
    "custom.fit-2-alt",
    "custom.fit-3-title",
    "custom.fit-3-line",
    "custom.fit-3-alt",
    "photos.custom.fit-1",
    "photos.custom.fit-2",
    "photos.custom.fit-3",
    // The line under "Why <store>?" beside the promises.
    "custom.promises-line",
    // The footer's demo contact, phone and email.
    "custom.contact-phone",
    "custom.contact-email",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  // `custom.shop-all`: the link to the whole catalog (default "كل القطع / Shop all").
  // `custom.store-short`: the store's short name inside a sentence ("Why Qassa?", "About Qassa").
  optional: ["photos.about", "custom.shop-all", "custom.store-short"],
  // The eight best sellers, then the store's 1st and 2nd categories (jeans, wide-leg) as rows.
  journey: { primary: "best-sellers", rows: [1, 2] },
  defaultContent: DEFAULT_CONTENT,
  demo: PANTS_JEANS.demo,
});
