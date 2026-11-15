/**
 * The cases and protection pack (niche editions, ROADMAP F-90): a small case
 * shop, "Qeshra" (Egyptian for a shell), with clear cases, silicone cases,
 * leather, wallet and rugged cases, and screen protectors and straps, sixteen
 * products in four categories of four. Data only; the looks draw it. No
 * React here.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("phone-cases", <slug>)`), square, one each, no brand
 * marks. Cases are offered "for popular iPhone and Samsung models", the
 * buyer picks the model on the product page; no other model claims. Only the
 * brown case is named real leather; the wallet and card-slot cases are faux
 * leather and say so.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * cases and phones on plain surfaces, no people, hands or body parts, no
 * logos or brand lettering, no readable screens, none used by a template or
 * another pack, none twice. Hero 2718446 (wide: a lilac silicone case on
 * light wood beside two plants; the back's lower part, where a logo would
 * sit, is out of frame) and 11059612 (tall: a red matte case on autumn
 * leaves and a dry fern). Tiles: clear 13780411 (a clear case on a blush
 * phone, close on the camera, dark granite), silicone 32912373 (purple, blue
 * and white silicone cases stacked on black), leather and rugged 19784109 (a
 * black rugged case with a ring stand on a desk), protection 11028408 (a
 * phone with a glass protector, its screen off, under a palm shadow on
 * white). Banner 1350462 (a phone with its screen off on dark grained
 * leather; it sits in the middle band, so a 21:9 crop keeps it). Story
 * 8100970 (a phone in a white bumper case, its screen blank white, round
 * glasses and a tan notebook on black linen), for `volt`'s about page.
 * Checked and fine but not used: 33039024, 3619858, 7241273.
 * Left out after the check: 8473458, 8473457, 12359130, 4206892, 13469804
 * and 14833708 (an Apple logo on the case or through it), 11938652 (a faint
 * logo pressed into the leather), 7742503 (a phone brand and a case brand),
 * 34391718 (a phone brand and fine print), 30846313 and 16144578 (a phone
 * brand and fine print), 11127983 and 11067245 (a monogram and a brand line
 * on the leather), 30669626 (a case brand mark), 30836168 (a brand mark on
 * the cable), 6907052 (a ruler brand), 32934287 and 32934272 (a brand on the
 * tote bag), 15028209 (drawn figures on the case and cards), 18868637 and
 * 18868636 (a hand, a case brand), 31570988 (printed people on the case),
 * 17077359 (a hand), 7621359 (a readable screen and a card logo). Already
 * used by a template: 374117, 374140, 1670768, 7742552, 7742554, 8156983,
 * 7538510, 3042448, 7360460, 19557526, 6214362.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace the Pexels photos
 * `volt` draws: the four tiles and the story. Still Pexels, drawn by no look:
 * the heroes 2718446 and 11059612 and the banner 1350462.
 *
 * Look: `volt` (its other planned look, `wasla`, is not edition-ready). No
 * category rows; the best sellers in compact rows. Four featured products:
 * `volt`'s hero shows the first featured one (the clear magnetic case). No
 * `reviews`: a pack holds no invented buyer quotes, and without them `volt`
 * leaves its messages section out. Promises stay generic (no hours, no
 * warranty term).
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "phone-cases";
const shot = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // a clear magnetic case on a navy phone, back up on white, an electric-blue shadow
  scene("tile-2"), // sage, pink, navy and black silicone cases fanned on white and lime paper
  scene("tile-3"), // a brown leather case, an open wallet flip case and a rugged case on its stand, navy cloth
  scene("tile-4"), // tempered glass in its fitting frame, a lens protector and a beaded strap beside a phone
];

export const PHONE_CASES: Edition = {
  niche: NICHE,
  looks: ["volt"],
  priceBand: { min: 100, max: 900 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("قشرة", "Qeshra"),
    description: L(
      "جرابات شفافة وسيليكون وجلد، وواقيات شاشة وعلّاقات، لطرازات iPhone وSamsung الشائعة.",
      "Clear, silicone and leather cases, screen protectors and straps, for popular iPhone and Samsung models.",
    ),
    categories: [
      ["clear", "جرابات شفافة", "Clear cases", TILES[0]!],
      ["silicone", "جرابات سيليكون", "Silicone cases", TILES[1]!],
      ["leather", "جلد ومحافظ وجرابات متينة", "Leather, wallet & rugged", TILES[2]!],
      ["protection", "واقيات شاشة وعلّاقات", "Protectors & straps", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `volt`'s hero.
    products: [
      ["clear-magnetic-case", "clear", "جراب شفاف بحلقة مغناطيسية", "Clear Magnetic Case", shot("clear-magnetic-case"), 350, { isFeatured: true, compareAtPrice: 420, rating: 4.8, sold90: 264 }],
      ["sage-silicone-case", "silicone", "جراب سيليكون أخضر زيتي", "Sage Silicone Case", shot("sage-silicone-case"), 280, { isFeatured: true, rating: 4.7, sold90: 198 }],
      ["brown-leather-case", "leather", "جراب جلد طبيعي بني", "Brown Genuine Leather Case", shot("brown-leather-case"), 850, { isFeatured: true, compareAtPrice: 950, rating: 4.8, sold90: 87 }],
      ["tempered-glass-protector", "protection", "واقي شاشة زجاجي بإطار تركيب", "Tempered Glass Protector with Fitting Frame", shot("tempered-glass-protector"), 150, { isFeatured: true, rating: 4.7, sold90: 512 }],
      ["clear-slim-case", "clear", "جراب شفاف رفيع", "Clear Slim Case", shot("clear-slim-case"), 150, { rating: 4.5, sold90: 441 }],
      ["black-silicone-case", "silicone", "جراب سيليكون أسود", "Black Silicone Case", shot("black-silicone-case"), 280, { rating: 4.7, sold90: 356 }],
      ["black-wallet-flip-case", "leather", "جراب محفظة قابل للطي من الجلد الصناعي أسود", "Black Faux Leather Wallet Flip Case", shot("black-wallet-flip-case"), 450, { rating: 4.6, sold90: 142 }],
      ["camera-lens-protector", "protection", "حماية عدسة الكاميرا", "Camera Lens Protector", shot("camera-lens-protector"), 120, { rating: 4.5, sold90: 387 }],
      ["clear-bumper-case", "clear", "جراب شفاف بزوايا مقوّاة", "Clear Bumper Case with Reinforced Corners", shot("clear-bumper-case"), 200, { rating: 4.6, sold90: 309 }],
      ["pink-silicone-case", "silicone", "جراب سيليكون وردي", "Pink Silicone Case", shot("pink-silicone-case"), 280, { compareAtPrice: 340, rating: 4.7, sold90: 231 }],
      ["tan-card-slot-case", "leather", "جراب بجيب بطاقات من الجلد الصناعي بلون الجمل", "Tan Faux Leather Card Slot Case", shot("tan-card-slot-case"), 380, { rating: 4.5, sold90: 118 }],
      ["beaded-phone-strap", "protection", "علّاقة هاتف بالخرز", "Beaded Phone Strap", shot("beaded-phone-strap"), 180, { rating: 4.6, sold90: 176 }],
      ["frosted-black-case", "clear", "جراب غير لامع بحواف سوداء", "Frosted Case with Black Edges", shot("frosted-black-case"), 250, { rating: 4.6, sold90: 214 }],
      ["navy-silicone-case", "silicone", "جراب سيليكون كحلي", "Navy Silicone Case", shot("navy-silicone-case"), 280, { rating: 4.6, sold90: 163 }],
      ["black-rugged-case", "leather", "جراب متين أسود بحامل", "Black Rugged Case with Kickstand", shot("black-rugged-case"), 400, { rating: 4.7, sold90: 189 }],
      ["crossbody-phone-lanyard", "protection", "علّاقة هاتف طويلة سوداء", "Black Crossbody Phone Lanyard", shot("crossbody-phone-lanyard"), 250, { rating: 4.5, sold90: 147 }],
    ],
  }),
  photos: {
    // Not drawn by `volt` (a big-word hero); kept for looks added later. A lilac silicone case and two plants on light wood.
    hero: { wide: pexels(2718446, 1920), tall: pexels(11059612, 1200) },
    tiles: TILES,
    // A phone on dark grained leather: it sits in the middle band, so a 21:9 crop keeps it.
    banner: pexels(1350462, 1920),
    // `volt`'s about page (4:5): a phone in a white bumper case, glasses and a notebook on navy linen.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("جرابات وواقيات شاشة وعلّاقات", "Cases, screen protectors and straps"),
      L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      L("اختر طراز هاتفك من صفحة المنتج", "Pick your phone model on the product page"),
    ],
    // `volt`: the header search placeholder, three things a buyer types.
    labels: { search: L("ابحث عن جراب شفاف، سيليكون، واقي شاشة…", "Search clear case, silicone, screen protector…") },
    hero: {
      alt: L("جراب سيليكون بنفسجي فاتح على خشب فاتح بجوار نبتتين", "A lilac silicone case on light wood beside two plants"),
      eyebrow: L("جرابات الهاتف", "Phone cases"),
      title: L("جراب على مقاس هاتفك", "A case that fits yours"),
      line: L(
        "جرابات وواقيات شاشة لطرازات iPhone وSamsung الشائعة، واختر طرازك من صفحة المنتج.",
        "Cases and protectors for popular iPhone and Samsung models. Pick yours on the product page.",
      ),
      cta: L("تسوّق الجرابات", "Shop cases"),
    },
    // `volt`: over the category chips.
    categories: { title: L("أي جراب تريد؟", "Which case are you after?") },
    products: {
      primary: {
        // `volt`: the best sellers in compact rows, so the title says so.
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("الجرابات وواقيات الشاشة الأكثر طلبًا.", "Our most-ordered cases and protectors."),
      },
    },
    story: {
      alt: L("هاتف في جراب أبيض بجوار نظارة ودفتر على قماش كحلي", "A phone in a white case beside glasses and a notebook on navy linen"),
      eyebrow: L("كيف نختار", "How we pick"),
      title: L("فتحات دقيقة لكل طراز", "Precise cut-outs for every model"),
      text: L(
        "نذكر في صفحة كل جراب الطرازات المناسبة له.",
        "Each case's page lists the models it fits.",
      ),
      cta: L("من نحن", "About us"),
    },
    trust: [
      { title: L("طرازات واضحة", "Clear models"), line: L("اختر طراز هاتفك من صفحة المنتج", "Pick your model on the product page") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("شفافة وسيليكون وجلد", "Clear, silicone and leather") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الألوان الجديدة أولًا بأول", "Hear about new colours first"),
      line: L("نراسلك فقط عند وصول جراب أو لون جديد.", "We only write when a new case or colour arrives."),
    },
    about: {
      line: L("متجر للجرابات، نختار كل قطعة بعناية.", "A case shop that picks every piece with care."),
      alt: L("هاتف في جراب أبيض بجوار نظارة ودفتر", "A phone in a white case beside glasses and a notebook"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("جرابات على مقاس كل طراز", "Cases made for each model"),
      text: L(
        "قشرة متجر لجرابات الهاتف وواقيات الشاشة والعلّاقات، ونذكر في صفحة كل منتج الطرازات المناسبة له.",
        "Qeshra sells phone cases, screen protectors and straps, and each product's page lists the models it fits.",
      ),
      more: L("ولأي سؤال عن طراز هاتفك، تواصل معنا.", "For any question about your phone model, contact us."),
      // `volt`: to the best sellers.
      cta: L("ابدأ التسوق", "Start shopping"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن الجراب المناسب لهاتفك.", "Ask us about the right case for your phone."),
      heading: L("اسأل عن جراب أو واقي شاشة", "Ask about a case or protector"),
    },
    faq: {
      line: L("الطرازات والمنتجات وطريقة الطلب.", "Models, products and ordering."),
      question: L("هل يناسب هذا الجراب هاتفي؟", "Will this case fit my phone?"),
      answer: L(
        "الجرابات وواقيات الشاشة متاحة لطرازات iPhone وSamsung الشائعة، واختر طرازك من صفحة المنتج. وإذا لم تجد طرازك، تواصل معنا.",
        "Cases and protectors come for popular iPhone and Samsung models: pick yours on the product page. If your model is not listed, contact us.",
      ),
    },
    custom: {
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("درع", "SHIELD"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("مواصفات واضحة لكل جراب", "Clear specs for every case"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يُستخدم معه", "Pairs well with") } },
};
