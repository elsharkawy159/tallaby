/**
 * Tibr (accessories, warm / workshop): white paper for the product stage, a
 * cordovan brown for actions and bands, a cool canvas grey for tinted rows
 * and a brass accent; Aref Ruqaa headings (a hand-lettered maker's mark) over
 * IBM Plex Sans Arabic, crisp 6px corners and a 1280px container. Built from
 * section library designs (`fromLibrary`).
 *
 * v2 (one template per niche, 2026-11-11, ROADMAP F-90,
 * docs/systems/one-template-per-niche.md §3): the belts-and-wallets niche
 * template, rebuilt look-first around a small workshop. Home, nine sections:
 *   1. `hero-fullbleed`              the workbench, copy on the photo; the
 *                                    page's one moment (`fade-exit`, the
 *                                    photo's parallax)
 *   2. `categories-captioned`        four portrait tiles with piece counts
 *   3. `products-grid`               eight best sellers on the product stage
 *   4. `about-overlap`               the workshop story on a wide photo
 *   5. `products-category-carousel`  the store's 1st category
 *   6. `features-checklist`          caring for the piece (the trade's own
 *                                    block: a photo and four care steps)
 *   7. `products-category-carousel`  the store's 2nd category
 *   8. `features-trust-band`         four promises on the canvas band
 *   9. `newsletter-strip`            one row on the cordovan
 * Chrome: `header-announcement` and `footer-line` (paper, so the cordovan
 * newsletter closes the page on its own).
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`; `DEFAULT_CONTENT` with `DEMO` is Tibr's
 * own gold workshop. v1 (the 2026-10-28 layout) was captured before the
 * redesign; v2 is a deliberate version bump with its own fixture.
 *
 * Photos: Pexels, checked by eye (2026-10-28, again 2026-11-11). Hero
 * 4155255; workshop band 4155252; care block and about page 4155250 (one
 * shoot, different sections); tiles 12290110, 13292955, 5830200, 37560446,
 * 6160287, 29538707; products as listed in `DEMO`. v2 dropped the leather
 * bags category (three products, fewer than a row of four).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels, phone } from "../library-template";
import { templatePreview } from "../preview";

export const JEWELRY_WARM_KEY = "jewelry-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(JEWELRY_WARM_KEY, getDesign(id)!, { corners: 6, ...patch });

/**
 * A library design with its nodes of one type changed in tree order, for
 * nodes a `nodes` patch cannot reach (no layer label: the hero's eyebrow, the
 * promise icons). The tree keeps its shape, only props and styles change.
 */
function retouch(design: Design, type: string, change: (node: NodeTemplate, index: number) => NodeTemplate): Design {
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const next = node.type === type ? change(node, index++) : node;
        return next.children ? { ...next, children: next.children.map(visit) } : next;
      };
      return visit(design.tree(t));
    },
  };
}

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

/** The four promises' icons, in the order a pack writes them: wrapping, a personal touch, sizing help, payment. */
const TRUST_ICONS: readonly ElementIconName[] = ["gift", "sparkles", "chat", "credit-card"];

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(4155255, 1920),
  workshop: pexels(4155252, 1600),
  care: pexels(4155250, 1200),
  // Category photos.
  catRings: pexels(12290110, 1200),
  catNecklaces: pexels(13292955, 1200),
  catEarrings: pexels(5830200, 1200),
  catBracelets: pexels(37560446, 1200),
  catBrooches: pexels(6160287, 1200),
  catSunglasses: pexels(29538707, 1200),
};

const NAME = L("تِبر", "Tibr");

/**
 * Tibr's own content: what the look is built with when no edition is applied.
 * The store name and description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  announcement: [L("توصيل لكل محافظات مصر", "Delivery across Egypt"), L("الدفع عند الاستلام", "Cash on delivery"), L("تلميع ببلاش لأي قطعة من عندنا", "Free polishing for any Tibr piece")],
  labels: { about: L("حكايتنا", "Our story") },
  hero: {
    alt: L("سلاسل وأساور دهب على سطح أبيض جنب ورق شجر ودانتيل", "Gold chains and bangles on a white surface with leaves and lace"),
    eyebrow: L("من ورشتنا في المعادي", "From our Maadi workshop"),
    title: L("دهب دافي يتلبس كل يوم", "Warm gold for every day"),
    line: L(
      "سلاسل رفيعة وغوايش وخواتم بلمسة يدوية، معمولة على مهل عشان تعيش معاكي سنين.",
      "Fine chains, bangles and rings with a handmade touch, made slowly to stay with you for years.",
    ),
    cta: L("شوفي الجديد", "See what is new"),
  },
  categories: { title: L("في الصندوق بتاعنا", "Inside our jewelry box") },
  products: {
    primary: {
      title: L("المفضّل عند عميلاتنا", "Our clients' favourites"),
      line: L("القطع اللي بتتطلب تاني وتالت.", "The pieces that are ordered again and again."),
    },
  },
  story: {
    alt: L("غويشة وسلسلة دهب في صينية خشب", "A gold bangle and chain in a wooden tray"),
    eyebrow: L("من ورشتنا", "From our workshop"),
    title: L("معمول بالإيد، عشان يتورث", "Made by hand, made to be passed on"),
    text: L(
      "بنشتغل دهب عيار ٢١ وفضة ٩٢٥ وأحجار طبيعية، بكميات صغيرة، وكل قطعة بتخلص على إيد صايغ واحد.",
      "We work in 21-karat gold, 925 silver and natural stones, in small batches, and each piece is finished by one goldsmith.",
    ),
    cta: L("اقري حكايتنا", "Read our story"),
  },
  trust: [
    { title: L("علبة هدية", "A gift box"), line: L("كل قطعة بتوصل متغلّفة", "Every piece arrives wrapped") },
    { title: L("حفر الأسامي", "Name engraving"), line: L("على الدلايات والدبل لو طلبتي", "On pendants and bands on request") },
    { title: L("مقاس الخاتم", "Ring size"), line: L("ابعتيلنا على واتساب ونساعدك", "Ask us on WhatsApp and we help") },
    { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
  ],
  newsletter: {
    title: L("رسالة من الورشة", "A letter from the workshop"),
    line: L("قطعة جديدة ونصيحة للمعة، مرة في الشهر.", "A new piece and a shine tip, once a month."),
  },
  about: {
    line: L("دهب وفضة معمولين على مهل في المعادي.", "Gold and silver made slowly in Maadi."),
    alt: L("خواتم وغوايش دهب جنب صينية خشب", "Gold rings and bangles beside a wooden tray"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("ورشة صغيرة في المعادي", "A small workshop in Maadi"),
    text: L(
      "بدأت تِبر من شنطة دهب ستي. كانت كل قطعة فيها ليها حكاية، وأنا كنت عايزة أعمل قطع لسه بتتحكي حكايات زيها.",
      "Tibr began with my grandmother's jewelry pouch. Every piece in it had a story, and I wanted to make pieces that still tell stories like hers.",
    ),
    more: L("ولسه كل قطعة بتتشطب بالإيد، وبنلمّع أي قطعة من عندنا ببلاش مهما كان عمرها.", "Every piece is still hand-finished, and we polish any Tibr piece free, whatever its age."),
    cta: L("تسوّقي المفضّل", "Shop favourites"),
  },
  contact: {
    title: L("تعالي زورينا", "Come and visit"),
    line: L(
      `١٤ شارع ٢٥٠، المعادي، القاهرة، ${phone("٠١١٢ ٦٥٣ ٠٨٧٤")}، ${handle("hello@tibr.eg")}`,
      "14 Road 250, Maadi, Cairo | +20 112 653 0874 | hello@tibr.eg",
    ),
    heading: L("اسألينا عن أي قطعة", "Ask us about any piece"),
  },
  faq: {
    line: L("الخامات والمقاسات والعناية.", "Materials, sizing and care."),
    question: L("إزاي أحافظ على لمعة الدهب؟", "How do I keep my gold shining?"),
    answer: L(
      "امسحيه بقماشة ناعمة بعد كل لبسة، وشيليه قبل الشاور والبرفان. ومرة في السنة هاتيه الورشة ونلمّعه ببلاش.",
      "Wipe it with a soft cloth after each wear and take it off before showering or perfume. Once a year, bring it to the workshop and we polish it free.",
    ),
  },
  custom: {
    // The workshop band's wide photo (`photos.banner`), its alt text.
    "banner-alt": L("خواتم وغوايش دهب جنب صينية خشب", "Gold rings and bangles beside a wooden tray"),
    // The care block beside `photos.story`: a title (≤ 6 words), one line, then four short care steps (≤ 7 words each).
    "care-title": L("عشان اللمعة تفضل", "To keep the shine"),
    "care-text": L("الدهب والفضة محتاجين حاجات بسيطة عشان يفضلوا زي يوم ما وصلوكي.", "Gold and silver need a few simple habits to stay as they arrived."),
    "care-point-1": L("امسحي القطعة بقماشة ناعمة بعد اللبس", "Wipe each piece with a soft cloth"),
    "care-point-2": L("شيليها قبل الشاور والبرفان", "Take it off before showers and perfume"),
    "care-point-3": L("خزّني كل قطعة في كيسها لوحدها", "Keep each piece in its own pouch"),
    "care-point-4": L("هاتيها الورشة مرة في السنة نلمّعها", "Bring it in once a year to polish"),
  },
  photos: {
    hero: { wide: PHOTOS.hero },
    banner: PHOTOS.workshop,
    story: PHOTOS.care,
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number, n: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${n}`,
    text: { "عرض الكل": L("عرض الكل", "View all") },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New in, Best sellers, Track order, View all) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;

  const header = lib("header-announcement", {
    text: {
      "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      م: initialOf(name),
      "اسم متجرك": name,
      المتجر: L("كل القطع", "Shop all"),
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("تتبّع طلبك", "Track order"),
      "من نحن": c.labels.about,
    },
    links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
  });

  const footer = lib("footer-line", {
    text: {
      م: initialOf(name),
      "اسم متجرك": name,
      "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
      "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
      "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
      "من نحن": c.labels.about,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
  });

  // The hero's eyebrow is a quiet sentence-case line here, not tracked capitals.
  const hero = retouch(
    lib("hero-fullbleed", {
      photo: [c.photos.hero.wide],
      text: {
        "صورة الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "صُنعت لتدوم معك": c.hero.title,
        "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "شوف الجديد": L("كل القطع", "Shop all"),
      },
      links: { "/products": NEW, "/products?sort=newest": SHOP },
    }),
    "text",
    (node, index) => (index === 0 ? { ...node, style: { ...node.style, textTransform: "none", letterSpacing: "normal", fontSize: "md" } } : node),
  );

  const home: Design[] = [
    hero,
    lib("categories-captioned", {
      text: { "اكتشف الأقسام": c.categories.title, "كل الأقسام": L("كل القطع", "Shop all"), منتج: L("قطعة", "pieces") },
      lists: [{ limit: 4 }],
      // Four across: a pack holds four to eight categories, the first four lead.
      nodes: { الأقسام: { style: { columns: 4 } } },
    }),
    lib("products-grid", {
      text: { "وصل حديثًا": c.products.primary.title, "أحدث المنتجات اللي نزلت المتجر.": c.products.primary.line },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
      nodes: { المنتجات: { tablet: { columns: 4 } } },
    }),
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
    categoryRow(journey.rows[0]!, 1),
    // The care block: its chip is hidden (the title says it), the steps are the pack's.
    retouch(
      lib("features-checklist", {
        person: [undefined, undefined, undefined, undefined, undefined, c.photos.story],
        text: {
          "فريق يجهز الطلبات": c.story.alt,
          "كيف نعمل": L("العناية", "Care"),
          "كل طلب يُراجع مرتين": x["care-title"]!,
          "قبل أن يخرج من المخزن نراجع المنتج والتغليف والفاتورة.": x["care-text"]!,
          "كل منتج يُفحص قبل الشحن": x["care-point-1"]!,
          "تغليف محكم ومبطّن": x["care-point-2"]!,
          "فاتورة وضمان داخل العلبة": x["care-point-3"]!,
          "رقم تتبع على واتساب": x["care-point-4"]!,
          "اعرف أكثر": L("أسئلة العناية والمقاسات", "Care and sizing questions"),
        },
        links: { "/about": "/faq" },
      }),
      "badge",
      (node) => ({ ...node, style: { ...node.style, hidden: true }, breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, hidden: true }, mobile: { ...node.breakpointStyles?.mobile, hidden: true } } }),
    ),
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
      (node, index) => ({ ...node, props: { ...node.props, name: TRUST_ICONS[index] ?? node.props.name } }),
    ),
    lib("newsletter-strip", {
      text: { "اعرف الجديد الأول": c.newsletter.title, "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": c.newsletter.line },
    }),
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
      { slug: "about", name: c.labels.about, seo: { title: c.labels.about }, sections: about },
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

const DEMO = demoStore({
  name: NAME,
  description: L("دهب وفضة معمولين على مهل في المعادي.", "Gold and silver made slowly in Maadi."),
  categories: [
    ["rings", "الخواتم والدبل", "Rings & bands", PHOTOS.catRings],
    ["necklaces", "السلاسل", "Necklaces", PHOTOS.catNecklaces],
    ["earrings", "الحلقان", "Earrings", PHOTOS.catEarrings],
    ["bracelets", "الأساور والخرز", "Bracelets & beads", PHOTOS.catBracelets],
    ["brooches", "البروشات والشعر", "Brooches & hair", PHOTOS.catBrooches],
    ["sunglasses", "النضارات الشمس", "Sunglasses", PHOTOS.catSunglasses],
  ],
  products: [
    // Rings & bands
    ["twin-wedding-bands", "rings", "دبلتين دهب", "Gold Wedding Bands", P(9080072), 21500, { rating: 4.9, sold90: 48 }],
    ["gold-ring-trio", "rings", "تلات خواتم دهب", "Gold Ring Trio", P(13524238), 28900, { rating: 4.8, sold90: 31 }],
    ["cluster-ring-and-band", "rings", "خاتم كلاستر ودبلة", "Cluster Ring and Band", P(7093179), 24500, { compareAtPrice: 26900, rating: 4.7, sold90: 22 }],
    ["two-tone-stacking-bands", "rings", "دبل دهب لونين", "Two-Tone Bands", P(34948823), 16900, { rating: 4.8, sold90: 27 }],
    ["bands-in-walnut-box", "rings", "دبل في علبة جوز", "Bands in a Walnut Box", P(29624003), 19800, { isFeatured: true, rating: 4.9, sold90: 25 }],
    ["two-stone-ring", "rings", "خاتم بفصين", "Two-Stone Gold Ring", P(1457801), 13500, { rating: 4.9, sold90: 36 }],
    ["stackable-ring-set", "rings", "طقم خواتم رفيعة", "Stackable Ring Set", P(10897815), 4900, { rating: 4.7, sold90: 54 }],
    ["rose-gold-bands", "rings", "دبل روز جولد", "Rose Gold Bands", P(25946875), 18500, { rating: 4.8, sold90: 19, inStock: false }],
    // Necklaces
    ["onyx-clover-pendant", "necklaces", "سلسلة برسيم عقيق", "Onyx Clover Pendant", P(33452872), 5400, { rating: 4.8, sold90: 57 }],
    ["molten-gold-pendant", "necklaces", "سلسلة دلاية دهب مموجة", "Molten Gold Pendant", P(6858599), 6900, { rating: 4.9, sold90: 42 }],
    ["vintage-locket-set", "necklaces", "سلاسل دلايات فينتدج", "Vintage Locket Set", P(38492235), 6900, { rating: 4.7, sold90: 29 }],
    ["curb-chain-necklace", "necklaces", "سلسلة كارتييه عريضة", "Gold Curb Chain", P(28900486), 9800, { compareAtPrice: 11200, rating: 4.8, sold90: 33 }],
    ["embroidered-pendants", "necklaces", "سلاسل دلايات مطرزة", "Embroidered Pendants", P(35756968), 2400, { rating: 4.7, sold90: 21 }],
    ["sequin-chain-necklace", "necklaces", "سلسلة ترتر دهب", "Gold Sequin Chain", P(10897849), 4600, { isFeatured: true, rating: 4.6, sold90: 25 }],
    ["gold-charm-plate", "necklaces", "طقم سلاسل وتشارمز", "Chain and Charm Set", P(8105117), 8600, { rating: 4.5, sold90: 18 }],
    ["chunky-link-chains", "necklaces", "سلاسل جنزير تقيل", "Chunky Link Chains", P(10816570), 12400, { rating: 4.8, sold90: 16 }],
    // Earrings
    ["emerald-chandeliers", "earrings", "حلق شاندلييه زمرد", "Emerald Chandeliers", P(32989030), 14500, { rating: 4.9, sold90: 26 }],
    ["gold-ball-studs", "earrings", "حلق كور دهب", "Gold Ball Studs", P(17368722), 2600, { rating: 4.8, sold90: 63 }],
    ["twisted-gold-hoops", "earrings", "حلق هوب مبروم", "Twisted Gold Hoops", P(26592836), 5800, { rating: 4.7, sold90: 44 }],
    ["filigree-drop-earrings", "earrings", "حلق فيليجري مدلدل", "Filigree Drops", P(32989025), 11200, { isFeatured: true, rating: 4.8, sold90: 22 }],
    ["honeycomb-huggies", "earrings", "حلق هاجي خلية نحل", "Honeycomb Huggies", P(32797484), 6400, { compareAtPrice: 7200, rating: 4.7, sold90: 31 }],
    ["silver-jhumka-studs", "earrings", "حلق فضة ولولي", "Silver Pearl Studs", P(22821354), 3200, { rating: 4.6, sold90: 24 }],
    ["star-lattice-earrings", "earrings", "حلق نجمة مفرغة", "Star Lattice Earrings", P(38404664), 7900, { rating: 4.8, sold90: 17 }],
    ["hoop-star-charm", "earrings", "حلق هوب بنجمة", "Hoop with Star Charm", P(34372559), 2900, { rating: 4.5, sold90: 28 }],
    // Bracelets & beads
    ["shell-charm-bracelet", "bracelets", "أسورة تشارمز صدف", "Shell Charm Bracelet", P(38909356), 3900, { rating: 4.8, sold90: 38 }],
    ["howlite-charm-bracelet", "bracelets", "أسورة هاوليت", "Howlite Charm Bracelet", P(20768643), 1250, { rating: 4.7, sold90: 34 }],
    ["wooden-bead-bracelets", "bracelets", "أساور خرز خشب", "Wooden Bead Bracelets", P(19029553), 650, { rating: 4.6, sold90: 59 }],
    ["mookaite-bead-bracelet", "bracelets", "أسورة خرز موكايت", "Mookaite Bracelet", P(11051718), 950, { rating: 4.7, sold90: 27 }],
    ["silver-sea-charm-bracelet", "bracelets", "أسورة تشارمز بحر", "Sea Charm Bracelet", P(38827930), 2800, { compareAtPrice: 3200, rating: 4.8, sold90: 22 }],
    ["aqua-jasper-bracelet", "bracelets", "أسورة جاسبر وأكوا", "Aqua Jasper Bracelet", P(11178580), 890, { rating: 4.6, sold90: 31 }],
    ["pearl-seed-bracelet", "bracelets", "أسورة لولي رفيعة", "Seed Pearl Bracelet", P(11075158), 1450, { rating: 4.9, sold90: 25 }],
    ["rosewood-bead-bracelet", "bracelets", "أسورة خرز خشب ورد", "Rosewood Bead Bracelet", P(31005906), 780, { rating: 4.5, sold90: 19 }],
    // Brooches & hair
    ["vintage-pearl-brooch", "brooches", "بروش لولي فينتدج", "Vintage Pearl Brooch", P(4974342), 2600, { isFeatured: true, rating: 4.8, sold90: 23 }],
    ["tortoise-clip-pair", "brooches", "مشبكين شعر", "Claw Clip Pair", P(18421514), 450, { rating: 4.6, sold90: 46 }],
    ["wooden-comb-pair", "brooches", "مشطين خشب", "Wooden Comb Pair", P(11751917), 350, { rating: 4.7, sold90: 39 }],
    ["filigree-lace-brooch", "brooches", "بروش فيليجري", "Filigree Brooch", P(37736472), 1800, { rating: 4.7, sold90: 14 }],
    ["daisy-pearl-brooch", "brooches", "بروش وردة باللولي", "Daisy Pearl Brooch", P(17434773), 3900, { rating: 4.9, sold90: 18 }],
    ["pearl-blossom-comb", "brooches", "مشط شعر ورد ولولي", "Pearl Blossom Comb", P(8281562), 1650, { rating: 4.8, sold90: 21 }],
    // Sunglasses
    ["tortoise-cat-eye", "sunglasses", "نضارة كات آي ترتر", "Tortoise Cat-Eye", P(10837797), 1650, { rating: 4.7, sold90: 32 }],
    ["round-wire-sunglasses", "sunglasses", "نضارة مدورة سلك", "Round Wire Sunglasses", P(3030690), 1250, { rating: 4.6, sold90: 26 }],
    ["white-cat-eye", "sunglasses", "نضارة كات آي بيضا", "White Cat-Eye", P(27347004), 1350, { rating: 4.5, sold90: 21 }],
    ["burgundy-round-sunglasses", "sunglasses", "نضارة مدورة نبيتي", "Burgundy Round", P(40474279), 1750, { rating: 4.7, sold90: 15 }],
  ],
});

export const JEWELRY_WARM = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(JEWELRY_WARM_KEY, "belts-wallets", { ar: 2798, en: 2798 }),
  key: JEWELRY_WARM_KEY,
  version: 2,
  name: L("تِبر", "Tibr"),
  description: L(
    "ورشة صغيرة بروح دافية: صورة الورشة بعرض الشاشة، أقسام بصور طولية، حكاية الصنعة وركن للعناية بالقطعة. للجلديات والقطع المعمولة باليد.",
    "A small workshop with a warm voice: the workbench full width, portrait category tiles, the craft story and a care corner. For leather goods and handmade pieces.",
  ),
  category: "jewelry",
  style: ["warm"],
  sortOrder: 1430,
  palette: ["#ffffff", "#e3e6e0", "#5b2a22", "#a87b2f"],
  colors: {
    primary: "#5b2a22",
    secondary: "#e3e6e0",
    background: "#ffffff",
    foreground: "#2a1d17",
    muted: "#695e57",
    border: "#d8d5ce",
    accent: "#a87b2f",
  },
  fonts: { heading: "Aref Ruqaa", body: "IBM Plex Sans Arabic" },
  radius: 6,
  containerMaxWidth: 1280,
  productStage: { ratio: "1:1", fit: "cover" },
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
    "products.primary.line",
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
    "custom.banner-alt",
    "custom.care-title",
    "custom.care-text",
    "custom.care-point-1",
    "custom.care-point-2",
    "custom.care-point-3",
    "custom.care-point-4",
    // 16:9, cropped tall on phones with the copy on it.
    "photos.hero.wide",
    // 21:9: the workshop band (`about-overlap`).
    "photos.banner",
    // 4:5: the care block, and the about page when there is no `photos.about`.
    "photos.story",
  ],
  // `photos.about`: the about page's photo (default: `photos.story`).
  optional: ["photos.about"],
  // The eight best sellers, then the store's 1st and 2nd categories as rows.
  journey: { primary: "best-sellers", rows: [1, 2] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من عملائنا", "From our clients"), related: L("قطع تليق معاها", "Pieces that suit it") },
  },
});
