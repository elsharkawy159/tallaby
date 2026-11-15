/**
 * The dresses edition (niche editions pilot, ROADMAP F-90): a dress boutique,
 * "Dantella". Sixteen dresses in four categories of four (casual, evening,
 * summer, modest maxi: one full row of four on every category row), white-background packshots on a ghost mannequin
 * (`editionPhoto`, portrait 4:5). Data only. No React here.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `fashion-luxe` draws except the casual tile (8030176), whose generated file came back with a dark band in its foot and is to be made again.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, checked 2026-11-11: bright, airy, blush and
 * neutral; dresses on rails and hangers, a fitting corner, a satin close-up;
 * no people, no readable lettering, none used by a template or another pack.
 * Hero 3965551 (wide) and 3965554 (tall): a boutique fitting corner with a
 * rail, plants and cream curtains. Tiles: casual 8030176, evening 15893780,
 * summer 17151139, modest 10689510. Banner 8793891 (blush satin, a calm field
 * for copy over it). Story / about 9788969 (two summer dresses on hangers).
 * Shop the look 8916600: three summer dresses on hangers on a terrace, pale
 * yellow, light blue and white, left to right; the dots are the demo's three
 * newest products (the yellow sundress, the sky blue dress, the white tiered
 * dress), so those three stay first in `products`.
 *
 * No hero video: none found without people, so both looks show the poster.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "dresses";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

// Casual stays Pexels 8030176 until its generated tile is made again (it came back with a dark band baked into its foot).
const TILES = [pexels(8030176, 1200), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@dantella.example";

export const DRESSES: Edition = {
  niche: NICHE,
  looks: ["fashion-luxe"],
  priceBand: { min: 400, max: 4000 },
  // The packshots are 4:5 on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "4:5", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("دانتيلا", "Dantella"),
    description: L("فساتين يومية وسهرة وصيفية وطويلة محتشمة.", "Casual, evening, summer and modest dresses."),
    categories: [
      ["casual", "فساتين يومية", "Casual dresses", TILES[0]!],
      ["soiree", "فساتين سهرة", "Evening dresses", TILES[1]!],
      ["summer", "فساتين صيفية", "Summer dresses", TILES[2]!],
      ["modest", "فساتين طويلة محتشمة", "Modest maxi dresses", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots, left to right in the photo: yellow, blue, white.
    products: [
      ["yellow-floral-sundress", "summer", "فستان صيفي أصفر مشجر", "Yellow Floral Sundress", P("yellow-floral-sundress"), 620, { rating: 4.5, sold90: 143 }],
      ["sky-blue-striped-dress", "summer", "فستان مقلم أزرق سماوي", "Sky Blue Striped Dress", P("sky-blue-striped-dress"), 650, { rating: 4.4, sold90: 121 }],
      ["white-linen-tiered-dress", "summer", "فستان كتان أبيض بكرانيش", "White Linen Tiered Dress", P("white-linen-tiered-dress"), 690, { rating: 4.6, sold90: 189 }],
      // Casual
      ["sage-green-wrap-midi-dress", "casual", "فستان ميدي ملفوف أخضر فاتح", "Sage Green Wrap Midi Dress", P("sage-green-wrap-midi-dress"), 890, { isFeatured: true, rating: 4.8, sold90: 214 }],
      ["navy-belted-shirt-dress", "casual", "فستان قميص كحلي بحزام", "Navy Belted Shirt Dress", P("navy-belted-shirt-dress"), 750, { rating: 4.6, sold90: 168 }],
      ["beige-knit-midi-dress", "casual", "فستان تريكو ميدي بيج", "Beige Ribbed Knit Midi Dress", P("beige-knit-midi-dress"), 820, { rating: 4.5, sold90: 97 }],
      ["terracotta-tshirt-dress", "casual", "فستان تيشيرت قطن بلون الطوب", "Terracotta Cotton T-Shirt Dress", P("terracotta-tshirt-dress"), 590, { rating: 4.5, sold90: 152 }],
      // Evening
      ["burgundy-velvet-evening-dress", "soiree", "فستان سهرة مخمل خمري", "Burgundy Velvet Evening Dress", P("burgundy-velvet-evening-dress"), 1950, { isFeatured: true, rating: 4.9, sold90: 86 }],
      ["black-satin-slip-dress", "soiree", "فستان سهرة ساتان أسود بحمالات", "Black Satin Slip Evening Dress", P("black-satin-slip-dress"), 1450, { rating: 4.7, sold90: 132 }],
      ["emerald-one-shoulder-gown", "soiree", "فستان سهرة ساتان زمردي بكتف واحد", "Emerald Satin One-Shoulder Gown", P("emerald-one-shoulder-gown"), 2200, { rating: 4.8, sold90: 61 }],
      ["champagne-sequin-evening-dress", "soiree", "فستان سهرة ترتر شامبين", "Champagne Sequin Evening Dress", P("champagne-sequin-evening-dress"), 2450, { rating: 4.7, sold90: 73 }],
      // Summer (the first three, above, are the newest)
      ["coral-off-shoulder-summer-dress", "summer", "فستان صيفي مرجاني بكتف منسدل", "Coral Off-Shoulder Summer Dress", P("coral-off-shoulder-summer-dress"), 670, { rating: 4.6, sold90: 134 }],
      // Modest maxi
      ["dusty-rose-maxi-dress", "modest", "فستان طويل كريب وردي هادئ", "Dusty Rose Crepe Maxi Dress", P("dusty-rose-maxi-dress"), 980, { isFeatured: true, rating: 4.8, sold90: 176 }],
      ["olive-maxi-shirt-dress", "modest", "فستان قميص طويل زيتي", "Olive Maxi Shirt Dress", P("olive-maxi-shirt-dress"), 920, { rating: 4.6, sold90: 109 }],
      ["black-floral-chiffon-maxi-dress", "modest", "فستان طويل شيفون أسود مشجر", "Black Floral Chiffon Maxi Dress", P("black-floral-chiffon-maxi-dress"), 1050, { rating: 4.7, sold90: 94 }],
      ["mocha-pleated-maxi-dress", "modest", "فستان طويل ساتان بطيّات بلون الموكا", "Mocha Satin Pleated Maxi Dress", P("mocha-pleated-maxi-dress"), 1120, { rating: 4.7, sold90: 118 }],
    ],
  }),
  photos: {
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(3965554, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
    // The dots, in percent from the photo's left and top: the yellow, the blue and the white dress.
    look: {
      src: scene("look"),
      dots: [
        { x: 20, y: 44 },
        { x: 45, y: 52 },
        { x: 68, y: 54 },
      ],
    },
  },
  copy: {
    announcement: [
      L("فساتين يومية وسهرة وصيفية", "Casual, evening and summer dresses"),
      L("تفاصيل ومقاسات واضحة لكل فستان", "Clear details and sizes for every dress"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    hero: {
      alt: L("شماعة فساتين بجوار ستائر كريمية ونباتات", "A rail of dresses beside cream curtains and plants"),
      eyebrow: L("تشكيلة الموسم", "This season's edit"),
      title: L("فستانك لكل مناسبة", "A dress for every occasion"),
      line: L("فساتين يومية وفساتين سهرة وفساتين طويلة محتشمة.", "Casual dresses, evening dresses and modest maxi dresses."),
      cta: L("تسوّق الفساتين", "Shop the dresses"),
    },
    categories: { title: L("تسوّق حسب المناسبة", "Shop by occasion") },
    products: {
      primary: {
        title: L("الفساتين الأكثر طلبًا", "Most-loved dresses"),
        line: L("تشكيلة مختارة من فساتين الموسم.", "A selection of this season's dresses."),
      },
    },
    story: {
      alt: L("ساتان وردي وكريب عاجي بطيّات ناعمة", "Blush satin and ivory crepe in soft folds"),
      eyebrow: L("الخامة أولًا", "Fabric first"),
      title: L("خامات ساتان وكريب وكتان", "Satin, crepe and linen"),
      text: L("نختار كل فستان حسب خامته وقصّته، ونذكر الخامة والمقاسات في صفحة كل موديل.", "We choose every dress for its fabric and its cut, and list the fabric and measurements on each product page."),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    look: {
      alt: L("ثلاثة فساتين صيفية على شماعات في شرفة: أصفر وأزرق فاتح وأبيض", "Three summer dresses on hangers on a terrace: yellow, light blue and white"),
      eyebrow: L("إطلالة الصيف", "The summer look"),
      title: L("ثلاثة فساتين صيفية", "Three summer dresses"),
      text: L("اضغط على أي نقطة في الصورة لترى أقرب فستان لها من تشكيلتنا.", "Tap a dot on the photo to see the closest dress from our range."),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل فستان", "Clear details and sizes for every dress") },
      { title: L("خامات مذكورة", "Fabrics listed"), line: L("الخامة في صفحة كل موديل", "Fabric listed on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new styles first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("دانتيلا: فساتين لكل مناسبة، مختارة بعناية.", "Dantella: dresses for every occasion, chosen with care.") },
    about: {
      line: L("فساتين لكل مناسبة، مختارة بعناية.", "Dresses for every occasion, chosen with care."),
      alt: L("فستانان صيفيان على شماعات: مرجاني وأصفر", "Two summer dresses on hangers: coral and yellow"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("موديلات مختارة بعناية", "Few styles, well chosen"),
      text: L(
        "دانتيلا متجر للفساتين اليومية وفساتين السهرة والفساتين الصيفية والمحتشمة، ونذكر خامة كل موديل وقصّته ومقاساته في صفحته.",
        "Dantella sells casual, evening, summer and modest dresses. Each style's page lists its fabric, cut and sizes.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("تحتاج مساعدة في المقاس؟ اسألنا", "Need help with sizing? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizing, fabrics and ordering."),
      question: L("كيف أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "مقاسات كل فستان مذكورة في صفحته بالسنتيمتر. وإذا كنت بين مقاسين، تواصل معنا لنساعدك في اختيار الأنسب.",
        "Each dress lists its measurements in centimetres on its page. If you are between two sizes, contact us and we will help you choose.",
      ),
    },
    // Vella's footer contact column: demo values, the seller's own replace them.
    custom: {
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", PHONE_EN),
      "contact-email": L(`البريد: ${handle(EMAIL)}`, EMAIL),
      "contact-address": L("القاهرة، مصر", "Cairo, Egypt"),
      "contact-hours": L("كل يوم، ١٠ ص – ١٠ م", "Every day, 10am to 10pm"),
      // Vella's footer link to the whole catalog (its default reads "Offers").
      "footer-offers": L("كل الفساتين", "All dresses"),
      // fashion-luxe: the link to the whole catalog, and the noun after a category tile's count.
      "shop-all": L("كل الفساتين", "All dresses"),
      "products-noun": L("فساتين", "dresses"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "What our customers say"), related: L("فساتين قد تعجبك", "Dresses you may like") } },
};
