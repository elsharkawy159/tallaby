/**
 * The dresses edition (niche editions pilot, ROADMAP F-90): a dress boutique,
 * "Dantella". Sixteen dresses in four categories of four (casual, evening,
 * summer, modest maxi: one full row of four on every category row), white-background packshots on a ghost mannequin
 * (`editionPhoto`, portrait 4:5). Data only. No React here.
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

const TILES = [pexels(8030176, 1200), pexels(15893780, 1200), pexels(17151139, 1200), pexels(10689510, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@dantella.example";

export const DRESSES: Edition = {
  niche: NICHE,
  looks: ["fashion-luxe", "vella"],
  priceBand: { min: 400, max: 4000 },
  // The packshots are 4:5 on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "4:5", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("دانتيلا", "Dantella"),
    description: L("فساتين كاجوال وسواريه وصيفي ومحتشمة، مختارة بعناية.", "Casual, evening, summer and modest dresses, chosen with care."),
    categories: [
      ["casual", "فساتين كاجوال", "Casual dresses", TILES[0]!],
      ["soiree", "فساتين سواريه", "Evening dresses", TILES[1]!],
      ["summer", "فساتين صيفي", "Summer dresses", TILES[2]!],
      ["modest", "فساتين طويلة محتشمة", "Modest maxi dresses", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots, left to right in the photo: yellow, blue, white.
    products: [
      ["yellow-floral-sundress", "summer", "فستان صيفي أصفر مشجر", "Yellow Floral Sundress", P("yellow-floral-sundress"), 620, { rating: 4.5, sold90: 143 }],
      ["sky-blue-striped-dress", "summer", "فستان مقلم أزرق سماوي", "Sky Blue Striped Dress", P("sky-blue-striped-dress"), 650, { rating: 4.4, sold90: 121 }],
      ["white-linen-tiered-dress", "summer", "فستان كتان أبيض بكرانيش", "White Linen Tiered Dress", P("white-linen-tiered-dress"), 690, { rating: 4.6, sold90: 189 }],
      // Casual
      ["sage-green-wrap-midi-dress", "casual", "فستان ميدي لف أخضر فاتح", "Sage Green Wrap Midi Dress", P("sage-green-wrap-midi-dress"), 890, { isFeatured: true, rating: 4.8, sold90: 214 }],
      ["navy-belted-shirt-dress", "casual", "فستان قميص كحلي بحزام", "Navy Belted Shirt Dress", P("navy-belted-shirt-dress"), 750, { rating: 4.6, sold90: 168 }],
      ["beige-knit-midi-dress", "casual", "فستان تريكو ميدي بيج", "Beige Ribbed Knit Midi Dress", P("beige-knit-midi-dress"), 820, { rating: 4.5, sold90: 97 }],
      ["terracotta-tshirt-dress", "casual", "فستان تيشيرت قطن طوبي", "Terracotta Cotton T-Shirt Dress", P("terracotta-tshirt-dress"), 590, { rating: 4.5, sold90: 152 }],
      // Evening
      ["burgundy-velvet-evening-dress", "soiree", "فستان سواريه قطيفة نبيتي", "Burgundy Velvet Evening Dress", P("burgundy-velvet-evening-dress"), 1950, { isFeatured: true, rating: 4.9, sold90: 86 }],
      ["black-satin-slip-dress", "soiree", "فستان سواريه ساتان أسود بحمالات", "Black Satin Slip Evening Dress", P("black-satin-slip-dress"), 1450, { rating: 4.7, sold90: 132 }],
      ["emerald-one-shoulder-gown", "soiree", "فستان سواريه ساتان زمردي كتف واحد", "Emerald Satin One-Shoulder Gown", P("emerald-one-shoulder-gown"), 2200, { rating: 4.8, sold90: 61 }],
      ["champagne-sequin-evening-dress", "soiree", "فستان سواريه ترتر شامبين", "Champagne Sequin Evening Dress", P("champagne-sequin-evening-dress"), 2450, { rating: 4.7, sold90: 73 }],
      // Summer (the first three, above, are the newest)
      ["coral-off-shoulder-summer-dress", "summer", "فستان صيفي مرجاني أوف شولدر", "Coral Off-Shoulder Summer Dress", P("coral-off-shoulder-summer-dress"), 670, { rating: 4.6, sold90: 134 }],
      // Modest maxi
      ["dusty-rose-maxi-dress", "modest", "فستان طويل كريب وردي هادي", "Dusty Rose Crepe Maxi Dress", P("dusty-rose-maxi-dress"), 980, { isFeatured: true, rating: 4.8, sold90: 176 }],
      ["olive-maxi-shirt-dress", "modest", "فستان قميص طويل زيتي", "Olive Maxi Shirt Dress", P("olive-maxi-shirt-dress"), 920, { rating: 4.6, sold90: 109 }],
      ["black-floral-chiffon-maxi-dress", "modest", "فستان طويل شيفون أسود مشجر", "Black Floral Chiffon Maxi Dress", P("black-floral-chiffon-maxi-dress"), 1050, { rating: 4.7, sold90: 94 }],
      ["mocha-pleated-maxi-dress", "modest", "فستان طويل ساتان بليسيه موكا", "Mocha Satin Pleated Maxi Dress", P("mocha-pleated-maxi-dress"), 1120, { rating: 4.7, sold90: 118 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(3965551, 1920), tall: pexels(3965554, 1200) },
    tiles: TILES,
    banner: pexels(8793891, 2000),
    story: pexels(9788969, 1200),
    // The dots, in percent from the photo's left and top: the yellow, the blue and the white dress.
    look: {
      src: pexels(8916600, 1400),
      dots: [
        { x: 20, y: 44 },
        { x: 45, y: 52 },
        { x: 68, y: 54 },
      ],
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفعي عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    hero: {
      alt: L("ركن قياس في بوتيك: شماعة فساتين وستاير كريمي ونباتات", "A boutique fitting corner: a rail of dresses, cream curtains and plants"),
      eyebrow: L("تشكيلة الموسم", "This season's edit"),
      title: L("فستانك لكل مناسبة", "A dress for every occasion"),
      line: L("كاجوال للنهار، سواريه للسهرة، وطويل محتشم لكل يوم.", "Casual for the day, evening for the night, and modest maxis for every day."),
      cta: L("تسوّقي الفساتين", "Shop the dresses"),
    },
    categories: { title: L("اختاري على حسب المناسبة", "Shop by occasion") },
    products: {
      primary: {
        title: L("الفساتين الأكثر طلبًا", "Most-loved dresses"),
        line: L("الموديلات اللي عميلاتنا بيطلبوها أكتر.", "The styles our customers order most."),
      },
    },
    story: {
      alt: L("قماش ساتان وردي فاتح بطيّات ناعمة", "Blush satin fabric in soft folds"),
      eyebrow: L("الخامة أول حاجة", "Fabric comes first"),
      title: L("قماش تحسّي بيه من أول لمسة", "Fabric you feel at first touch"),
      text: L("بنختار كل فستان على حسب خامته وقصّته، وبنكتبلك الخامة والمقاسات في صفحة كل موديل.", "We choose every dress for its fabric and its cut, and list the fabric and measurements on each product page."),
      cta: L("شوفي الجديد", "See what is new"),
    },
    look: {
      alt: L("تلات فساتين صيفي على شماعات في تراس: أصفر وأزرق فاتح وأبيض", "Three summer dresses on hangers on a terrace: yellow, light blue and white"),
      eyebrow: L("لوك الصيف", "The summer look"),
      title: L("تلات فساتين لأيام الصيف", "Three dresses for summer days"),
      text: L("دوسي على أي نقطة في الصورة وشوفي أقرب فستان ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest dress from our range."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتيلنا مقاساتك على واتساب", "Send us your measurements on WhatsApp") },
      { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرفي الموديلات الجديدة أول واحدة", "Hear about new styles first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("دانتيلا: فساتين لكل مناسبة، مختارة بعناية.", "Dantella: dresses for every occasion, chosen with care.") },
    about: {
      line: L("فساتين لكل مناسبة، مختارة بعناية.", "Dresses for every occasion, chosen with care."),
      alt: L("فستانين صيفي على شماعات: وردي وأصفر", "Two summer dresses on hangers: coral and yellow"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("موديلات قليلة، مختارة صح", "Few styles, well chosen"),
      text: L(
        "دانتيلا بدأت من حب الفساتين. بننزّل موديلات قليلة في كل تشكيلة، وكل موديل بنراجع خامته وقصّته ومقاساته قبل ما يتعرض.",
        "Dantella began with a love of dresses. Each range holds a few styles, and we check the fabric, cut and sizing of every one before it is listed.",
      ),
      more: L("ولو المقاس مش مظبوط عليكي، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتاجة مساعدة في المقاس؟ اسألينا", "Need help with sizing? Ask us"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاستبدال.", "Sizing, delivery and exchanges."),
      question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "مقاسات كل فستان مكتوبة في صفحته بالسنتيمتر. ولو بين مقاسين، ابعتيلنا مقاساتك ونقولك الأنسب.",
        "Each dress lists its measurements in centimetres on its page. If you are between two sizes, send us your measurements and we will tell you which fits.",
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
  productPage: { copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("فساتين ممكن تعجبك", "Dresses you may like") } },
};
