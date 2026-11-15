/**
 * The bedding and textiles pack (niche editions, ROADMAP F-90): "Nisma", a
 * home textiles shop of cotton and linen sheet sets, duvets and throws,
 * pillows and towels, and curtains and rugs. Data only; `mafrash` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels, lettering or logos),
 * in the public `library-media` bucket, `editions/bedding-textiles/`:
 * twelve white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `mafrash`, the niche's template (one template per niche). Its home
 * shows a rail of the newest products, so the product order is newest
 * first; no category rows, so three products per category are enough. No
 * `reviews`: a pack holds no invented buyer quotes, and without them
 * `mafrash` leaves its reviews wall out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "bedding-textiles";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const BEDDING_TEXTILES: Edition = {
  niche: NICHE,
  looks: ["mafrash"],
  priceBand: { min: 150, max: 3000 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("نسمة", "Nisma"),
    description: L("ملاءات وألحفة ومفروشات من القطن والكتان.", "Cotton and linen sheets, duvets and textiles."),
    categories: [
      ["sheets", "ملاءات وأطقم", "Sheets & sets", TILES[0]!],
      ["duvets", "ألحفة وبطاطين", "Duvets & blankets", TILES[1]!],
      ["pillows-towels", "وسائد ومناشف", "Pillows & towels", TILES[2]!],
      ["curtains-rugs", "ستائر وسجاد", "Curtains & rugs", TILES[3]!],
    ],
    // Newest first: `mafrash`'s rail shows the newest.
    products: [
      ["sand-linen-duvet-cover", "sheets", "طقم غطاء لحاف كتان رملي", "Sand Linen Duvet Cover Set", P("sand-linen-duvet-cover"), 1650, { isFeatured: true, rating: 4.8, sold90: 132 }],
      ["sage-knit-throw", "duvets", "بطانية تريكو خضراء فاتحة", "Sage Chunky Knit Throw", P("sage-knit-throw"), 890, { rating: 4.7, sold90: 96 }],
      ["linen-cushion-cover", "pillows-towels", "غطاء وسادة كتان رملي", "Sand Linen Cushion", P("linen-cushion-cover"), 320, { rating: 4.6, sold90: 141 }],
      ["sheer-white-curtain", "curtains-rugs", "ستارة شيفون بيضاء", "Sheer White Curtain Panel", P("sheer-white-curtain"), 650, { rating: 4.6, sold90: 87 }],
      ["white-cotton-sheet-set", "sheets", "طقم ملايات قطن أبيض", "White Cotton Sheet Set", P("white-cotton-sheet-set"), 1250, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["white-quilted-duvet", "duvets", "لحاف مبطّن أبيض", "White Quilted Duvet", P("white-quilted-duvet"), 1450, { rating: 4.8, sold90: 158 }],
      ["white-towel-stack", "pillows-towels", "طقم ٣ مناشف قطن بيضاء", "White Cotton Towel Set of 3", P("white-towel-stack"), 590, { rating: 4.7, sold90: 176 }],
      ["blackout-curtain-blue", "curtains-rugs", "ستارة معتمة زرقاء فاتحة", "Dusty Blue Blackout Curtain", P("blackout-curtain-blue"), 790, { rating: 4.5, sold90: 74 }],
      ["dusty-blue-sheet-set", "sheets", "طقم ملايات بيركال أزرق فاتح", "Dusty Blue Percale Sheet Set", P("dusty-blue-sheet-set"), 1150, { rating: 4.7, sold90: 119 }],
      ["grey-fleece-blanket", "duvets", "بطانية فليس رمادية", "Grey Fleece Blanket", P("grey-fleece-blanket"), 450, { rating: 4.6, sold90: 133 }],
      ["white-bed-pillow", "pillows-towels", "وسادة سرير بيضاء", "White Bed Pillow", P("white-bed-pillow"), 290, { rating: 4.7, sold90: 202 }],
      ["jute-round-rug", "curtains-rugs", "سجادة جوت دائرية", "Round Jute Rug", P("jute-round-rug"), 990, { compareAtPrice: 1150, rating: 4.6, sold90: 68 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`mafrash` has no banner).
    banner: scene("banner"),
    // `mafrash`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("ملاءات وألحفة ومفروشات", "Sheets, duvets and textiles"),
      L("المقاسات والخامات واضحة لكل منتج", "Clear sizes and fabrics for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    nav: [{ label: L("الملاءات", "Sheets"), href: search("ملايات") }],
    hero: {
      alt: L("ملاءات مطوية بالأبيض والأزرق الفاتح والرملي والأخضر على كرسي خشبي", "Folded white, blue, sand and sage sheets on a wooden stool"),
      eyebrow: L("قطن وكتان", "Cotton and linen"),
      title: L("ملاءات وألحفة من القطن والكتان", "Cotton and linen bedding"),
      line: L("ملاءات وألحفة ووسائد بألوان هادئة.", "Sheets, duvets and pillows in quiet colours."),
      cta: L("تسوّق الملاءات", "Shop sheets"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("ألوان الموسم", "This season's colours"),
        line: L("أحدث الملايات والمفروشات.", "The newest sheets and textiles."),
      },
    },
    story: {
      alt: L("ورشة فيها لفائف قماش كتان وماكينة خياطة وملاءات مطوية", "A workshop with linen rolls, a sewing machine and folded sheets"),
      eyebrow: L("الخامات", "The fabrics"),
      title: L("قطن وكتان مختار", "Chosen cotton and linen"),
      text: L("نختار القطن والكتان بعناية، ونذكر خامة كل قطعة ومقاسها في صفحتها.", "We choose cotton and linen with care, and list each piece's fabric and size on its page."),
      cta: L("تسوّق الملاءات", "Shop sheets"),
    },
    trust: [
      { title: L("قطن وكتان", "Cotton and linen"), line: L("خامات طبيعية", "Natural fabrics") },
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل قطعة", "Clear details and sizes for every piece") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("ألوان جديدة كل موسم", "New colours every season"),
      line: L("تعرّف على الألوان الجديدة أولًا، مع نصائح لغسل القطن والكتان.", "Hear about new colours first, plus tips for washing cotton and linen."),
    },
    about: {
      line: L("ملاءات ومفروشات من القطن والكتان.", "Cotton and linen sheets and textiles."),
      alt: L("ورشة فيها لفائف قماش كتان وماكينة خياطة وملاءات مطوية", "A workshop with linen rolls, a sewing machine and folded sheets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("مفروشات قطن وكتان", "Cotton and linen textiles"),
      text: L(
        "نسمة متجر للملاءات والألحفة والوسائد والمناشف والستائر. نختار القطن والكتان بعناية، ونذكر خامة كل قطعة ومقاسها وطريقة غسلها.",
        "Nisma sells sheets, duvets, pillows, towels and curtains. We choose cotton and linen with care, and list each piece's fabric, size and washing care.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق المفروشات", "Shop textiles"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن المقاسات والألوان والخامات.", "Ask us about sizes, colours and fabrics."),
      heading: L("اسأل عن مقاسات السرير", "Ask about bed sizes"),
    },
    faq: {
      line: L("المقاسات والغسيل وطريقة الطلب.", "Sizes, washing and ordering."),
      question: L("كيف أغسل الكتان؟", "How do I wash linen?"),
      answer: L(
        "اغسله على درجة ٤٠ بمنظف خفيف ودون مبيّض، وجفّفه في الهواء. ويصبح أنعم مع كل غسلة.",
        "Wash it at 40 degrees with a mild detergent and no bleach, and dry it in the air. It gets softer with every wash.",
      ),
    },
    custom: {
      // `mafrash`: the store's short name inside "About …".
      "store-short": L("نسمة", "Nisma"),
      // `mafrash`: the categories section's link to the whole catalog.
      "shop-all": L("كل المفروشات", "All textiles"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل السرير", "Completes the bed") } },
};
