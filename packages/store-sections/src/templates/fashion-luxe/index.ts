/**
 * Fashion Luxe "Hareer" (fashion niche, premium / minimal): white paper,
 * jet-black ink and a soft taupe, Reem Kufi headings over Noto Sans Arabic,
 * square corners and a wide 1400px container. Built from section library
 * designs (`fromLibrary`).
 *
 * v3 (look-first pilot, 2026-11-11, ROADMAP F-89): the home page rebuilt
 * around photos, on one product stage. Home, nine sections:
 *   1. `hero-video`                  the season's rail, copy fading out on scroll
 *   2. `categories-photo-tiles`      four portrait tiles
 *   3. `products-grid`               eight best sellers
 *   4. `about-two-tone`              the atelier story (`reveal-scrub`)
 *   5. `products-category-carousel`  shoes (the store's 3rd category)
 *   6. `gallery-shop-look`           a flat lay with three product dots
 *   7. `products-category-carousel`  bags (the store's 4th category)
 *   8. `features-classic`            the ruled promises row
 *   9. `newsletter-ruled`            no discount copy
 * Chrome: `header-centered-ticker` v2 and `footer-links` v2 (its top hairline
 * hidden: the newsletter's own closes the page).
 *
 * The shop-the-look dots show the store's three newest products, so the demo
 * lists a cream overshirt, a cable knit and a beige tote first: the pieces
 * nearest to the coat, knit and bag in the look photo.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Hareer itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 3.
 *
 * Photos and video: Pexels, checked 2026-11-11, white-studio packshots for
 * the products; no people, no logos, none shared with another template.
 * Hero video 8580858 (its poster: a rail with knits, loafers and a straw
 * tote). Category tiles: tops 5706275, knits and jackets 10838789, shoes
 * 27609337, bags 5706269. Two-tone banner 6461507. Shop the look 14577586
 * (dots: coat, knit, bag). About page 7147454.
 * Products, tops: 12025472, 11671964, 8532616, 28297697, 13181673, 20763273;
 * knits and jackets: 4641824, 5704187, 45982, 9603627, 9603630, 6044143,
 * 13094187; shoes: 15557045, 15557047, 15059774, 15059775; bags and leather:
 * 36365228, 22432987, 22432992, 22434759, 26610519, 15763948, 22434781.
 * Dropped: the dresses category (bridal gowns hanging in rooms, not
 * packshots) and every v2 product photo that was not a studio packshot.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
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
import type {
  LookContent,
  LookDefaults,
  LookJourney,
} from "../editions/types";
import {
  demoStore,
  handle,
  pexels,
  pexelsVideo,
  pexelsVideoPoster,
  phone,
} from "../library-template";
import { templatePreview } from "../preview";

export const FASHION_LUXE_KEY = "fashion-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design =>
  fromLibrary(FASHION_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

/**
 * A library design with its nodes of one type changed in tree order. For
 * what a `nodes` patch cannot reach: nodes with no layer label, or several
 * nodes sharing one label (the three dots of `gallery-shop-look`). The tree
 * keeps its shape, only props and styles change.
 */
function retouch(
  design: Design,
  type: string,
  change: (node: NodeTemplate, index: number) => NodeTemplate,
): Design {
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const next = node.type === type ? change(node, index++) : node;
        return next.children
          ? { ...next, children: next.children.map(visit) }
          : next;
      };
      return visit(design.tree(t));
    },
  };
}

/** Hides the first node of a `retouch` (a doubled hairline between two ruled sections). */
const hideFirst = (node: NodeTemplate, index: number): NodeTemplate =>
  index === 0
    ? { ...node, style: { ...node.style, borderWidth: 0, opacity: 0 } }
    : node;

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8580858, "8580858-hd_1920_1080_30fps.mp4"),
  heroPoster: pexelsVideoPoster(8580858),
  atelier: pexels(7147454, 1200),
  tools: pexels(6461507, 1600),
  look: pexels(14577586, 1400),
  // Category tiles.
  catTops: pexels(5706275, 1200),
  catKnits: pexels(10838789, 1200),
  catShoes: pexels(27609337, 1200),
  catBags: pexels(5706269, 1200),
};

const NAME = L("حرير", "Hareer");
const VIEW_ALL = L("عرض الكل", "View all");

/**
 * Hareer's own content: what the look is built with when no edition is
 * applied (the template `fashion-luxe` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  announcement: [
    L("تفاصيل ومقاسات واضحة لكل منتج", "Clear details and sizes for every product"),
    L("ملابس وأحذية وحقائب في مكان واحد", "Clothes, shoes and bags in one place"),
    L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
  ],
  labels: { about: L("من نحن", "About") },
  hero: {
    alt: L(
      "علّاقة عليها قطع تريكو وبجانبها حقيبة من القش",
      "A rail of knits beside a straw tote",
    ),
    eyebrow: L("مجموعة خريف ٢٠٢٦", "Autumn 2026"),
    title: L("قطع هادئة تدوم طويلًا", "Quiet pieces, made to last"),
    line: L(
      "قطن وصوف وجلد طبيعي في قطع مختارة بعناية.",
      "Cotton, wool and real leather in carefully chosen pieces.",
    ),
    cta: L("اكتشف المجموعة", "Explore the edit"),
  },
  categories: { title: L("تسوّق حسب القسم", "Shop by category") },
  products: {
    primary: {
      title: L("القطع الأكثر طلبًا", "Most-loved pieces"),
      line: L(
        "القطع التي يختارها العملاء أكثر.",
        "The pieces customers choose most.",
      ),
    },
  },
  story: {
    alt: L(
      "مقص وبكرات خيط ومتر قياس على طاولة خياطة",
      "Scissors, thread and a tape measure on a sewing table",
    ),
    eyebrow: L("الخامات والتفاصيل", "Materials and details"),
    title: L("التفاصيل تصنع القطعة", "It is all in the details"),
    text: L(
      "خامات مختارة وتشطيب متقن في كل قطعة.",
      "Chosen fabrics and a careful finish on every piece.",
    ),
    cta: L("اعرف أكثر", "Learn more"),
  },
  look: {
    alt: L(
      "بالطو وبلوفر بضفائر وجينز وحقيبة مبطنة على رخام أبيض",
      "A coat, a cable knit, jeans and a quilted bag laid on white marble",
    ),
    eyebrow: L("إطلالة الأسبوع", "This week's look"),
    title: L("طبقات هادئة للخريف", "Soft layers for autumn"),
    text: L(
      "اضغط على أي نقطة في الصورة لترى القطعة من المجموعة.",
      "Tap a dot on the photo to see the piece from the collection.",
    ),
  },
  trust: [
    {
      title: L("خامات مختارة", "Chosen fabrics"),
      line: L(
        "قطن وصوف وجلد طبيعي",
        "Cotton, wool and real leather",
      ),
    },
    {
      title: L("تفاصيل ومقاسات واضحة", "Clear details and sizes"),
      line: L("في صفحة كل منتج", "On every product page"),
    },
    {
      title: L("تواصل معنا", "Contact us"),
      line: L(
        "لأي سؤال عن قطعة أو مقاس",
        "With any question about a piece or a size",
      ),
    },
  ],
  newsletter: {
    title: L("اكتشف المجموعة الجديدة أولًا", "See each new collection first"),
    line: L(
      "أخبار المجموعات الجديدة في بريدك.",
      "New collections in your inbox.",
    ),
  },
  about: {
    line: L(
      "ملابس وأحذية وحقائب مختارة بعناية.",
      "Clothes, shoes and bags chosen with care.",
    ),
    alt: L(
      "مانيكان وماكينة خياطة أمام جدار أبيض",
      "A dress form and a sewing machine by a white wall",
    ),
    eyebrow: L("من نحن", "About us"),
    title: L("قطع أقل، بجودة أفضل", "Fewer pieces, better made"),
    text: L(
      "نختار قطعًا قليلة بعناية، بخامات جيدة وتشطيب متقن.",
      "We choose fewer pieces with care, in good fabrics with a careful finish.",
    ),
    more: L(
      "وفي كل صفحة منتج تفاصيل المقاسات والخامات.",
      "Every product page shows the sizes and fabrics.",
    ),
    cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L(
      `١٨ شارع أحمد باشا، جاردن سيتي، القاهرة، ${phone("+20 122 740 9315")}، ${handle("atelier@hareer.eg")}`,
      `18 Ahmed Pasha St, Garden City, Cairo | ${phone("+20 122 740 9315")} | ${handle("atelier@hareer.eg")}`,
    ),
    heading: L("لأي سؤال عن المقاسات، راسلنا", "Questions about sizing? Write to us"),
  },
  faq: {
    line: L(
      "المقاسات والخامات والطلبات.",
      "Sizes, fabrics and orders.",
    ),
    question: L(
      "كيف أختار المقاس المناسب؟",
      "How do I choose the right size?",
    ),
    answer: L(
      "ستجد جدول المقاسات في صفحة كل منتج، ولأي سؤال تواصل معنا. وراجع سياسة الاستبدال والاسترجاع في صفحة السياسات.",
      "Each product page has a size chart, and you can contact us with any question. See the exchange and return policy page.",
    ),
  },
  photos: {
    // The poster is drawn first; the video plays over it.
    hero: { wide: PHOTOS.heroPoster, video: PHOTOS.heroVideo },
    banner: PHOTOS.tools,
    story: PHOTOS.atelier,
    // The dots, in percent from the photo's left and top: the coat, the knit, the bag (the store's 1st–3rd newest).
    look: {
      src: PHOTOS.look,
      dots: [
        { x: 25, y: 41 },
        { x: 50, y: 29 },
        { x: 22, y: 77 },
      ],
    },
  },
};

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${place}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New in, Best sellers, Track order) and the layout stay here; "all pieces"
 * and "pieces" are optional custom slots.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  // Optional wording a trade may replace: the link to the whole catalog (header and footer) and the noun after a category's product count.
  const shopAll = c.custom?.["shop-all"];
  const noun = c.custom?.["products-noun"];

  const header = lib("header-centered-ticker", {
    text: {
      "تفاصيل ومقاسات واضحة لكل منتج": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تسوّق سهل من هاتفك": c.announcement[2]!,
      "اسم متجرك": name,
      المتجر: shopAll ?? L("كل القطع", "Shop all"),
      العروض: L("وصل حديثًا", "New in"),
      المدونة: L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about,
      "تواصل معنا": L("تتبّع طلبك", "Track order"),
    },
    links: {
      "/products": [undefined, undefined, NEW],
      "/blog": BEST,
      "/contact": "/profile/orders",
    },
  });

  // The newsletter above ends on its own hairline, so the footer's first one is hidden (two lines 32px apart otherwise).
  const footer = retouch(
    lib("footer-links", {
      text: {
        م: initialOf(name),
        "اسم متجرك": name,
        "كل المنتجات": shopAll ?? L("كل القطع", "All pieces"),
        "وصل حديثًا": L("وصل حديثًا", "New in"),
        "الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers"),
        "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
        "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
        "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
        "من نحن": L(aboutName.ar, "About"),
        "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      },
      links: {
        "/products": [SHOP, NEW, BEST],
        "https://wa.me/": "https://wa.me/201227409315",
      },
      // Phones: the links wrap, so a dot could end a line alone.
      nodes: { فاصل: { mobile: { hidden: true } } },
    }),
    "divider",
    hideFirst,
  );

  const video = c.photos.hero.video;
  const home: Design[] = [
    lib("hero-video", {
      photo: [c.photos.hero.wide],
      // Without a video the design shows its poster alone.
      nodes: {
        ...(video && { الفيديو: { props: { url: video } } }),
        التعتيم: { style: { opacity: 28 } },
      },
      text: {
        "فيديو الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "تصميم هادئ لكل يوم": c.hero.title,
        "قطع مختارة بعناية لكل يوم.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "اكتشف الجديد": L("وصل حديثًا", "New in"),
      },
      links: { "/products": SHOP, "/products?sort=newest": NEW },
    }),
    lib("categories-photo-tiles", {
      text: {
        "تسوّق حسب القسم": c.categories.title,
        منتج: noun ?? L("قطع", "pieces"),
      },
    }),
    lib("products-grid", {
      text: {
        "وصل حديثًا": c.products.primary.title,
        "أحدث المنتجات في المتجر.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
      // Tablets: 4 columns, so the 8 products fill two rows.
      nodes: { المنتجات: { tablet: { columns: 4 } } },
    }),
    lib("about-two-tone", {
      photo: [undefined, undefined, c.photos.banner],
      text: {
        "صورة البانر": c.story.alt,
        "مختارات المتجر": c.story.eyebrow,
        "مصنوع ليدوم طويلًا": c.story.title,
        "خامات مختارة وتفاصيل متقنة تتحمّل الاستخدام اليومي.":
          c.story.text,
        "تسوّق الآن": c.story.cta,
      },
      links: { "/products": "/about" },
    }),
    categoryRow(journey.rows[0]!),
    // Phones keep the look photo's tall crop (the design squares it), so the dots stay on their pieces.
    retouch(
      retouch(
        lib("gallery-shop-look", {
          photo: [c.photos.look.src],
          text: {
            "صورة الإطلالة": c.look.alt,
            "تسوّق الإطلالة": c.look.eyebrow,
            "كل ما في الصورة": c.look.title,
            "اضغط على أي نقطة في الصورة لترى القطعة وسعرها، وأضفها إلى السلة مباشرة.":
              c.look.text,
            "تسوّق الكل": L("وصل حديثًا", "Shop new in"),
          },
          links: { "/products": NEW },
        }),
        "hotspot",
        (node, index) => ({
          ...node,
          props: { ...node.props, ...c.photos.look.dots[index] },
        }),
      ),
      "image",
      (node, index) =>
        index === 0
          ? {
              ...node,
              breakpointStyles: {
                ...node.breakpointStyles,
                mobile: {
                  ...node.breakpointStyles?.mobile,
                  aspectRatio: "portrait",
                },
              },
            }
          : node,
    ),
    categoryRow(journey.rows[1]!),
    lib("features-classic", {
      text: {
        "الشحن": c.trust[0]!.title,
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب": c.trust[0]!.line,
        "الاستبدال والاسترجاع": c.trust[1]!.title,
        "التفاصيل في صفحة السياسات": c.trust[1]!.line,
        "تواصل معنا": c.trust[2]!.title,
        "لأي سؤال عن طلب أو منتج": c.trust[2]!.line,
      },
    }),
    // The promises row above ends on a hairline, so the newsletter's first one is hidden.
    retouch(
      lib("newsletter-ruled", {
        text: {
          "اشترك في نشرتنا البريدية": c.newsletter.title,
          "كن أول من يعرف بالمنتجات الجديدة.": c.newsletter.line,
        },
      }),
      "divider",
      hideFirst,
    ),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
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

const DEMO = demoStore({
  name: NAME,
  description: L(
    "ملابس وأحذية وحقائب مختارة بعناية.",
    "Clothes, shoes and bags chosen with care.",
  ),
  categories: [
    ["tops", "التيشيرتات والقمصان", "Tees & shirts", PHOTOS.catTops],
    ["knits", "التريكو والجواكت", "Knits & jackets", PHOTOS.catKnits],
    ["shoes", "الأحذية", "Shoes", PHOTOS.catShoes],
    ["bags", "الحقائب والجلود", "Bags & leather", PHOTOS.catBags],
  ],
  // Newest first. The first three are the shop-the-look dots: a jacket, a knit, a bag.
  products: [
    [
      "cream-overshirt",
      "knits",
      "قميص صوف واسع كريمي",
      "Cream Wool Overshirt",
      P(4641824),
      3400,
      { rating: 4.7, sold90: 21 },
    ],
    [
      "cable-knit-sweater",
      "knits",
      "بلوفر صوف بضفائر",
      "Cable Knit Sweater",
      P(5704187),
      2650,
      { isFeatured: true, rating: 4.9, sold90: 71 },
    ],
    [
      "beige-leather-tote",
      "bags",
      "حقيبة توت جلد بيج",
      "Beige Leather Tote",
      P(36365228),
      4600,
      { rating: 4.9, sold90: 49 },
    ],
    // Tees & shirts
    [
      "essential-white-tee",
      "tops",
      "تيشيرت قطن أبيض",
      "Essential White Tee",
      P(12025472),
      690,
      { rating: 4.8, sold90: 84 },
    ],
    [
      "noir-cotton-tee",
      "tops",
      "تيشيرت قطن أسود",
      "Noir Cotton Tee",
      P(8532616),
      690,
      { rating: 4.8, sold90: 38 },
    ],
    [
      "navy-check-shirt",
      "tops",
      "قميص كاروه كحلي",
      "Navy Check Shirt",
      P(28297697),
      1390,
      { rating: 4.7, sold90: 55 },
    ],
    [
      "zip-polo-knit",
      "tops",
      "بولو تريكو بسحّاب",
      "Zip Polo Knit",
      P(20763273),
      1650,
      { rating: 4.8, sold90: 33 },
    ],
    [
      "striped-tee",
      "tops",
      "تيشيرت مقلم",
      "Striped Tee",
      P(13181673),
      850,
      { compareAtPrice: 990, rating: 4.6, sold90: 27 },
    ],
    [
      "fitted-white-tee",
      "tops",
      "تيشيرت أبيض مفصل",
      "Fitted White Tee",
      P(11671964),
      750,
      { rating: 4.7, sold90: 24 },
    ],
    // Knits & jackets
    [
      "navy-stripe-knit",
      "knits",
      "بلوفر مقلم كحلي",
      "Navy Stripe Knit",
      P(45982),
      2400,
      { rating: 4.8, sold90: 62 },
    ],
    [
      "black-leather-jacket",
      "knits",
      "جاكيت جلد أسود",
      "Black Leather Jacket",
      P(6044143),
      5600,
      { rating: 4.9, sold90: 58 },
    ],
    [
      "grey-shirt-jacket",
      "knits",
      "جاكيت قميص رمادي",
      "Grey Shirt-Jacket",
      P(13094187),
      3200,
      { rating: 4.7, sold90: 30 },
    ],
    [
      "soft-wool-cardigan",
      "knits",
      "كارديجان صوف ناعم",
      "Soft Wool Cardigan",
      P(9603627),
      2600,
      { rating: 4.6, sold90: 19 },
    ],
    [
      "ribbed-button-cardigan",
      "knits",
      "كارديجان مضلّع بأزرار",
      "Ribbed Button Cardigan",
      P(9603630),
      2200,
      { rating: 4.5, sold90: 12 },
    ],
    // Shoes
    [
      "black-oxfords",
      "shoes",
      "حذاء أكسفورد أسود",
      "Black Oxfords",
      P(15557045),
      3500,
      { rating: 4.9, sold90: 76 },
    ],
    [
      "brown-derbies",
      "shoes",
      "حذاء ديربي بني",
      "Brown Derbies",
      P(15059774),
      3200,
      { rating: 4.8, sold90: 52 },
    ],
    [
      "black-wingtip-brogues",
      "shoes",
      "حذاء بروج أسود",
      "Black Wingtip Brogues",
      P(15557047),
      3600,
      { rating: 4.8, sold90: 31 },
    ],
    [
      "dark-brown-brogues",
      "shoes",
      "حذاء بروج بني غامق",
      "Dark Brown Brogues",
      P(15059775),
      3450,
      { rating: 4.7, sold90: 23 },
    ],
    // Bags & leather
    [
      "pink-quilted-tote",
      "bags",
      "حقيبة يد وردية مبطنة",
      "Pink Quilted Tote",
      P(22432987),
      3800,
      { rating: 4.8, sold90: 67 },
    ],
    [
      "tan-leather-wallet",
      "bags",
      "محفظة جلد عسلي",
      "Tan Leather Wallet",
      P(15763948),
      1150,
      { rating: 4.7, sold90: 44 },
    ],
    [
      "burgundy-duffle-bag",
      "bags",
      "حقيبة سفر جلد نبيتي",
      "Burgundy Leather Duffle",
      P(22434759),
      4400,
      { rating: 4.7, sold90: 26 },
    ],
    [
      "burgundy-quilted-tote",
      "bags",
      "حقيبة يد نبيتي مبطنة",
      "Burgundy Quilted Tote",
      P(22432992),
      3900,
      { rating: 4.6, sold90: 22 },
    ],
    [
      "floral-embroidered-handbag",
      "bags",
      "حقيبة مطرزة بالورود",
      "Floral Embroidered Handbag",
      P(26610519),
      4200,
      { rating: 4.8, sold90: 18 },
    ],
    [
      "scalloped-leather-wallet",
      "bags",
      "محفظة جلد نبيتي",
      "Burgundy Leather Wallet",
      P(22434781),
      1250,
      { rating: 4.6, sold90: 15 },
    ],
  ],
});

export const FASHION_LUXE = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(FASHION_LUXE_KEY, "dresses", { ar: 2812, en: 2812 }),
  key: FASHION_LUXE_KEY,
  version: 4,
  name: L("حرير", "Hareer"),
  description: L(
    "أزياء راقية بهدوء: فيديو لشماعة الموسم، أقسام بصور طولية، لوك تتسوقه بالنقط وصفوف منتجات على خلفية واحدة. لبوتيكات الملابس الراقية.",
    "Quiet luxury fashion: a video of the season's rail, portrait category tiles, a look you shop by its dots and product rows on one stage. For premium clothing boutiques.",
  ),
  category: "fashion",
  style: ["luxe"],
  sortOrder: 1230,
  palette: ["#f7f6f3", "#ecebe6", "#161616", "#a08c72"],
  colors: {
    primary: "#161616",
    secondary: "#ecebe6",
    background: "#ffffff",
    foreground: "#141414",
    muted: "#64615c",
    border: "#dcdad3",
    accent: "#a08c72",
  },
  fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
  radius: 0,
  containerMaxWidth: 1400,
  productStage: { ratio: "1:1", fit: "cover" },
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "announcement.2",
    "labels.about",
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "story",
    "look",
    "trust.0",
    "trust.1",
    "trust.2",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
    "photos.look.src",
    // One dot per hotspot of `gallery-shop-look`.
    "photos.look.dots.0",
    "photos.look.dots.1",
    "photos.look.dots.2",
  ],
  // `custom.shop-all`: the link to the whole catalog in the header and the footer (default "كل القطع / Shop all", "All pieces" in the footer).
  // `custom.products-noun`: the noun after each category tile's product count (default "قطع / pieces").
  optional: ["photos.hero.video", "custom.shop-all", "custom.products-noun"],
  // The eight best sellers, then the store's 3rd and 4th categories as rows.
  journey: { primary: "best-sellers", rows: [3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: {
      reviews: L("آراء العملاء", "Customer reviews"),
      related: L("قطع تكمّل الإطلالة", "Complete the look"),
    },
  },
});
