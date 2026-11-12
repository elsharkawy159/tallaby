/**
 * Kasr (shoes & bags, the womens-shoes niche template; one template per
 * niche, ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a women's
 * shoe shop set like a quiet gallery, each pair on its own plinth. White
 * paper for the product stage, a cool porcelain tint, a bordeaux patent for
 * actions and panels and a powder blue for the sign-up band; Amiri headings
 * (a high-contrast naskh, like the lettering on a shoe-box lid) over Tajawal
 * (light and plain, for sizes in centimetres); square corners. Built from
 * section library designs (`fromLibrary`).
 *
 * v5 (2026-11-12): rebuilt look-first around the pairs. Home, nine sections:
 *   1. `hero-ticket`                 one pair on a floating shelf with a
 *                                    label card at its top corner, like the
 *                                    end of a shoe box (the size range, the
 *                                    headline, one button), and two side
 *                                    campaigns on plinths (boots, heels); the
 *                                    page's one moment: the headline rises
 *                                    word by word
 *   2. `categories-feature-list`     the 1st category as a large photo, the
 *                                    others in a ruled list with photos
 *   3. `products-boxed`              eight best sellers on the white stage,
 *                                    on the porcelain band
 *   4. `about-wide`                  the fit story: a headline, one wide
 *                                    photo and its caption
 *   5. `products-category-carousel`  heels (the store's 1st category)
 *   6. `service-price-menu`          the size guide: EU size to foot length
 *                                    in centimetres, and "between two sizes?
 *                                    go up in heels" (the trade's own section)
 *   7. `products-campaign`           sandals (the store's 3rd category) beside
 *                                    a campaign photo: the photo-led row
 *   8. `features-bento`              three promises beside the bordeaux tile
 *   9. `newsletter-big`              one row on the powder-blue panel
 * Chrome: `header-departments` (heels, flats, boots as the segments) and
 * `footer-ruled`. Eyebrows are set in sentence case and headings at the
 * face's own spacing (`calm`), never capitals or tightened Arabic.
 *
 * Content: the `womens-shoes` pack is Kasr's own shop ("Hanem"): the look's
 * default content and demo are the pack's, so the template and the niche's
 * edition are one store.
 *
 * Guard: `kasr.v4.json` was captured from the v4 look (an editorial
 * clothing studio) before any edit, and the edition-ready v4 matched it byte
 * for byte (commit 9e44ca80). v5 is the deliberate redesign, so its fixture
 * is a new capture (`kasr.v5.json`) and the v4 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header): hero 14928875, side campaigns
 * 27274309 and 15792209, tiles 13788573, 37853534, 38583189, 5863649, story
 * 40773101, campaign 16217395; products are the pack's white packshots. No
 * people, feet, legs, logos or lettering.
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
import { WOMENS_SHOES } from "../editions/packs/shoes-bags/womens-shoes";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const KASR_KEY = "kasr";

const lib = (id: string, patch: LibraryPatch = {}): Design =>
  fromLibrary(KASR_KEY, getDesign(id)!, { corners: 0, ...patch });

/**
 * A library design with its nodes changed in tree order (all nodes, or those
 * of one type), for what a `nodes` patch cannot reach: nodes with no layer
 * label (eyebrows, headings, icons) or a node's motion. The tree keeps its
 * shape, only props, styles and motion change.
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

/**
 * Eyebrows in sentence case, and headings at Amiri's own spacing: the
 * library sets some eyebrows in spaced capitals and tightens display
 * headings, which crowds a naskh face.
 */
const calm = (design: Design): Design =>
  retouch(design, undefined, (node) => {
    if (node.props?.role === "eyebrow")
      return {
        ...node,
        style: {
          ...node.style,
          textTransform: "none",
          letterSpacing: "normal",
        },
      };
    if (node.type === "heading" && node.style?.letterSpacing)
      return { ...node, style: { ...node.style, letterSpacing: "normal" } };
    return node;
  });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const VIEW_ALL = L("عرض الكل", "View all");

/** The three promises' icons, in the pack's order: delivery, size exchange, help with sizing. */
const PROMISE_ICONS: readonly ElementIconName[] = ["truck", "rotate", "chat"];

/** Kasr's own content is the womens-shoes pack's shop (Hanem): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...WOMENS_SHOES.copy,
  photos: {
    hero: WOMENS_SHOES.photos.hero,
    banner: WOMENS_SHOES.photos.banner,
    story: WOMENS_SHOES.photos.story,
    ...(WOMENS_SHOES.photos.about && { about: WOMENS_SHOES.photos.about }),
    ...(WOMENS_SHOES.photos.custom && { custom: WOMENS_SHOES.photos.custom }),
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  calm(
    lib("products-category-carousel", {
      as: `category-row-${n}`,
      text: { "عرض الكل": VIEW_ALL },
      lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
    }),
  );

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Shipping) and the
 * layout stay here; what names the trade is a slot of `c`.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const size = (n: number, part: "name" | "value") =>
    x[`size-row-${n}-${part}`]!;

  // Heels, flats and boots as the segments; the row under them: new in, sandals, best sellers, the story, top rated.
  const header = lib("header-departments", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      نساء: c.nav[1]!.label,
      رجال: c.nav[3]!.label,
      أطفال: c.nav[0]!.label,
      ملابس: c.nav[2]!.label,
      أحذية: L("الأكثر طلبًا", "Best sellers"),
      شنط: c.labels.about,
      العروض: L("الأعلى تقييمًا", "Top rated"),
    },
    links: {
      "/products": [
        c.nav[1]!.href,
        c.nav[3]!.href,
        c.nav[0]!.href,
        undefined,
        NEW,
        c.nav[2]!.href,
        BEST,
        "/about",
        RATED,
      ],
    },
  });

  const footer = lib("footer-ruled", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "منتجات أصلية بضمان، توصلك لحد البيت.": c.footer.line,
      "كل المنتجات": x["shop-all"]!,
      العروض: L("الأعلى تقييمًا", "Top rated"),
      "من نحن": c.labels.about,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [SHOP, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    // The page's one moment: the shelf photo drifts as the page scrolls (still with reduced motion); the headline never animates (it is the h1).
    retouch(
      // The headline on one line on desktop, so the card ends well above the pair.
      retouch(
        calm(
          lib("hero-ticket", {
            photo: [
              c.photos.hero.wide,
              c.photos.custom["hero-side-1"]!,
              c.photos.custom["hero-side-2"]!,
            ],
            text: {
              "صورة الحملة": c.hero.alt,
              "٠١": x["hero-label"]!,
              "مجموعة الخريف": c.hero.eyebrow,
              "ألوان هادئة لأيام أطول": c.hero.title,
              "تسوّق المجموعة": c.hero.cta,
              "٠٢": x["hero-side-1-tag"]!,
              "عروض الأسبوع": x["hero-side-1-title"]!,
              "٠٣": x["hero-side-2-tag"]!,
              "هدايا مختارة": x["hero-side-2-title"]!,
            },
            links: { "/products": [SHOP, c.nav[0]!.href, c.nav[1]!.href] },
            // The label card sits at the top corner, over the empty wall: the pair stays clear below it.
            nodes: {
              التذكرة: {
                style: {
                  insetTop: "24px",
                  insetBottom: "auto",
                  maxWidth: "460px",
                },
                mobile: { insetTop: "12px", insetBottom: "auto" },
              },
            },
          }),
        ),
        "heading",
        (node) =>
          node.props?.role === "title"
            ? { ...node, style: { ...node.style, fontSize: "4xl" } }
            : node,
      ),
      "image",
      // The shelf photo (the first one) drifts as the page scrolls.
      (node, index) =>
        index === 0
          ? { ...node, props: { ...node.props, scrollEffect: "parallax" } }
          : node,
    ),
    // The 1st category large, the others as ruled rows with a portrait photo each (the library's 56px thumbs read as icons).
    retouch(
      calm(
        lib("categories-feature-list", {
          text: { الأقسام: c.categories.title, منتج: x["products-noun"]! },
          // The other categories: three rows beside the large one (one full column in the demo).
          lists: [undefined, { limit: 3 }],
          nodes: {
            قسم: { style: { paddingTop: 14, paddingBottom: 14 } },
            السطر: { style: { alignItems: "center" } },
          },
        }),
      ),
      undefined,
      (node, index) => {
        // The design writes its eyebrow and its title with the same Arabic word, so the text patch cannot tell them apart.
        if (node.props?.role === "eyebrow") {
          const line = x["categories-eyebrow"]!;
          const translations = node.props.translations as
            { en?: Record<string, string> } | undefined;
          return {
            ...node,
            props: {
              ...node.props,
              text: line.ar,
              translations: {
                ...translations,
                en: { ...translations?.en, text: line.en },
              },
            },
          };
        }
        if (node.type === "image" && node.style?.width === "56px")
          return {
            ...node,
            style: { ...node.style, width: "96px", aspectRatio: "portrait" },
          };
        void index;
        return node;
      },
    ),
    calm(
      lib("products-boxed", {
        text: { "أساسيات كل يوم": c.products.primary.title },
        links: { "/products": primaryHref(journey.primary) },
        lists: [{ source: journey.primary }],
      }),
    ),
    calm(
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
        links: { "/about": NEW },
      }),
    ),
    categoryRow(journey.rows[0]!, 1),
    // The trade's own section: EU size to foot length, set like a menu on the porcelain band.
    calm(
      lib("service-price-menu", {
        text: {
          "أسعار الخدمات": x["size-title"]!,
          "الأسعار شاملة قطع الغيار الأصلية والضمان.": x["size-line"]!,
          الموبايل: x["size-group-1"]!,
          "تغيير بطارية": size(1, "name"),
          "٦٥٠ ج.م": size(1, "value"),
          "تغيير شاشة": size(2, "name"),
          "٢٤٠٠ ج.م": size(2, "value"),
          "سوكت الشحن": size(3, "name"),
          "٤٥٠ ج.م": size(3, "value"),
          "الشاشات والبيت": x["size-group-2"]!,
          "تركيب حائط": size(4, "name"),
          "٣٥٠ ج.م": size(4, "value"),
          "ضبط رسيفر": size(5, "name"),
          "١٥٠ ج.م": size(5, "value"),
          السماعات: x["size-group-3"]!,
          "تغيير وسايد": size(6, "name"),
          "١٢٠ ج.م": size(6, "value"),
          "تنظيف وفحص": size(7, "name"),
          "٨٠ ج.م": size(7, "value"),
        },
        nodes: { "قايمة الأسعار": { style: { background: "secondary" } } },
      }),
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
          "تسوّق المجموعة": c.nav[2]!.label,
        },
        links: { "/products": c.nav[2]!.href },
        lists: [
          { source: "category", categoryIndex: journey.rows[1]!, limit: 4 },
        ],
      }),
    ),
    retouch(
      calm(
        lib("features-bento", {
          text: {
            "وعدنا ليك": L("وعدنا ليكي", "Our promise"),
            "نشتري لك كأننا بنشتري لنفسنا": x["promises-title"]!,
            "اعرف أكتر": c.labels.about,
            "توصيل سريع": c.trust[0]!.title,
            "من يوم إلى ٤ أيام لكل المحافظات": c.trust[0]!.line,
            "الدفع عند الاستلام": c.trust[1]!.title,
            "أو ادفع بالبطاقة والمحفظة": c.trust[1]!.line,
            "استرجاع سهل": c.trust[2]!.title,
            "١٤ يومًا لتغيّر رأيك": c.trust[2]!.line,
          },
        }),
      ),
      "icon",
      (node, index) => ({
        ...node,
        props: { ...node.props, name: PROMISE_ICONS[index] ?? node.props.name },
      }),
    ),
    calm(
      lib("newsletter-big", {
        text: {
          "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
          "عروض للمشتركين بس، مرة في الأسبوع.": c.newsletter.line,
        },
      }),
    ),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", c.labels.about, c.about.line),
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
        name: c.labels.about,
        seo: { title: c.labels.about, description: c.about.line },
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

export const KASR = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(KASR_KEY, "womens-shoes", { ar: 2812, en: 2812 }),
  key: KASR_KEY,
  version: 5,
  changelog: "Kasr v5: the womens-shoes template, rebuilt look-first",
  name: L("قصر", "Kasr"),
  description: L(
    "أحذية حريمي: كل جوز على قاعدة زي الجاليري، أقسام بصور، الأكثر طلبًا على خلفية بيضا، دليل مقاسات بالسنتيمتر، وحملة للصنادل. لمحلات الكعب والفلات والصنادل والبوتات.",
    "Women's shoes: each pair on its own plinth like a gallery, photo categories, best sellers on a white stage, a size guide in centimetres and a sandals campaign. For heel, flat, sandal and boot shops.",
  ),
  category: "fashion",
  style: ["luxe", "classic"],
  sortOrder: 40,
  palette: ["#ffffff", "#eef0f4", "#c9d6e6", "#6e1834"],
  colors: {
    primary: "#6e1834",
    secondary: "#eef0f4",
    background: "#ffffff",
    foreground: "#241619",
    muted: "#665b60",
    border: "#dcdee5",
    accent: "#c9d6e6",
  },
  fonts: { heading: "Amiri", body: "Tajawal" },
  radius: 0,
  productStage: WOMENS_SHOES.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.about",
    "nav.0",
    "nav.1",
    "nav.2",
    "nav.3",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story.alt",
    "story.title",
    "story.text",
    "story.cta",
    "trust.0",
    "trust.1",
    "trust.2",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    // The hero: the label card's size range, then two side campaigns (a 4:3 photo, a tag and a title each).
    "custom.hero-label",
    "photos.custom.hero-side-1",
    "photos.custom.hero-side-2",
    "custom.hero-side-1-tag",
    "custom.hero-side-1-title",
    "custom.hero-side-2-tag",
    "custom.hero-side-2-title",
    // The categories: the small line over the title, and the noun after a category's count.
    "custom.categories-eyebrow",
    "custom.products-noun",
    // The size guide: a title, a line, three group titles and seven rows (a name and a value each; groups of 3, 2, 2).
    "custom.size-title",
    "custom.size-line",
    "custom.size-group-1",
    "custom.size-group-2",
    "custom.size-group-3",
    "custom.size-row-1-name",
    "custom.size-row-1-value",
    "custom.size-row-2-name",
    "custom.size-row-2-value",
    "custom.size-row-3-name",
    "custom.size-row-3-value",
    "custom.size-row-4-name",
    "custom.size-row-4-value",
    "custom.size-row-5-name",
    "custom.size-row-5-value",
    "custom.size-row-6-name",
    "custom.size-row-6-value",
    "custom.size-row-7-name",
    "custom.size-row-7-value",
    // The campaign beside the 2nd category row, on `photos.banner`; its button is `nav.2`.
    "custom.banner-alt",
    "custom.banner-eyebrow",
    "custom.banner-title",
    "custom.banner-line",
    // The title on the bordeaux promise tile.
    "custom.promises-title",
    // The footer's link to the whole catalog.
    "custom.shop-all",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // Eight best sellers, then the store's 1st category as a row and its 3rd beside the campaign photo.
  journey: { primary: "best-sellers", rows: [1, 3] },
  defaultContent: DEFAULT_CONTENT,
  demo: WOMENS_SHOES.demo,
  productPage: {
    thumbs: "side",
    band: "paper",
    copy: WOMENS_SHOES.productPage?.copy ?? {
      reviews: L("آراء عميلاتنا", "What our customers say"),
      related: L("أحذية ممكن تعجبك", "Shoes you may like"),
    },
  },
});
