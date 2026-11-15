/**
 * The furniture pack (niche editions, ROADMAP F-90): "Ateek", a furniture
 * maker and showroom of living room, bedroom, dining, and office and
 * storage pieces in oak, walnut and soft fabrics, with delivery and
 * assembly at home. Data only; `furniture-luxe` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/furniture/`: sixteen
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`. No hero video: `furniture-luxe` then shows its poster,
 * `photos.hero.wide`.
 *
 * Look: `furniture-luxe`, the niche's template (one template per niche).
 * Its four category rows show four across, so each category holds four
 * products (one full row each). Its about page falls back to the showroom
 * block's photo (no `about`). No `reviews`: `furniture-luxe` has no reviews
 * section.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "furniture";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const FURNITURE: Edition = {
  niche: NICHE,
  looks: ["furniture-luxe"],
  priceBand: { min: 2000, max: 60000 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("عتيق", "Ateek"),
    description: L("أثاث من الخشب الطبيعي لغرف المعيشة والنوم والطعام والمكتب.", "Solid wood furniture for the living room, bedroom, dining room and office."),
    categories: [
      ["living", "غرفة المعيشة", "Living room", TILES[0]!],
      ["bedroom", "غرفة النوم", "Bedroom", TILES[1]!],
      ["dining", "غرفة الطعام", "Dining", TILES[2]!],
      ["office", "المكتب والتخزين", "Office & storage", TILES[3]!],
    ],
    products: [
      ["oatmeal-three-seat-sofa", "living", "كنبة ٣ مقاعد بيج", "Oatmeal Three-Seat Sofa", P("oatmeal-three-seat-sofa"), 24500, { isFeatured: true, rating: 4.8, sold90: 46 }],
      ["green-velvet-armchair", "living", "كرسي فوتيه مخمل أخضر", "Green Velvet Armchair", P("green-velvet-armchair"), 9800, { isFeatured: true, rating: 4.9, sold90: 58 }],
      ["l-shape-corner-sofa", "living", "كنبة زاوية رمادية فاتحة", "Light Grey Corner Sofa", P("l-shape-corner-sofa"), 38500, { rating: 4.7, sold90: 31 }],
      ["round-travertine-coffee-table", "living", "طاولة قهوة ترافرتين دائرية", "Round Travertine Coffee Table", P("round-travertine-coffee-table"), 12500, { rating: 4.8, sold90: 39 }],
      ["upholstered-queen-bed", "bedroom", "سرير كوين منجّد بيج", "Upholstered Queen Bed", P("upholstered-queen-bed"), 27500, { isFeatured: true, rating: 4.8, sold90: 34 }],
      ["walnut-nightstand", "bedroom", "كومودينو من خشب الجوز", "Walnut Nightstand", P("walnut-nightstand"), 5400, { rating: 4.7, sold90: 72 }],
      ["oak-sliding-wardrobe", "bedroom", "خزانة ملابس بأبواب منزلقة من البلوط", "Oak Sliding Wardrobe", P("oak-sliding-wardrobe"), 32000, { rating: 4.6, sold90: 22 }],
      ["cane-dresser", "bedroom", "تسريحة ٦ أدراج بخوص", "Cane Chest of Six Drawers", P("cane-dresser"), 16500, { rating: 4.7, sold90: 28 }],
      ["oval-oak-dining-table", "dining", "طاولة طعام بيضاوية من البلوط", "Oval Oak Dining Table", P("oval-oak-dining-table"), 21000, { rating: 4.8, sold90: 26 }],
      ["boucle-dining-chair", "dining", "كرسي سفرة بوكليه", "Bouclé Dining Chair", P("boucle-dining-chair"), 3900, { isFeatured: true, rating: 4.7, sold90: 96 }],
      ["walnut-sideboard", "dining", "بوفيه جوز مضلّع", "Fluted Walnut Sideboard", P("walnut-sideboard"), 18500, { rating: 4.8, sold90: 24 }],
      ["rattan-bar-stool", "dining", "كرسي بار خوص", "Rattan Counter Stool", P("rattan-bar-stool"), 3200, { rating: 4.5, sold90: 64 }],
      ["oak-writing-desk", "office", "مكتب كتابة بلوط", "Oak Writing Desk", P("oak-writing-desk"), 7800, { rating: 4.7, sold90: 52 }],
      ["ergonomic-office-chair", "office", "كرسي مكتب مريح", "Ergonomic Office Chair", P("ergonomic-office-chair"), 6900, { rating: 4.6, sold90: 81 }],
      ["open-oak-bookcase", "office", "مكتبة رفوف بلوط", "Open Oak Bookcase", P("open-oak-bookcase"), 8900, { rating: 4.6, sold90: 37 }],
      ["tv-unit-walnut", "office", "وحدة تلفزيون من خشب الجوز", "Walnut TV Unit", P("tv-unit-walnut"), 11500, { compareAtPrice: 12900, rating: 4.7, sold90: 43 }],
    ],
  }),
  photos: {
    // `furniture-luxe`'s video hero shows this poster alone (no video file).
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `furniture-luxe`'s showroom block on the home page, and its about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("أثاث لغرف المعيشة والنوم والطعام", "Furniture for living, bedroom and dining"),
      L("مقاسات وخامات واضحة لكل قطعة", "Clear sizes and materials for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    hero: {
      alt: L("غرفة معيشة فيها كنبة بيج وطاولة ترافرتين في ضوء العصر", "A living room with a cream sofa and a travertine table in afternoon light"),
      eyebrow: L("المجموعة الجديدة", "The new collection"),
      title: L("أثاث من الخشب الطبيعي", "Solid wood furniture"),
      line: L("خشب طبيعي وأقمشة مقاومة للبقع.", "Solid wood and stain-resistant fabrics."),
      cta: L("اكتشف المجموعة", "Explore the collection"),
    },
    categories: { title: L("تسوّق حسب الغرفة", "Shop by room") },
    products: { primary: { title: L("القطع الأكثر طلبًا", "Our most-loved pieces"), line: L("الأكثر مبيعًا والجديد والأعلى تقييمًا.", "Best sellers, new in and top rated.") } },
    story: {
      alt: L("ورشة نجارة فيها كرسي خشبي قيد التشطيب وألواح خشب", "A woodworking shop with a wooden chair being finished and timber boards"),
      eyebrow: L("الخامات", "Materials"),
      title: L("خشب طبيعي وتشطيب يدوي", "Solid wood, hand-finished"),
      text: L(
        "نذكر نوع الخشب والقماش ومقاسات كل قطعة في صفحتها.",
        "Each piece's page lists its wood, fabric and measurements.",
      ),
      cta: L("تسوّق المجموعة", "Shop the collection"),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("لكل قطعة مقاساتها بالسنتيمتر", "Measurements in centimetres for every piece") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("الخشب والقماش في صفحة كل قطعة", "Wood and fabric on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      eyebrow: L("نشرة عتيق", "The Ateek letter"),
      title: L("كن أول من يرى المجموعات الجديدة", "See new collections first"),
      line: L("رسالة واحدة شهريًا: قطع جديدة وأفكار للتنسيق.", "One letter a month: new pieces and styling ideas."),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    about: {
      line: L("أثاث من الخشب الطبيعي بتشطيب يدوي.", "Solid wood furniture, hand-finished."),
      alt: L("ورشة نجارة فيها كرسي خشبي قيد التشطيب وألواح خشب", "A woodworking shop with a wooden chair being finished and timber boards"),
      eyebrow: L("عن عتيق", "About Ateek"),
      title: L("أثاث بخامات مختارة", "Furniture in chosen materials"),
      text: L("نختار الخشب والأقمشة بعناية لكل قطعة، ونذكر مقاساتها وخاماتها في صفحتها.", "We choose the wood and fabrics of every piece with care, and list its measurements and materials on its page."),
      more: L("ولأي سؤال عن المقاسات أو الخامات، تواصل معنا.", "For any question about sizes or materials, contact us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي قطعة أو عن المقاس المناسب لمكانك.", "Ask us about any piece or the right size for your space."),
      heading: L("اسأل عن قطعة", "Ask about a piece"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, materials and ordering."),
      question: L("كيف أعرف أن القطعة تناسب مكاني؟", "How do I know a piece fits my space?"),
      answer: L(
        "مقاسات كل قطعة بالسنتيمتر مذكورة في صفحتها، فقِس المكان وقارن.",
        "Each piece's measurements in centimetres are on its page, so measure your space and compare.",
      ),
    },
    custom: {
      // `furniture-luxe`: the header's link to the about page.
      "about-label": L("عن المتجر", "About us"),
      // `furniture-luxe`: the link to the whole catalog.
      "shop-all": L("كل القطع", "Shop all"),
      // `furniture-luxe`: the footer's phone and email (a seller replaces them; the Arabic email starts with a right-to-left mark, as the look's own does).
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", "+20 100 000 0000"),
      "contact-email": L("‏hello@ateek.example", "hello@ateek.example"),
    },
  },
  productPage: { copy: { reviews: L("آراء عملائنا", "What our clients say"), related: L("قطع تكمّل المكان", "Pieces that complete the room") } },
};
