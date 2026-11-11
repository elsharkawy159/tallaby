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

const TILES = [pexels(7445030, 1200), pexels(3932950, 1200), pexels(31145149, 1200), pexels(18797320, 1200)];

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
      "بيجامات وقمصان نوم وأرواب ولبس بيت مريح، بمقاسات من S لـ XXL.",
      "Pajamas, nightgowns, robes and loungewear made for comfort, in sizes S to XXL.",
    ),
    categories: [
      ["pajama-sets", "بيجامات", "Pajama sets", TILES[0]!],
      ["nightgowns", "قمصان نوم", "Nightgowns", TILES[1]!],
      ["robes", "أرواب", "Robes", TILES[2]!],
      ["loungewear", "لبس بيت", "Loungewear", TILES[3]!],
    ],
    products: [
      // Pajama sets
      ["ivory-satin-pajama-set", "pajama-sets", "بيجامة ساتان عاجي بكم طويل", "Ivory Satin Long-Sleeve Pajama Set", P("ivory-satin-pajama-set"), 1450, { compareAtPrice: 1700, isFeatured: true, rating: 4.8, sold90: 164 }],
      ["navy-cotton-pajama-set", "pajama-sets", "بيجامة قطن كحلي بكم طويل", "Navy Cotton Long-Sleeve Pajama Set", P("navy-cotton-pajama-set"), 950, { rating: 4.7, sold90: 198 }],
      ["pink-striped-pajama-set", "pajama-sets", "بيجامة قطن مقلّمة وردي نص كم وشورت", "Pink Striped Cotton Short Pajama Set", P("pink-striped-pajama-set"), 650, { rating: 4.6, sold90: 231 }],
      ["sage-modal-pajama-set", "pajama-sets", "بيجامة مودال أخضر هادي", "Sage Modal Pajama Set", P("sage-modal-pajama-set"), 1150, { rating: 4.8, sold90: 117 }],
      // Nightgowns
      ["champagne-satin-nightgown", "nightgowns", "قميص نوم ساتان شامبين طويل", "Champagne Satin Long Nightgown", P("champagne-satin-nightgown"), 1250, { isFeatured: true, rating: 4.7, sold90: 96 }],
      ["white-cotton-nightgown", "nightgowns", "قميص نوم قطن أبيض بكم منفوخ", "White Cotton Puff-Sleeve Nightgown", P("white-cotton-nightgown"), 720, { rating: 4.8, sold90: 152 }],
      ["dusty-rose-nightgown", "nightgowns", "قميص نوم قطن وردي هادي بنص كم", "Dusty Rose Cotton Nightgown", P("dusty-rose-nightgown"), 690, { rating: 4.6, sold90: 138 }],
      ["navy-printed-nightgown", "nightgowns", "قميص نوم قطن كحلي منقّط بكم طويل", "Navy Dotted Cotton Long-Sleeve Nightgown", P("navy-printed-nightgown"), 780, { compareAtPrice: 900, rating: 4.7, sold90: 109 }],
      // Robes
      ["white-waffle-robe", "robes", "روب قطن وافل أبيض", "White Waffle Cotton Robe", P("white-waffle-robe"), 1350, { isFeatured: true, rating: 4.8, sold90: 127 }],
      ["blush-satin-robe", "robes", "روب ساتان وردي فاتح بحزام", "Blush Satin Belted Robe", P("blush-satin-robe"), 1100, { rating: 4.6, sold90: 88 }],
      ["grey-fleece-robe", "robes", "روب فليس رمادي بكابيشون", "Grey Hooded Fleece Robe", P("grey-fleece-robe"), 1250, { compareAtPrice: 1450, rating: 4.8, sold90: 143 }],
      ["beige-linen-robe", "robes", "روب كتان بيج طويل", "Beige Linen Long Robe", P("beige-linen-robe"), 1650, { rating: 4.7, sold90: 64 }],
      // Loungewear
      ["oatmeal-knit-lounge-set", "loungewear", "طقم بيت تريكو أوف وايت", "Oatmeal Knit Lounge Set", P("oatmeal-knit-lounge-set"), 1850, { isFeatured: true, rating: 4.8, sold90: 79 }],
      ["black-jersey-lounge-set", "loungewear", "طقم بيت جيرسيه أسود", "Black Jersey Lounge Set", P("black-jersey-lounge-set"), 990, { rating: 4.6, sold90: 174 }],
      ["lilac-fleece-lounge-set", "loungewear", "طقم بيت فليس ليلكي بكابيشون", "Lilac Hooded Fleece Lounge Set", P("lilac-fleece-lounge-set"), 1190, { rating: 4.7, sold90: 121 }],
      ["cream-cotton-lounge-dress", "loungewear", "فستان بيت قطن كريمي بكم طويل", "Cream Cotton Long-Sleeve Lounge Dress", P("cream-cotton-lounge-dress"), 850, { rating: 4.7, sold90: 102 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(5629138, 1920), tall: pexels(7580977, 1200) },
    tiles: TILES,
    banner: pexels(7691347, 2000),
    story: pexels(20065482, 1200),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفعي عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    hero: {
      alt: L("لحاف وردي فاتح ومخدة بيضاء على سرير", "A blush duvet and a white pillow on a bed"),
      eyebrow: L("لبس البيت والنوم", "Sleep and lounge"),
      title: L("نومة هادية في قماش مريح", "Calm nights in soft fabrics"),
      line: L(
        "بيجامات وقمصان نوم وأرواب ولبس بيت من القطن والساتان والمودال، بمقاسات من S لـ XXL.",
        "Pajamas, nightgowns, robes and loungewear in cotton, satin and modal, in sizes S to XXL.",
      ),
      cta: L("تسوّقي البيجامات", "Shop sleepwear"),
    },
    categories: { title: L("اختاري راحتك", "Choose your comfort") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most-ordered pieces"),
        line: L("القطع اللي عميلاتنا بيرجعوا يطلبوها.", "The pieces our customers come back for."),
      },
    },
    story: {
      alt: L("تريكو متطبق على كنبة كريمي", "Folded knits on a cream sofa"),
      eyebrow: L("القماش أول حاجة", "Fabric comes first"),
      title: L("قماش تحسّي بيه على جلدك", "Fabric that feels kind on skin"),
      text: L(
        "بنختار القطن والمودال والساتان على حسب نعومتهم وتهويتهم، وبنكتب الخامة وطريقة الغسيل في صفحة كل قطعة.",
        "We choose cotton, modal and satin for how soft they are and how they breathe, and we list the fabric and its washing care on each piece's page.",
      ),
      cta: L("شوفي الجديد", "See what is new"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("تغليف سادة", "Plain packaging"), line: L("من غير أي كلام على الكرتونة", "No wording on the parcel") },
      { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرفي التشكيلة الجديدة أول واحدة", "Hear about new pieces first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("سكون: لبس نوم وبيت مريح، لكل ليلة ولكل صباح.", "Sukoon: comfortable sleep and lounge wear, for every night and morning.") },
    about: {
      line: L("لبس نوم وبيت مختار على الخامة والراحة.", "Sleep and lounge wear chosen for fabric and comfort."),
      alt: L("أوضة نوم بيضاء فيها روبين متعلقين وكرسي أخضر", "A white bedroom with two robes on a wall rail and a green armchair"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("راحة البيت تبدأ من اللبس", "Comfort at home starts with what you wear"),
      text: L(
        "سكون بدأت من حاجة بسيطة: بيجامة حلوة تتلبس في البيت قدام العيلة ومريحة طول الليل. عشان كده بنختار قصّات واسعة وخامات ناعمة، وبنجرّب كل قطعة بعد الغسيل قبل ما تتعرض.",
        "Sukoon began with a simple wish: pajamas pretty enough to wear around the family and comfortable all night. So we choose relaxed cuts and soft fabrics, and we test every piece after washing before it is listed.",
      ),
      more: L("ولو المقاس مش مظبوط عليكي، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتارة في المقاس أو الخامة؟ اسألينا", "Unsure about size or fabric? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات والتوصيل والاستبدال.", "Sizing, fabrics, delivery and exchanges."),
      question: L("إزاي أختار مقاسي؟", "How do I choose my size?"),
      answer: L(
        "قصّاتنا واسعة ومريحة، ومقاسات كل قطعة بالسنتيمتر مكتوبة في صفحتها من S لـ XXL. ولو بين مقاسين، ابعتيلنا مقاساتك على واتساب ونقولك الأنسب.",
        "Our cuts are relaxed, and each piece lists its measurements in centimetres on its page, from S to XXL. If you are between two sizes, send us your measurements on WhatsApp and we will tell you which fits.",
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
  productPage: { copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("قطع ممكن تعجبك", "Pieces you may like") } },
};
