/**
 * Zahra (accessories, the fashion-jewelry niche template; one template per
 * niche, ROADMAP F-90, `docs/systems/one-template-per-niche.md`): gold-tone
 * and silver fashion jewelry at gift prices. White paper, a blush plaster
 * tint, a deep petrol ink for actions and a dusty rose; Aref Ruqaa headings
 * (the ornament in the name) over Alexandria; 14px corners. Built from
 * section library designs (`fromLibrary`).
 *
 * v3 (2026-11-11): rebuilt look-first around the pieces. Home, nine sections:
 *   1. `hero-fullbleed`              rings on blush; the page's one motion: the
 *                                    photo drifts and the copy fades on scroll
 *   2. `categories-captioned`        four portrait tiles with a count
 *   3. `products-tabs-grid`          eight best sellers on the white stage
 *   4. `about-fullbleed`             the gift-wrapping story
 *   5. `products-category-carousel`  earrings (the store's 2nd category)
 *   6. `about-product-anatomy`       one necklace with four note dots: the
 *                                    plating, the chain, the stones, care (the
 *                                    trade's own section, and the photo break)
 *   7. `products-category-carousel`  rings (the store's 4th category)
 *   8. `features-trust-band`         four promises, the fourth gift wrapping
 *   9. `newsletter-strip`            one row
 * Chrome: `header-announcement-strip` (its strip in the petrol ink) and
 * `footer-line`. Eyebrows are set in sentence case (`calm`), never capitals.
 *
 * Content: the `fashion-jewelry` pack is Zahra's own shop ("Hilya"): the
 * look's default content and demo are the pack's, so the template and the
 * niche's edition are one store. `photos.look` and `look` are the anatomy
 * photo, its four dots and its heading (one piece with notes, not shop the
 * look); the notes are `custom.anatomy-N-title` / `-line`.
 *
 * Guard: `zahra.v2.json` was captured from the v2 look before any edit, and
 * the edition-ready v2 matched it byte for byte (commit 483bfde2). v3 is the
 * deliberate redesign, so its fixture is a new capture (`zahra.v3.json`) and
 * the v2 one is deleted (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header), plus the anatomy necklace 27357178.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import { FASHION_JEWELRY } from "../editions/packs/jewelry/fashion-jewelry";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";

export const ZAHRA_KEY = "zahra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAHRA_KEY, getDesign(id)!, { corners: 14, ...patch });

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
    node.props?.role === "eyebrow" ? { ...node, style: { ...node.style, textTransform: "none", letterSpacing: "normal" } } : node,
  );

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const VIEW_ALL = L("عرض الكل", "View all");

/** Zahra's own content is the fashion-jewelry pack's shop (Hilya): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...FASHION_JEWELRY.copy,
  photos: {
    hero: FASHION_JEWELRY.photos.hero,
    story: FASHION_JEWELRY.photos.story,
    ...(FASHION_JEWELRY.photos.about && { about: FASHION_JEWELRY.photos.about }),
    ...(FASHION_JEWELRY.photos.look && { look: FASHION_JEWELRY.photos.look }),
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/** The anatomy: one piece on a 4:5 photo (phones too, so the dots stay put) with a note per dot. */
function anatomy(c: LookContent): Design {
  const notes = [1, 2, 3, 4].map((n) => ({ title: c.custom[`anatomy-${n}-title`]!, line: c.custom[`anatomy-${n}-line`]! }));
  const portrait = (node: NodeTemplate): NodeTemplate => ({
    ...node,
    style: { ...node.style, aspectRatio: "portrait" },
    breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "portrait" } },
  });
  const placed = retouch(
    lib("about-product-anatomy", {
      photo: [undefined, c.photos.look.src],
      text: {
        التفاصيل: c.look.eyebrow,
        "اللي بيفرق في كل جزء": c.look.title,
        "دوس على أي نقطة في الصورة وشوف تفاصيل الجزء ده.": c.look.text,
        "صورة المنتج": c.look.alt,
        الخامة: notes[0]!.title,
        "خامة متينة تستحمل الاستخدام اليومي.": notes[0]!.line,
        التشطيب: notes[1]!.title,
        "تشطيب نضيف في كل تفصيلة، من أول نظرة.": notes[1]!.line,
        المقاس: notes[2]!.title,
        "مقاس عملي يناسب أغلب الاستخدامات.": notes[2]!.line,
        العناية: notes[3]!.title,
        "سهل التنضيف، ويفضل زي ما هو مع الوقت.": notes[3]!.line,
      },
      nodes: { الصورة: { style: { maxWidth: "480px" } } },
    }),
    "hotspot",
    (node, index) => ({ ...node, props: { ...node.props, ...c.photos.look.dots[index] } }),
  );
  return calm(retouch(placed, "image", (node, index) => (index === 0 ? portrait(node) : node)));
}

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Shipping) and the
 * layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const shopAll = c.custom?.["shop-all"];
  const noun = c.custom?.["products-noun"];

  const header = lib("header-announcement-strip", {
    text: {
      "أهلًا بيك في متجرنا": c.announcement[0]!,
      "شحن مجاني للطلبات الكبيرة": c.announcement[1]!,
      "تفاصيل بتفرق": c.announcement[2]!,
      "اسم متجرك": name,
      المتجر: shopAll ?? L("كل القطع", "Shop all"),
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about,
      "تواصل معنا": L("تواصل", "Contact"),
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
    nodes: { "شريط الرسائل": { style: { background: "primary" } } },
  });

  const footer = lib("footer-line", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
      "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
      "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
      "من نحن": L(aboutName.ar, "About"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
  });

  const home: Design[] = [
    calm(
      lib("hero-fullbleed", {
        photo: [c.photos.hero.wide],
        text: {
          "صورة الواجهة": c.hero.alt,
          "المجموعة الجديدة": c.hero.eyebrow,
          "صُنعت لتدوم معك": c.hero.title,
          "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": c.hero.line,
          "تسوّق الآن": c.hero.cta,
          "شوف الجديد": L("الأكثر طلبًا", "Best sellers"),
        },
        links: { "/products": NEW, "/products?sort=newest": BEST },
      }),
    ),
    // One row of the first four categories, four across on desktop and tablets (the design's five leave a gap with four); phones swipe.
    retouch(
      lib("categories-captioned", {
        text: {
          "اكتشف الأقسام": c.categories.title,
          منتج: noun ?? L("قطعة", "pieces"),
        },
      }),
      "categoryList",
      (node) => ({
        ...node,
        props: { ...node.props, limit: 4 },
        style: { ...node.style, columns: 4 },
        breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 4 } },
      }),
    ),
    lib("products-tabs-grid", {
      text: { "وصل حديثاً": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    calm(
      lib("about-fullbleed", {
        photo: [undefined, undefined, c.photos.story],
        text: {
          "صورة القصة": c.story.alt,
          حكايتنا: c.story.eyebrow,
          "تفاصيل صغيرة تصنع الفرق": c.story.title,
          "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.":
            c.story.text,
          "اعرف أكثر": c.story.cta,
        },
      }),
    ),
    categoryRow(journey.rows[0]!, 1),
    anatomy(c),
    categoryRow(journey.rows[1]!, 2),
    retouch(
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
      "icon",
      // The fourth promise is gift wrapping in this trade.
      (node, index) => (index === 3 ? { ...node, props: { ...node.props, name: "gift" } } : node),
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
      href: NEW,
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

export const ZAHRA = editionTemplate({
  key: ZAHRA_KEY,
  version: 3,
  changelog: "Zahra v3: the fashion-jewelry template, rebuilt look-first",
  productPage: {
    surface: "flat",
    thumbs: "bottom",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("قالوا إيه عن القطعة دي", "What buyers say"), related: L("تتلبس معاها", "Wear it with") },
  },
  name: L("زهرة", "Zahra"),
  description: L(
    "إكسسوارات مطلية دهب وفضة: صورة كبيرة للقطع، أقسام بصور طولية، قطعة تتعرفي عليها بالنقط وصفوف منتجات على خلفية بيضا. لمحلات الإكسسوارات والهدايا.",
    "Gold-tone and silver fashion jewelry: a big photo of the pieces, portrait category tiles, one piece explained by its dots and product rows on a white stage. For accessories and gift shops.",
  ),
  category: "jewelry",
  style: ["warm"],
  sortOrder: 810,
  palette: ["#ffffff", "#f6ebe6", "#d9a5a0", "#1f4a4f"],
  colors: {
    primary: "#1f4a4f",
    secondary: "#f6ebe6",
    background: "#ffffff",
    foreground: "#1c2526",
    muted: "#5c6667",
    border: "#ead8d0",
    accent: "#d9a5a0",
  },
  fonts: { heading: "Aref Ruqaa", body: "Alexandria" },
  radius: 14,
  productStage: FASHION_JEWELRY.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "announcement.2",
    "labels.about",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story",
    "look",
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
    "photos.story",
    "photos.look.src",
    // One dot per hotspot of `about-product-anatomy`, in its notes' order.
    "photos.look.dots.0",
    "photos.look.dots.1",
    "photos.look.dots.2",
    "photos.look.dots.3",
    // The four notes the dots open.
    "custom.anatomy-1-title",
    "custom.anatomy-1-line",
    "custom.anatomy-2-title",
    "custom.anatomy-2-line",
    "custom.anatomy-3-title",
    "custom.anatomy-3-line",
    "custom.anatomy-4-title",
    "custom.anatomy-4-line",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  // `custom.shop-all`: the header's link to the whole catalog (default "كل القطع / Shop all").
  // `custom.products-noun`: the noun after a category's product count (default "قطعة / pieces").
  optional: ["photos.about", "custom.shop-all", "custom.products-noun"],
  // The eight best sellers, then the store's 2nd and 4th categories (earrings, rings) as rows.
  journey: { primary: "best-sellers", rows: [2, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: FASHION_JEWELRY.demo,
});
