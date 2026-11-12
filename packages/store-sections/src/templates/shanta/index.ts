/**
 * Shanta (shoes & bags, the handbags niche template; one template per niche,
 * ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a women's handbag
 * boutique. White paper and a pale mineral grey, a bottle green for actions
 * and a camel accent (the colour of the bags themselves); El Messiri headings
 * (the curve of a handle) over Almarai; 4px corners, tailored like a
 * structured bag. Built from section library designs (`fromLibrary`).
 *
 * v4 (2026-11-12): rebuilt look-first around the bag. Home, nine sections:
 *   1. `hero-split`                  a structured bag on a white plinth, the
 *                                    copy in the mineral panel beside it (a
 *                                    light photo: copy on it would cover the
 *                                    bag). The page's one motion: the photo
 *                                    zooms slowly as the page scrolls
 *   2. `categories-photo-tiles`      four portrait tiles by bag type
 *   3. `products-minimal`            ten best sellers on the white stage, with
 *                                    sort links
 *   4. `about-split-story`           the stitching story (leather, stitches and
 *                                    a D-ring up close)
 *   5. `products-category-carousel`  totes (the store's 1st category)
 *   6. `about-product-anatomy`       one bag with four note dots: the handles,
 *                                    the zip and pockets, the hardware, the
 *                                    size (the trade's own section, and the
 *                                    photo break)
 *   7. `products-category-carousel`  clutches and evening (the 3rd category)
 *   8. `features-icon-cards`         four promises on quiet tiles
 *   9. `newsletter-classic`          one row on the mineral panel
 * Chrome: `header-classic` (its announcement line in the bottle green) and
 * `footer-signoff` (the store's line and WhatsApp). Eyebrows are set in
 * sentence case (`calm`), never capitals.
 *
 * Content: the `handbags` pack is Shanta's own shop ("Lamaa"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store. `photos.look` and `look` are the anatomy photo, its
 * four dots and its heading; the notes are `custom.anatomy-N-title` / `-line`.
 *
 * Guard: `shanta.v3.json` was captured from the v3 template before any edit.
 * v4 is the deliberate redesign, so its fixture is a new capture
 * (`shanta.v4.json`) and the v3 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import { HANDBAGS } from "../editions/packs/shoes-bags/handbags";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const SHANTA_KEY = "shanta";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SHANTA_KEY, getDesign(id)!, { corners: 4, ...patch });

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

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const VIEW_ALL = L("عرض الكل", "View all");

/** Shanta's own content is the handbags pack's shop (Lamaa): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...HANDBAGS.copy,
  photos: {
    hero: HANDBAGS.photos.hero,
    story: HANDBAGS.photos.story,
    ...(HANDBAGS.photos.about && { about: HANDBAGS.photos.about }),
    ...(HANDBAGS.photos.look && { look: HANDBAGS.photos.look }),
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/** The hero: the bag on its plinth beside the copy; the photo zooms slowly with the scroll (transform only, so LCP is unaffected). */
function hero(c: LookContent): Design {
  const split = lib("hero-split", {
    photo: [c.photos.hero.tall],
    text: {
      "صورة الواجهة": c.hero.alt,
      "المجموعة الجديدة": c.hero.eyebrow,
      "معمول بكميات صغيرة": c.hero.title,
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": c.hero.line,
      "تسوّق المجموعة": c.hero.cta,
      حكايتنا: c.labels.about,
    },
    // The panel sits above the photo, so the zoomed photo never covers its edge.
    nodes: { اللوح: { style: { position: "relative", zIndex: 1 } } },
  });
  return calm(retouch(split, "image", (node, index) => (index === 0 ? { ...node, props: { ...node.props, scrollEffect: "zoom" } } : node)));
}

/** The anatomy: one bag on a 4:5 photo (phones too, so the dots stay put) with a note per dot. */
function anatomy(c: LookContent): Design {
  const notes = [1, 2, 3, 4].map((n) => ({
    title: c.custom[`anatomy-${n}-title`]!,
    line: c.custom[`anatomy-${n}-line`]!,
  }));
  const portrait = (node: NodeTemplate): NodeTemplate => ({
    ...node,
    style: { ...node.style, aspectRatio: "portrait" },
    breakpointStyles: {
      ...node.breakpointStyles,
      mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "portrait" },
    },
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
    (node, index) => ({
      ...node,
      props: { ...node.props, ...c.photos.look.dots[index] },
    }),
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

  const header = retouch(
    lib("header-classic", {
      text: {
        "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": c.announcement[0]!,
        م: initialOf(name),
        "اسم متجرك": name,
        الرئيسية: L("الرئيسية", "Home"),
        المتجر: shopAll ?? L("كل المنتجات", "Shop all"),
        العروض: L("وصل حديثًا", "New in"),
        المدونة: L("الأكثر طلبًا", "Best sellers"),
        "من نحن": c.labels.about,
        "تواصل معنا": L("تواصل", "Contact"),
        "ابحث عن منتج": c.labels.search,
      },
      links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
      nodes: { القائمة: { style: { gap: 4 } } },
    }),
    undefined,
    (node) => (node.props?.role === "announcement" ? { ...node, style: { ...node.style, background: "primary" } } : node),
  );

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا إنك عدّيت علينا": c.footer.line,
      "كل المنتجات": shopAll ?? L("كل المنتجات", "All products"),
      العروض: L("الأعلى تقييمًا", "Top rated"),
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    hero(c),
    lib("categories-photo-tiles", {
      text: {
        "تسوّق حسب القسم": c.categories.title,
        منتج: noun ?? L("منتج", "products"),
      },
    }),
    // Eight best sellers, four across from tablets up (two rows), two on phones.
    retouch(
      lib("products-minimal", {
        text: {
          "الأكثر طلباً": c.products.primary.title,
          "الأكثر مبيعاً": L("الأكثر طلبًا", "Best sellers"),
          الجديد: L("وصل حديثًا", "New in"),
          "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
          "عرض الكل": VIEW_ALL,
        },
        links: { "/products": primaryHref(journey.primary) },
        lists: [{ source: journey.primary, limit: 8 }],
      }),
      "productList",
      (node) => ({
        ...node,
        style: { ...node.style, columns: 4 },
        breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 4 } },
      }),
    ),
    calm(
      lib("about-split-story", {
        photo: [undefined, undefined, c.photos.story],
        text: {
          "صورة القصة": c.story.alt,
          "من ورشتنا": c.story.eyebrow,
          "متصمم عشانك ومعمول في القاهرة": c.story.title,
          "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": c.story.text,
          "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": c.custom["story-more"]!,
          حكايتنا: c.story.cta,
        },
        links: { "/about": NEW },
      }),
    ),
    categoryRow(journey.rows[0]!, 1),
    anatomy(c),
    categoryRow(journey.rows[1]!, 2),
    retouch(
      retouch(
        lib("features-icon-cards", {
          text: {
            "تسوّق وأنت مطمئن": c.custom["trust-title"]!,
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
        undefined,
        (node) => {
          // The heading alone: no label over it.
          if (node.props?.role === "eyebrow") {
            return {
              ...node,
              style: { ...node.style, hidden: true },
              breakpointStyles: {
                ...node.breakpointStyles,
                tablet: { ...node.breakpointStyles?.tablet, hidden: true },
                mobile: { ...node.breakpointStyles?.mobile, hidden: true },
              },
            };
          }
          return node;
        },
      ),
      "icon",
      // The promises' own icons: delivery, exchange, real photos and sizes, pay on delivery.
      (node, index) => ({
        ...node,
        props: {
          ...node.props,
          name: ["truck", "rotate", "image", "package"][index] ?? node.props?.name,
        },
      }),
    ),
    // On the mineral panel (the footer under it is the bottle green), so its copy is set in the page's ink.
    retouch(
      lib("newsletter-classic", {
        text: {
          "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
          "اشترك وأول ما يوصل جديد أو عرض للمشتركين هتعرف.": c.newsletter.line,
        },
        nodes: {
          اللوحة: { style: { background: "secondary", color: "foreground" } },
        },
      }),
      undefined,
      (node) =>
        node.props?.role === "title" ? { ...node, style: { ...node.style, color: "foreground" } } : node.props?.role === "subtitle" ? { ...node, style: { ...node.style, color: "muted" } } : node,
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

export const SHANTA = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(SHANTA_KEY, "handbags", { ar: 2812, en: 2812 }),
  key: SHANTA_KEY,
  version: 4,
  changelog: "Shanta v4: the handbags template, rebuilt look-first",
  productPage: {
    gallery: "end",
    thumbs: "side",
    band: "shelf",
    extras: ["product-shipping"],
    copy: {
      reviews: L("رأي اللي شالوها", "From those who carry it"),
      related: L("تمشي معاها", "Carried together"),
    },
  },
  name: L("شنطة", "Shanta"),
  description: L(
    "شنط يد حريمي: شنطة على قاعدة جنب الكلام، أقسام بصور طولية، شنطة تتعرفي عليها بالنقط وصفوف منتجات على خلفية بيضا. لمحلات الشنط.",
    "Women's handbags: a bag on a plinth beside the copy, portrait category tiles, one bag explained by its dots and product rows on a white stage. For handbag shops.",
  ),
  category: "shoes-bags",
  style: ["luxe"],
  sortOrder: 520,
  palette: ["#ffffff", "#e4e7e1", "#b8875a", "#1f3a2e"],
  colors: {
    primary: "#1f3a2e",
    secondary: "#e4e7e1",
    background: "#ffffff",
    foreground: "#18201b",
    muted: "#59635c",
    border: "#d4d9d2",
    accent: "#b8875a",
  },
  fonts: { heading: "El Messiri", body: "Almarai" },
  radius: 4,
  productStage: HANDBAGS.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.about",
    "labels.search",
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
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
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
    // The story's second paragraph (one sentence), and the promises' heading (a few words).
    "custom.story-more",
    "custom.trust-title",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  // `custom.shop-all`: the link to the whole catalog, header and footer (default "كل المنتجات / Shop all").
  // `custom.products-noun`: the noun after a category tile's product count (default "منتج / products").
  optional: ["photos.about", "custom.shop-all", "custom.products-noun"],
  // The ten best sellers, then the store's 1st and 3rd categories (totes, clutches) as rows: the day bag and the evening bag.
  journey: { primary: "best-sellers", rows: [1, 3] },
  defaultContent: DEFAULT_CONTENT,
  demo: HANDBAGS.demo,
});
