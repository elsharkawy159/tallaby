/**
 * The home decor pack (niche editions, ROADMAP F-90): "Zawya", a small decor
 * studio of wall art and frames, vases and pottery, mirrors and clocks, and
 * candles and accents in warm terracotta and ivory. Data only; `rokn` draws
 * it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, lettering or logos; the
 * mirrors reflect only plain white), in the public `library-media` bucket,
 * `editions/decor/`: twelve white-background packshots named by slug and
 * eight scenes as `scene-<slot>`.
 *
 * Look: `rokn`, the niche's template (one template per niche). Its home
 * shows a list of six best sellers and a price finder (`custom.price-*`; the
 * bands' links stay the finder's own); no category rows, so three products
 * per category are enough. No `reviews`: a pack holds no invented buyer
 * quotes, and without them `rokn` leaves its quote out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "decor";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const DECOR: Edition = {
  niche: NICHE,
  looks: ["rokn"],
  priceBand: { min: 200, max: 2500 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("زاوية", "Zawya"),
    description: L("ديكور بألوان الطين والعاج يكمّل كل ركن.", "Terracotta and ivory decor to finish every corner."),
    categories: [
      ["wall-art", "لوحات وإطارات", "Wall art & frames", TILES[0]!],
      ["vases", "فازات وفخار", "Vases & pottery", TILES[1]!],
      ["mirrors-clocks", "مرايا وساعات", "Mirrors & clocks", TILES[2]!],
      ["candles-accents", "شموع وإكسسوارات", "Candles & accents", TILES[3]!],
    ],
    products: [
      ["terracotta-amphora-vase", "vases", "فازة فخار طويلة", "Tall Terracotta Vase", P("terracotta-amphora-vase"), 650, { isFeatured: true, rating: 4.9, sold90: 188 }],
      ["rattan-sunburst-mirror", "mirrors-clocks", "مرآة خوص على شكل شمس", "Rattan Sunburst Mirror", P("rattan-sunburst-mirror"), 1250, { isFeatured: true, rating: 4.8, sold90: 142 }],
      ["abstract-canvas-print", "wall-art", "لوحة قماشية تجريدية", "Abstract Canvas Print", P("abstract-canvas-print"), 1450, { rating: 4.7, sold90: 96 }],
      ["ceramic-candle-holders", "candles-accents", "شمعدانان من الفخار بشموع", "Terracotta Candle Holders with Candles", P("ceramic-candle-holders"), 480, { rating: 4.8, sold90: 171 }],
      ["ivory-ribbed-vase", "vases", "فازة سيراميك عاجي مضلّعة", "Ivory Ribbed Vase", P("ivory-ribbed-vase"), 520, { rating: 4.7, sold90: 156 }],
      ["round-arched-mirror", "mirrors-clocks", "مرآة مقوّسة بإطار حديدي", "Arched Iron Mirror", P("round-arched-mirror"), 1850, { rating: 4.6, sold90: 73 }],
      ["desert-landscape-print", "wall-art", "لوحة صحراء بإطار خشبي", "Desert Landscape Print", P("desert-landscape-print"), 890, { rating: 4.6, sold90: 88 }],
      ["brass-ramadan-lantern", "candles-accents", "فانوس نحاس بزجاج ملوّن", "Brass Lantern with Coloured Glass", P("brass-ramadan-lantern"), 950, { rating: 4.9, sold90: 124 }],
      ["black-bud-vase-trio", "vases", "ثلاث فازات صغيرة سوداء", "Black Bud Vase Trio", P("black-bud-vase-trio"), 450, { rating: 4.5, sold90: 109 }],
      ["wood-wall-clock", "mirrors-clocks", "ساعة حائط من خشب الجوز", "Walnut Wall Clock", P("wood-wall-clock"), 690, { rating: 4.7, sold90: 92 }],
      ["black-frame-set", "wall-art", "طقم ٣ إطارات سوداء", "Black Frame Set of 3", P("black-frame-set"), 390, { rating: 4.5, sold90: 117 }],
      ["marble-decor-bowl", "candles-accents", "طبق رخام ديكور", "Marble Decor Bowl", P("marble-decor-bowl"), 560, { compareAtPrice: 650, rating: 4.6, sold90: 64 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`rokn` has no banner).
    banner: scene("banner"),
    // `rokn`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("لوحات وفازات ومرايا وشموع", "Art, vases, mirrors and candles"),
      L("صور ومقاسات لكل قطعة", "Photos and sizes for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    hero: {
      alt: L("فانوس نحاسي مضاء بجوار فازة فخار وظل مشربية على الجدار", "A lit brass lantern beside a terracotta vase, a mashrabiya shadow on the wall"),
      eyebrow: L("ديكور البيت", "Home decor"),
      title: L("ديكور بألوان دافئة", "Decor in warm colours"),
      line: L("لوحات وفازات ومرايا وشموع بألوان الطين والعاج تتناسق معًا.", "Art, vases, mirrors and candles in terracotta and ivory that go together."),
      cta: L("تسوّق الديكور", "Shop decor"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        eyebrow: L("الأكثر طلبًا", "Most ordered"),
        title: L("قطع مختارة", "Selected pieces"),
        line: L("قطع ديكور للمنزل أو للإهداء.", "Decor pieces for the home or as a gift."),
      },
    },
    story: {
      alt: L("ورشة فخار فيها رفوف فازات وعجلة خزّاف", "A pottery workshop with shelves of vases and a potter's wheel"),
      eyebrow: L("التنسيق", "Styling"),
      title: L("قطع تتناسق معًا", "Pieces that go together"),
      text: L("نختار كل قطعة لتتناسق مع البقية، لتنسّق ركنًا كاملًا من مكان واحد.", "Every piece is chosen to go with the rest, so you can finish a whole corner in one place."),
      cta: L("تسوّق الديكور", "Shop decor"),
    },
    trust: [
      { title: L("صور ومقاسات", "Photos and sizes"), line: L("لكل قطعة", "For every piece") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("لوحات وفازات ومرايا وشموع", "Art, vases, mirrors and candles") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("أفكار لركن جديد", "Ideas for a new corner"),
      line: L("رسالة شهرية فيها القطع الجديدة وفكرة لتنسيق ركن.", "A monthly letter with new pieces and an idea for styling a corner."),
    },
    about: {
      line: L("ستوديو ديكور صغير بألوان الطين والعاج.", "A small decor studio in terracotta and ivory."),
      alt: L("ورشة فخار فيها رفوف فازات وعجلة خزّاف", "A pottery workshop with shelves of vases and a potter's wheel"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("قطع مختارة تتناسق معًا", "Pieces chosen to go together"),
      text: L(
        "نختار كل لوحة وفازة ومرآة لتتناسق مع البقية، بألوان الطين والعاج.",
        "We choose every print, vase and mirror to go with the rest, in terracotta and ivory.",
      ),
      more: L("ولأي سؤال عن القطع، تواصل معنا.", "For any question about our pieces, contact us."),
      cta: L("تسوّق الديكور", "Shop decor"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي قطعة أو عن تنسيق ركن.", "Ask us about any piece or styling a corner."),
      heading: L("اسأل عن قطعة أو هدية", "Ask about a piece or a gift"),
    },
    faq: {
      line: L("القطع والمقاسات وطريقة الطلب.", "Pieces, sizes and ordering."),
      question: L("كيف أعرف مقاس القطعة؟", "How do I know a piece's size?"),
      answer: L("مقاسات كل قطعة بالسنتيمتر مذكورة في صفحتها.", "Each piece's measurements in centimetres are on its page."),
    },
    custom: {
      // `rokn`: the header's line under the store name.
      tagline: L("ديكور يكمّل كل ركن", "Decor that finishes every corner"),
      // `rokn`: the label of the link to the best sellers (header, the hero's second button).
      "best-label": L("الأكثر طلبًا", "Most ordered"),
      // `rokn`: the about page's name (header, footer, page title).
      "about-label": L("عن زاوية", "About Zawya"),
      // `rokn`: the price finder's title and three bands.
      "price-title": L("حسب ميزانيتك", "Shop by budget"),
      "price-band-1": L("أقل من ٦٠٠", "Under 600"),
      "price-band-2": L("٦٠٠ – ١٬٥٠٠", "600 – 1,500"),
      "price-band-3": L("أكثر من ١٬٥٠٠", "Over 1,500"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يتناسق معها", "Goes well with") } },
};
