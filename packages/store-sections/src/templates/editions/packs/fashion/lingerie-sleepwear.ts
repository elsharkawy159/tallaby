/**
 * The sleepwear edition (niche editions, ROADMAP F-90): a modest sleepwear
 * and loungewear shop, "Sukoon". Sixteen pieces in four categories of four
 * (pajama sets, nightgowns, robes, loungewear: one full row of four on every
 * vella category row), white-background packshots (`editionPhoto`, square,
 * flat lays). Family-friendly on purpose: pajamas, long nightgowns, robes and
 * lounge sets, nothing revealing in copy or photos. Data only. No React here.
 *
 * Fabrics are named only as the packshots show them and stay the same in
 * every name and line: satin (the ivory pajama set, the champagne nightgown,
 * the blush robe), cotton (the navy and pink striped pajama sets, the white,
 * dusty rose and navy dotted nightgowns, the cream lounge dress), modal (the
 * sage set), waffle cotton (the white robe), fleece (the grey robe, the lilac
 * set), linen (the beige robe), knit (the oatmeal set), jersey (the black set).
 * Sizes S to XXL appear in copy only.
 *
 * Only `vella` for now: its other planned look (`fashion-warm`) is not
 * edition-ready.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `vella` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * bedrooms, bed linen and folded or hanging garments; no people or body
 * parts, no mannequins, nothing revealing, no readable lettering or brand
 * marks, none used by a template or another pack, none twice.
 * Hero 5629138 (wide: a blush duvet and white pillow, rumpled) and 7580977
 * (tall: a white bed tray with daffodils and coffee on white sheets).
 * Tiles: pajama sets 7445030 (a plush sleep mask on pale blue linen bedding),
 * nightgowns 3932950 (a long white embroidered cotton dress with a collar on a
 * hanger by a rainy window), robes 31145149 (two white waffle robes on wall
 * hooks), loungewear 18797320 (soft taupe tops on a wooden rail beside
 * baskets and a plant). Banner 7691347 (folded knits on a cream sofa, the
 * stack on the left and a calm field for copy). Story / about 20065482 (a
 * white bedroom with two robes on a wall rail, a green armchair and a closed
 * book whose cover lettering is too small to read).
 *
 * Left out after the check: 7445019 (a readable brand label on the shirt
 * collar), 16497538 (an unclear tan shape under the blanket), 36533436 and
 * 36533446 (printed lettering on the garment), 37780115 (printed lettering),
 * 8104579 (magazine lettering, a lace slip), 4374510 (lace underwear),
 * 8536092 (a handwritten card), 31421652 (a printed card), 9145360 (too dark),
 * 3999067 (a printed sheet on the wall); already used by a template or pack:
 * 7445081, 3847546, 30569741, 14641436, 30618181.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews (vella shows
 * no reviews section). No shop-the-look photo: vella has no such section.
 *
 * No hero video: none found without people, so vella shows the poster.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "lingerie-sleepwear";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@sukoon.example";

export const LINGERIE_SLEEPWEAR: Edition = {
  niche: NICHE,
  looks: ["vella"],
  priceBand: { min: 450, max: 2200 },
  // The packshots are square flat lays on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("سكون", "Sukoon"),
    description: L(
      "بيجامات وقمصان نوم وأرواب وملابس منزلية، بمقاسات من S حتى XXL.",
      "Pajamas, nightgowns, robes and loungewear, in sizes S to XXL.",
    ),
    categories: [
      ["pajama-sets", "بيجامات", "Pajama sets", TILES[0]!],
      ["nightgowns", "قمصان نوم", "Nightgowns", TILES[1]!],
      ["robes", "أرواب", "Robes", TILES[2]!],
      ["loungewear", "ملابس منزلية", "Loungewear", TILES[3]!],
    ],
    products: [
      // Pajama sets
      ["ivory-satin-pajama-set", "pajama-sets", "بيجامة ساتان عاجي بكم طويل", "Ivory Satin Long-Sleeve Pajama Set", P("ivory-satin-pajama-set"), 1450, { compareAtPrice: 1700, isFeatured: true, rating: 4.8, sold90: 164 }],
      ["navy-cotton-pajama-set", "pajama-sets", "بيجامة قطن كحلي بكم طويل", "Navy Cotton Long-Sleeve Pajama Set", P("navy-cotton-pajama-set"), 950, { rating: 4.7, sold90: 198 }],
      ["pink-striped-pajama-set", "pajama-sets", "بيجامة قطن مقلّمة وردي بنصف كم وشورت", "Pink Striped Cotton Short Pajama Set", P("pink-striped-pajama-set"), 650, { rating: 4.6, sold90: 231 }],
      ["sage-modal-pajama-set", "pajama-sets", "بيجامة مودال أخضر هادئ", "Sage Modal Pajama Set", P("sage-modal-pajama-set"), 1150, { rating: 4.8, sold90: 117 }],
      // Nightgowns
      ["champagne-satin-nightgown", "nightgowns", "قميص نوم ساتان شامبين طويل", "Champagne Satin Long Nightgown", P("champagne-satin-nightgown"), 1250, { isFeatured: true, rating: 4.7, sold90: 96 }],
      ["white-cotton-nightgown", "nightgowns", "قميص نوم قطن أبيض بكم منفوخ", "White Cotton Puff-Sleeve Nightgown", P("white-cotton-nightgown"), 720, { rating: 4.8, sold90: 152 }],
      ["dusty-rose-nightgown", "nightgowns", "قميص نوم قطن وردي هادئ بنصف كم", "Dusty Rose Cotton Nightgown", P("dusty-rose-nightgown"), 690, { rating: 4.6, sold90: 138 }],
      ["navy-printed-nightgown", "nightgowns", "قميص نوم قطن كحلي منقّط بكم طويل", "Navy Dotted Cotton Long-Sleeve Nightgown", P("navy-printed-nightgown"), 780, { compareAtPrice: 900, rating: 4.7, sold90: 109 }],
      // Robes
      ["white-waffle-robe", "robes", "روب قطن وافل أبيض", "White Waffle Cotton Robe", P("white-waffle-robe"), 1350, { isFeatured: true, rating: 4.8, sold90: 127 }],
      ["blush-satin-robe", "robes", "روب ساتان وردي فاتح بحزام", "Blush Satin Belted Robe", P("blush-satin-robe"), 1100, { rating: 4.6, sold90: 88 }],
      ["grey-fleece-robe", "robes", "روب فليس رمادي بقلنسوة", "Grey Hooded Fleece Robe", P("grey-fleece-robe"), 1250, { compareAtPrice: 1450, rating: 4.8, sold90: 143 }],
      ["beige-linen-robe", "robes", "روب كتان بيج طويل", "Beige Linen Long Robe", P("beige-linen-robe"), 1650, { rating: 4.7, sold90: 64 }],
      // Loungewear
      ["oatmeal-knit-lounge-set", "loungewear", "طقم منزلي تريكو بيج فاتح", "Oatmeal Knit Lounge Set", P("oatmeal-knit-lounge-set"), 1850, { isFeatured: true, rating: 4.8, sold90: 79 }],
      ["black-jersey-lounge-set", "loungewear", "طقم منزلي جيرسيه أسود", "Black Jersey Lounge Set", P("black-jersey-lounge-set"), 990, { rating: 4.6, sold90: 174 }],
      ["lilac-fleece-lounge-set", "loungewear", "طقم منزلي فليس ليلكي بقلنسوة", "Lilac Hooded Fleece Lounge Set", P("lilac-fleece-lounge-set"), 1190, { rating: 4.7, sold90: 121 }],
      ["cream-cotton-lounge-dress", "loungewear", "فستان منزلي قطن كريمي بكم طويل", "Cream Cotton Long-Sleeve Lounge Dress", P("cream-cotton-lounge-dress"), 850, { rating: 4.7, sold90: 102 }],
    ],
  }),
  photos: {
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(7580977, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("مقاسات من S حتى XXL", "Sizes S to XXL"),
      L("تفاصيل الخامة وطريقة الغسيل لكل قطعة", "Fabric and care details for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    hero: {
      alt: L("بيجامة ساتان مطوية وروب وافل على سرير أبيض", "A white bed with a folded satin pajama set and a waffle robe over the footboard"),
      eyebrow: L("ملابس النوم والملابس المنزلية", "Sleepwear and loungewear"),
      title: L("بيجامات وقمصان نوم وأرواب", "Pajamas, nightgowns and robes"),
      line: L(
        "من القطن والساتان والمودال، بمقاسات من S حتى XXL.",
        "In cotton, satin and modal, in sizes S to XXL.",
      ),
      cta: L("تسوّق البيجامات", "Shop sleepwear"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most-ordered pieces"),
        line: L("تشكيلة مختارة من البيجامات وقمصان النوم.", "A selection of pajamas and nightgowns."),
      },
    },
    story: {
      alt: L("أطقم منزلية مطوية على ذراع أريكة كريمية", "Folded lounge sets on the arm of a cream sofa"),
      eyebrow: L("الخامة أولًا", "Fabric first"),
      title: L("خامات قطن وساتان ومودال", "Cotton, satin and modal"),
      text: L(
        "نختار القطن والمودال والساتان بعناية، ونذكر الخامة وطريقة الغسيل في صفحة كل قطعة.",
        "We choose cotton, modal and satin with care, and list the fabric and washing care on each piece's page.",
      ),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل قطعة", "Clear details and sizes for every piece") },
      { title: L("خامات مذكورة", "Fabrics listed"), line: L("الخامة وطريقة الغسيل في صفحة كل قطعة", "Fabric and care on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على التشكيلة الجديدة أولًا", "Hear about new pieces first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("سكون: ملابس نوم وملابس منزلية من القطن والساتان والمودال.", "Sukoon: sleepwear and loungewear in cotton, satin and modal.") },
    about: {
      line: L("ملابس نوم وملابس منزلية مختارة بعناية.", "Sleep and lounge wear chosen with care."),
      alt: L("روبان معلّقان على حامل حائط بجوار كرسي أخضر", "Two robes on a wall rail beside a green armchair"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("ملابس نوم بخامات مختارة", "Sleepwear in chosen fabrics"),
      text: L(
        "سكون متجر لملابس النوم والملابس المنزلية: بيجامات وقمصان نوم وأرواب وأطقم منزلية. نختار قصّات واسعة وخامات مثل القطن والساتان والمودال، ونذكر تفاصيل كل قطعة في صفحتها.",
        "Sukoon sells sleepwear and loungewear: pajamas, nightgowns, robes and lounge sets. We choose relaxed cuts and fabrics such as cotton, satin and modal, and list each piece's details on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("لديك سؤال عن المقاس أو الخامة؟ اسألنا", "A question about size or fabric? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizing, fabrics and ordering."),
      question: L("كيف أختار مقاسي؟", "How do I choose my size?"),
      answer: L(
        "قصّاتنا واسعة، ومقاسات كل قطعة بالسنتيمتر مذكورة في صفحتها من S حتى XXL. وإذا كنت بين مقاسين، تواصل معنا لنساعدك في اختيار الأنسب.",
        "Our cuts are relaxed, and each piece lists its measurements in centimetres on its page, from S to XXL. If you are between two sizes, contact us and we will help you choose.",
      ),
    },
    // Vella's footer contact column: demo values, the seller's own replace them.
    custom: {
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", PHONE_EN),
      "contact-email": L(`البريد: ${handle(EMAIL)}`, EMAIL),
      "contact-address": L("القاهرة، مصر", "Cairo, Egypt"),
      "contact-hours": L("كل يوم، ١١ ص – ١١ م", "Every day, 11am to 11pm"),
      // Vella's footer link to the whole catalog (its default reads "Offers").
      "footer-offers": L("كل المنتجات", "All products"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "What our customers say"), related: L("قد يعجبك أيضًا", "You may also like") } },
};
