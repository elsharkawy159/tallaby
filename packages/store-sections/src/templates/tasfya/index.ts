/**
 * Tasfya (shoes & bags, the slippers-clogs niche template; one template per
 * niche, ROADMAP F-90, `docs/systems/one-template-per-niche.md`): a summer
 * and home footwear shop set by the pool. White paper for the product
 * stage, a shallow-water aqua tint, the deep end's teal for the poster and
 * actions, and a pool-float pink for the size sticker and the cart; Baloo Bhaijaan 2 headings (round and soft, moulded like a rubber
 * clog) over Readex Pro; 20px corners, the curve of a clog's toe. Built from
 * section library designs (`fromLibrary`).
 *
 * v4 (2026-11-12): rebuilt look-first around the pair. Home, nine sections:
 *   1. `hero-poster`                 a printed pool poster on the deep teal:
 *                                    a line on top, the pool deck photo (a
 *                                    pair of polka-dot flip-flops beside the
 *                                    water) with the round pink size sticker
 *                                    on its top edge, then the headline. The
 *                                    page's one moment: the photo zooms
 *                                    slowly as the page scrolls (transform
 *                                    only, still with reduced motion)
 *   2. `categories-portrait-labels`  four tall category photos, rounded
 *   3. `products-feature`            the pick of the week large on the white
 *                                    stage, four of the newest beside it
 *   4. `finder-use`                  the trade's own section: "where will
 *                                    you wear them?" (beach, pool and
 *                                    shower, errands, home), each a link to
 *                                    its pairs, on the aqua band
 *   5. `products-category-carousel`  clogs (the store's 1st category)
 *   6. `about-two-tone`              the story and the photo-led break in
 *                                    one: beach towels on sand beside the
 *                                    teal half ("from the front door to the
 *                                    beach")
 *   7. `products-category-carousel`  flip-flops (the 3rd category)
 *   8. `features-classic`            four promises between two hairlines
 *   9. `newsletter-ruled`            one row
 * Chrome: `header-pill` (a floating ink capsule, the cart in pink) and
 * `footer-centered` on the teal. Eyebrows are set in sentence case and
 * headings at the face's own spacing (`calm`), never capitals or
 * tightened Arabic. The outlet's v3 sections (shop by budget, open before
 * you pay, reviews) are gone.
 *
 * QA fixes (2026-11-12, still v4, not released): the poster photo is a 21:9
 * band on desktop (16:9 on phones) so the headline and button end inside a
 * 1280×900 first screen; the promises lose their closing rule (the
 * newsletter's top rule follows); the finder's pills hold two lines, so all
 * four are one height; the product page shows the pack's sizes, description
 * and promises (`productPage.copy.perks`).
 *
 * Content: the `slippers-clogs` pack is Tasfya's own shop ("Zannouba"): the
 * look's default content and demo are the pack's, so the template and the
 * niche's edition are one store.
 *
 * Guard: `tasfya.v3.json` was captured from the v3 outlet before any edit,
 * and the edition-ready v3 matched it byte for byte (commit 38347df4). v4
 * is the deliberate redesign, so its fixture is a new capture
 * (`tasfya.v4.json`) and the v3 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header): hero 9308418 (cropped 21:9 and
 * zoomed around the pair), tiles 8801134, 13836590, 27719438, 12969102, banner 18674213
 * (the home story), about page 34667259; products are the pack's white packshots. No people,
 * feet, logos or lettering.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import { SLIPPERS_CLOGS } from "../editions/packs/shoes-bags/slippers-clogs";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { templatePreview } from "../preview";

export const TASFYA_KEY = "tasfya";

const RADIUS = 20;

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TASFYA_KEY, getDesign(id)!, { corners: RADIUS, ...patch });

/**
 * A library design with its nodes changed in tree order (all nodes, or those
 * of one type), for what a `nodes` patch cannot reach: nodes with no layer
 * label (eyebrows, headings, icons) or a node's motion. The tree keeps its
 * shape, only props and styles change.
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

/**
 * Eyebrows in sentence case, and headings at Baloo's own spacing: the
 * library sets some eyebrows in spaced capitals and tightens display
 * headings, which crowds Arabic.
 */
const calm = (design: Design): Design =>
  retouch(design, undefined, (node) => {
    if (node.props?.role === "eyebrow") return { ...node, style: { ...node.style, textTransform: "none", letterSpacing: "normal" } };
    if (node.type === "heading" && node.style?.letterSpacing) return { ...node, style: { ...node.style, letterSpacing: "normal" } };
    return node;
  });

/** Hidden on every screen (a node the layout does not need; the tree keeps its shape). */
const hide = (node: NodeTemplate): NodeTemplate => ({
  ...node,
  style: { ...node.style, hidden: true },
  breakpointStyles: {
    ...node.breakpointStyles,
    tablet: { ...node.breakpointStyles?.tablet, hidden: true },
    mobile: { ...node.breakpointStyles?.mobile, hidden: true },
  },
});

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const VIEW_ALL = L("عرض الكل", "View all");

/** The four promises' icons, in the pack's order: delivery, size exchange, help with sizing, pay on delivery. */
const PROMISE_ICONS: readonly ElementIconName[] = ["truck", "rotate", "chat", "package"];

/** Tasfya's own content is the slippers-clogs pack's shop (Zannouba): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...SLIPPERS_CLOGS.copy,
  photos: {
    hero: SLIPPERS_CLOGS.photos.hero,
    banner: SLIPPERS_CLOGS.photos.banner,
    story: SLIPPERS_CLOGS.photos.story,
    ...(SLIPPERS_CLOGS.photos.about && { about: SLIPPERS_CLOGS.photos.about }),
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
 * The hero: the pool poster. The size sticker sits on the photo's top edge
 * (the pair lies at its foot), and the photo zooms slowly as the page
 * scrolls: the page's one moment. The headline never animates (it is the h1).
 */
function hero(c: LookContent): Design {
  const x = c.custom;
  const poster = calm(
    lib("hero-poster", {
      photo: [undefined, undefined, c.photos.hero.wide],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "من ١ إلى ٣٠ نوفمبر": c.announcement[0]!,
        "صورة الحملة": c.hero.alt,
        خصم: x["hero-sticker-1"]!,
        "٣٠٪": x["hero-sticker-2"]!,
        "لفترة محدودة": x["hero-sticker-3"]!,
        "الموسم الجديد وصل": c.hero.title,
        "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": c.hero.line,
        "اكتشف المجموعة": c.hero.cta,
      },
      links: { "/products": NEW },
      nodes: {
        الملصق: {
          style: { insetTop: "-36px", insetBottom: "auto", background: "accent" },
          mobile: { insetTop: "-28px", insetBottom: "auto" },
        },
        // Closer to the photo, so the headline and its button end inside the first desktop screen (1280×900).
        العنوان: { style: { marginTop: 28 } },
      },
    }),
  );
  return retouch(poster, undefined, (node) => {
    // The size range fits the round sticker on phones.
    if (node.type === "heading" && node.props?.role !== "title")
      return { ...node, style: { ...node.style, fontSize: "3xl" }, breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, fontSize: "2xl" } } };
    // A 21:9 band on desktop (16:9 there pushed the headline below the first screen); 16:9 on phones, where the copy sits under it.
    if (node.type === "image")
      return {
        ...node,
        props: { ...node.props, scrollEffect: "zoom" },
        style: { ...node.style, aspectRatio: "banner" },
        breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "wide", keepRatio: true } },
      };
    return node;
  });
}

/** Where the pair is worn: four places, each a link to its pairs (the finder's own grid of products is hidden, so the band stays short). */
function finder(c: LookContent): Design {
  const [beach, pool, errands, home] = c.finder.options;
  const band = calm(
    lib("finder-use", {
      text: {
        "ساعدني أختار": L("ساعدني أختار", "Help me choose"),
        "هتستخدمها في إيه؟": c.finder.title,
        "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": c.finder.line,
        المشاوير: beach!.label,
        الرياضة: pool!.label,
        المكالمات: errands!.label,
        "الشغل من البيت": home!.label,
      },
      links: { "/products": [beach!.href, pool!.href, errands!.href, home!.href] },
      nodes: {
        // The places as plain pills: the library's icons (a pin, a heart, a phone, a person) name other trades.
        أيقونة: { style: { hidden: true }, tablet: { hidden: true }, mobile: { hidden: true } },
        استخدام: { style: { background: "background", minHeight: 64, justifyContent: "center" } },
        // Room for two lines in every pill, the label centred in it: one-line places ("On the beach") matched their two-line neighbours on phones.
        المحتوى: { style: { minHeight: 44 } },
      },
    }),
  );
  return retouch(band, undefined, (node) => {
    if (node.type === "section") return { ...node, style: { ...node.style, background: "secondary" } };
    if (node.type === "productList" || (node.type === "text" && node.props?.text === "الأكثر طلبًا دلوقتي")) return hide(node);
    return node;
  });
}

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Shipping) and the
 * layout stay here; what names the trade is a slot of `c`.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;

  // A floating ink capsule: the store, four links, the cart in pink.
  const header = lib("header-pill", {
    text: {
      "اسم متجرك": name,
      الرئيسية: L("الرئيسية", "Home"),
      المتجر: x["shop-all"]!,
      العروض: L("وصل حديثًا", "New in"),
      المدونة: c.labels.about,
    },
    links: { "/products": [undefined, NEW], "/blog": "/about" },
  });

  // Centred on the teal: the store, its line, the social links and the help pages.
  const footer = lib("footer-centered", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": c.footer.line,
      "من نحن": c.labels.about,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
  });

  const home: Design[] = [
    hero(c),
    // Four tall photos, rounded like the rest of the page (the design squares them), each with its name and a link.
    calm(
      lib("categories-portrait-labels", {
        text: { المجموعات: c.categories.title },
        nodes: { الصورة: { style: { radius: RADIUS } } },
      }),
    ),
    // The pick of the week (the newest featured pair) large on the white stage, and four of the main list beside it.
    calm(
      lib("products-feature", {
        text: { "اختيارنا ليك": c.products.primary.title },
        lists: [undefined, { source: journey.primary, limit: 4 }],
      }),
    ),
    finder(c),
    categoryRow(journey.rows[0]!, 1),
    // The story and the photo-led break in one: the beach towels beside the teal half (no scroll scrub: the hero is the page's one moment).
    {
      ...calm(
        lib("about-two-tone", {
          photo: [undefined, undefined, c.photos.banner],
          text: {
            "صورة البانر": x["banner-alt"]!,
            "صناعة مصرية": c.story.eyebrow,
            "متعمول عشان يريّحك ويعيش معاك": c.story.title,
            "خامات مختارة وتفاصيل متشطبة بإيدينا، عشان تفضل معاك سنين.": c.story.text,
            "تسوّق الآن": c.story.cta,
          },
          links: { "/products": "/about" },
        }),
      ),
      scrollEffect: undefined,
    },
    categoryRow(journey.rows[1]!, 2),
    // The promises' closing rule is dropped: the newsletter's own top rule follows (two hairlines 66px apart read as a mistake).
    retouch(
      retouch(
        lib("features-classic", {
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
        "icon",
        (node, index) => ({ ...node, props: { ...node.props, name: PROMISE_ICONS[index] ?? node.props?.name } }),
      ),
      "divider",
      (node, index) => (index === 1 ? hide(node) : node),
    ),
    calm(
      lib("newsletter-ruled", {
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

export const TASFYA = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(TASFYA_KEY, "slippers-clogs", { ar: 2535, en: 2558 }),
  key: TASFYA_KEY,
  version: 4,
  changelog: "Tasfya v4: the slippers-clogs template, rebuilt look-first",
  name: L("تصفية", "Tasfya"),
  description: L(
    "شباشب وكلوج: بوستر حمام سباحة بملصق المقاسات، أقسام بصور طولية، أحدث موديل كبير على خلفية بيضا، هتلبسه فين، وصفوف للكلوج والشباشب الصباع. لمحلات الشباشب والكلوج والسلايد والشباشب البيتي.",
    "Slippers and clogs: a pool poster with a size sticker, tall category photos, the newest pair large on a white stage, where will you wear them, and rows of clogs and flip-flops. For slipper, clog, slide and home-slipper shops.",
  ),
  category: "shoes-bags",
  style: ["bold"],
  sortOrder: 530,
  palette: ["#ffffff", "#def2f1", "#ff8fab", "#0a6077"],
  colors: {
    primary: "#0a6077",
    secondary: "#def2f1",
    background: "#ffffff",
    foreground: "#0c2a33",
    muted: "#4f6a71",
    border: "#cfe3e3",
    accent: "#ff8fab",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Readex Pro" },
  radius: RADIUS,
  productStage: SLIPPERS_CLOGS.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.about",
    "hero",
    "categories.title",
    "products.primary.title",
    "finder",
    "story.eyebrow",
    "story.title",
    "story.text",
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
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    // The round sticker on the poster's photo: three short lines (a word, the size range, a word).
    "custom.hero-sticker-1",
    "custom.hero-sticker-2",
    "custom.hero-sticker-3",
    // The alt of the banner photo (the home story sits beside it).
    "custom.banner-alt",
    // The header's link to the whole catalog.
    "custom.shop-all",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // The newest pairs (one large, four beside it), then the store's 1st and 3rd categories (clogs, flip-flops) as rows.
  journey: { primary: "newest", rows: [1, 3] },
  defaultContent: DEFAULT_CONTENT,
  demo: SLIPPERS_CLOGS.demo,
  productPage: {
    thumbs: "bottom",
    band: "brand",
    extras: ["product-perks"],
    copy: SLIPPERS_CLOGS.productPage?.copy ?? {
      reviews: L("آراء اللي لبسوه", "From people who wear them"),
      related: L("موديلات ممكن تعجبك", "Pairs you may like"),
    },
  },
});
