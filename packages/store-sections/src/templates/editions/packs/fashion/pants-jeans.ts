/**
 * The pants and jeans edition (niche editions pilot, ROADMAP F-90): a
 * trousers shop, "Qassa" (Egyptian for "the cut"). Sixteen pairs in four
 * categories of four (jeans, wide-leg, chinos and tailored, joggers and
 * sweatpants: one full row of four on every category row), white-background
 * packshots (`editionPhoto`, square). Data only. No React here.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `fashion-bold` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * jeans and trousers folded, stacked and on hangers, denim, linen and soft
 * cotton; no people, hands or mannequins, no readable lettering, none used by
 * a template or another pack, none twice.
 * Hero 16390580 (wide: jeans on wooden hangers, dark to light wash; the
 * clips carry no text) and 7764609 (tall: folded white and blue jeans on a
 * wooden stool, grey room). Tiles: jeans 6764122 (a close stack of folded
 * jeans), wide-leg 31842963 (flowing trousers in many colours on white
 * hangers, a white drawstring pair in front), chinos and tailored 33633245
 * (taupe trousers, a knit, a belt and boots laid out on navy), joggers and
 * sweatpants 10348923 (soft cotton and knit folded in a stack, earth tones).
 * Banner 10133275 (indigo denim folded, a calm field for copy). Story / about
 * 4546763 (folded jeans on white). Shop the look 17720471: three pairs of
 * jeans on white, two light wash at the top and a dark one below; the dots
 * are the demo's three newest products (the light mom jeans, the wide-leg
 * jeans, the mid blue straight jeans), so those three stay first in
 * `products`. Zay's hero collage: 4210866 (4:5, jeans stacked light to
 * dark), 6461325 (square, linen trousers and shirts on a wooden rail),
 * 1082528 (4:3, two pairs of jeans on wooden hangers on a white wall).
 *
 * Left out after the check: 24513121 (brand lettering on the jeans' labels),
 * 11176394 (a logo on the back pocket and lettering on the waistband),
 * 29210804 (a mannequin and shop signs behind the rail, size tags),
 * 279079 ("W 34" size stickers), 1598507, 2129970, 6069083, 6069087,
 * 16729456 and 17139455 (leather patches, brand tags or shop lettering),
 * 31961165 (a printed logo on the sweatpants), 4085305 (a sneaker logo),
 * 18533675 (a brand name on a box), 20777875 (a brand patch), and photos of
 * people (4611657, 39457742, 39457735 and the other jogger searches).
 * Already used by a template: 31961166, 31961167, 31961168, 6046228,
 * 20094389, 4210864, 6461398, 6461477, 11733651, 9594667.
 *
 * Looks: `fashion-bold` (Alwan, the niche's template, one template per
 * niche; it shows the pack itself, Qassa), then `zay` and `fashion-luxe`
 * until the fashion switch takes them off. For Alwan (checked by eye
 * 2026-11-12, no people, lettering or labels, used nowhere else): hero
 * 19824259 (rolled jeans in rows, indigo to light; it replaced 16390580 as
 * `hero.wide`, which moved to Alwan's second slide); the third slide is the
 * banner; fit steps 10895045 (a yellow tape measure on blue), 30828508
 * (denim bands, light to charcoal), 4109765 (an indigo hem with gold
 * top-stitching). Rejected: 32641555, 7775472, 7774245 (hands), 8788779,
 * 8788785 (a person measuring), 783590 (a machine logo), 31070328 (ruler
 * lettering), 6461479 (a word in buttons), 18199255 (a mark on the
 * scissors), 17265364 (waistband labels).
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

const NICHE = "pants-jeans";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@qassa.example";

export const PANTS_JEANS: Edition = {
  niche: NICHE,
  looks: ["fashion-bold"],
  priceBand: { min: 300, max: 1500 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("قَصّة", "Qassa"),
    description: L("جينز وبناطيل واسعة وشينو وبناطيل رياضية بمقاسات متعددة.", "Jeans, wide-leg trousers, chinos and sweatpants in a range of sizes."),
    categories: [
      ["jeans", "جينز", "Jeans", TILES[0]!],
      ["wide-leg", "بناطيل واسعة", "Wide-leg trousers", TILES[1]!],
      ["chinos-tailored", "شينو وبناطيل رسمية", "Chinos & tailored", TILES[2]!],
      ["joggers", "بناطيل رياضية", "Joggers & sweatpants", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the light mom jeans, the wide-leg jeans, the mid blue straight jeans.
    products: [
      ["light-wash-mom-jeans", "jeans", "جينز بخصر عالٍ فاتح", "Light Wash Mom Jeans", P("light-wash-mom-jeans"), 850, { rating: 4.7, sold90: 236 }],
      ["blue-wide-leg-jeans", "wide-leg", "جينز واسع أزرق", "Blue Wide-Leg Jeans", P("blue-wide-leg-jeans"), 950, { isFeatured: true, rating: 4.8, sold90: 251 }],
      ["mid-blue-straight-jeans", "jeans", "جينز مستقيم أزرق متوسط", "Mid Blue Straight Jeans", P("mid-blue-straight-jeans"), 890, { isFeatured: true, rating: 4.8, sold90: 318 }],
      // The rest, mixed so a row of the newest shows every category.
      ["beige-chino-trousers", "chinos-tailored", "بنطلون شينو بيج", "Beige Chino Trousers", P("beige-chino-trousers"), 690, { isFeatured: true, rating: 4.7, sold90: 274 }],
      ["grey-melange-joggers", "joggers", "بنطلون رياضي رمادي ميلانج", "Grey Melange Joggers", P("grey-melange-joggers"), 450, { rating: 4.6, sold90: 297 }],
      ["beige-linen-wide-leg-trousers", "wide-leg", "بنطلون كتان واسع بيج", "Beige Linen Wide-Leg Trousers", P("beige-linen-wide-leg-trousers"), 780, { rating: 4.7, sold90: 168 }],
      ["black-slim-jeans", "jeans", "جينز ضيّق أسود", "Black Slim Jeans", P("black-slim-jeans"), 870, { rating: 4.7, sold90: 289 }],
      ["navy-tailored-trousers", "chinos-tailored", "بنطلون قماش كحلي", "Navy Tailored Trousers", P("navy-tailored-trousers"), 820, { compareAtPrice: 950, rating: 4.6, sold90: 143 }],
      ["black-tapered-joggers", "joggers", "بنطلون رياضي أسود ضيّق عند الحافة", "Black Tapered Joggers", P("black-tapered-joggers"), 480, { rating: 4.7, sold90: 262 }],
      ["black-wide-leg-trousers", "wide-leg", "بنطلون قماش واسع أسود", "Black Wide-Leg Trousers", P("black-wide-leg-trousers"), 820, { rating: 4.6, sold90: 154 }],
      ["grey-straight-jeans", "jeans", "جينز مستقيم رمادي", "Grey Straight Jeans", P("grey-straight-jeans"), 890, { rating: 4.5, sold90: 121 }],
      ["olive-cargo-trousers", "chinos-tailored", "بنطلون كارجو زيتي", "Olive Cargo Trousers", P("olive-cargo-trousers"), 750, { rating: 4.6, sold90: 187 }],
      ["navy-side-stripe-joggers", "joggers", "بنطلون رياضي كحلي بخط أبيض جانبي", "Navy Side-Stripe Joggers", P("navy-side-stripe-joggers"), 520, { rating: 4.5, sold90: 133 }],
      ["terracotta-palazzo-trousers", "wide-leg", "بنطلون بالاتسو بلون الطوب بحزام", "Terracotta Palazzo Trousers", P("terracotta-palazzo-trousers"), 720, { compareAtPrice: 850, rating: 4.6, sold90: 109 }],
      ["brown-corduroy-trousers", "chinos-tailored", "بنطلون مخمل مضلّع بني", "Brown Corduroy Trousers", P("brown-corduroy-trousers"), 790, { rating: 4.7, sold90: 96 }],
      ["beige-straight-sweatpants", "joggers", "بنطلون رياضي مستقيم بيج", "Beige Straight Sweatpants", P("beige-straight-sweatpants"), 460, { rating: 4.6, sold90: 178 }],
    ],
  }),
  photos: {
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(7764609, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
    // The dots, in percent from the photo's left and top: the light mom jeans, the wide-leg jeans, the mid blue straight jeans.
    look: {
      src: pexels(17720471, 1400),
      dots: [
        { x: 40, y: 18 },
        { x: 82, y: 26 },
        { x: 66, y: 64 },
      ],
    },
    // Zay's hero collage: 1 portrait 4:5, 2 square, 3 landscape 4:3, one per caption (`custom.hero-piece-1..3`).
    custom: {
      // `fashion-bold`: the hero carousel's second slide (16:9; the third is `banner`).
      "slide-2": scene("slide-2"),
      // `fashion-bold`: the fit steps, square: measure, pick the wash, we hem.
      "fit-1": scene("fit-1"),
      "fit-2": scene("fit-2"),
      "fit-3": scene("fit-3"),
      "hero-piece-1": pexels(4210866, 1200),
      "hero-piece-2": pexels(6461325, 900),
      "hero-piece-3": pexels(1082528, 1400),
    },
  },
  copy: {
    announcement: [
      L("جينز وبناطيل واسعة وشينو", "Jeans, wide-leg trousers and chinos"),
      L("تفاصيل ومقاسات واضحة لكل بنطلون", "Clear details and sizes for every pair"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحث عن جينز، شينو، بنطلون رياضي…", "Search jeans, chinos, joggers…") },
    hero: {
      alt: L("بناطيل جينز ملفوفة متجاورة بكل درجات الأزرق", "Rolled jeans side by side in every shade of blue"),
      eyebrow: L("تشكيلة الموسم", "This season's range"),
      title: L("بناطيل بمقاسات واضحة", "Trousers in clear sizes"),
      line: L(
        "جينز وبناطيل واسعة وشينو وبناطيل رياضية، والطول الداخلي مذكور لكل مقاس.",
        "Jeans, wide-leg trousers, chinos and joggers, with the inseam listed for every size.",
      ),
      cta: L("تسوّق البناطيل", "Shop the trousers"),
    },
    categories: { title: L("اختر القَصّة", "Pick your cut") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("تشكيلة مختارة من الجينز والبناطيل.", "A selection of jeans and trousers."),
      },
    },
    story: {
      alt: L("بناطيل جينز مطوية على طاولة بيضاء، والعلوي مفتوح تظهر خياطته", "Folded jeans on a white table, the top pair open to show its stitching"),
      eyebrow: L("الخامة أولًا", "Fabric first"),
      title: L("خامة ومقاسات لكل بنطلون", "Fabric and sizes for every pair"),
      text: L(
        "نذكر خامة كل بنطلون وخصره وطوله الداخلي بالسنتيمتر في صفحته.",
        "Each pair's page lists its fabric, waist and inseam in centimetres.",
      ),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    // Zay's carousel of best sellers.
    rows: [{ title: L("قطع أساسية", "Essentials") }],
    look: {
      alt: L("ثلاثة بناطيل جينز على خلفية بيضاء: اثنان فاتحان وواحد داكن", "Three pairs of jeans on white: two light wash and one dark"),
      eyebrow: L("ركن الجينز", "The denim corner"),
      title: L("ثلاث درجات من الجينز", "Three denim washes"),
      text: L("اضغط على أي نقطة في الصورة لترى أقرب جينز لها من تشكيلتنا.", "Tap a dot on the photo to see the closest jeans from our range."),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل بنطلون", "Clear details and sizes for every pair") },
      { title: L("خامات مذكورة", "Fabrics listed"), line: L("الخامة في صفحة كل موديل", "Fabric listed on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new styles first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    // Zay's large sign-off line.
    footer: { line: L("القَصّة تصنع الفرق", "The cut matters") },
    about: {
      line: L("بناطيل لكل يوم بقصّات متنوعة.", "Trousers for every day, in a range of cuts."),
      alt: L("بناطيل جينز مطوية على طاولة بيضاء، والعلوي مفتوح تظهر خياطته", "Folded jeans on a white table, the top pair open to show its stitching"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("مقاسات واضحة لكل موديل", "Clear sizes for every style"),
      text: L(
        "قَصّة متجر للجينز والبناطيل الواسعة والشينو والبناطيل الرياضية. نختار كل موديل حسب خامته وقصّته، ونذكر الخصر والطول الداخلي لكل مقاس.",
        "Qassa sells jeans, wide-leg trousers, chinos and sweatpants. We choose every style for its fabric and its cut, and list the waist and inseam of every size.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق البناطيل", "Shop the trousers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("لديك سؤال عن المقاس أو القَصّة؟ اسألنا", "A question about size or cut? Ask us"),
    },
    faq: {
      line: L("المقاسات والقصّات وطريقة الطلب.", "Sizes, cuts and ordering."),
      question: L("كيف أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "الخصر والطول الداخلي مذكوران في صفحة كل بنطلون بالسنتيمتر. قِس بنطلونًا مريحًا لديك وقارن، وإذا كنت بين مقاسين، تواصل معنا لنساعدك في الاختيار.",
        "Each pair lists its waist and inseam in centimetres on its page. Measure a pair that fits you well and compare; if you are between two sizes, contact us and we will help you choose.",
      ),
    },
    custom: {
      // Fashion-luxe: the link to the whole catalog, and the noun after a category tile's product count.
      "shop-all": L("كل البناطيل", "All trousers"),
      "products-noun": L("موديلات", "styles"),
      // Zay: the store's short name inside a sentence ("Why Qassa?", "About Qassa").
      "store-short": L("قَصّة", "Qassa"),
      // Zay's hero captions, numbered under the collage photos.
      "hero-piece-1": L("جينز", "Jeans"),
      "hero-piece-2": L("كتان", "Linen"),
      "hero-piece-3": L("قَصّة مستقيمة", "Straight cut"),
      // Zay's comparison: rows 1 and 3 are ticked for the store only, row 2 for both.
      "compare-row-1": L("الطول الداخلي مذكور لكل مقاس", "Inseam listed for every size"),
      "compare-row-2": L("صور ومواصفات لكل موديل", "Photos and specs for every style"),
      "compare-row-3": L("أكثر من طول لكل موديل", "Every style in more than one length"),
      // Fashion-bold's hero carousel, slides 2 (jeans on hangers, dark to light) and 3 (indigo folds, the hemming service). A title of at most six words.
      "slide-2-alt": L("بناطيل جينز على شماعات خشبية من الداكن إلى الفاتح", "Jeans on wooden hangers, from dark to light wash"),
      "slide-2-eyebrow": L("من الداكن إلى الفاتح", "Dark to light"),
      "slide-2-title": L("درجات متعددة من الجينز", "Many denim washes"),
      "slide-2-line": L("إنديجو خام وأزرق متوسط وفاتح ورمادي، بقصّات مستقيمة وضيّقة وواسعة.", "Raw indigo, mid blue, light and grey, in straight, slim and wide cuts."),
      "slide-2-cta": L("تصفّح الأكثر طلبًا", "See the most ordered"),
      "slide-3-alt": L("جينز إنديجو مطوي، حافة خام بجوار حافة مخيطة ومقص خياطة", "Folded indigo denim, a raw hem beside a stitched one and tailor's scissors"),
      "slide-3-eyebrow": L("أطوال متعددة", "Several lengths"),
      "slide-3-title": L("اختر الطول المناسب", "Pick your length"),
      "slide-3-line": L("طول كل بنطلون مذكور لكل مقاس في صفحته.", "Each pair's length is listed for every size on its page."),
      "slide-3-cta": L("تسوّق الجديد", "Shop new in"),
      // Fashion-bold's fit steps: a heading, then three steps in order (a title of a few words, one line, the photo's alt).
      "fit-eyebrow": L("المقاس المناسب", "The right fit"),
      "fit-title": L("مقاسك في ثلاث خطوات", "Your fit in three steps"),
      "fit-1-title": L("قِس بنطلونًا تفضّله", "Measure a pair you love"),
      "fit-1-line": L("افرده على سطح مستوٍ، وقِس الخصر من طرف لطرف والطول الداخلي حتى الحافة.", "Lay it flat, then measure the waist edge to edge and the inner length to the hem."),
      "fit-1-alt": L("بنطلون جينز مفرود على قماش أزرق فاتح بجوار شريط قياس", "A pair of jeans laid flat on chambray beside a tape measure"),
      "fit-2-title": L("اختر القَصّة ودرجة اللون", "Pick the cut and the wash"),
      "fit-2-line": L("صفحة كل بنطلون تذكر الخصر والطول الداخلي لكل مقاس بالسنتيمتر، فقارن بالأرقام.", "Each pair's page lists the waist and inseam of every size in centimetres, so compare the numbers."),
      "fit-2-alt": L("درجات جينز من الفاتح حتى الرمادي الداكن", "Denim in shades from light blue to dark grey"),
      "fit-3-title": L("اطلب مقاسك", "Order your size"),
      "fit-3-line": L("اختر المقاس الأقرب لقياسك، ولأي سؤال تواصل معنا.", "Choose the size closest to your measurements; for any question, contact us."),
      "fit-3-alt": L("حافة جينز إنديجو بخياطة ذهبية", "The hem of indigo jeans with gold stitching"),
      // Fashion-bold's line under "Why Qassa?", beside the four promises.
      "promises-line": L("ما نقدّمه مع كل موديل.", "What comes with every style."),
      // Fashion-bold's footer: the demo contact (a seller replaces both).
      "contact-phone": L(PHONE_AR, PHONE_EN),
      "contact-email": L(handle(EMAIL), EMAIL),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("بناطيل قد تعجبك", "Trousers you may like") } },
};
