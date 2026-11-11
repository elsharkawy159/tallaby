/**
 * The pants and jeans edition (niche editions pilot, ROADMAP F-90): a
 * trousers shop, "Qassa" (Egyptian for "the cut"). Sixteen pairs in four
 * categories of four (jeans, wide-leg, chinos and tailored, joggers and
 * sweatpants: one full row of four on every category row), white-background
 * packshots (`editionPhoto`, square). Data only. No React here.
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

const TILES = [pexels(6764122, 1200), pexels(31842963, 1200), pexels(33633245, 1200), pexels(10348923, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@qassa.example";

export const PANTS_JEANS: Edition = {
  niche: NICHE,
  looks: ["fashion-bold", "zay", "fashion-luxe"],
  priceBand: { min: 300, max: 1500 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("قَصّة", "Qassa"),
    description: L("جينز وبناطيل واسعة وشينو وسويت بانتس، بمقاسات مظبوطة.", "Jeans, wide-leg trousers, chinos and sweatpants, in sizes that fit."),
    categories: [
      ["jeans", "جينز", "Jeans", TILES[0]!],
      ["wide-leg", "بناطيل واسعة", "Wide-leg trousers", TILES[1]!],
      ["chinos-tailored", "شينو وقماش", "Chinos & tailored", TILES[2]!],
      ["joggers", "جوجرز وسويت بانتس", "Joggers & sweatpants", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the light mom jeans, the wide-leg jeans, the mid blue straight jeans.
    products: [
      ["light-wash-mom-jeans", "jeans", "جينز مام فاتح", "Light Wash Mom Jeans", P("light-wash-mom-jeans"), 850, { rating: 4.7, sold90: 236 }],
      ["blue-wide-leg-jeans", "wide-leg", "جينز واسع أزرق", "Blue Wide-Leg Jeans", P("blue-wide-leg-jeans"), 950, { isFeatured: true, rating: 4.8, sold90: 251 }],
      ["mid-blue-straight-jeans", "jeans", "جينز مستقيم أزرق متوسط", "Mid Blue Straight Jeans", P("mid-blue-straight-jeans"), 890, { isFeatured: true, rating: 4.8, sold90: 318 }],
      // The rest, mixed so a row of the newest shows every category.
      ["beige-chino-trousers", "chinos-tailored", "بنطلون شينو بيج", "Beige Chino Trousers", P("beige-chino-trousers"), 690, { isFeatured: true, rating: 4.7, sold90: 274 }],
      ["grey-melange-joggers", "joggers", "جوجر رمادي ميلانج", "Grey Melange Joggers", P("grey-melange-joggers"), 450, { rating: 4.6, sold90: 297 }],
      ["beige-linen-wide-leg-trousers", "wide-leg", "بنطلون كتان واسع بيج", "Beige Linen Wide-Leg Trousers", P("beige-linen-wide-leg-trousers"), 780, { rating: 4.7, sold90: 168 }],
      ["black-slim-jeans", "jeans", "جينز سليم أسود", "Black Slim Jeans", P("black-slim-jeans"), 870, { rating: 4.7, sold90: 289 }],
      ["navy-tailored-trousers", "chinos-tailored", "بنطلون قماش كحلي", "Navy Tailored Trousers", P("navy-tailored-trousers"), 820, { compareAtPrice: 950, rating: 4.6, sold90: 143 }],
      ["black-tapered-joggers", "joggers", "جوجر أسود ضيّق من تحت", "Black Tapered Joggers", P("black-tapered-joggers"), 480, { rating: 4.7, sold90: 262 }],
      ["black-wide-leg-trousers", "wide-leg", "بنطلون قماش واسع أسود", "Black Wide-Leg Trousers", P("black-wide-leg-trousers"), 820, { rating: 4.6, sold90: 154 }],
      ["grey-straight-jeans", "jeans", "جينز مستقيم رمادي", "Grey Straight Jeans", P("grey-straight-jeans"), 890, { rating: 4.5, sold90: 121 }],
      ["olive-cargo-trousers", "chinos-tailored", "بنطلون كارجو زيتي", "Olive Cargo Trousers", P("olive-cargo-trousers"), 750, { rating: 4.6, sold90: 187 }],
      ["navy-side-stripe-joggers", "joggers", "جوجر كحلي بخط أبيض على الجنب", "Navy Side-Stripe Joggers", P("navy-side-stripe-joggers"), 520, { rating: 4.5, sold90: 133 }],
      ["terracotta-palazzo-trousers", "wide-leg", "بنطلون بالاتسو طوبي بحزام", "Terracotta Palazzo Trousers", P("terracotta-palazzo-trousers"), 720, { compareAtPrice: 850, rating: 4.6, sold90: 109 }],
      ["brown-corduroy-trousers", "chinos-tailored", "بنطلون قطيفة مضلّعة بني", "Brown Corduroy Trousers", P("brown-corduroy-trousers"), 790, { rating: 4.7, sold90: 96 }],
      ["beige-straight-sweatpants", "joggers", "سويت بانتس مستقيم بيج", "Beige Straight Sweatpants", P("beige-straight-sweatpants"), 460, { rating: 4.6, sold90: 178 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(19824259, 1920), tall: pexels(7764609, 1200) },
    tiles: TILES,
    banner: pexels(10133275, 2000),
    story: pexels(4546763, 1200),
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
      "slide-2": pexels(16390580, 1920),
      // `fashion-bold`: the fit steps, square: measure, pick the wash, we hem.
      "fit-1": pexels(10895045, 1200),
      "fit-2": pexels(30828508, 1200),
      "fit-3": pexels(4109765, 1200),
      "hero-piece-1": pexels(4210866, 1200),
      "hero-piece-2": pexels(6461325, 900),
      "hero-piece-3": pexels(1082528, 1400),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على جينز، شينو، جوجر…", "Search jeans, chinos, joggers…") },
    hero: {
      alt: L("بناطيل جينز ملفوفة جنب بعض بكل درجات الأزرق", "Rolled jeans side by side in every shade of blue"),
      eyebrow: L("تشكيلة الموسم", "This season's range"),
      title: L("البنطلون اللي على مقاسك", "Trousers cut to fit you"),
      line: L(
        "جينز وبناطيل واسعة وشينو وجوجرز، وطول الرجل مكتوب لكل مقاس.",
        "Jeans, wide-leg trousers, chinos and joggers, with the inseam listed for every size.",
      ),
      cta: L("تسوّق البناطيل", "Shop the trousers"),
    },
    categories: { title: L("اختار القَصّة", "Pick your cut") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("البناطيل اللي عملاءنا بيرجعوا يطلبوها.", "The trousers our customers come back for."),
      },
    },
    story: {
      alt: L("بناطيل جينز متطبقة على خلفية بيضا", "Folded jeans on a white background"),
      eyebrow: L("الخامة أول حاجة", "Fabric comes first"),
      title: L("جينز يعيش معاك سنين", "Denim that lasts for years"),
      text: L(
        "بنكتب خامة كل بنطلون ووسطه وطول رجله بالسنتيمتر في صفحته، عشان تختار وإنت مطمّن.",
        "Each pair's page lists its fabric, waist and inseam in centimetres, so you can choose with confidence.",
      ),
      cta: L("شوف الجديد", "See what is new"),
    },
    // Zay's carousel of best sellers.
    rows: [{ title: L("بيرجعوا يطلبوه", "The ones they reorder") }],
    look: {
      alt: L("تلات بناطيل جينز على خلفية بيضا: اتنين فاتحين وواحد غامق", "Three pairs of jeans on white: two light wash and one dark"),
      eyebrow: L("ركن الجينز", "The denim corner"),
      title: L("تلات غسلات لكل يوم", "Three washes for every day"),
      text: L("دوس على أي نقطة في الصورة وشوف أقرب جينز ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest jeans from our range."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا وسطك وطولك على واتساب", "Send us your waist and height on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "Hear about new styles first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    // Zay's large sign-off line.
    footer: { line: L("القَصّة تفرق", "The cut matters") },
    about: {
      line: L("بناطيل لكل يوم، بقصّات مظبوطة.", "Trousers for every day, in cuts that fit."),
      alt: L("بناطيل جينز متطبقة على خلفية بيضا", "Folded jeans on a white background"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("مقاس صح من أول مرة", "The right size, first time"),
      text: L(
        "قَصّة بدأت من مشكلة كلنا عارفينها: بنطلون الوسط بتاعه مظبوط والطول لأ. فبنختار كل موديل على حسب خامته وقصّته، وبنكتب وسطه وطول رجله لكل مقاس.",
        "Qassa began with a problem we all know: trousers that fit at the waist but not in the leg. So we choose every style for its fabric and its cut, and list the waist and inseam of every size.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق البناطيل", "Shop the trousers"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتار في المقاس أو القَصّة؟ اسألنا", "Not sure about a size or cut? Ask us"),
    },
    faq: {
      line: L("المقاسات والقصّات والتوصيل.", "Sizes, cuts and delivery."),
      question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "الوسط وطول الرجل مكتوبين في صفحة كل بنطلون بالسنتيمتر. قيس بنطلون مريح عندك وقارن، ولو بين مقاسين ابعتلنا ونقولك الأنسب.",
        "Each pair lists its waist and inseam in centimetres on its page. Measure a pair that fits you well and compare; if you are between two sizes, write to us and we will tell you which fits.",
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
      "compare-row-1": L("طول الرجل مكتوب لكل مقاس", "Inseam listed for every size"),
      "compare-row-2": L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
      "compare-row-3": L("كل موديل بأكتر من طول", "Every style in more than one length"),
      // Fashion-bold's hero carousel, slides 2 (jeans on hangers, dark to light) and 3 (indigo folds, the hemming service). A title of at most six words.
      "slide-2-alt": L("بناطيل جينز على شماعات خشب، من الغامق للفاتح", "Jeans on wooden hangers, from dark to light wash"),
      "slide-2-eyebrow": L("من الغامق للفاتح", "Dark to light"),
      "slide-2-title": L("غسلة لكل يوم في الأسبوع", "A wash for every day"),
      "slide-2-line": L("إنديجو خام، أزرق متوسط، فاتح ورمادي، بقصّات مستقيمة وسليم وواسعة.", "Raw indigo, mid blue, light and grey, in straight, slim and wide cuts."),
      "slide-2-cta": L("شوف الأكثر طلبًا", "See the most ordered"),
      "slide-3-alt": L("طبقات قماش جينز إنديجو متطبّقة", "Layers of folded indigo denim"),
      "slide-3-eyebrow": L("تقصير على طولك", "Hemmed to your length"),
      "slide-3-title": L("قول طولك، ونقصّره إحنا", "Tell us your length"),
      "slide-3-line": L("اكتب طول رجلك في ملاحظة الطلب، والبنطلون يوصلك جاهز تلبسه.", "Add your inseam to the order note and your pair arrives ready to wear."),
      "slide-3-cta": L("تسوّق الجديد", "Shop new in"),
      // Fashion-bold's fit steps: a heading, then three steps in order (a title of a few words, one line, the photo's alt).
      "fit-eyebrow": L("المقاس الصح", "The right fit"),
      "fit-title": L("مقاسك في تلات خطوات", "Your fit in three steps"),
      "fit-1-title": L("قيس بنطلون بتحبه", "Measure a pair you love"),
      "fit-1-line": L("افرده على سطح مستوي، وقيس الوسط من طرف لطرف وطول الرجل من الدرزة لآخر الرجل.", "Lay it flat, then measure the waist edge to edge and the inseam from the crotch seam to the hem."),
      "fit-1-alt": L("شريط قياس أصفر على خلفية زرقا", "A yellow tape measure on a blue background"),
      "fit-2-title": L("اختار القَصّة والغسلة", "Pick the cut and the wash"),
      "fit-2-line": L("كل بنطلون مكتوب في صفحته الوسط وطول الرجل لكل مقاس بالسنتيمتر، فقارن بالأرقام.", "Each pair's page lists the waist and inseam of every size in centimetres, so compare the numbers."),
      "fit-2-alt": L("درجات جينز من الفاتح للرمادي الغامق", "Denim in shades from light blue to dark grey"),
      "fit-3-title": L("بنقصّره على طولك", "We hem it to your length"),
      "fit-3-line": L("اكتب طول رجلك في ملاحظة الطلب ونقصّره قبل الشحن. البنطلون المقصّر ما بيتبدلش.", "Add your inseam to the order note and we hem it before it ships. Hemmed pairs cannot be exchanged."),
      "fit-3-alt": L("طرف رجل جينز إنديجو بخياطة دهبي", "The hem of indigo jeans with gold stitching"),
      // Fashion-bold's line under "Why Qassa?", beside the four promises.
      "promises-line": L("أربع حاجات بنلتزم بيها مع كل بنطلون.", "Four things we stand by with every pair."),
      // Fashion-bold's footer: the demo contact (a seller replaces both).
      "contact-phone": L(PHONE_AR, PHONE_EN),
      "contact-email": L(handle(EMAIL), EMAIL),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي لبسوه", "From people who wear it"), related: L("بناطيل ممكن تعجبك", "Trousers you may like") } },
  // Fashion-luxe's own shop (owner, 2026-11-11: two looks of one niche must not look duplicated): "Darza"
  // (Egyptian for a seam), a quiet trouser atelier that hems every pair to the buyer's length. Same pairs and
  // prices; its own copy, photos and journey. The shop-the-look photo (dots on the three newest) stays the
  // pack's: only this look shows it.
  perLook: {
    "fashion-luxe": {
      store: {
        name: L("درزة", "Darza"),
        description: L("بناطيل جينز وقماش وكتان، بنقصّرها على طولك قبل ما نبعتها.", "Denim, tailored and linen trousers, hemmed to your length before they ship."),
      },
      copy: {
        announcement: [
          L("ابعت طولك ونقصّر الرجل قبل الشحن", "Send your length and we hem before shipping"),
          L("التوصيل لكل محافظات مصر", "Delivery to every governorate"),
          L("الدفع عند الاستلام", "Cash on delivery"),
        ],
        labels: { about: L("الأتيليه", "The atelier") },
        hero: {
          alt: L("بناطيل جينز متطبّقة فوق بعض في ضوء ناعم", "Folded jeans stacked in soft light"),
          eyebrow: L("أتيليه بناطيل", "A trouser atelier"),
          title: L("بنطلون متفصّل على طول رجلك", "Trousers finished to your length"),
          line: L(
            "اختار الموديل والمقاس، واكتب طول رجلك في الطلب: بنقصّره في الأتيليه وبنبعته جاهز تلبسه.",
            "Pick the style and size, add your inseam to the order: we hem it in the atelier and send it ready to wear.",
          ),
          cta: L("تسوّق الجديد", "Shop new in"),
        },
        categories: { title: L("القصّات", "The cuts") },
        products: {
          primary: {
            title: L("جديد الأتيليه", "New from the atelier"),
            line: L("آخر البناطيل اللي خلصت من الماكينة.", "The latest pairs off the sewing table."),
          },
        },
        // The two-tone band (waves of folded denim); its button goes to the about page.
        story: {
          alt: L("طبقات جينز متطبّقة بدرجات أزرق من الفاتح للغامق", "Layers of folded denim in blues from light to deep"),
          eyebrow: L("التشطيب", "The finish"),
          title: L("كل درزة بإيد خياط", "Every seam by a tailor's hand"),
          text: L(
            "بنقصّر كل بنطلون على الطول اللي تكتبه، وبنرجّع التنية الأصلية في الجينز عشان شكله يفضل زي ما هو.",
            "We hem every pair to the length you give us, and keep the original hem on jeans so they look as they should.",
          ),
          cta: L("زور الأتيليه", "Visit the atelier"),
        },
        look: {
          eyebrow: L("تلات غسلات", "Three washes"),
          title: L("من الفاتح للغامق", "From light to deep"),
          text: L("دوس على أي نقطة وشوف أقرب بنطلون ليها في التشكيلة.", "Tap a dot to see the closest pair in the range."),
        },
        trust: [
          { title: L("تقصير على طولك", "Hemmed to your length"), line: L("اكتب طول رجلك وإنت بتطلب", "Add your inseam when you order") },
          { title: L("تبديل المقاس", "Size exchange"), line: L("خلال ١٤ يوم لو مش مقصّر", "Within 14 days if not hemmed") },
          { title: L("اسأل خياط", "Ask a tailor"), line: L("على واتساب قبل ما تطلب", "On WhatsApp before you order") },
          { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
        ],
        newsletter: {
          title: L("قصّات جديدة من الأتيليه", "New cuts from the atelier"),
          line: L("رسالة لما ننزل قصّة أو قماشة جديدة، وبس.", "A letter when a new cut or fabric arrives, and that is all."),
        },
        footer: { line: L("درزة: بناطيل مقصّرة على طولك.", "Darza: trousers hemmed to your length.") },
        about: {
          line: L("أتيليه صغير للبناطيل، في وسط البلد.", "A small trouser atelier in downtown Cairo."),
          alt: L("بنطلون جينز متطبّق وعليه ريشة بيضا", "Folded jeans with a white feather on top"),
          eyebrow: L("الأتيليه", "The atelier"),
          title: L("الطول الصح بيفرق", "The right length changes everything"),
          text: L(
            "درزة بدأت من ورشة خياطة كانت كل يومها تقصير بناطيل اشتروها الناس جاهزة. فقلنا نختار البنطلون ونقصّره في نفس المكان، ويوصلك على طولك من أول مرة.",
            "Darza began in a tailoring shop whose days were spent hemming trousers people had bought ready-made. So we choose the trousers and hem them in the same place, and they reach you at your length the first time.",
          ),
          more: L("ولو مش متأكد من طولك، قيس بنطلون مريح عندك من الوسط لآخر الرجل وابعته لنا.", "Not sure of your length? Measure a pair you like from the crotch seam to the hem and send it to us."),
          cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
        },
        contact: {
          title: L("كلّم الأتيليه", "Talk to the atelier"),
          line: L(`وسط البلد، القاهرة، ${PHONE_AR}، ${handle("hello@darza.example")}`, `Downtown, Cairo | ${PHONE_EN} | hello@darza.example`),
          heading: L("مش عارف طول رجلك؟ نقولك تقيسه إزاي", "Not sure of your inseam? We show you how to measure"),
        },
        faq: {
          line: L("الطول والتقصير والتبديل.", "Length, hemming and exchanges."),
          question: L("أقيس طول رجلي إزاي؟", "How do I measure my inseam?"),
          answer: L(
            "افرد بنطلون طوله مظبوط عليك وقيس من الدرزة اللي في النص لحد آخر الرجل بالسنتيمتر، واكتب الرقم في ملاحظة الطلب. البنطلون المقصّر ما بيتبدلش، فلو محتار ابعت لنا قبلها.",
            "Lay flat a pair that fits you and measure from the crotch seam to the hem in centimetres, then add the number to the order note. Hemmed pairs cannot be exchanged, so ask us first if unsure.",
          ),
        },
        custom: {
          "shop-all": L("كل القصّات", "All cuts"),
          "products-noun": L("بنطلون", "pairs"),
        },
      },
      // Pexels, checked by eye at 1600px 2026-11-11 (no people, hands, mannequins, labels or lettering):
      // denim and tailoring in deep blues, so the cool palette sits apart from zay's rails and stools.
      photos: {
        hero: { wide: pexels(4109755, 1920), tall: pexels(10133274, 1200) },
        // Jeans (folded stacks on a shop table), wide-leg (trousers hanging long from washing lines, from below),
        // chinos and tailored (black trousers on a wooden hanger with scissors and pins), joggers (soft folded stack).
        tiles: [pexels(32879870, 1200), pexels(19867663, 1200), pexels(2737702, 1200), pexels(35009337, 1200)],
        banner: pexels(19903579, 2000),
        story: pexels(6764142, 1200),
      },
      // The newest pairs in the grid (zay shows best sellers), then wide-leg and tailored as rows.
      journey: { primary: "newest", rows: [2, 3] },
    },
  },
};
