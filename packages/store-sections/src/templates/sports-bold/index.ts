/**
 * Nabd (shoes & bags, the sneakers niche template; one template per niche,
 * ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a street sneaker
 * shop that sells by the pair and the spec. White paper and a cool concrete
 * grey, an infrared red for actions and the size tile (the colour of a
 * running track and a retro runner's heel tab), deep navy ink and a pale
 * periwinkle for the spec dots; Alexandria headings (wide and geometric, like
 * the lettering on a shoebox) over Noto Sans Arabic; 10px corners. Built from
 * section library designs (`fromLibrary`).
 *
 * v2 (2026-11-12): rebuilt look-first around the pair. It was v1, a sports
 * and fitness gear shop (match-day carousel, big-type categories). Home, nine
 * sections:
 *   1. `hero-bento`                  the message on a concrete tile, the pair
 *                                    itself large in a square tile (white
 *                                    canvas low-tops, the laces up close),
 *                                    the newest featured pair with its price,
 *                                    and the size range 36–45 on an infrared
 *                                    tile (the bento's rating tile, its stars
 *                                    hidden: no invented reviews). The page's
 *                                    one motion: the copy fades out as the
 *                                    page scrolls on (`fade-exit`)
 *   2. `categories-circles`          four styles in large rings, a swipe row on phones
 *   3. `products-tabbed`             the eight newest pairs on the white stage,
 *                                    with New in, Best sellers and Top rated as links
 *   4. `finder-versus`               head to head: a runner against an everyday
 *                                    white, four spec rows with a dot on the
 *                                    better side (the trade's own section:
 *                                    sneakers are bought by comparing; not
 *                                    ghorza's bench, kasr's size guide,
 *                                    tasfya's "where will you wear them?" or
 *                                    shanta's anatomy)
 *   5. `products-panel-rail`         high-tops beside an infrared panel (a category row)
 *   6. `about-overlap`               "Not every pair makes the shelf": the
 *                                    shop wall on a wide photo with the card
 *                                    over its corner (the photo-led break
 *                                    between the rows)
 *   7. `products-category-carousel`  slip-ons and canvas
 *   8. `features-columns`            three promises under their own heading
 *   9. `newsletter-interests`        what the letters cover, the form on one row
 * Chrome: `header-inline` (the high-tops link from the pack's `nav`) and
 * `footer-wordmark` (the store's name across the foot). Eyebrows are set in
 * sentence case (`calm`), never capitals.
 *
 * Content: the `sneakers` pack is Nabd's own shop ("Raseef"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store. Custom slots: `hero-sticker-2` and
 * `hero-sizes-line` (the size tile), `versus-*` (the head to head),
 * `panel-*` (the high-tops panel), `banner-alt`, `trust-title`,
 * `trust-line`, `newsletter-interest-N`, `shop-all`, `contact-phone`,
 * `contact-email`.
 *
 * Category moves from sports to shoes-bags: the sports wave picks other
 * templates (`one-template-per-niche.md` §2).
 *
 * Guard: `sports-bold.v1.json` was the v1 capture (the edition-ready sports
 * shop, commit 6ef6ad63). v2 is the deliberate redesign, so its fixture is a
 * new capture (`sports-bold.v2.json`) and the v1 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's, no new Pexels photo (see its header). Hero tile 4296075
 * (the white canvas pair on red, orange and green paper, looked at again at
 * 3648px: only the zigzag stitching and two coloured windows in the sole's
 * heel, no lettering), home story 13807630 (white and olive pairs on oak shop
 * shelves), about page 11827147 (one chunky sneaker alone on an orange
 * shelf), category tiles 7193625, 9207813, 29253011, 5488660. Left out for
 * the hero: 1020372 (the pink shelf: the pairs are too small to read in a
 * square tile; streetwear keeps it) and 11827147 (the pair fills a tenth of
 * the frame; it is the about page's photo instead).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, primaryHref, type LookParts } from "../editions/apply";
import { SNEAKERS } from "../editions/packs/shoes-bags/sneakers";
import type { JourneySource, LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const SPORTS_BOLD_KEY = "sports-bold";

const RADIUS = 10;

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SPORTS_BOLD_KEY, getDesign(id)!, { corners: RADIUS, ...patch });

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

/** A node hidden on every screen. */
const hide = (node: NodeTemplate): NodeTemplate => ({
  ...node,
  style: { ...node.style, hidden: true },
  breakpointStyles: {
    ...node.breakpointStyles,
    tablet: { ...node.breakpointStyles?.tablet, hidden: true },
    mobile: { ...node.breakpointStyles?.mobile, hidden: true },
  },
});

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

/** The grid's three links: what it shows first (the active chip), then the other two. */
const TABS: readonly { source: JourneySource | "rating"; label: ReturnType<typeof L>; href: string }[] = [
  { source: "newest", label: L("وصل حديثًا", "New in"), href: NEW },
  { source: "best-sellers", label: L("الأكثر مبيعًا", "Best sellers"), href: BEST },
  { source: "featured", label: L("مختارات", "Picks"), href: SHOP },
  { source: "rating", label: L("الأعلى تقييمًا", "Top rated"), href: RATED },
];

/** Nabd's own content is the sneakers pack's shop (Raseef): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...SNEAKERS.copy,
  photos: {
    hero: SNEAKERS.photos.hero,
    story: SNEAKERS.photos.story,
    banner: SNEAKERS.photos.banner,
  },
};

/**
 * The hero: the message, the pair large in a square tile, the newest
 * featured pair, and the size range on the brand tile. Six columns on
 * desktop (message 2, photo 3, the side column 1). The copy fades out as the
 * page scrolls on: the page's one motion.
 */
function hero(c: LookContent): Design {
  const x = c.custom;
  const bento = lib("hero-bento", {
    photo: [c.photos.hero.tall],
    text: {
      "وصل جديد": c.hero.eyebrow,
      "صوت أنقى، كل يوم": c.hero.title,
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
      "تسوق الآن": c.hero.cta,
      "صورة الحملة": c.hero.alt,
      "٤٫٨": x["hero-sticker-2"]!,
      "من ١٢ ألف تقييم": x["hero-sizes-line"]!,
    },
    links: { "/products": SHOP },
  });
  const shaped = retouch(bento, undefined, (node) => {
    const tablet = (extra: Record<string, unknown>) => ({ ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, ...extra } });
    // Six columns, so the photo can take three: as tall as the message beside it. Tablets stack as phones do.
    if (node.type === "grid" && node.props?.role === undefined && node.children?.length === 3) {
      return { ...node, style: { ...node.style, columns: 6 }, breakpointStyles: tablet({ columns: 2 }) };
    }
    // The side column: the pair and the size tile side by side on tablets.
    if (node.type === "grid" && node.children?.length === 2) {
      return { ...node, breakpointStyles: tablet({ colSpan: 2, columns: 2 }) };
    }
    // The pair, square and three columns wide (a wide band on tablets and phones).
    if (node.type === "image" && node.props?.role === "image") {
      return { ...node, style: { ...node.style, colSpan: 3, aspectRatio: "square" }, breakpointStyles: tablet({ colSpan: 2, aspectRatio: "landscape" }) };
    }
    // The headline runs the tile's width, so the message tile is no taller than the square photo.
    if (node.type === "heading" && node.props?.role === "title") return { ...node, style: { ...node.style, fontSize: "display-md", maxWidth: "100%" } };
    // No invented reviews: the stars go, the tile shows the size range, compact so the side column matches the photo.
    if (node.children?.length === 5 && node.children.every((child) => child.type === "icon")) return hide(node);
    if (node.props?.role === "rating") {
      const [figure, ...rest] = node.children ?? [];
      return {
        ...node,
        style: { ...node.style, paddingTop: 18, paddingBottom: 18 },
        // The design's phone size (5xl) would outgrow this half-width tile and break "36–45" over two lines.
        children: figure
          ? [{ ...figure, style: { ...figure.style, fontSize: "4xl" }, breakpointStyles: { ...figure.breakpointStyles, mobile: { ...figure.breakpointStyles?.mobile, fontSize: "3xl" } } }, ...rest]
          : rest,
      };
    }
    if (node.type === "productList" && node.props?.role === "product") {
      return { ...node, style: { ...node.style, paddingTop: 14, paddingBottom: 14, paddingStart: 14, paddingEnd: 14 } };
    }
    return node;
  });
  return { ...calm(shaped), scrollEffect: "fade-exit" };
}

/** Four styles in large rings, four across from tablets up; a swipe row on phones. */
function categories(c: LookContent): Design {
  const circles = lib("categories-circles", {
    text: {
      "بتدوّر على إيه؟": c.categories.title,
      "عرض الكل": c.custom["shop-all"]!,
    },
    lists: [{ limit: 4 }],
    nodes: { الحلقة: { style: { maxWidth: "232px" } } },
  });
  return retouch(circles, "categoryList", (node) => ({
    ...node,
    style: { ...node.style, columns: 4, gap: 40 },
    breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 4 } },
  }));
}

/** The main grid on the white stage: eight pairs, and the three links with the one it shows first marked. */
function grid(c: LookContent, primary: JourneySource): Design {
  const first = TABS.find((tab) => tab.source === primary)!;
  const tabs = [first, ...TABS.filter((tab) => tab !== first && tab.source !== "featured")].slice(0, 3);
  return lib("products-tabbed", {
    text: {
      منتجاتنا: c.products.primary.title,
      "وصل جديد": tabs[0]!.label,
      "الأكثر مبيعًا": tabs[1]!.label,
      العروض: tabs[2]!.label,
    },
    links: { "/products": tabs.map((tab) => tab.href) },
    lists: [{ source: primary, limit: 8 }],
    // The heading speaks for itself: the small label above it goes.
    nodes: { التسمية: { style: { hidden: true }, tablet: { hidden: true }, mobile: { hidden: true } } },
  });
}

/** Head to head: the newest pair of one category against the newest of another, four spec rows under them. */
function versus(c: LookContent, a: number, b: number): Design {
  const v = (key: string) => c.custom[`versus-${key}`]!;
  return lib("finder-versus", {
    text: {
      "تختار مين؟": v("title"),
      ضد: L("ولا", "or"),
      "اشتري ده": L("اختار ده", "Pick this"),
      البطارية: v("1-label"),
      "٣٠ ساعة": v("1-a"),
      "٢٤ ساعة": v("1-b"),
      "عزل الضوضاء": v("2-label"),
      أيوه: v("2-a"),
      لأ: v("2-b"),
      الوزن: v("3-label"),
      "٥٫٢ جم": v("3-a"),
      "٤٫٨ جم": v("3-b"),
      "مقاومة المية": v("4-label"),
      "IPX٤": v("4-a"),
      "IPX٥": v("4-b"),
    },
    lists: [
      { source: "category", categoryIndex: a },
      { source: "category", categoryIndex: b, offset: 0 },
    ],
  });
}

/** A category beside the infrared panel: four pairs, two by two on phones. */
function panel(c: LookContent, place: number): Design {
  const x = c.custom;
  const rail = lib("products-panel-rail", {
    text: {
      هدايا: x["panel-eyebrow"]!,
      "هدايا تحت ١٠٠٠ جنيه": x["panel-title"]!,
      "اختيارات مضمونة لأي مناسبة.": x["panel-line"]!,
      "عرض الكل": x["panel-cta"]!,
    },
    links: { "/products": c.nav[0]!.href },
    lists: [{ source: "category", categoryIndex: place, limit: 4 }],
  });
  // Five columns: the panel takes one, four pairs the other four (over them on tablets, two by two on phones, so no card is left alone).
  return calm(
    retouch(rail, undefined, (node) => {
      // Tablets put the panel over the four pairs, as phones do.
      const tablet = (extra: Record<string, unknown>) => ({ ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, ...extra } });
      if (node.type === "grid" && node.children?.length === 2) return { ...node, style: { ...node.style, columns: 5 }, breakpointStyles: tablet({ columns: 1 }) };
      if (node.type === "productList") return { ...node, style: { ...node.style, columns: 4, colSpan: 4 }, breakpointStyles: tablet({ colSpan: 1, columns: 4 }) };
      return node;
    }),
  );
}

/** One row of four of a category's products, under its own name. */
const categoryRow = (place: number): Design =>
  lib("products-category-carousel", {
    text: { "عرض الكل": L("عرض الكل", "View all") },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Contact) and the
 * layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const [versusA, versusB, panelPlace, rowPlace] = journey.rows as [number, number, number, number];

  const header = lib("header-inline", {
    text: {
      "اسم متجرك": name,
      المتجر: x["shop-all"]!,
      العروض: L("وصل حديثًا", "New in"),
      المدونة: c.nav[0]!.label,
      "من نحن": L("حكايتنا", "Our story"),
      "تواصل معنا": L("تواصل", "Contact"),
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": c.nav[0]!.href },
  });

  const footer = lib("footer-wordmark", {
    text: {
      "اسم متجرك": name,
      "كل المنتجات": x["shop-all"]!,
      العروض: L("الأعلى تقييمًا", "Top rated"),
      "٠١٠٠ ١٢٣ ٤٥٦٧": x["contact-phone"]!,
      "‏hello@store.com": x["contact-email"]!,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    hero(c),
    categories(c),
    grid(c, journey.primary),
    versus(c, versusA, versusB),
    panel(c, panelPlace),
    calm(
      lib("about-overlap", {
        person: [undefined, undefined, undefined, undefined, c.photos.banner],
        text: {
          "صورة المتجر": x["banner-alt"]!,
          "من داخل المتجر": c.story.eyebrow,
          "بدأنا من محل صغير": c.story.title,
          "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": c.story.text,
          "اعرف أكثر": c.story.cta,
        },
      }),
    ),
    categoryRow(rowPlace),
    icons(
      calm(
        lib("features-columns", {
          text: {
            "ليه تشتري مننا": L(`ليه ${name.ar}؟`, `Why ${name.en}`),
            "بنوفّر لك منتجات بجودة عالية": x["trust-title"]!,
            "التفاصيل اللي بتفرق في كل طلب.": x["trust-line"]!,
            "توصيل سريع": c.trust[0]!.title,
            "من يوم لـ ٤ أيام لكل المحافظات، وتتبّع طلبك خطوة بخطوة.": c.trust[0]!.line,
            "جودة مضمونة": c.trust[1]!.title,
            "كل منتج بيتراجع قبل ما يتغلف، ومعاه ضمان.": c.trust[1]!.line,
            "استرجاع سهل": c.trust[2]!.title,
            "١٤ يوم تغيّر فيهم رأيك من غير أسئلة كتير.": c.trust[2]!.line,
          },
        }),
      ),
      // The promises' own icons: delivery, size exchange, sizing help.
      ["truck", "rotate", "chat"],
    ),
    // The form on one row (email, name, button) under the four topics.
    retouch(
      lib("newsletter-interests", {
        text: {
          "إيه اللي يهمك؟": c.newsletter.title,
          "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": c.newsletter.line,
          "وصل حديثًا": x["newsletter-interest-1"]!,
          العروض: x["newsletter-interest-2"]!,
          هدايا: x["newsletter-interest-3"]!,
          نصايح: x["newsletter-interest-4"]!,
        },
      }),
      "storeForm",
      // The ready-made form stays the last prop, where the stored ref puts it back.
      (node) => {
        const { formTemplate, ...props } = node.props ?? {};
        return { ...node, props: { ...props, layout: "inline", ...(formTemplate !== undefined && { formTemplate }) } };
      },
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
      href: primaryHref(journey.primary),
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

export const SPORTS_BOLD = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(SPORTS_BOLD_KEY, "sneakers", { ar: 2812, en: 2812 }),
  key: SPORTS_BOLD_KEY,
  version: 2,
  changelog: "Nabd v2: the sneakers template, rebuilt look-first",
  name: L("نبض", "Nabd"),
  description: L(
    "كوتشيات: الجوز كبير في مربع جنب الكلام ومقاسات من ٣٦ لـ ٤٥، أقسام في دواير، شبكة على خلفية بيضا، مقارنة رانينج ولا أبيض لكل يوم، وصفوف منتجات. لمحلات الكوتشيات.",
    "Sneakers: the pair large in a tile beside the copy and sizes 36 to 45, styles in rings, a white-stage grid, a runner against an everyday white spec by spec, and product rows. For sneaker shops.",
  ),
  category: "shoes-bags",
  style: ["bold"],
  sortOrder: 1480,
  palette: ["#ffffff", "#eceeec", "#d0381f", "#131a32"],
  colors: {
    primary: "#d0381f",
    secondary: "#eceeec",
    background: "#ffffff",
    foreground: "#131a32",
    muted: "#586074",
    border: "#d9dce2",
    accent: "#b6c4ff",
  },
  fonts: { heading: "Alexandria", body: "Noto Sans Arabic" },
  radius: RADIUS,
  productStage: SNEAKERS.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "nav.0",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story.eyebrow",
    "story.title",
    "story.text",
    "story.cta",
    "trust.0",
    "trust.1",
    "trust.2",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "photos.banner",
    // The header's and the circles' link to the whole catalog, and the footer's phone and email.
    "custom.shop-all",
    "custom.contact-phone",
    "custom.contact-email",
    // The hero's brand tile: the size range (a short figure) and one short line under it.
    "custom.hero-sticker-2",
    "custom.hero-sizes-line",
    // The head to head: a title, then four rows of a label and a value per side (the dot marks side a in rows 1–2, side b in rows 3–4).
    "custom.versus-title",
    "custom.versus-1-label",
    "custom.versus-1-a",
    "custom.versus-1-b",
    "custom.versus-2-label",
    "custom.versus-2-a",
    "custom.versus-2-b",
    "custom.versus-3-label",
    "custom.versus-3-a",
    "custom.versus-3-b",
    "custom.versus-4-label",
    "custom.versus-4-a",
    "custom.versus-4-b",
    // The panel beside the 3rd row place (a small label, a title, one line, the button to `nav.0`).
    "custom.panel-eyebrow",
    "custom.panel-title",
    "custom.panel-line",
    "custom.panel-cta",
    // The home story's photo is `photos.banner`: its alt.
    "custom.banner-alt",
    // The promises' heading and its line.
    "custom.trust-title",
    "custom.trust-line",
    // Four topics the letters cover (one or two words each).
    "custom.newsletter-interest-1",
    "custom.newsletter-interest-2",
    "custom.newsletter-interest-3",
    "custom.newsletter-interest-4",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // The eight newest pairs; then the head to head's two sides (running, everyday white), the panel (high-tops) and the row (slip-ons and canvas).
  journey: { primary: "newest", rows: [2, 1, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: SNEAKERS.demo,
  productPage: {
    thumbs: "bottom",
    surface: "shelf",
    band: "paper",
    extras: ["product-perks"],
    copy: SNEAKERS.productPage?.copy ?? { reviews: L("آراء اللي لبسوه", "From people who wear them"), related: L("موديلات ممكن تعجبك", "Pairs you may like") },
  },
});
