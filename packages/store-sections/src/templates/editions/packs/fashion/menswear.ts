/**
 * The menswear edition (niche editions, ROADMAP F-90): a men's smart-casual
 * shop, "Hendam" (Arabic for a well-kept turnout). Sixteen pieces in four
 * categories of four (shirts, polos and knitwear, trousers, jackets: one full
 * row of four on every category row), white-background flat lays
 * (`editionPhoto`, square). Data only. No React here.
 *
 * Materials, kept the same everywhere: the tan jacket is faux suede, the
 * black jacket is genuine leather.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * shirts, knits, trousers and jackets on rails, hooks and wood; no people,
 * hands or mannequins, no readable lettering, none used by a template or
 * another pack, none twice.
 * Hero 5424945 (wide: two black rails of shirts, sweatshirts and denim in a
 * room with wooden doors; the hanger tags are too small to read) and 18335270
 * (tall: a rust denim jacket and a canvas tote on an oak hook rail). Tiles:
 * shirts 35150391 (a light blue placket and buttons over a grey pinstripe),
 * polos and knitwear 13889763 (a stack of cream, beige and brown knits),
 * trousers 6045283 (trousers hanging close: denim, grey wool, navy, khaki),
 * jackets 615003 (brown and navy jackets on a rail). Banner 298864 (folded
 * grey wool and tan brogues on a dark shelf, shirts behind; the clock's
 * numerals are the only figures, no lettering). Story / about 7794265 (the
 * neck of a grey wool crew knit). Shop the look 3998647: four layers laid
 * out on light wood (a charcoal knit, a grey wool coat, a black hooded parka,
 * a navy bomber); the dots are the demo's three newest products, the closest
 * pieces of the range (the grey crew sweater on the knit, the olive field
 * jacket on the parka, the navy bomber on the bomber), so those three stay
 * first in `products`. Zay's hero collage: 36910113 (4:5, a checked blazer,
 * a chambray shirt, rust trousers, a tie and loafers laid out together),
 * 6276002 (square, a navy shirt collar and buttons), 3633039 (4:3, a navy
 * knit texture).
 *
 * Left out after the check: 35750806 (a stamped name on a wooden hanger),
 * 17315934 (an "S" size ring on a hanger), 8788679 and 10131161 (readable
 * neck labels), 11485035, 11176397 and 11100267 (a brand label), 34334481
 * ("GERMAN" label, printed lettering), 37595197 (a brand patch), 13094233 (a
 * neck label), 7679866 (lettering on a jacket), 33800036 ("STRETCH" tag),
 * 8531904 and 16470015 (a brand swing tag), 3944693, 9065153 and 18533673
 * (labels and leather patches), 34150928 (a logo on the knit), 1266143 (a
 * phone with lettering), 253668 and 31155535 (label rows), 17351234 and
 * 16959150 (price tags and a handwritten sign), 5120085 (printed lettering),
 * 19736559 (a frayed jacket and scribbles on the post), 36593273 (reads as
 * womenswear), and photos of people or body parts (9464625, 2897533,
 * 10341113, 7959592, 5264910, 31318445 and the chino and suede searches).
 * Already used by a template or pack: 39176732, 7755387, 7989576, 965632,
 * 1682699, 7671168, 7671167, 7671163, 17293343, 10558182, 30569741,
 * 14641438, 30263570, 5710046, 14641440, 7679725, 6909817, 37524688,
 * 4641824, 20763273, 8483487, 8483478, 7679455, 7679798, 29765480, 8113002,
 * 8112996, 22441297, 17281873, 12955555, 15923917, 5706273, 18144397,
 * 996329, 6347892, 6461392.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so zay's
 * home ends on its best-seller carousel.
 *
 * No hero video: none found without people, so fashion-luxe shows the poster.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "menswear";
const P = (slug: string) => editionPhoto(NICHE, slug);

const TILES = [pexels(35150391, 1200), pexels(13889763, 1200), pexels(6045283, 1200), pexels(615003, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@hendam.example";

export const MENSWEAR: Edition = {
  niche: NICHE,
  looks: ["zay"],
  priceBand: { min: 450, max: 4500 },
  // The flat lays are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("هِندام", "Hendam"),
    description: L(
      "قمصان وبولو وتريكو وبناطيل وجواكت رجالي، لبس شيك تروح بيه الشغل وتخرج بيه بعدها.",
      "Men's shirts, polos, knitwear, trousers and jackets: smart clothes for work and for after.",
    ),
    categories: [
      ["shirts", "قمصان", "Shirts", TILES[0]!],
      ["polos-knitwear", "بولو وتريكو", "Polos & knitwear", TILES[1]!],
      ["trousers", "بناطيل", "Trousers", TILES[2]!],
      ["jackets", "جواكت", "Jackets", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the grey crew sweater, the olive field jacket, the navy bomber.
    products: [
      ["grey-crew-sweater", "polos-knitwear", "بلوفر رمادي رقبة مدوّرة", "Grey Crew-Neck Sweater", P("grey-crew-sweater"), 1250, { isFeatured: true, rating: 4.8, sold90: 164 }],
      ["olive-field-jacket", "jackets", "جاكيت فيلد زيتي", "Olive Field Jacket", P("olive-field-jacket"), 2250, { rating: 4.7, sold90: 88 }],
      ["navy-bomber-jacket", "jackets", "جاكيت بومبر كحلي", "Navy Bomber Jacket", P("navy-bomber-jacket"), 1950, { isFeatured: true, rating: 4.8, sold90: 131 }],
      // The rest, mixed so a row of the newest shows every category.
      ["white-oxford-shirt", "shirts", "قميص أكسفورد أبيض", "White Oxford Shirt", P("white-oxford-shirt"), 890, { isFeatured: true, rating: 4.8, sold90: 342 }],
      ["stone-chino-trousers", "trousers", "بنطلون شينو بيج فاتح", "Stone Chino Trousers", P("stone-chino-trousers"), 950, { rating: 4.7, sold90: 268 }],
      ["navy-pique-polo", "polos-knitwear", "بولو بيكيه كحلي", "Navy Piqué Polo", P("navy-pique-polo"), 650, { rating: 4.7, sold90: 311 }],
      ["light-blue-linen-shirt", "shirts", "قميص كتان لبني", "Light Blue Linen Shirt", P("light-blue-linen-shirt"), 1150, { rating: 4.7, sold90: 197 }],
      ["charcoal-tailored-trousers", "trousers", "بنطلون قماش رصاصي غامق", "Charcoal Tailored Trousers", P("charcoal-tailored-trousers"), 1190, { rating: 4.6, sold90: 142 }],
      ["tan-suede-jacket", "jackets", "جاكيت سويد صناعي هافان", "Tan Faux Suede Jacket", P("tan-suede-jacket"), 2900, { compareAtPrice: 3300, rating: 4.6, sold90: 73 }],
      ["olive-knit-polo", "polos-knitwear", "بولو تريكو زيتي", "Olive Knit Polo", P("olive-knit-polo"), 890, { rating: 4.6, sold90: 118 }],
      ["navy-striped-shirt", "shirts", "قميص مقلّم كحلي", "Navy Striped Shirt", P("navy-striped-shirt"), 950, { compareAtPrice: 1100, rating: 4.6, sold90: 156 }],
      ["navy-drawstring-trousers", "trousers", "بنطلون كحلي بأستك ورباط", "Navy Drawstring Trousers", P("navy-drawstring-trousers"), 790, { rating: 4.6, sold90: 203 }],
      ["black-leather-jacket", "jackets", "جاكيت جلد طبيعي أسود", "Black Leather Jacket", P("black-leather-jacket"), 4500, { rating: 4.9, sold90: 41 }],
      ["beige-quarter-zip-sweater", "polos-knitwear", "بلوفر بيج بسوستة نص", "Beige Quarter-Zip Sweater", P("beige-quarter-zip-sweater"), 1490, { compareAtPrice: 1700, rating: 4.7, sold90: 96 }],
      ["black-overshirt", "shirts", "أوفرشيرت أسود", "Black Overshirt", P("black-overshirt"), 1450, { rating: 4.7, sold90: 112 }],
      ["black-cargo-trousers", "trousers", "بنطلون كارجو أسود", "Black Cargo Trousers", P("black-cargo-trousers"), 1050, { rating: 4.5, sold90: 137 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(5424945, 1920), tall: pexels(18335270, 1200) },
    tiles: TILES,
    banner: pexels(298864, 2000),
    story: pexels(7794265, 1200),
    // The dots, in percent from the photo's left and top: the knit (grey crew sweater), the parka (olive field jacket), the bomber (navy bomber jacket).
    look: {
      src: pexels(3998647, 1400),
      dots: [
        { x: 10, y: 45 },
        { x: 59, y: 48 },
        { x: 84, y: 48 },
      ],
    },
    // Zay's hero collage: 1 portrait 4:5, 2 square, 3 landscape 4:3, one per caption (`custom.hero-piece-1..3`).
    custom: {
      "hero-piece-1": pexels(36910113, 1200),
      "hero-piece-2": pexels(6276002, 900),
      "hero-piece-3": pexels(3633039, 1400),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على قميص، بولو، جاكيت…", "Search shirts, polos, jackets…") },
    hero: {
      alt: L("قمصان وبلوفرات وجواكت رجالي على رفّين في أوضة بأبواب خشب", "Men's shirts, sweaters and jackets on two rails in a room with wooden doors"),
      eyebrow: L("لبس الشغل وما بعده", "For work and after"),
      title: L("شياكة كل يوم من غير مجهود", "Smart every day, without trying"),
      line: L(
        "قمصان وبولو وتريكو وبناطيل وجواكت بتتنسّق مع بعض، فتلبس على طول من غير ما تفكّر كتير.",
        "Shirts, polos, knitwear, trousers and jackets that go together, so getting dressed takes a minute.",
      ),
      cta: L("تسوّق التشكيلة", "Shop the range"),
    },
    categories: { title: L("ابدأ من هنا", "Start here") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("القطع اللي عملاءنا بيرجعوا يطلبوها بلون تاني.", "The pieces our customers come back for in another colour."),
      },
    },
    story: {
      alt: L("رقبة بلوفر صوف رمادي، قريب أوي", "The neck of a grey wool sweater, up close"),
      eyebrow: L("الخامة قبل الموضة", "Fabric before fashion"),
      title: L("قطع تعيش معاك أكتر من موسم", "Pieces that last more than a season"),
      text: L(
        "بنكتب خامة كل قطعة ومقاساتها بالسنتيمتر في صفحتها: أكسفورد قطن، كتان، صوف، سويد صناعي وجلد طبيعي، كل حاجة باسمها.",
        "Every page lists the fabric and the measurements in centimetres: cotton oxford, linen, wool, faux suede and genuine leather, each called by its name.",
      ),
      cta: L("شوف الجديد", "See what is new"),
    },
    // Zay's carousel of best sellers.
    rows: [{ title: L("بيرجعوا يطلبوه", "The ones they reorder") }],
    look: {
      alt: L("بلوفر وبالطو وباركا وجاكيت بومبر جنب بعض على أرضية خشب فاتح", "A knit, a coat, a parka and a bomber jacket side by side on light wood"),
      eyebrow: L("طبقات الشتا", "Winter layers"),
      title: L("طبقة فوق طبقة", "Layer on layer"),
      text: L("دوس على أي نقطة في الصورة وشوف أقرب قطعة ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest piece from our range."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا طولك ووزنك على واتساب", "Send us your height and weight on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف التشكيلة الجديدة أول واحد", "Hear about new pieces first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    // Zay's large sign-off line.
    footer: { line: L("البس مظبوط، وانزل", "Dress right, then go") },
    about: {
      line: L("لبس رجالي شيك لكل يوم.", "Smart menswear for every day."),
      alt: L("رقبة بلوفر صوف رمادي، قريب أوي", "The neck of a grey wool sweater, up close"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("دولاب صغير، لبس أكتر", "A smaller wardrobe, more outfits"),
      text: L(
        "هِندام بدأ من سؤال كل يوم الصبح: ألبس إيه؟ فاخترنا قطع بألوان هادية بتتنسّق مع بعض، قميص وبنطلون وطبقة فوقهم، عشان كل قطعة تشتغل مع التانية.",
        "Hendam began with the question every morning brings: what do I wear? So we chose pieces in quiet colours that go together, a shirt, trousers and a layer on top, so every piece works with the rest.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق التشكيلة", "Shop the range"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتار في المقاس أو التنسيق؟ اسألنا", "Not sure about a size or what goes with what? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات والتوصيل.", "Sizes, fabrics and delivery."),
      question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "عرض الصدر والطول مكتوبين في صفحة كل قطعة بالسنتيمتر. قيس قطعة مريحة عندك وقارن، ولو بين مقاسين ابعتلنا طولك ووزنك ونقولك الأنسب.",
        "Each page lists the chest width and length in centimetres. Measure a piece that fits you well and compare; if you are between two sizes, send us your height and weight and we will tell you which fits.",
      ),
    },
    custom: {
      // Fashion-luxe: the link to the whole catalog, and the noun after a category tile's product count.
      "shop-all": L("كل التشكيلة", "Shop all"),
      "products-noun": L("قطع", "pieces"),
      // Zay: the store's short name inside a sentence ("Why Hendam?", "About Hendam").
      "store-short": L("هِندام", "Hendam"),
      // Zay's hero captions, numbered under the collage photos.
      "hero-piece-1": L("طقم كامل", "The full outfit"),
      "hero-piece-2": L("قمصان", "Shirts"),
      "hero-piece-3": L("تريكو", "Knitwear"),
      // Zay's comparison: rows 1 and 3 are ticked for the store only, row 2 for both.
      "compare-row-1": L("الخامة مكتوبة بصراحة لكل قطعة", "The fabric named honestly on every piece"),
      "compare-row-2": L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
      "compare-row-3": L("ألوان بتتنسّق مع بعض", "Colours chosen to go together"),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي لبسوه", "From people who wear it"), related: L("قطع تكمّل الطقم", "Pieces to finish the outfit") } },
};
