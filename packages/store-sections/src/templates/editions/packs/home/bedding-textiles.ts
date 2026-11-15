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
    description: L("ملايات وألحفة ومفروشات قطن وكتان لبيت أهدى.", "Cotton and linen sheets, duvets and textiles for a calmer home."),
    categories: [
      ["sheets", "ملايات وأطقم", "Sheets & sets", TILES[0]!],
      ["duvets", "ألحفة وبطاطين", "Duvets & blankets", TILES[1]!],
      ["pillows-towels", "مخدات وفوط", "Pillows & towels", TILES[2]!],
      ["curtains-rugs", "ستاير وسجاد", "Curtains & rugs", TILES[3]!],
    ],
    // Newest first: `mafrash`'s rail shows the newest.
    products: [
      ["sand-linen-duvet-cover", "sheets", "طقم كفر لحاف كتان رملي", "Sand Linen Duvet Cover Set", P("sand-linen-duvet-cover"), 1650, { isFeatured: true, rating: 4.8, sold90: 132 }],
      ["sage-knit-throw", "duvets", "بطانية تريكو مخضرّة", "Sage Chunky Knit Throw", P("sage-knit-throw"), 890, { rating: 4.7, sold90: 96 }],
      ["linen-cushion-cover", "pillows-towels", "خدادية كتان رملي", "Sand Linen Cushion", P("linen-cushion-cover"), 320, { rating: 4.6, sold90: 141 }],
      ["sheer-white-curtain", "curtains-rugs", "ستارة شيفون بيضا", "Sheer White Curtain Panel", P("sheer-white-curtain"), 650, { rating: 4.6, sold90: 87 }],
      ["white-cotton-sheet-set", "sheets", "طقم ملايات قطن أبيض", "White Cotton Sheet Set", P("white-cotton-sheet-set"), 1250, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["white-quilted-duvet", "duvets", "لحاف مبطّن أبيض", "White Quilted Duvet", P("white-quilted-duvet"), 1450, { rating: 4.8, sold90: 158 }],
      ["white-towel-stack", "pillows-towels", "طقم ٣ فوط قطن بيضا", "White Cotton Towel Set of 3", P("white-towel-stack"), 590, { rating: 4.7, sold90: 176 }],
      ["blackout-curtain-blue", "curtains-rugs", "ستارة بلاك أوت لبني", "Dusty Blue Blackout Curtain", P("blackout-curtain-blue"), 790, { rating: 4.5, sold90: 74 }],
      ["dusty-blue-sheet-set", "sheets", "طقم ملايات بيركال لبني", "Dusty Blue Percale Sheet Set", P("dusty-blue-sheet-set"), 1150, { rating: 4.7, sold90: 119 }],
      ["grey-fleece-blanket", "duvets", "بطانية فليس رمادي", "Grey Fleece Blanket", P("grey-fleece-blanket"), 450, { rating: 4.6, sold90: 133 }],
      ["white-bed-pillow", "pillows-towels", "مخدة سرير بيضا", "White Bed Pillow", P("white-bed-pillow"), 290, { rating: 4.7, sold90: 202 }],
      ["jute-round-rug", "curtains-rugs", "سجادة جوت مدوّرة", "Round Jute Rug", P("jute-round-rug"), 990, { compareAtPrice: 1150, rating: 4.6, sold90: 68 }],
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
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    nav: [{ label: L("الملايات", "Sheets"), href: search("ملايات") }],
    hero: {
      alt: L("ملايات متطبقة أبيض ولبني ورملي ومخضرّ على كرسي خشب", "Folded white, blue, sand and sage sheets on a wooden stool"),
      eyebrow: L("قطن وكتان", "Cotton and linen"),
      title: L("سرير مريح من أول ليلة", "Rest easy from night one"),
      line: L("ملايات وألحفة ومخدات بألوان هادية، وكلها مغسولة قبل ما توصلك.", "Sheets, duvets and pillows in quiet colours, all washed before they reach you."),
      cta: L("تسوق الملايات", "Shop sheets"),
    },
    categories: { title: L("جهّز بيتك", "Dress your home") },
    products: {
      primary: {
        eyebrow: L("وصل جديد", "New in"),
        title: L("ألوان الموسم", "This season's colours"),
        line: L("أحدث الملايات والمفروشات.", "The newest sheets and textiles."),
      },
    },
    story: {
      alt: L("ورشة فيها لفف قماش كتان وماكينة خياطة وملايات متطبقة", "A workshop with linen rolls, a sewing machine and folded sheets"),
      eyebrow: L("من الورشة", "From the workshop"),
      title: L("قماش بنختاره بإيدينا", "Fabric we choose by hand"),
      text: L("بنختار القطن والكتان بنفسنا وبنغسل كل قطعة قبل ما تتغلف.", "We choose the cotton and linen ourselves and wash every piece before packing."),
      cta: L("تسوق الملايات", "Shop sheets"),
    },
    trust: [
      { title: L("قطن وكتان", "Cotton and linen"), line: L("خامات طبيعية بتتنفس", "Natural fabrics that breathe") },
      { title: L("مغسول", "Pre-washed"), line: L("ناعم من أول ليلة", "Soft from the first night") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو المقاس مش مظبوط", "If the size is not right") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
    ],
    newsletter: {
      title: L("ألوان جديدة كل موسم", "New colours every season"),
      line: L("اعرف الألوان الجديدة قبل الكل، ونصايح غسيل القطن والكتان.", "Hear about new colours first, plus tips for washing cotton and linen."),
    },
    about: {
      line: L("ملايات ومفروشات قطن وكتان، مغسولة وناعمة.", "Cotton and linen sheets and textiles, washed soft."),
      alt: L("ورشة فيها لفف قماش كتان وماكينة خياطة وملايات متطبقة", "A workshop with linen rolls, a sewing machine and folded sheets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("من لفّة القماش لسريرك", "From the fabric roll to your bed"),
      text: L(
        "بنختار القطن والكتان بنفسنا، وبنقص ونخيط في ورشتنا، وبنغسل كل قطعة قبل ما تتغلف عشان تبقى ناعمة من أول ليلة.",
        "We choose the cotton and linen ourselves, cut and sew in our workshop, and wash every piece before packing so it is soft from the first night.",
      ),
      more: L("ولو المقاس مش مظبوط، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوق المفروشات", "Shop textiles"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("اسألنا عن المقاسات والألوان والخامات.", "Ask us about sizes, colours and fabrics."),
      heading: L("اسأل عن مقاس سريرك", "Ask about your bed size"),
    },
    faq: {
      line: L("المقاسات والغسيل والاستبدال.", "Sizes, washing and exchanges."),
      question: L("أغسل الكتان إزاي؟", "How do I wash linen?"),
      answer: L(
        "اغسله على ٤٠ درجة بمنظف خفيف ومن غير مبيّض، ونشّفه في الهوا. كل ما يتغسل بيبقى أنعم.",
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
  productPage: { copy: { reviews: L("ناموا عليها", "Slept on it"), related: L("يكمّل السرير", "Completes the bed") } },
};
