/**
 * The t-shirts edition (niche editions pilot, ROADMAP F-90): a cotton tee
 * shop, "Noss Kom" (Egyptian for "short sleeve"). Sixteen tees in four
 * categories of four (basics, oversized, stripes and prints, polos),
 * white-background flat lays (`editionPhoto`, square). Data only. No React
 * here.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `streetwear` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, checked 2026-11-11: bright and casual; tees on
 * rails and hangers, a striped weave, cotton; no people, no logos, none used
 * by a template or another pack.
 * Hero 40450765 (wide: tees in many colours on a rail) and 7857552 (tall:
 * bright tees on wooden hangers). Tiles: basics 7319172 (a white tee on a
 * hanger in a shop), oversized 37704842 (a loose cream tee in a patch of
 * sunlight; its neck label and hem tag are too small to read), stripes and
 * prints 7640756 (a blue and white striped weave), polos 28460164 (a pile of
 * tipped polo collars). Banner 2112648 (white tees on black hangers). Story /
 * about 9702241 (a cotton branch on white). Shop the look 38928670: polos in
 * many colours fanned out on wooden hangers over a straw mat; the dots are
 * the burgundy polo in front, a white one and the navy one at the back, the
 * demo's three newest products, so those three stay first in `products`
 * (the front polo's neck label reads "M": see the pilot report).
 * Streetwear's lookbook (square crops): 8146450, 12039633, 9940948,
 * 13924869, 4440651.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so
 * streetwear's about page is built without that section.
 *
 * No hero video: none found without people, so the looks show the poster.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "tshirts";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@nosskom.example";
const HANDLE = handle("@nosskom");

export const TSHIRTS: Edition = {
  niche: NICHE,
  looks: ["streetwear"],
  priceBand: { min: 150, max: 900 },
  // The flat lays are square on white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("نص كم", "Noss Kom"),
    description: L("تيشيرتات قطن أساسية وبمقاس واسع ومقلّمة وبولو.", "Cotton tees for every day: basics, oversized, stripes and polos."),
    categories: [
      ["basic", "أساسية", "Basics", TILES[0]!],
      ["oversized", "مقاس واسع", "Oversized", TILES[1]!],
      ["patterned", "مقلّم ومنقوش", "Stripes & prints", TILES[2]!],
      ["polo", "بولو", "Polos", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the burgundy, the white and the navy polo.
    products: [
      ["burgundy-tipped-polo", "polo", "بولو خمري بخط أبيض", "Burgundy Tipped Polo", P("burgundy-tipped-polo"), 520, { rating: 4.7, sold90: 118 }],
      ["white-pique-polo", "polo", "بولو بيكيه أبيض", "White Pique Polo", P("white-pique-polo"), 490, { rating: 4.6, sold90: 157 }],
      ["navy-pique-polo", "polo", "بولو بيكيه كحلي", "Navy Pique Polo", P("navy-pique-polo"), 480, { rating: 4.8, sold90: 203 }],
      // The rest, mixed so a row of the newest shows every category.
      ["navy-white-striped-tshirt", "patterned", "تيشيرت مقلّم كحلي وأبيض", "Navy and White Striped Tee", P("navy-white-striped-tshirt"), 350, { rating: 4.7, sold90: 198 }],
      ["washed-black-oversized-tshirt", "oversized", "تيشيرت بمقاس واسع أسود مغسول", "Washed Black Oversized Tee", P("washed-black-oversized-tshirt"), 420, { isFeatured: true, rating: 4.9, sold90: 276 }],
      ["white-basic-cotton-tshirt", "basic", "تيشيرت قطن أساسي أبيض", "White Basic Cotton Tee", P("white-basic-cotton-tshirt"), 280, { isFeatured: true, rating: 4.8, sold90: 412 }],
      ["blue-tie-dye-tshirt", "patterned", "تيشيرت أزرق بصبغة متدرجة", "Blue Tie-Dye Tee", P("blue-tie-dye-tshirt"), 380, { rating: 4.4, sold90: 112 }],
      ["sand-beige-oversized-tshirt", "oversized", "تيشيرت بمقاس واسع بيج", "Sand Beige Oversized Tee", P("sand-beige-oversized-tshirt"), 420, { rating: 4.6, sold90: 164 }],
      ["black-basic-cotton-tshirt", "basic", "تيشيرت قطن أساسي أسود", "Black Basic Cotton Tee", P("black-basic-cotton-tshirt"), 280, { rating: 4.7, sold90: 388 }],
      ["forest-green-pique-polo", "polo", "بولو بيكيه أخضر غامق", "Forest Green Pique Polo", P("forest-green-pique-polo"), 490, { rating: 4.6, sold90: 132 }],
      ["black-chest-stripe-tshirt", "patterned", "تيشيرت أسود بخط أبيض عريض", "Black Tee with a White Stripe", P("black-chest-stripe-tshirt"), 360, { rating: 4.5, sold90: 126 }],
      ["brown-oversized-tshirt", "oversized", "تيشيرت بمقاس واسع بني", "Chocolate Brown Oversized Tee", P("brown-oversized-tshirt"), 430, { rating: 4.7, sold90: 151 }],
      ["dusty-blue-basic-tshirt", "basic", "تيشيرت قطن أساسي أزرق هادئ", "Dusty Blue Basic Cotton Tee", P("dusty-blue-basic-tshirt"), 290, { rating: 4.6, sold90: 208 }],
      ["green-white-colour-block-tshirt", "patterned", "تيشيرت بألوان متباينة أخضر وأبيض", "Green and White Colour-Block Tee", P("green-white-colour-block-tshirt"), 390, { rating: 4.5, sold90: 87 }],
      ["olive-oversized-tshirt", "oversized", "تيشيرت بمقاس واسع زيتي", "Olive Oversized Tee", P("olive-oversized-tshirt"), 430, { rating: 4.5, sold90: 139 }],
      ["grey-melange-basic-tshirt", "basic", "تيشيرت أساسي رمادي ميلانج", "Grey Melange Basic Tee", P("grey-melange-basic-tshirt"), 290, { rating: 4.6, sold90: 231 }],
    ],
  }),
  photos: {
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(7857552, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
    // The dots, in percent from the photo's left and top: the burgundy, the white and the navy polo.
    look: {
      src: pexels(38928670, 1400),
      dots: [
        { x: 30, y: 82 },
        { x: 62, y: 43 },
        { x: 70, y: 24 },
      ],
    },
    // Streetwear's lookbook, square: one large photo, then four small ones.
    custom: {
      "lookbook-1": scene("lookbook-1"),
      "lookbook-2": scene("lookbook-2"),
      "lookbook-3": scene("lookbook-3"),
      "lookbook-4": scene("lookbook-4"),
      "lookbook-5": scene("lookbook-5"),
    },
  },
  copy: {
    announcement: [
      L("تيشيرتات قطن وبولو لكل يوم", "Cotton tees and polos for every day"),
      L("تفاصيل ومقاسات واضحة لكل تيشيرت", "Clear details and sizes for every tee"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحث عن تيشيرت", "Search the tees") },
    hero: {
      alt: L("تيشيرتات قطن بألوان متعددة على شماعة", "Cotton tees in many colours on a rail"),
      eyebrow: L("تشكيلة الموسم", "This season's range"),
      title: L("تيشيرتات قطن لكل يوم", "Cotton tees for every day"),
      line: L("تيشيرتات أساسية وبمقاس واسع ومقلّمة وبولو من القطن.", "Basics, oversized, stripes and polos, in cotton."),
      cta: L("تسوّق التيشيرتات", "Shop the tees"),
    },
    categories: { title: L("اختر القَصّة", "Pick your fit") },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث التيشيرتات", "The newest tees"),
        line: L("أحدث الموديلات في المتجر.", "The latest styles to arrive."),
      },
    },
    story: {
      alt: L("تيشيرتات بيضاء على شماعات سوداء", "White tees on black hangers"),
      eyebrow: L("الخامة أولًا", "Fabric first"),
      title: L("قطن بمقاسات واضحة", "Cotton in clear sizes"),
      text: L(
        "نذكر خامة كل تيشيرت ومقاساته بالسنتيمتر في صفحته.",
        "Each tee's page lists its fabric and its measurements in centimetres.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    // Streetwear's bento of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most ordered") }],
    look: {
      alt: L("قمصان بولو بألوان متعددة على شماعات خشبية فوق حصيرة قش", "Polo shirts in many colours on wooden hangers over a straw mat"),
      eyebrow: L("ركن البولو", "The polo corner"),
      title: L("بولو بيكيه بثلاثة ألوان", "Pique polos in three colours"),
      text: L("اضغط على أي نقطة في الصورة لترى أقرب بولو لها من تشكيلتنا.", "Tap a dot on the photo to see the closest polo from our range."),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل تيشيرت", "Clear details and sizes for every tee") },
      { title: L("خامات مذكورة", "Fabrics listed"), line: L("الخامة في صفحة كل موديل", "Fabric listed on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new styles first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    // Streetwear's large sign-off line.
    footer: { line: L("تيشيرتات وبولو من القطن", "Cotton tees and polos") },
    about: {
      line: L("تيشيرتات قطن لكل يوم، مختارة بعناية.", "Cotton tees for every day, chosen with care."),
      alt: L("ركن متجر تيشيرتات: تيشيرتات مطوية على طاولة خشبية وشماعة خلفها", "A tee shop corner: folded tees on a plywood table and a rail behind"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("خامة جيدة وقصّة مناسبة", "Good fabric, the right cut"),
      text: L(
        "نص كم متجر لتيشيرتات القطن والبولو. نختار كل موديل حسب خامته وقصّته، ونذكر مقاساته بالسنتيمتر في صفحته.",
        "Noss Kom sells cotton tees and polos. We choose every style for its fabric and its cut, and list its measurements in centimetres on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق التيشيرتات", "Shop the tees"),
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
        "مقاسات كل تيشيرت مذكورة في صفحته بالسنتيمتر. قِس تيشيرتًا مريحًا لديك وقارن، وإذا كنت بين مقاسين، تواصل معنا لنساعدك في الاختيار.",
        "Each tee lists its measurements in centimetres on its page. Measure a tee that fits you well and compare; if you are between two sizes, contact us and we will help you choose.",
      ),
    },
    // Streetwear's own sections.
    custom: {
      // Fashion-luxe: the link to the whole catalog, and the noun after a category's product count.
      "shop-all": L("كل التيشيرتات", "All tees"),
      "products-noun": L("تيشيرتات", "tees"),
      "store-short": L("نص كم", "Noss Kom"),
      "hero-note": L("أساسي · مقاس واسع · بولو", "Basics · Oversized · Polos"),
      // The hero's round sticker: a fabric fact, not an offer. Demo value: a seller writes their own fabric.
      "hero-sticker-1": L("قطن", "Pure"),
      "hero-sticker-2": L("١٠٠٪", "100%"),
      "hero-sticker-3": L("خالص", "cotton"),
      "banner-alt": L("تيشيرتات بيضاء على شماعات سوداء", "White tees on black hangers"),
      "banner-title": L("تيشيرتات", "Tees"),
      "banner-line": L("قطن مريح بقصّة عادية أو واسعة.", "Comfortable cotton, in a regular or an oversized cut."),
      "craft-statement": L("تيشيرت بمقاس مناسب أفضل من عشرة في الخزانة.", "One tee that fits beats ten in the drawer."),
      "craft-statement-cta": L("كل التيشيرتات", "Shop the tees"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور من تشكيلتنا", "Photos from our range"),
    },
  },
  // Both looks show the newest products in their main section (one title for both).
  journey: { primary: "newest" },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("تيشيرتات قد تعجبك", "Tees you may like") } },
};
