/**
 * Madar (fashion, the sportswear niche template; one template per niche,
 * ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a training-wear
 * shop that sells by the fabric. White product stage, a pale ice band, one
 * cobalt for actions (the colour of a technical knit), graphite ink and a
 * steel-blue ring; Changa headings (narrow and upright, like the numbers on
 * a training top) over Readex Pro; 6px corners. Built from section library
 * designs (`fromLibrary`).
 *
 * v2 (2026-11-12): rebuilt look-first around the fabric. It was v1, a quiet
 * sports equipment club (a dumbbell-rack video, six sports categories). Home,
 * nine sections:
 *   1. `hero-fullbleed`              a slate performance weave in close-up
 *                                    filling the first screen, the copy on it.
 *                                    The page's one motion: the photo drifts
 *                                    and the copy fades as the page scrolls on
 *   2. `categories-ruled`            the four categories as tall photo tiles
 *                                    over a hairline, the name and how many
 *                                    pieces under it (four across, two on phones)
 *   3. `products-category-tabs`      the ten newest pieces on the white stage,
 *                                    the first three categories as links over them
 *   4. `about-rows`                  the fabric guide, the trade's own section:
 *                                    quick-dry polyester, nylon with elastane,
 *                                    cotton fleece, each a macro photo of the
 *                                    fabric beside the pieces made of it, its
 *                                    name and what it does (not zay's comparison, alwan's fit
 *                                    steps, kasr's size menu, ghorza's bench,
 *                                    tasfya's "where will you wear them?",
 *                                    nabd's head to head or shanta's anatomy)
 *   5. `products-category-carousel`  leggings and joggers, on the ice band
 *   6. `about-circle`                "every piece trains before it ships": the
 *                                    changing room in a steel ring (the
 *                                    photo-led break between the rows)
 *   7. `products-category-carousel`  jackets and hoodies
 *   8. `features-ruled`              four promises in hairline cells (the
 *                                    design's big numbers hidden: the promises
 *                                    are not a sequence)
 *   9. `newsletter-photo`            the cobalt knit beside the sign-up, the
 *                                    form on one row
 * Chrome: `header-line` and `footer-dark-bar` (graphite). Eyebrows are set in
 * sentence case (`calm`), never capitals.
 *
 * Content: the `sportswear` pack is Madar's own shop ("Tamreen"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store. Custom slots: `shop-all`, `fabric-N-*` and
 * `photos.custom.fabric-N` (the guide), `newsletter-alt` and
 * `photos.custom.newsletter`.
 *
 * Category moves from sports to fashion (the plan's map: sportswear is a
 * fashion niche); the sports wave picks other templates.
 *
 * Guard: `sports-luxe.v1.json` was the v1 capture (the edition-ready club
 * shop, commit db7b75e3). v2 is the deliberate redesign, so its fixture is a
 * new capture (`sports-luxe.v2.json`) and the v1 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header): hero 1487809, fabric guide 10221743,
 * 4863009, 34860712, newsletter 18372335 (all new, fabric close-ups with no
 * marks), story 4162550, tiles 37496664, 36717697, 8454925, 12255816;
 * products are the pack's white packshots.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, primaryHref, type LookParts } from "../editions/apply";
import { SPORTSWEAR } from "../editions/packs/fashion/sportswear";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const SPORTS_LUXE_KEY = "sports-luxe";

const RADIUS = 6;

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SPORTS_LUXE_KEY, getDesign(id)!, { corners: RADIUS, ...patch });

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

/** Styles for phones merged over a node's own. */
const onPhones = (node: NodeTemplate, extra: Record<string, unknown>): NodeTemplate["breakpointStyles"] => ({
  ...node.breakpointStyles,
  mobile: { ...node.breakpointStyles?.mobile, ...extra },
});

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

/** Madar's own content is the sportswear pack's shop (Tamreen): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...SPORTSWEAR.copy,
  photos: {
    hero: SPORTSWEAR.photos.hero,
    story: SPORTSWEAR.photos.story,
    custom: SPORTSWEAR.photos.custom,
  },
};

/** The fabric close-up from edge to edge, the copy on it. The photo drifts and the copy fades on scroll: the page's one motion. */
function hero(c: LookContent): Design {
  return calm(
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
      links: { "/products?sort=newest": BEST },
    }),
  );
}

/** The categories as tall photo tiles over a hairline, the name and the count under each: four across, two on phones. */
function categories(c: LookContent): Design {
  const ruled = lib("categories-ruled", {
    text: {
      "تسوق بالقسم": c.categories.title,
      منتج: L("قطعة", "pieces"),
    },
    lists: [{ limit: 4 }],
  });
  return retouch(ruled, undefined, (node) => {
    // The heading speaks for itself: no small label over it.
    if (node.props?.role === "eyebrow") return hide(node);
    if (node.type === "categoryList") {
      return {
        ...node,
        style: { ...node.style, columns: 4, gap: 28 },
        breakpointStyles: {
          ...node.breakpointStyles,
          tablet: { ...node.breakpointStyles?.tablet, columns: 2 },
          mobile: { ...node.breakpointStyles?.mobile, columns: 2, gap: 14 },
        },
      };
    }
    // The photo on top, full width and tall; the name and the count under it.
    if (node.type === "hFlex" && node.children?.some((child) => child.type === "image")) {
      return { ...node, style: { ...node.style, direction: "column", alignItems: "start", gap: 14 }, breakpointStyles: onPhones(node, { gap: 10 }) };
    }
    if (node.type === "image") {
      return { ...node, style: { ...node.style, width: "100%", aspectRatio: "portrait", radius: RADIUS }, breakpointStyles: onPhones(node, { width: "100%", aspectRatio: "portrait" }) };
    }
    // The arrow belongs to a side-by-side row; under a tile it would float.
    if (node.type === "icon") return hide(node);
    // The name in the heading face, larger.
    if (node.props?.bind === "name") {
      return { ...node, style: { ...node.style, fontFamily: "heading", fontSize: "xl", fontWeight: "semibold" }, breakpointStyles: onPhones(node, { fontSize: "md" }) };
    }
    return node;
  });
}

/** The newest pieces on the white stage, the first three categories as links over them. */
function grid(c: LookContent, journey: LookJourney): Design {
  const tabs = lib("products-category-tabs", {
    text: {
      "لحق قبل ما يخلص": c.products.primary.eyebrow ?? c.products.primary.title,
      "وصل حديثًا": c.products.primary.title,
      "أحدث القطع اللي نزلت المتجر الأسبوع ده.": c.products.primary.line!,
    },
    lists: [undefined, { source: journey.primary, limit: 10 }],
  });
  return retouch(tabs, undefined, (node) => {
    // The heading speaks for itself: no small label over it.
    if (node.props?.role === "eyebrow") return hide(node);
    // Category names as written, not in capitals.
    if (node.props?.bind === "name") return { ...node, style: { ...node.style, textTransform: "none", fontSize: "md" } };
    // Phones have no room for three names on one line, and the category tiles sit just above: the links show from tablets up.
    if (node.type === "categoryList") return { ...node, breakpointStyles: onPhones(node, { hidden: true }) };
    // No stars on the cards: name and price only.
    if (node.type === "hFlex" && node.children?.some((child) => child.type === "icon" && child.props?.name === "star")) return hide(node);
    return node;
  });
}

/** The fabric guide: three fabrics, each a close-up beside the pieces made of it, its name and what it does. */
function fabrics(c: LookContent): Design {
  const x = c.custom;
  const photos = c.photos.custom ?? {};
  const rows = lib("about-rows", {
    photo: [undefined, undefined, undefined, undefined, photos["fabric-1"], photos["fabric-2"], photos["fabric-3"]],
    text: {
      "٠١": x["fabric-1-pieces"]!,
      نختار: x["fabric-1-name"]!,
      "نشتري من الموزعين المعتمدين فقط، ونرفض أي منتج مشكوك فيه.": x["fabric-1-text"]!,
      "٠٢": x["fabric-2-pieces"]!,
      نجرّب: x["fabric-2-name"]!,
      "كل منتج يُفتح ويُجرَّب قبل أن يُعرض في المتجر.": x["fabric-2-text"]!,
      "٠٣": x["fabric-3-pieces"]!,
      نغلّف: x["fabric-3-name"]!,
      "تغليف محكم ومعه الفاتورة والضمان.": x["fabric-3-text"]!,
    },
  });
  // The pieces made of the fabric where the design has a big step number: a small line in cobalt. Each photo's alt is its row's title, the fabric's name.
  return retouch(rows, "text", (node) =>
    node.style?.fontSize === "3xl" ? { ...node, style: { ...node.style, fontSize: "md", fontWeight: "semibold" } } : node,
  );
}

/** One category's row of four. */
const categoryRow = (place: number, shaded: boolean): Design =>
  lib("products-category-carousel", {
    as: `category-row-${place}`,
    text: { "عرض الكل": L("عرض الكل", "View all") },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
    ...(shaded && { nodes: { "منتجات قسم": { style: { background: "secondary" } } } }),
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
  const [firstRow, secondRow] = journey.rows as [number, number];

  const header = lib("header-line", {
    text: {
      "اسم متجرك": name,
      المتجر: x["shop-all"]!,
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("الأكثر طلبًا", "Best sellers"),
      "من نحن": L("حكايتنا", "Our story"),
      "تواصل معنا": L("تواصل", "Contact"),
    },
    links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": BEST },
  });

  const footer = lib("footer-dark-bar", {
    text: {
      "اسم متجرك": name,
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
  });

  const home: Design[] = [
    hero(c),
    categories(c),
    grid(c, journey),
    fabrics(c),
    categoryRow(firstRow, true),
    calm(
      lib("about-circle", {
        person: [c.photos.story],
        text: {
          "صورة الفريق": c.story.alt,
          "إحنا مين": c.story.eyebrow,
          "فريق صغير بيحب اللي بيعمله": c.story.title,
          "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.": c.story.text,
          "قابل الفريق": c.story.cta,
        },
      }),
    ),
    categoryRow(secondRow, false),
    retouch(
      lib("features-ruled", {
        text: {
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
      "text",
      // The promises are not a sequence: the design's big numbers go.
      (node) => (node.style?.fontSize === "4xl" ? hide(node) : node),
    ),
    retouch(
      calm(
        lib("newsletter-photo", {
          photo: [undefined, undefined, undefined, (c.photos.custom ?? {}).newsletter],
          text: {
            "صورة من المتجر": x["newsletter-alt"]!,
            للمشتركين: c.newsletter.eyebrow!,
            "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
            "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": c.newsletter.line,
            "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": c.newsletter.note!,
          },
        }),
      ),
      "storeForm",
      // The form on one row; the ready-made form stays the last prop, where the stored ref puts it back.
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

export const SPORTS_LUXE = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(SPORTS_LUXE_KEY, "sportswear", { ar: 2812, en: 2812 }),
  key: SPORTS_LUXE_KEY,
  version: 2,
  changelog: "Madar v2: the sportswear template, rebuilt look-first",
  name: L("مدار", "Madar"),
  description: L(
    "لبس تمرين: قماش رياضي عن قرب بعرض الشاشة، أقسام بصور طويلة، أحدث القطع على خلفية بيضا، ودليل للخامات (بوليستر بينشف بسرعة، نايلون بإيلاستين، قطن فليس). لمحلات لبس الرياضة.",
    "Training wear: a performance fabric in close-up across the screen, tall category photos, the newest pieces on a white stage, and a fabric guide (quick-dry polyester, nylon with elastane, cotton fleece). For sportswear shops.",
  ),
  category: "fashion",
  style: ["luxe"],
  sortOrder: 1470,
  palette: ["#ffffff", "#e8edfc", "#2a45c8", "#16191f"],
  colors: {
    primary: "#2a45c8",
    secondary: "#e8edfc",
    background: "#ffffff",
    foreground: "#16191f",
    muted: "#5b616e",
    border: "#d9dde6",
    accent: "#b9c3e6",
  },
  fonts: { heading: "Changa", body: "Readex Pro" },
  radius: RADIUS,
  productStage: SPORTSWEAR.productStage,
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
    "story",
    "trust.0",
    "trust.1",
    "trust.2",
    "trust.3",
    "newsletter",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
    // The header's link to the whole catalog.
    "custom.shop-all",
    // The fabric guide, three rows: the pieces made of it (a short list), the fabric's name (two or three words; also its photo's alt) and one or two sentences on what it does.
    "custom.fabric-1-pieces",
    "custom.fabric-1-name",
    "custom.fabric-1-text",
    "custom.fabric-2-pieces",
    "custom.fabric-2-name",
    "custom.fabric-2-text",
    "custom.fabric-3-pieces",
    "custom.fabric-3-name",
    "custom.fabric-3-text",
    // The fabric close-ups (landscape), and the sign-up's square photo with its alt.
    "photos.custom.fabric-1",
    "photos.custom.fabric-2",
    "photos.custom.fabric-3",
    "photos.custom.newsletter",
    "custom.newsletter-alt",
  ],
  // `products.primary.eyebrow` is read only to fill the grid's hidden label; `photos.about`: the about page's photo (falls back to the story's).
  optional: ["products.primary.eyebrow", "photos.about"],
  // The ten newest pieces; then the rows: leggings and joggers, jackets and hoodies.
  journey: { primary: "newest", rows: [2, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: SPORTSWEAR.demo,
  productPage: {
    thumbs: "bottom",
    band: "paper",
    extras: ["product-perks"],
    copy: SPORTSWEAR.productPage?.copy ?? { reviews: L("آراء اللي اتمرّنوا بيه", "From people who train in it"), related: L("قطع ممكن تعجبك", "Pieces you may like") },
  },
});
