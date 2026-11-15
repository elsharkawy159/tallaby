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
    description: L("علب وسلال ومنظّمات لبيت مترتب من غير مجهود.", "Boxes, baskets and organisers for a tidy home without the effort."),
    categories: [
      ["boxes", "علب وصناديق", "Storage boxes & bins", TILES[0]!],
      ["baskets", "سلال", "Baskets", TILES[1]!],
      ["closet", "الدولاب والشماعات", "Closet & hangers", TILES[2]!],
      ["kitchen-bath", "المطبخ والحمام", "Kitchen & bathroom", TILES[3]!],
    ],
    products: [
      ["pantry-jars-set", "kitchen-bath", "طقم ٤ برطمانات بغطا بامبو", "Pantry Jars with Bamboo Lids, Set of 4", P("pantry-jars-set"), 490, { isFeatured: true, rating: 4.8, sold90: 268 }],
      ["clear-stacking-boxes", "boxes", "تلات علب شفافة بغطا", "Clear Stacking Boxes, Set of 3", P("clear-stacking-boxes"), 420, { isFeatured: true, rating: 4.7, sold90: 231 }],
      ["velvet-hangers-set", "closet", "١٠ شماعات قطيفة رمادي", "Grey Velvet Hangers, Set of 10", P("velvet-hangers-set"), 260, { rating: 4.8, sold90: 297 }],
      ["seagrass-basket-handles", "baskets", "سلة سيجراس بإيدين", "Seagrass Basket with Handles", P("seagrass-basket-handles"), 380, { rating: 4.7, sold90: 184 }],
      ["drawer-divider-set", "closet", "منظّم أدراج قماش", "Fabric Drawer Organiser Set", P("drawer-divider-set"), 320, { rating: 4.6, sold90: 176 }],
      ["spice-rack-tiered", "kitchen-bath", "رف بهارات ٣ أدوار", "Three-Tier Spice Rack", P("spice-rack-tiered"), 350, { rating: 4.6, sold90: 162 }],
      ["fabric-storage-cube", "boxes", "صندوق قماش رمادي", "Grey Fabric Storage Cube", P("fabric-storage-cube"), 290, { rating: 4.5, sold90: 147 }],
      ["white-laundry-hamper", "baskets", "سلة غسيل بغطا", "White Laundry Hamper with Lid", P("white-laundry-hamper"), 750, { rating: 4.7, sold90: 98 }],
      ["under-sink-organiser", "kitchen-bath", "منظّم تحت الحوض بدرجين", "Two-Tier Under-Sink Organiser", P("under-sink-organiser"), 590, { rating: 4.6, sold90: 121 }],
      ["over-door-hook-rack", "closet", "علّاقة باب ٦ شماعات", "Over-Door Rack with 6 Hooks", P("over-door-hook-rack"), 220, { rating: 4.5, sold90: 133 }],
      ["wire-basket-set", "baskets", "سلتين سلك أبيض", "White Wire Baskets, Set of 2", P("wire-basket-set"), 340, { rating: 4.5, sold90: 104 }],
      ["underbed-storage-bag", "boxes", "شنطة تخزين تحت السرير", "Under-Bed Storage Bag", P("underbed-storage-bag"), 240, { compareAtPrice: 290, rating: 4.4, sold90: 88 }],
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
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("ابعت مقاس الرف ونقولك يدخل إيه", "Send your shelf size and we tell you what fits"),
    ],
    labels: { search: L("دوّر على علبة، سلة، شماعات…", "Search boxes, baskets, hangers…") },
    // Only `nav.0.href` is read by `tanzim`: where the hero's and the about page's buttons go.
    nav: [{ label: L("المطبخ", "Kitchen"), href: search("برطمانات") }],
    hero: {
      alt: L("برطمانات زجاج فيها رز وعدس ومكرونة على رف مطبخ", "Glass jars of rice, lentils and pasta on a kitchen shelf"),
      eyebrow: L("تنظيم البيت", "Home reset"),
      title: L("مكان لكل حاجة", "A place for everything"),
      line: L("برطمانات وعلب وسلال وشماعات تخلي كل ركن في البيت مترتب.", "Jars, boxes, baskets and hangers that keep every corner tidy."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    categories: { title: L("هتنظم إيه النهارده؟", "What are you organising today?") },
    products: { primary: { title: L("الأكثر مبيعًا", "Best sellers"), line: L("اللي الناس بترجع تطلبه.", "What people come back for.") } },
    story: {
      alt: L("رف معدن عليه علب وسلال خوص مترتبة", "A metal shelf of neatly arranged boxes and woven baskets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("بدأنا بدولاب واحد", "It started with one cupboard"),
      text: L("رتبنا بيتنا الأول، وبعدين بقينا نختار العلب والسلال اللي تناسب بيوت مصر.", "We sorted our own home first, then started choosing boxes and baskets that suit Egyptian homes."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    trust: [
      { title: L("توصيل لكل مصر", "Delivery across Egypt"), line: L("لحد باب البيت", "To your door") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("مقاسات مظبوطة", "Sizes that fit"), line: L("المقاسات في صفحة كل منتج", "Sizes on every product page") },
      { title: L("استرجاع سهل", "Easy returns"), line: L("خلال ١٤ يوم", "Within 14 days") },
    ],
    newsletter: {
      title: L("أفكار تنظيم على إيميلك", "Organising ideas in your inbox"),
      line: L("فكرة تنظيم واحدة كل أسبوع.", "One organising idea every week."),
    },
    about: {
      line: L("علب وسلال ومنظّمات لبيت مترتب.", "Boxes, baskets and organisers for a tidy home."),
      alt: L("رف معدن عليه علب وسلال خوص مترتبة", "A metal shelf of neatly arranged boxes and woven baskets"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("بدأنا بدولاب واحد", "It started with one cupboard"),
      text: L(
        "رتبنا دولاب المطبخ وصورناه، والناس فضلت تسأل جبنا العلب منين. فبقينا نختار علب وسلال على مقاس دواليب البيوت المصرية.",
        "We sorted our kitchen cupboard, shared a photo and everyone asked where the boxes came from. So we started choosing boxes and baskets sized for Egyptian cupboards.",
      ),
      more: L("ولو مش متأكد من المقاس، ابعتلنا مقاس الرف.", "If you are unsure of the size, send us your shelf measurements."),
      cta: L("رتّب مطبخك", "Sort your kitchen"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("ابعتلنا صورة الدولاب ومقاسه ونقترح عليك العلب المناسبة.", "Send us a photo and the size of your cupboard and we suggest the right boxes."),
      heading: L("عن مقاس أو منتج", "About a size or a product"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاسترجاع.", "Sizes, delivery and returns."),
      question: L("أعرف مقاس العلبة منين؟", "Where do I find a box's size?"),
      answer: L("الطول والعرض والارتفاع مكتوبين في صفحة كل منتج بالسنتيمتر.", "The length, width and height are on every product page in centimetres."),
    },
    custom: {
      // `tanzim`: the label of the hero's second button (the best sellers).
      "best-label": L("الأكثر طلبًا", "Most ordered"),
      // `tanzim`: the home page's six questions.
      "faq-1-question": L("البرطمانات محكمة؟", "Are the jars airtight?"),
      "faq-1-answer": L("أيوه، الغطا البامبو فيه جلدة سيليكون.", "Yes, each bamboo lid has a silicone seal."),
      "faq-2-question": L("العلب الشفافة بتتحمل وزن؟", "Do the clear boxes take weight?"),
      "faq-2-answer": L("أيوه، وبتترص فوق بعض من غير ما تتكسر.", "Yes, and they stack without cracking."),
      "faq-3-question": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
      "faq-3-answer": L("القاهرة والجيزة تاني يوم، وباقي المحافظات من ٢ لـ ٥ أيام.", "Cairo and Giza next day, other governorates in 2 to 5 days."),
      "faq-4-question": L("الزجاج بيوصل سليم؟", "Does the glass arrive safely?"),
      "faq-4-answer": L("كل برطمان متغلف لوحده، ولو اتكسر حاجة بنبدّلها.", "Every jar is wrapped on its own, and we replace anything broken."),
      "faq-5-question": L("السلة هتدخل الرف بتاعي؟", "Will a basket fit my shelf?"),
      "faq-5-answer": L("ابعتلنا مقاس الرف ونقولك أنهي سلال تدخل.", "Send us your shelf size and we tell you which baskets fit."),
      "faq-6-question": L("ينفع أرجّع؟", "Can I return things?"),
      "faq-6-answer": L("أيوه، خلال ١٤ يوم لو المنتج متستعملش.", "Yes, within 14 days if it is unused."),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي رتّبوا بيه", "From people who sorted with it"), related: L("يكمّل التنظيم", "Completes the set") } },
};
