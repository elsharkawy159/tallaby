/**
 * Saat (accessories, the watches niche template; one template per niche,
 * ROADMAP F-90, `docs/systems/one-template-per-niche.md`): an everyday watch
 * shop. The palette is read off a field watch: a midnight-blue dial for the
 * hero half and every action, brushed steel for the bands and rings, a
 * seconds-hand red kept for the small marks (the hero's dot, sale chips),
 * white for the product stage. Reem Kufi headings (geometric, set like the
 * indices on a dial) over Noto Sans Arabic; crisp 4px corners, the way a
 * case and its box are cut. Built from section library designs
 * (`fromLibrary`).
 *
 * v4 (2026-11-12): rebuilt look-first around the watch. Home, nine sections:
 *   1. `hero-halves`                the midnight half with the promise beside
 *                                   a steel chronograph on dark wood; the
 *                                   page's one moment is that photo growing
 *                                   slowly inside its frame as the page
 *                                   scrolls (`scrollEffect: zoom`, transform
 *                                   only, still with reduced motion)
 *   2. `categories-circles`         the categories in round bezel rings,
 *                                   four across (a swipe row on phones)
 *   3. `products-boxed`             eight best sellers, white cards on the
 *                                   steel band (the product stage)
 *   4. `about-wide`                 the editorial break: an open movement and
 *                                   the bench tools, "every watch is checked
 *                                   and set"
 *   5. `products-category-carousel` the store's 1st category (men's)
 *   6. `service-price-menu`         the trade's own section: battery, strap
 *                                   and service prices, ruled like a menu
 *   7. `products-campaign`          the store's 3rd category (smart and
 *                                   sport) beside a smartwatch photo: the
 *                                   photo-led product row
 *   8. `features-icon-cards`        four promises on steel tiles
 *   9. `newsletter-ruled`           one row between two hairlines
 * Chrome: `header-ruled` and `footer-ruled` (hairline cells, like a watch
 * box's lid and base). Eyebrows are set in sentence case, never capitals.
 *
 * v3's analogue-or-smart comparison, instalments, branches and closing quote
 * are gone: a nine-section look-first home keeps the service prices (what a
 * watch shop does that others don't) and lets the smartwatch campaign carry
 * "analogue or smart". Its six-category grid is gone too, so the watches pack
 * fits as it is (four categories of four).
 *
 * Content: the `watches` pack is Saat's own shop ("Daqiqa"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store.
 *
 * Guard: `saat.v3.json` was the v3 look (Saat Corner, converted unchanged).
 * v4 is a deliberate redesign, so its fixture is a new capture
 * (`saat.v4.json`) and the v3 one is deleted (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header): hero 190819, tiles 34069486,
 * 34833638, 13610157, 5058216, story 8327593, campaign 437037, about page
 * 8327579; products are the pack's white packshots. No people, wrists,
 * hands, logos or brand names on dials.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import {
  copyrightLine,
  editionTemplate,
  initialOf,
  primaryHref,
  type LookParts,
} from "../editions/apply";
import { WATCHES } from "../editions/packs/jewelry/watches";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";

export const SAAT_KEY = "saat";

const lib = (id: string, patch: LibraryPatch = {}): Design =>
  fromLibrary(SAAT_KEY, getDesign(id)!, { corners: 4, ...patch });

/**
 * A library design with its nodes changed in tree order (all nodes, or those
 * of one type), for what a `nodes` patch cannot reach: nodes with no layer
 * label (eyebrows, icons, the hero photo) or a list's columns. The tree keeps
 * its shape, only props and styles change.
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

/** Eyebrows in sentence case: the library sets some eyebrows in tracked capitals. */
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

/** Swaps the ink and paper colours in a subtree: the hero's main button reads white on the midnight half (the library's ink button disappears on it). */
const onPaper = (node: NodeTemplate): NodeTemplate => {
  const swap = (value: unknown) =>
    value === "foreground"
      ? "background"
      : value === "background"
        ? "foreground"
        : value;
  const style = node.style && {
    ...node.style,
    ...(node.style.color !== undefined && { color: swap(node.style.color) }),
    ...(node.style.background !== undefined && {
      background: swap(node.style.background),
    }),
  };
  return {
    ...node,
    ...(style && { style: style as NodeTemplate["style"] }),
    ...(node.children && { children: node.children.map(onPaper) }),
  };
};

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const VIEW_ALL = L("عرض الكل", "View all");

/** The four promises' icons, in the order a pack writes them: delivery, cash on delivery, warranty, exchange. */
const TRUST_ICONS: readonly ElementIconName[] = [
  "truck",
  "credit-card",
  "shield",
  "rotate",
];

/** Saat's own content is the watches pack's shop (Daqiqa): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...WATCHES.copy,
  photos: {
    hero: WATCHES.photos.hero,
    banner: WATCHES.photos.banner,
    story: WATCHES.photos.story,
    ...(WATCHES.photos.about && { about: WATCHES.photos.about }),
    ...(WATCHES.photos.custom && { custom: WATCHES.photos.custom }),
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (Best sellers, View all, Top rated) and the
 * layout stay here; what names the trade is a slot of `c`.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const main = c.nav[0]!;
  const x = c.custom;

  const header = lib("header-ruled", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      المتجر: main.label,
      العروض: c.nav[1]!.label,
    },
    links: { "/products": [main.href, c.nav[1]!.href, undefined, undefined] },
  });

  const footer = lib("footer-ruled", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "منتجات أصلية بضمان، توصلك لحد البيت.": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      العروض: L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    // Phones: the photo first and tall (4:5), the midnight half under it.
    // The page's one moment: the watch grows slowly inside its frame as the page scrolls (transform only; the photo is never hidden).
    retouch(
      retouch(
        calm(
          lib("hero-halves", {
            photo: [undefined, c.photos.hero.wide],
            text: {
              "كوليكشن الموسم": c.hero.eyebrow,
              "صوت أنقى، كل يوم": c.hero.title,
              "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
              "تسوق الآن": c.hero.cta,
              العروض: x["hero-cta-2"]!,
              "صورة الحملة": c.hero.alt,
            },
            links: { "/products": [main.href, "/contact"] },
          }),
        ),
        "linkBlock",
        // The first of the two buttons is the main one.
        (node, index) => (index === 0 ? onPaper(node) : node),
      ),
      "image",
      (node) => ({
        ...node,
        props: { ...node.props, scrollEffect: "zoom" },
        breakpointStyles: {
          ...node.breakpointStyles,
          mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "portrait" },
        },
      }),
    ),
    // Round bezel rings, four across: the library's six-column row would leave two empty places for a four-category shop.
    retouch(
      lib("categories-circles", {
        text: { "بتدوّر على إيه؟": c.categories.title, "عرض الكل": VIEW_ALL },
        nodes: { الحلقة: { style: { maxWidth: "240px" } } },
        lists: [{ limit: 4 }],
      }),
      "categoryList",
      (node) => ({
        ...node,
        style: { ...node.style, columns: 4 },
        breakpointStyles: {
          ...node.breakpointStyles,
          tablet: { ...node.breakpointStyles?.tablet, columns: 4 },
        },
      }),
    ),
    lib("products-boxed", {
      text: {
        "أساسيات كل يوم": c.products.primary.title,
        "عرض الكل": VIEW_ALL,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    lib("about-wide", {
      photo: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        c.photos.story,
      ],
      text: {
        "كل منتج بيتراجع قبل ما يوصلك": c.story.title,
        "صورة المتجر": c.story.alt,
        "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.":
          c.story.text,
        "شوف إزاي بنشتغل": c.story.cta,
      },
    }),
    lib("products-category-carousel", {
      as: "category-row-1",
      text: { "عرض الكل": VIEW_ALL },
      lists: [
        { offset: journey.rows[0]! - 1 },
        { categoryIndex: journey.rows[0]!, limit: 4 },
      ],
    }),
    // The group headings are small (sm): set in the body face, where the kufi display letters would crowd.
    retouch(
      lib("service-price-menu", {
        text: {
          "أسعار الخدمات": x["service-title"]!,
          "الأسعار شاملة قطع الغيار الأصلية والضمان.": x["service-line"]!,
          الموبايل: x["service-1-title"]!,
          "تغيير بطارية": x["service-1-1-name"]!,
          "٦٥٠ ج.م": x["service-1-1-price"]!,
          "تغيير شاشة": x["service-1-2-name"]!,
          "٢٤٠٠ ج.م": x["service-1-2-price"]!,
          "سوكت الشحن": x["service-1-3-name"]!,
          "٤٥٠ ج.م": x["service-1-3-price"]!,
          "الشاشات والبيت": x["service-2-title"]!,
          "تركيب حائط": x["service-2-1-name"]!,
          "٣٥٠ ج.م": x["service-2-1-price"]!,
          "ضبط رسيفر": x["service-2-2-name"]!,
          "١٥٠ ج.م": x["service-2-2-price"]!,
          السماعات: x["service-3-title"]!,
          "تغيير وسايد": x["service-3-1-name"]!,
          "١٢٠ ج.م": x["service-3-1-price"]!,
          "تنظيف وفحص": x["service-3-2-name"]!,
          "٨٠ ج.م": x["service-3-2-price"]!,
        },
      }),
      "heading",
      (node) =>
        node.props?.level === "h3"
          ? { ...node, style: { ...node.style, fontFamily: "body" } }
          : node,
    ),
    calm(
      lib("products-campaign", {
        as: "category-row-2",
        photo: [undefined, undefined, undefined, c.photos.banner],
        text: {
          "صورة الحملة": x["banner-alt"]!,
          "الخط الجديد": x["banner-eyebrow"]!,
          "اختارناها لك بعناية": x["banner-title"]!,
          "قطع جديدة من خطنا الجديد، معمولة عشان تعيش معاك.": x["banner-line"]!,
          "تسوّق المجموعة": x["banner-cta"]!,
        },
        links: { "/products": c.nav[1]!.href },
        lists: [
          { source: "category", categoryIndex: journey.rows[1]!, limit: 4 },
        ],
      }),
    ),
    retouch(
      calm(
        lib("features-icon-cards", {
          text: {
            "لماذا تشتري منا": L("وعدنا ليك", "Our promise"),
            "تسوّق وأنت مطمئن": L("اشتري وانت مطمن", "Buy with confidence"),
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
      ),
      "icon",
      (node, index) => ({
        ...node,
        props: { ...node.props, name: TRUST_ICONS[index] ?? node.props.name },
      }),
    ),
    lib("newsletter-ruled", {
      text: {
        "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
        "عروض للمشتركين بس، مرة في الأسبوع.": c.newsletter.line,
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
      href: main.href,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      {
        slug: "about",
        name: L("عننا", "About"),
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

export const SAAT = editionTemplate({
  key: SAAT_KEY,
  version: 4,
  changelog: "Saat v4: the watches template, rebuilt look-first",
  productPage: {
    surface: "flat",
    thumbs: "side",
    button: "outline",
    band: "paper",
    extras: ["product-perks"],
    copy: {
      reviews: L("رأي اللي لبسوها", "From people who wear it"),
      related: L("ساعات تانية هتعجبك", "More watches you may like"),
    },
  },
  name: L("ساعات", "Saat"),
  description: L(
    "ساعات: نص بلون ميناء الساعة جنب صورة ساعة، أقسام في حلقات زي الإطار، ساعات على خلفية بيضا، أسعار البطارية والأستيك والصيانة، وحملة للسمارت واتش. لمحلات الساعات العقارب والسمارت.",
    "Watches: a dial-blue half beside a watch photo, categories in bezel rings, watches on a white stage, battery, strap and service prices, and a smartwatch campaign. For analogue and smartwatch shops.",
  ),
  category: "jewelry",
  style: ["classic", "luxe"],
  sortOrder: 840,
  palette: ["#ffffff", "#e8ebef", "#c2362b", "#16264a"],
  colors: {
    primary: "#16264a",
    secondary: "#e8ebef",
    background: "#ffffff",
    foreground: "#141c2e",
    muted: "#566072",
    border: "#d6dbe2",
    accent: "#c2362b",
  },
  fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
  radius: 4,
  productStage: WATCHES.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "nav.0",
    "nav.1",
    "footer.line",
    "hero",
    "categories.title",
    "products.primary.title",
    "story.alt",
    "story.title",
    "story.text",
    "story.cta",
    "trust",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    // The hero's second button, to the contact page.
    "custom.hero-cta-2",
    // The price menu: a title and one line, then three groups (a title and rows of name and price; 3, 2 and 2 rows).
    "custom.service-title",
    "custom.service-line",
    "custom.service-1-title",
    "custom.service-1-1-name",
    "custom.service-1-1-price",
    "custom.service-1-2-name",
    "custom.service-1-2-price",
    "custom.service-1-3-name",
    "custom.service-1-3-price",
    "custom.service-2-title",
    "custom.service-2-1-name",
    "custom.service-2-1-price",
    "custom.service-2-2-name",
    "custom.service-2-2-price",
    "custom.service-3-title",
    "custom.service-3-1-name",
    "custom.service-3-1-price",
    "custom.service-3-2-name",
    "custom.service-3-2-price",
    // The campaign beside the 2nd category row, on `photos.banner`; its button goes to `nav.1`.
    "custom.banner-alt",
    "custom.banner-eyebrow",
    "custom.banner-title",
    "custom.banner-line",
    "custom.banner-cta",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // Eight best sellers, then the store's 1st category as a row and its 3rd (smart and sport) beside the campaign photo.
  journey: { primary: "best-sellers", rows: [1, 3] },
  defaultContent: DEFAULT_CONTENT,
  demo: WATCHES.demo,
});
