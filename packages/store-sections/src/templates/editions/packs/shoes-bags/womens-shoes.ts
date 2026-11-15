/**
 * The women's shoes edition (niche editions, ROADMAP F-90): a women's shoe
 * shop, "Hanem". Sixteen pairs in four categories of four (heels, flats and
 * ballerinas, sandals, boots: one full row of four on every category row),
 * white-background packshots (`editionPhoto`, square, one pair each). Data
 * only. No React here.
 *
 * Materials are named only as the packshots show them and stay the same in
 * every name and line: patent (black pumps), suede (burgundy kitten heels,
 * camel boots), metallic (gold sandals, silver Mary Janes), leather (loafers,
 * woven sandals, ankle, knee and Chelsea boots), canvas and jute (the wedge).
 * Sizes 36 to 41 appear in copy only.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `kasr` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px or more
 * (2026-11-11): shelves, steps, sand and a sunlit wall; no people, legs, feet
 * or hands, no readable lettering or brand marks, none used by a template or
 * another pack, none twice. Some insoles carry a small dark label patch that
 * stays unreadable even at full size (14928875, 20682702, 16217395); photos
 * whose insole or sole lettering can be read were left out (below).
 * Hero 14928875 (wide: gold block-heel sandals on a white floating shelf) and
 * 20682702 (tall: white pumps against a sunlit wall with palm shadows).
 * Tiles: heels 13788573 (blue suede heels on a cowhide bench), flats
 * 37853534 (tan cross-strap ballerinas on a shop shelf), sandals 38583189
 * (tan sandals in white sand), boots 5863649 (rows of ankle boots on shop
 * shelves). Banner 16217395 (orange block-heel sandals on pale cracked
 * concrete, an empty field for copy on the left). Story / about 40773101
 * (green polka-dot slingbacks on a boutique shelf).
 * Shop the look 27256446: three pointed pumps on white steps, orange at the
 * top left, yellow in the middle, black at the bottom right. The dots are the
 * demo's three newest products, the closest pair to each (the burgundy suede
 * kitten heels, the beige pointed flats, the black patent pumps), so those
 * three stay first in `products`.
 *
 * Left out after the check: 5863630 (shop hang tags with a logo), 134064
 * (printed size and lettering inside), 29393718, 3682290, 3682293, 26925259,
 * 27174538, 27046139, 15766325, 18267917, 31450993, 9108930, 28861498,
 * 36593274, 34317569, 22589308, 35828603 (brand lettering on the insole or
 * sole), 9267585 (printed cards), 7543640 (sneaker logos), 27256462,
 * 27256473, 27256456, 27658707, 26774382 (brand emblems on boots or zips),
 * 27204307 and 17018821 (marks on the insole), 34334686 (insole lettering and
 * a fingertip), 10070653, 26796156, 27063075, 27046150, 32498579 (legs or
 * hands), 14783240 (sneakers, not this trade), 15106682 (sport sandals, not
 * this trade).
 *
 * Looks: `kasr` (the niche's template, one template per niche; it shows the
 * pack itself, Hanem), then `fashion-luxe` and `vella` until the shoes-and-bags
 * switch takes them off. For Kasr (checked by eye 2026-11-12 at 1400px or
 * more, no people, feet or lettering, used nowhere else): the hero's two side
 * campaigns, 27274309 (a black block-heel ankle boot on a white plinth) and
 * 15792209 (a coral strappy heel on a wooden block). Rejected: 13035176 (a
 * scuffed sole), 26965810, 30826570, 4109843, 10528003, 9327154 (insole
 * lettering or marks), 3782768 (lettering on the strap), 6046186, 6639326
 * (brand logos), 31450714, 1335450 (legs), 6371793 (peach, off the palette).
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews (no look
 * shows a reviews section).
 *
 * No hero video: none found without people or feet.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "womens-shoes";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@hanem.example";

export const WOMENS_SHOES: Edition = {
  niche: NICHE,
  looks: ["kasr"],
  priceBand: { min: 500, max: 4000 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("هانم", "Hanem"),
    description: L(
      "أحذية نسائية بكعب وفلات وصنادل وبوتات، بمقاسات من ٣٦ حتى ٤١.",
      "Women's heels, flats, sandals and boots, in sizes 36 to 41.",
    ),
    categories: [
      ["heels", "كعب", "Heels", TILES[0]!],
      ["flats", "فلات وباليرينا", "Flats & ballerinas", TILES[1]!],
      ["sandals", "صنادل", "Sandals", TILES[2]!],
      ["boots", "بوتات", "Boots", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots, top to bottom in the photo: orange, yellow, black.
    products: [
      ["burgundy-kitten-heels", "heels", "صندل بكعب رفيع من السويد الخمري مفتوح من الخلف", "Burgundy Suede Kitten-Heel Slingbacks", P("burgundy-kitten-heels"), 1350, { rating: 4.7, sold90: 118 }],
      ["beige-pointed-flats", "flats", "فلات بيج بمقدمة مدببة", "Beige Pointed Flats", P("beige-pointed-flats"), 950, { rating: 4.6, sold90: 173 }],
      ["black-pointed-pumps", "heels", "حذاء بكعب عالٍ لامع أسود بمقدمة مدببة", "Black Patent Pointed Pumps", P("black-pointed-pumps"), 1450, { isFeatured: true, rating: 4.8, sold90: 226 }],
      // Heels
      ["nude-block-heels", "heels", "صندل بكعب عريض بيج بحزام رفيع", "Nude Block-Heel Ankle-Strap Sandals", P("nude-block-heels"), 1250, { isFeatured: true, rating: 4.7, sold90: 194 }],
      ["gold-strappy-heels", "heels", "صندل سهرة بسيور ذهبية لامعة", "Gold Metallic Strappy Heels", P("gold-strappy-heels"), 1650, { compareAtPrice: 1900, rating: 4.8, sold90: 87 }],
      // Flats and ballerinas
      ["black-ballerina-flats", "flats", "باليرينا سوداء بفيونكة", "Black Bow Ballerina Flats", P("black-ballerina-flats"), 890, { isFeatured: true, rating: 4.8, sold90: 241 }],
      ["tan-leather-loafers-women", "flats", "لوفر نسائي من الجلد البني الفاتح", "Women's Tan Leather Loafers", P("tan-leather-loafers-women"), 1390, { rating: 4.7, sold90: 132 }],
      ["silver-mary-janes", "flats", "حذاء ماري جين فضي لامع بإبزيم", "Silver Metallic Mary Janes", P("silver-mary-janes"), 1050, { compareAtPrice: 1200, rating: 4.6, sold90: 104 }],
      // Sandals
      ["white-flat-sandals", "sandals", "صندل فلات أبيض بسيرين", "White Two-Strap Flat Sandals", P("white-flat-sandals"), 690, { rating: 4.6, sold90: 212 }],
      ["tan-woven-sandals", "sandals", "صندل جلد مضفّر بني فاتح", "Tan Woven Leather Sandals", P("tan-woven-sandals"), 980, { rating: 4.7, sold90: 149 }],
      ["black-platform-sandals", "sandals", "صندل بنعل مرتفع أسود بإبزيم", "Black Platform Buckle Sandals", P("black-platform-sandals"), 1190, { rating: 4.6, sold90: 126 }],
      ["beige-wedge-sandals", "sandals", "صندل بكعب إسفيني من القماش البيج بنعل من الخيش", "Beige Canvas Jute Wedge Sandals", P("beige-wedge-sandals"), 1290, { rating: 4.7, sold90: 98 }],
      // Boots
      ["black-ankle-boots", "boots", "بوت قصير جلد أسود بكعب عريض", "Black Leather Block-Heel Ankle Boots", P("black-ankle-boots"), 2350, { isFeatured: true, rating: 4.8, sold90: 157 }],
      ["camel-suede-boots", "boots", "بوت قصير من السويد بلون الجمل", "Camel Suede Ankle Boots", P("camel-suede-boots"), 2450, { compareAtPrice: 2800, rating: 4.7, sold90: 91 }],
      ["brown-knee-boots", "boots", "بوت طويل جلد بني", "Brown Leather Knee Boots", P("brown-knee-boots"), 3400, { rating: 4.8, sold90: 64 }],
      ["white-chelsea-boots", "boots", "بوت تشيلسي جلد أبيض", "White Leather Chelsea Boots", P("white-chelsea-boots"), 2250, { rating: 4.6, sold90: 83 }],
    ],
  }),
  photos: {
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(20682702, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
    // `kasr`'s about page (it falls back to the story): nude block heels in an open powder-blue box, upright.
    about: scene("about"),
    // The dots, in percent from the photo's left and top: the orange, the yellow and the black pump.
    look: {
      src: pexels(27256446, 1400),
      dots: [
        { x: 30, y: 33 },
        { x: 48, y: 54 },
        { x: 62, y: 78 },
      ],
    },
    // `kasr`: the hero's two side campaigns, 4:3 (boots for winter, heels for evenings).
    custom: {
      "hero-side-1": scene("hero-side-1"),
      "hero-side-2": scene("hero-side-2"),
    },
  },
  copy: {
    announcement: [
      L("أحذية بكعب وفلات وصنادل وبوتات", "Heels, flats, sandals and boots"),
      L("جدول مقاسات لكل موديل", "A size chart for every style"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    // Kasr's header and hero links, each to a search that finds that kind of pair.
    nav: [
      { label: L("بوتات", "Boots"), href: `/products?search=${encodeURIComponent("بوت")}` },
      { label: L("كعب", "Heels"), href: `/products?search=${encodeURIComponent("كعب")}` },
      { label: L("صنادل", "Sandals"), href: `/products?search=${encodeURIComponent("صندل")}` },
      { label: L("فلات", "Flats"), href: `/products?search=${encodeURIComponent("فلات")}` },
    ],
    hero: {
      alt: L("صندل بكعب عريض بيج على رف أبيض فارغ", "Nude block-heel sandals on an empty white shelf"),
      eyebrow: L("تشكيلة الموسم", "This season's pairs"),
      title: L("حذاء لكل مناسبة", "A pair for every occasion"),
      line: L(
        "كعب للسهرة، وفلات للعمل، وصنادل للصيف، وبوتات للشتاء، بمقاسات من ٣٦ حتى ٤١.",
        "Heels for the evening, flats for work, sandals for summer and boots for winter, in sizes 36 to 41.",
      ),
      cta: L("تسوّق الأحذية", "Shop the shoes"),
    },
    categories: { title: L("تسوّق حسب النوع", "Shop by type") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most-ordered pairs"),
        line: L("تشكيلة مختارة من الأحذية.", "A selection of our shoes."),
      },
    },
    story: {
      alt: L("أربعة أحذية على رف أبيض طويل: باليرينا وحذاء مفتوح من الخلف وكعب عالٍ وبوت", "Four pairs on a long white shelf: flats, slingbacks, pumps and ankle boots"),
      eyebrow: L("المقاس أولًا", "Fit comes first"),
      title: L("مقاسات وتفاصيل واضحة", "Clear sizes and details"),
      text: L(
        "نذكر طول الكعب وعرض المقدمة ونوع النعل والخامة في صفحة كل موديل.",
        "Each pair's page lists heel height, toe width, the sole and the material.",
      ),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    look: {
      alt: L("ثلاثة أحذية بكعب ومقدمة مدببة على سلالم بيضاء: برتقالي وأصفر وأسود", "Three pointed pumps on white steps: orange, yellow and black"),
      eyebrow: L("إطلالة المكتب", "The office look"),
      title: L("مقدمة مدببة لكل يوم", "Pointed toes for every day"),
      text: L("اضغط على أي نقطة في الصورة لترى أقرب حذاء لها من تشكيلتنا.", "Tap a dot on the photo to see the closest pair from our range."),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("جدول مقاسات لكل موديل", "A size chart for every style") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("الخامة ونوع النعل لكل موديل", "Material and sole for every style") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new pairs first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("هانم: أحذية نسائية لكل مناسبة.", "Hanem: women's shoes for every occasion.") },
    about: {
      line: L("أحذية نسائية مختارة حسب المقاس والراحة.", "Women's shoes chosen for fit and comfort."),
      alt: L("حذاء بكعب بيج في علبة زرقاء فاتحة مفتوحة على طاولة بيضاء", "Nude block heels in an open powder-blue box on a white table"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أحذية أنيقة ومريحة", "Pretty pairs that feel good too"),
      text: L(
        "هانم متجر للأحذية النسائية: كعب وفلات وصنادل وبوتات. نذكر مقاسات كل موديل وخامته في صفحته.",
        "Hanem sells women's shoes: heels, flats, sandals and boots. Each style's page lists its measurements and material.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or material, contact us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("غير متأكد من المقاس؟ اسألنا", "Not sure of your size? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizing, materials and ordering."),
      question: L("كيف أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "قارن مقاسك المعتاد بجدول المقاسات في صفحة الموديل. ولأي سؤال، تواصل معنا.",
        "Compare your usual size with the size chart on the style's page. For any question, contact us.",
      ),
    },
    // Vella's footer contact column: demo values, the seller's own replace them.
    custom: {
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", PHONE_EN),
      "contact-email": L(`البريد: ${handle(EMAIL)}`, EMAIL),
      "contact-address": L("القاهرة، مصر", "Cairo, Egypt"),
      "contact-hours": L("كل يوم، ١١ ص – ١١ م", "Every day, 11am to 11pm"),
      // Vella's footer link to the whole catalog (its default reads "Offers").
      "footer-offers": L("كل الأحذية", "All shoes"),
      // fashion-luxe: the link to the whole catalog, and the noun after a category tile's count.
      "shop-all": L("كل الأحذية", "All shoes"),
      "products-noun": L("موديلات", "styles"),
      // Kasr's hero: the label on the ticket (like the end of a shoe box), then the two side campaigns (a tag and a title each; the title is also the photo's alt).
      "hero-label": L("مقاسات من ٣٦ حتى ٤١", "Sizes 36 to 41"),
      "hero-side-1-tag": L("للشتاء", "For winter"),
      "hero-side-1-title": L("بوت بكعب عريض ثابت", "Boots on a steady block heel"),
      "hero-side-2-tag": L("للسهرة", "For evenings"),
      "hero-side-2-title": L("حذاء مفتوح من الخلف بكعب صغير", "Kitten-heel slingbacks"),
      // Kasr's categories: the small line over their title.
      "categories-eyebrow": L("على حسب النوع", "By type"),
      // Kasr's size guide (the trade's own section): a title and a line, then three groups of rows (a size and its foot length).
      "size-title": L("مقاسك بالسنتيمتر", "Your size in centimetres"),
      "size-line": L(
        "قارن مقاسك المعتاد بالجدول. وإذا كنت بين مقاسين، فاختر الأكبر في الأحذية ذات الكعب والمقدمة المدببة.",
        "Compare your usual size with the chart. Between two sizes? Go up in heels and pointed toes.",
      ),
      "size-group-1": L("مقاس ٣٦ حتى ٣٨", "Sizes 36 to 38"),
      "size-group-2": L("مقاس ٣٩ و٤٠", "Sizes 39 and 40"),
      "size-group-3": L("مقاس ٤١، وبين مقاسين", "Size 41, and in between"),
      "size-row-1-name": L("مقاس ٣٦", "Size 36"),
      "size-row-1-value": L("٢٣ سم", "23 cm"),
      "size-row-2-name": L("مقاس ٣٧", "Size 37"),
      "size-row-2-value": L("٢٣٫٥ سم", "23.5 cm"),
      "size-row-3-name": L("مقاس ٣٨", "Size 38"),
      "size-row-3-value": L("٢٤ سم", "24 cm"),
      "size-row-4-name": L("مقاس ٣٩", "Size 39"),
      "size-row-4-value": L("٢٥ سم", "25 cm"),
      "size-row-5-name": L("مقاس ٤٠", "Size 40"),
      "size-row-5-value": L("٢٥٫٥ سم", "25.5 cm"),
      "size-row-6-name": L("مقاس ٤١", "Size 41"),
      "size-row-6-value": L("٢٦ سم", "26 cm"),
      "size-row-7-name": L("بين مقاسين؟", "Between two sizes?"),
      "size-row-7-value": L("اختر الأكبر في الكعب", "Go up in heels"),
      // Kasr's campaign beside the sandals row, on `photos.banner`; its button is `nav.2`.
      "banner-alt": L("صندل بكعب عريض بيج على سلالم حجرية في شمس الصيف", "Nude block-heel sandals on stone steps in summer sun"),
      "banner-eyebrow": L("للصيف", "For summer"),
      "banner-title": L("صنادل للمشي الطويل", "Sandals for the long walk"),
      "banner-line": L("كعب عريض ثابت وسيور ناعمة، من الفلات حتى الكعب الإسفيني.", "Steady block heels and soft straps, from flats to wedges."),
      // Kasr's promises: the title on the bordeaux tile beside the first three promises.
      "promises-title": L("ما نقدّمه مع كل موديل", "What comes with every style"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "What our customers say"), related: L("أحذية قد تعجبك", "Shoes you may like") } },
};
