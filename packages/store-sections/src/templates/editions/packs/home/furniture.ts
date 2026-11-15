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
    description: L("أثاث خشب طبيعي متشطب يدويًا، بالتوصيل والتركيب في البيت.", "Hand-finished solid wood furniture, delivered and assembled at home."),
    categories: [
      ["living", "الصالة", "Living room", TILES[0]!],
      ["bedroom", "غرفة النوم", "Bedroom", TILES[1]!],
      ["dining", "السفرة", "Dining", TILES[2]!],
      ["office", "المكتب والتخزين", "Office & storage", TILES[3]!],
    ],
    products: [
      ["oatmeal-three-seat-sofa", "living", "كنبة ٣ مقاعد بيج", "Oatmeal Three-Seat Sofa", P("oatmeal-three-seat-sofa"), 24500, { isFeatured: true, rating: 4.8, sold90: 46 }],
      ["green-velvet-armchair", "living", "فوتيه قطيفة أخضر", "Green Velvet Armchair", P("green-velvet-armchair"), 9800, { isFeatured: true, rating: 4.9, sold90: 58 }],
      ["l-shape-corner-sofa", "living", "ركنة رمادي فاتح", "Light Grey Corner Sofa", P("l-shape-corner-sofa"), 38500, { rating: 4.7, sold90: 31 }],
      ["round-travertine-coffee-table", "living", "ترابيزة قهوة ترافرتين مدوّرة", "Round Travertine Coffee Table", P("round-travertine-coffee-table"), 12500, { rating: 4.8, sold90: 39 }],
      ["upholstered-queen-bed", "bedroom", "سرير كوين منجّد بيج", "Upholstered Queen Bed", P("upholstered-queen-bed"), 27500, { isFeatured: true, rating: 4.8, sold90: 34 }],
      ["walnut-nightstand", "bedroom", "كومودينو خشب جوز", "Walnut Nightstand", P("walnut-nightstand"), 5400, { rating: 4.7, sold90: 72 }],
      ["oak-sliding-wardrobe", "bedroom", "دولاب سحّاب بلوط", "Oak Sliding Wardrobe", P("oak-sliding-wardrobe"), 32000, { rating: 4.6, sold90: 22 }],
      ["cane-dresser", "bedroom", "تسريحة ٦ أدراج بخوص", "Cane Chest of Six Drawers", P("cane-dresser"), 16500, { rating: 4.7, sold90: 28 }],
      ["oval-oak-dining-table", "dining", "ترابيزة سفرة بيضاوي بلوط", "Oval Oak Dining Table", P("oval-oak-dining-table"), 21000, { rating: 4.8, sold90: 26 }],
      ["boucle-dining-chair", "dining", "كرسي سفرة بوكليه", "Bouclé Dining Chair", P("boucle-dining-chair"), 3900, { isFeatured: true, rating: 4.7, sold90: 96 }],
      ["walnut-sideboard", "dining", "بوفيه جوز مضلّع", "Fluted Walnut Sideboard", P("walnut-sideboard"), 18500, { rating: 4.8, sold90: 24 }],
      ["rattan-bar-stool", "dining", "كرسي بار خوص", "Rattan Counter Stool", P("rattan-bar-stool"), 3200, { rating: 4.5, sold90: 64 }],
      ["oak-writing-desk", "office", "مكتب كتابة بلوط", "Oak Writing Desk", P("oak-writing-desk"), 7800, { rating: 4.7, sold90: 52 }],
      ["ergonomic-office-chair", "office", "كرسي مكتب طبي", "Ergonomic Office Chair", P("ergonomic-office-chair"), 6900, { rating: 4.6, sold90: 81 }],
      ["open-oak-bookcase", "office", "مكتبة رفوف بلوط", "Open Oak Bookcase", P("open-oak-bookcase"), 8900, { rating: 4.6, sold90: 37 }],
      ["tv-unit-walnut", "office", "ترابيزة تلفزيون جوز", "Walnut TV Unit", P("tv-unit-walnut"), 11500, { compareAtPrice: 12900, rating: 4.7, sold90: 43 }],
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
      L("توصيل وتركيب لحد البيت في كل محافظات مصر", "Delivery and assembly at home, across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("ضمان ٥ سنين على الهيكل", "Five-year frame guarantee"),
    ],
    hero: {
      alt: L("صالة فيها كنبة بيج وترابيزة ترافرتين في نور العصر", "A living room with a cream sofa and a travertine table in afternoon light"),
      eyebrow: L("المجموعة الجديدة", "The new collection"),
      title: L("أثاث يعيش معاك سنين", "Furniture made to stay"),
      line: L("خشب طبيعي وقماش مقاوم للبقع، وتركيب في البيت علينا.", "Solid wood and stain-resistant fabrics, with assembly at home on us."),
      cta: L("اكتشف المجموعة", "Explore the collection"),
    },
    categories: { title: L("تسوّق حسب الغرفة", "Shop by room") },
    products: { primary: { title: L("القطع الأكثر طلبًا", "Our most-loved pieces"), line: L("الأكثر مبيعًا والجديد والأعلى تقييمًا.", "Best sellers, new in and top rated.") } },
    story: {
      alt: L("ورشة نجارة فيها كرسي خشب قيد التشطيب ولوح خشب", "A woodworking shop with a wooden chair being finished and timber boards"),
      eyebrow: L("من الورشة", "From the workshop"),
      title: L("كل قطعة بتتعمل عندنا", "Every piece is made by us"),
      text: L(
        "بنقص الخشب وننجّد ونشطّب في ورشتنا، وبنوصل ونركّب القطعة في مكانها، وبنضمن الهيكل ٥ سنين.",
        "We cut, upholster and finish in our workshop, deliver and assemble the piece in place, and guarantee the frame for five years.",
      ),
      cta: L("زور المعرض", "Visit the showroom"),
    },
    trust: [
      { title: L("توصيل وتركيب", "Delivery and assembly"), line: L("في البيت، علينا", "At home, on us") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما القطعة توصل", "Pay when the piece arrives") },
      { title: L("ضمان الهيكل", "Frame guarantee"), line: L("٥ سنين على كل قطعة", "Five years on every piece") },
      { title: L("زور المعرض", "Visit the showroom"), line: L("شوف القماش والخشب بنفسك", "See the fabrics and wood yourself") },
    ],
    newsletter: {
      eyebrow: L("نشرة عتيق", "The Ateek letter"),
      title: L("كن أول من يشوف المجموعات الجديدة", "See new collections first"),
      line: L("رسالة واحدة في الشهر: قطع جديدة وأفكار لتنسيق البيت.", "One letter a month: new pieces and ideas for styling your home."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    about: {
      line: L("أثاث خشب طبيعي متشطب يدويًا في ورشتنا.", "Solid wood furniture, hand-finished in our workshop."),
      alt: L("ورشة نجارة فيها كرسي خشب قيد التشطيب ولوح خشب", "A woodworking shop with a wooden chair being finished and timber boards"),
      eyebrow: L("الورشة والمعرض", "Workshop and showroom"),
      title: L("من لوح الخشب لبيتك", "From the timber board to your home"),
      text: L("من اختيار الخشب لحد آخر غرزة في التنجيد، الشغل كله بيتعمل في ورشتنا.", "From choosing the wood to the last upholstery stitch, all the work happens in our workshop."),
      more: L("وبنضمن الهيكل ٥ سنين، والتركيب في البيت علينا.", "Frames carry a five-year guarantee, and assembly at home is on us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("زورنا أو كلمنا", "Visit or call us"),
      line: L("ابعتلنا مقاس المكان ونقولك أنهي قطعة تناسبه.", "Send us the size of your space and we tell you which piece fits."),
      heading: L("احجز زيارة للمعرض", "Book a showroom visit"),
    },
    faq: {
      line: L("التوصيل والتركيب والضمان.", "Delivery, assembly and guarantee."),
      question: L("التركيب عليكم؟", "Do you assemble the furniture?"),
      answer: L(
        "أيوه، فريقنا بيوصل القطعة ويركبها في مكانها وياخد الكرتون معاه.",
        "Yes. Our team delivers, assembles the piece in place and takes the packaging away.",
      ),
    },
    custom: {
      // `furniture-luxe`: the header's link to the about page.
      "about-label": L("المعرض", "Our showroom"),
      // `furniture-luxe`: the link to the whole catalog.
      "shop-all": L("كل القطع", "Shop all"),
      // `furniture-luxe`: the footer's phone and email (a seller replaces them; the Arabic email starts with a right-to-left mark, as the look's own does).
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", "+20 100 000 0000"),
      "contact-email": L("‏hello@ateek.example", "hello@ateek.example"),
    },
  },
  productPage: { copy: { reviews: L("آراء عملائنا", "What our clients say"), related: L("قطع تكمّل المكان", "Pieces that complete the room") } },
};
