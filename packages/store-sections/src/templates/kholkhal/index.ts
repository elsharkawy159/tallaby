/**
 * Kholkhal (accessories, the hair-accessories niche template; one template
 * per niche, ROADMAP F-90, `docs/systems/one-template-per-niche.md`): claw
 * clips, scrunchies, headbands and pins for a young shop at pocket-money
 * prices. White paper for the product stage, a lilac tint, a cherry red for
 * actions and a butter yellow for the promise band; Lemonada headings (round
 * and bouncy, like a scrunchie) over Rubik; soft 18px corners. Built from
 * section library designs (`fromLibrary`).
 *
 * v3 (2026-11-11): rebuilt look-first around the pieces. Home, nine sections:
 *   1. `hero-carousel`               three colour stories (everyday clips,
 *                                    claw clips, small gifts); the page's
 *                                    one moment is the slides changing
 *   2. `categories-chips`            four photo cards with a piece count
 *   3. `products-minimal`            ten best sellers on the white stage
 *   4. `about-split-story`           every clip tested, every order tied
 *                                    with a bow (the photo's scroll zoom is
 *                                    off: only its reveal moves)
 *   5. `products-category-carousel`  the store's 1st category (claw clips)
 *   6. `finder-sentence`             shop by hair type: three ready-made
 *                                    searches ("a big claw clip for thick
 *                                    hair under EGP 250"), the trade's own
 *                                    section
 *   7. `products-campaign`           the store's 2nd category (scrunchies)
 *                                    beside a fabric photo: the photo-led
 *                                    product row
 *   8. `features-ticker`             four promises on the butter band
 *   9. `newsletter-classic`          one row on the lilac panel
 * Chrome: `header-classic` (one announcement line, pill menu) and
 * `footer-centered` (the cherry close). Eyebrows are set in sentence case,
 * never capitals.
 *
 * Content: the `hair-accessories` pack is Kholkhal's own shop ("Fyonka"):
 * the look's default content and demo are the pack's, so the template and
 * the niche's edition are one store.
 *
 * Guard: `kholkhal.v2.json` was captured from the v2 look (a gold-plated
 * jewellery shop) before any edit. v3 is a deliberate redesign, so its
 * fixture is a new capture (`kholkhal.v3.json`) and the v2 one is deleted
 * (`../editions/look-guard.test.ts`).
 *
 * Photos: the pack's (see its header): hero 8468179, slides 20178660 and
 * 31702117, tiles 20166053, 6044137, 27592172, 9750766, campaign 15130427,
 * story 30056548, about page 4491555; products are the pack's white
 * packshots. No people, hair on a head, hands, logos or lettering.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import { HAIR_ACCESSORIES } from "../editions/packs/jewelry/hair-accessories";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";

export const KHOLKHAL_KEY = "kholkhal";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KHOLKHAL_KEY, getDesign(id)!, { corners: 18, ...patch });

/**
 * A library design with its nodes changed in tree order (all nodes, or those
 * of one type), for what a `nodes` patch cannot reach: nodes with no layer
 * label (eyebrows, headings, icons) or a node's motion. The tree keeps its
 * shape, only props, styles and motion change.
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

/** Eyebrows in sentence case: the library sets hero eyebrows in tracked capitals. */
const calm = (design: Design): Design =>
  retouch(design, undefined, (node) =>
    node.props?.role === "eyebrow" ? { ...node, style: { ...node.style, textTransform: "none", letterSpacing: "normal" } } : node,
  );

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const CHEAPEST = "/products?sort=price-low";

const VIEW_ALL = L("عرض الكل", "View all");

/** The four promises' icons, in the order a pack writes them: delivery, cash on delivery, exchange, gift wrapping. */
const TRUST_ICONS: readonly ElementIconName[] = ["truck", "credit-card", "rotate", "gift"];

/** Kholkhal's own content is the hair-accessories pack's shop (Fyonka): one source for the template and its edition. */
const DEFAULT_CONTENT: LookDefaults = {
  ...HAIR_ACCESSORIES.copy,
  photos: {
    hero: HAIR_ACCESSORIES.photos.hero,
    banner: HAIR_ACCESSORIES.photos.banner,
    story: HAIR_ACCESSORIES.photos.story,
    ...(HAIR_ACCESSORIES.photos.about && { about: HAIR_ACCESSORIES.photos.about }),
    ...(HAIR_ACCESSORIES.photos.custom && { custom: HAIR_ACCESSORIES.photos.custom }),
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/** A product list's heading and copy in the panel's ink (the library sets them on the brand colour). */
const onPanel = (node: NodeTemplate): NodeTemplate =>
  node.props?.role === "title" || node.props?.role === "subtitle" ? { ...node, style: { ...node.style, color: "foreground", opacity: 100 } } : node;

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels (New in, Best sellers, Shipping) and the
 * layout stay here; what names the trade is a slot of `c`.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const x = c.custom;

  const header = lib("header-classic", {
    text: {
      "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": c.announcement[0]!,
      م: initialOf(name),
      "اسم متجرك": name,
      المتجر: L("كل التوك", "Shop all"),
      العروض: L("وصل جديد", "New in"),
      المدونة: L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about,
      "تواصل معنا": L("تواصلي معانا", "Contact"),
      "ابحث عن منتج": c.labels.search,
    },
    links: { "/products": [SHOP, NEW, SHOP], "/blog": BEST },
  });

  const footer = lib("footer-centered", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": c.footer.line,
      "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
      "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
      "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
      "من نحن": L(aboutName.ar, "About"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
  });

  const home: Design[] = [
    // The page's one moment: three colour stories that change on their own (paused with reduced motion).
    calm(
      lib("hero-carousel", {
        photo: [c.photos.hero.wide, c.photos.custom["hero-2"], c.photos.custom["hero-3"]],
        text: {
          "صورة الحملة الأولى": c.hero.alt,
          "وصل حديثًا": c.hero.eyebrow,
          "الموسم الجديد وصل": c.hero.title,
          "قطع مختارة بعناية، وتوصيل لحد باب البيت.": c.hero.line,
          "تسوّق الجديد": c.hero.cta,
          "صورة الحملة الثانية": x["hero-2-alt"]!,
          "الأكثر مبيعًا": x["hero-2-eyebrow"]!,
          "المفضّلة عند عملائنا": x["hero-2-title"]!,
          "القطع اللي بترجع لها كل مرة.": x["hero-2-line"]!,
          "شوف الأكثر مبيعًا": c.nav[0]!.label,
          "صورة الحملة الثالثة": x["hero-3-alt"]!,
          "عروض الأسبوع": x["hero-3-eyebrow"]!,
          "خصومات لفترة محدودة": x["hero-3-title"]!,
          "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": x["hero-3-line"]!,
          "تسوّق العروض": x["hero-3-cta"]!,
        },
        links: { "/products": [NEW, c.nav[0]!.href, CHEAPEST] },
      }),
    ),
    lib("categories-chips", {
      text: { "إيه اللي في بالك؟": c.categories.title },
      // One row of four on desktop: a store with more categories reaches them from the menu.
      lists: [{ limit: 4 }],
    }),
    lib("products-minimal", {
      text: {
        "الأكثر طلباً": c.products.primary.title,
        "الأكثر مبيعاً": L("الأكثر طلبًا", "Best sellers"),
        الجديد: L("وصل جديد", "New in"),
        "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
        "عرض الكل": VIEW_ALL,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
      // Tablets: five across, so the ten best sellers fill two rows. The packshots sit on white with a hairline (the library frames them on the tint).
      nodes: {
        المنتجات: { tablet: { columns: 5 } },
        "صورة المنتج": { style: { background: "background", borderWidth: 1, borderColor: "border" } },
      },
    }),
    // The story photo keeps its reveal but not the scroll zoom: the hero is the page's one moment.
    retouch(
      calm(
        lib("about-split-story", {
          photo: [undefined, undefined, c.photos.story],
          text: {
            "صورة القصة": c.story.alt,
            "من ورشتنا": c.story.eyebrow,
            "متصمم عشانك ومعمول في القاهرة": c.story.title,
            "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": c.story.text,
            "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": x["story-more"]!,
            حكايتنا: c.story.cta,
          },
        }),
      ),
      "image",
      (node) => {
        if (!node.props.scrollEffect) return node;
        const { scrollEffect: _zoom, ...props } = node.props;
        return { ...node, props };
      },
    ),
    categoryRow(journey.rows[0]!, 1),
    lib("finder-sentence", {
      text: {
        "ساعدني أختار": L("حسب شعرك", "By hair type"),
        "قول إنت عايز إيه": c.finder.title,
        عايز: L("عايزة", "I want"),
        عشان: L("عشان", "for"),
        "بأقل من": L("بأقل من", "under"),
        سماعة: c.finder.options[0]!.label,
        الجيم: x["finder-1-for"]!,
        "١٠٠٠ ج.م": x["finder-1-under"]!,
        "ساعة ذكية": c.finder.options[1]!.label,
        الجري: x["finder-2-for"]!,
        "٢٠٠٠ ج.م": x["finder-2-under"]!,
        شاحن: c.finder.options[2]!.label,
        السفر: x["finder-3-for"]!,
        "٥٠٠ ج.م": x["finder-3-under"]!,
      },
      links: { "/products": c.finder.options.slice(0, 3).map((o) => o.href) },
    }),
    lib("products-campaign", {
      as: "category-row-2",
      photo: [undefined, undefined, undefined, c.photos.banner],
      text: {
        "صورة الحملة": x["banner-alt"]!,
        "الخط الجديد": x["banner-eyebrow"]!,
        "اختارناها لك بعناية": x["banner-title"]!,
        "قطع جديدة من خطنا الجديد، معمولة عشان تعيش معاك.": x["banner-line"]!,
        "تسوّق المجموعة": c.nav[1]!.label,
      },
      links: { "/products": c.nav[1]!.href },
      lists: [{ source: "category", categoryIndex: journey.rows[1]!, limit: 4 }],
    }),
    retouch(
      lib("features-ticker", {
        text: {
          "توصيل سريع": c.trust[0]!.title,
          "الدفع عند الاستلام": c.trust[1]!.title,
          "استرجاع سهل": c.trust[2]!.title,
          "دعم على واتساب": c.trust[3]!.title,
        },
      }),
      "icon",
      // Icons alternate with the stars between promises: the promise icons are the even ones.
      (node, index) => (index % 2 === 0 ? { ...node, props: { ...node.props, name: TRUST_ICONS[index / 2] ?? node.props.name } } : node),
    ),
    // One row on the lilac panel, so the cherry footer closes the page on its own.
    retouch(
      lib("newsletter-classic", {
        text: {
          "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
          "اشترك وأول ما يوصل جديد أو عرض للمشتركين هتعرف.": c.newsletter.line,
        },
        nodes: { اللوحة: { style: { background: "secondary" } } },
      }),
      undefined,
      onPanel,
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

export const KHOLKHAL = editionTemplate({
  key: KHOLKHAL_KEY,
  version: 3,
  changelog: "Kholkhal v3: the hair-accessories template, rebuilt look-first",
  productPage: {
    thumbs: "side",
    gallery: "end",
    surface: "flat",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("قالوا إيه عن التوكة دي", "What buyers say"), related: L("تتلبس معاها", "Wear it with") },
  },
  name: L("خلخال", "Kholkhal"),
  description: L(
    "إكسسوارات شعر: بانرات بألوان الموسم، أقسام بصور، توك على خلفية بيضا، جمل جاهزة تختاري بيها حسب نوع شعرك، وحملة للسكرانشي. لمحلات التوك والسكرانشي والهدايا الصغيرة.",
    "Hair accessories: colour-story banners, photo category cards, clips on a white stage, ready-made searches by hair type and a scrunchie campaign. For clip, scrunchie and small-gift shops.",
  ),
  category: "jewelry",
  style: ["warm"],
  sortOrder: 1070,
  palette: ["#ffffff", "#efe9fa", "#f4d35e", "#a3173a"],
  colors: {
    primary: "#a3173a",
    secondary: "#efe9fa",
    background: "#ffffff",
    foreground: "#25183a",
    muted: "#65597a",
    border: "#e4dcf1",
    accent: "#f4d35e",
  },
  fonts: { heading: "Lemonada", body: "Rubik" },
  radius: 18,
  productStage: HAIR_ACCESSORIES.productStage,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.about",
    "labels.search",
    "nav.0",
    "nav.1",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story",
    "finder.title",
    "finder.options.0",
    "finder.options.1",
    "finder.options.2",
    "trust.0.title",
    "trust.1.title",
    "trust.2.title",
    "trust.3.title",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    // Hero slides 2 and 3: a photo, an alt, an eyebrow, a title and a line each; slide 2's button is `nav.0`, slide 3's has its own label.
    "photos.custom.hero-2",
    "photos.custom.hero-3",
    "custom.hero-2-alt",
    "custom.hero-2-eyebrow",
    "custom.hero-2-title",
    "custom.hero-2-line",
    "custom.hero-3-alt",
    "custom.hero-3-eyebrow",
    "custom.hero-3-title",
    "custom.hero-3-line",
    "custom.hero-3-cta",
    // The story's second paragraph.
    "custom.story-more",
    // The finder's sentences: "I want <option N> for <finder-N-for> under <finder-N-under>".
    "custom.finder-1-for",
    "custom.finder-1-under",
    "custom.finder-2-for",
    "custom.finder-2-under",
    "custom.finder-3-for",
    "custom.finder-3-under",
    // The campaign beside the 2nd category row, on `photos.banner`; its button is `nav.1`.
    "custom.banner-alt",
    "custom.banner-eyebrow",
    "custom.banner-title",
    "custom.banner-line",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // The ten best sellers, then the store's 1st category as a row and its 2nd beside the campaign photo.
  journey: { primary: "best-sellers", rows: [1, 2] },
  defaultContent: DEFAULT_CONTENT,
  demo: HAIR_ACCESSORIES.demo,
});
