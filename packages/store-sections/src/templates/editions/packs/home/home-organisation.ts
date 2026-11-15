/**
 * The home organisation pack (niche editions, ROADMAP F-90): "Rattib", a
 * shop of storage boxes and bins, baskets, closet and hanger organisers,
 * and kitchen and bathroom organisers. Data only; `tanzim` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/home-organisation/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `tanzim`, the niche's template (one template per niche). Its home
 * shows six best sellers in compact rows, the delivery days and six
 * questions (`custom.faq-*`); no category rows, so three products per
 * category are enough.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "home-organisation";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const HOME_ORGANISATION: Edition = {
  niche: NICHE,
  looks: ["tanzim"],
  priceBand: { min: 100, max: 1500 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("رتّب", "Rattib"),
    description: L("علب وسلال ومنظّمات للتخزين والترتيب.", "Boxes, baskets and organisers for storage."),
    categories: [
      ["boxes", "علب وصناديق", "Storage boxes & bins", TILES[0]!],
      ["baskets", "سلال", "Baskets", TILES[1]!],
      ["closet", "الخزانة والشماعات", "Closet & hangers", TILES[2]!],
      ["kitchen-bath", "المطبخ والحمام", "Kitchen & bathroom", TILES[3]!],
    ],
    products: [
      ["pantry-jars-set", "kitchen-bath", "طقم ٤ برطمانات بأغطية بامبو", "Pantry Jars with Bamboo Lids, Set of 4", P("pantry-jars-set"), 490, { isFeatured: true, rating: 4.8, sold90: 268 }],
      ["clear-stacking-boxes", "boxes", "ثلاث علب شفافة بأغطية", "Clear Stacking Boxes, Set of 3", P("clear-stacking-boxes"), 420, { isFeatured: true, rating: 4.7, sold90: 231 }],
      ["velvet-hangers-set", "closet", "١٠ شماعات مخمل رمادية", "Grey Velvet Hangers, Set of 10", P("velvet-hangers-set"), 260, { rating: 4.8, sold90: 297 }],
      ["seagrass-basket-handles", "baskets", "سلة من عشب البحر بمقبضين", "Seagrass Basket with Handles", P("seagrass-basket-handles"), 380, { rating: 4.7, sold90: 184 }],
      ["drawer-divider-set", "closet", "منظّم أدراج قماش", "Fabric Drawer Organiser Set", P("drawer-divider-set"), 320, { rating: 4.6, sold90: 176 }],
      ["spice-rack-tiered", "kitchen-bath", "رف بهارات بثلاثة أدوار", "Three-Tier Spice Rack", P("spice-rack-tiered"), 350, { rating: 4.6, sold90: 162 }],
      ["fabric-storage-cube", "boxes", "صندوق قماش رمادي", "Grey Fabric Storage Cube", P("fabric-storage-cube"), 290, { rating: 4.5, sold90: 147 }],
      ["white-laundry-hamper", "baskets", "سلة غسيل بغطاء", "White Laundry Hamper with Lid", P("white-laundry-hamper"), 750, { rating: 4.7, sold90: 98 }],
      ["under-sink-organiser", "kitchen-bath", "منظّم أسفل الحوض بدرجين", "Two-Tier Under-Sink Organiser", P("under-sink-organiser"), 590, { rating: 4.6, sold90: 121 }],
      ["over-door-hook-rack", "closet", "علّاقة باب بستة خطافات", "Over-Door Rack with 6 Hooks", P("over-door-hook-rack"), 220, { rating: 4.5, sold90: 133 }],
      ["wire-basket-set", "baskets", "سلتان من السلك الأبيض", "White Wire Baskets, Set of 2", P("wire-basket-set"), 340, { rating: 4.5, sold90: 104 }],
      ["underbed-storage-bag", "boxes", "حقيبة تخزين أسفل السرير", "Under-Bed Storage Bag", P("underbed-storage-bag"), 240, { compareAtPrice: 290, rating: 4.4, sold90: 88 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`tanzim` has no banner).
    banner: scene("banner"),
    // `tanzim`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("علب وسلال ومنظّمات", "Boxes, baskets and organisers"),
      L("مقاسات واضحة لكل منتج", "Clear sizes for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن علبة، سلة، شماعات…", "Search boxes, baskets, hangers…") },
    // Only `nav.0.href` is read by `tanzim`: where the hero's and the about page's buttons go.
    nav: [{ label: L("المطبخ", "Kitchen"), href: search("برطمانات") }],
    hero: {
      alt: L("برطمانات زجاجية فيها أرز وعدس ومكرونة على رف مطبخ", "Glass jars of rice, lentils and pasta on a kitchen shelf"),
      eyebrow: L("تنظيم البيت", "Home reset"),
      title: L("مكان لكل شيء", "A place for everything"),
      line: L("برطمانات وعلب وسلال وشماعات لترتيب كل ركن.", "Jars, boxes, baskets and hangers that keep every corner tidy."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    categories: { title: L("ماذا ستنظّم اليوم؟", "What are you organising today?") },
    products: { primary: { title: L("الأكثر مبيعًا", "Best sellers"), line: L("المنتجات الأكثر طلبًا.", "Our most-ordered products.") } },
    story: {
      alt: L("رف معدني عليه علب وسلال خوص مرتبة", "A metal shelf of neatly arranged boxes and woven baskets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("حلول تخزين لكل ركن", "Storage for every corner"),
      text: L("نختار العلب والسلال والمنظّمات بمقاسات تناسب الخزائن والرفوف، ونذكر مقاس كل منتج في صفحته.", "We choose boxes, baskets and organisers sized for cupboards and shelves, with each product's size on its page."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    trust: [
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("للمطبخ والحمام والخزانة", "For kitchen, bathroom and closet") },
      { title: L("مقاسات دقيقة", "Sizes that fit"), line: L("المقاسات في صفحة كل منتج", "Sizes on every product page") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("أفكار تنظيم في بريدك الإلكتروني", "Organising ideas in your inbox"),
      line: L("فكرة تنظيم واحدة كل أسبوع.", "One organising idea every week."),
    },
    about: {
      line: L("علب وسلال ومنظّمات لبيت مترتب.", "Boxes, baskets and organisers for a tidy home."),
      alt: L("رف معدني عليه علب وسلال خوص مرتبة", "A metal shelf of neatly arranged boxes and woven baskets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("حلول تخزين لكل ركن", "Storage for every corner"),
      text: L(
        "رتّب متجر للعلب والسلال والمنظّمات. نختار المنتجات بمقاسات تناسب الخزائن والرفوف، ونذكر الطول والعرض والارتفاع لكل منتج.",
        "Rattib sells boxes, baskets and organisers. We choose products sized for cupboards and shelves, and list each one's length, width and height.",
      ),
      more: L("ولأي سؤال عن المقاس، تواصل معنا.", "For any question about sizes, contact us."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي منتج أو مقاس.", "Ask us about any product or size."),
      heading: L("عن مقاس أو منتج", "About a size or a product"),
    },
    faq: {
      line: L("المقاسات والمنتجات وطريقة الطلب.", "Sizes, products and ordering."),
      question: L("أين أجد مقاس العلبة؟", "Where do I find a box's size?"),
      answer: L("الطول والعرض والارتفاع مذكورة في صفحة كل منتج بالسنتيمتر.", "The length, width and height are on every product page in centimetres."),
    },
    custom: {
      // `tanzim`: the label of the hero's second button (the best sellers).
      "best-label": L("الأكثر طلبًا", "Most ordered"),
      // `tanzim`: the home page's six questions.
      "faq-1-question": L("هل البرطمانات محكمة؟", "Are the jars airtight?"),
      "faq-1-answer": L("نعم، في غطاء البامبو حلقة من السيليكون.", "Yes, each bamboo lid has a silicone seal."),
      "faq-2-question": L("هل تتحمل العلب الشفافة الوزن؟", "Do the clear boxes take weight?"),
      "faq-2-answer": L("نعم، ويمكن رصّها فوق بعضها.", "Yes, and they stack."),
      "faq-3-question": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
      "faq-3-answer": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
      "faq-4-question": L("هل البرطمانات زجاجية؟", "Are the jars glass?"),
      "faq-4-answer": L("نعم، برطمانات زجاجية بأغطية من البامبو.", "Yes, glass jars with bamboo lids."),
      "faq-5-question": L("هل تناسب السلة الرف لديّ؟", "Will a basket fit my shelf?"),
      "faq-5-answer": L("مقاسات كل سلة مذكورة في صفحتها، فقِس الرف وقارن.", "Each basket's size is on its page, so measure your shelf and compare."),
      "faq-6-question": L("هل يمكنني إرجاع المنتج؟", "Can I return things?"),
      "faq-6-answer": L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل التنظيم", "Completes the set") } },
};
