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

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(13780411, 1200), // a clear case on a blush phone, dark granite
  pexels(32912373, 1200), // purple, blue and white silicone cases on black
  pexels(19784109, 1200), // a black rugged case with a ring stand on a desk
  pexels(11028408, 1200), // a phone with a glass protector under a palm shadow
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
      "جرابات شفافة وسيليكون وجلد، واسكرينات وعلّاقات، لموديلات آيفون وسامسونج المشهورة.",
      "Clear, silicone and leather cases, screen protectors and straps, for popular iPhone and Samsung models.",
    ),
    categories: [
      ["clear", "جرابات شفافة", "Clear cases", TILES[0]!],
      ["silicone", "جرابات سيليكون", "Silicone cases", TILES[1]!],
      ["leather", "جلد ومحافظ وتقيل", "Leather, wallet & rugged", TILES[2]!],
      ["protection", "اسكرينات وعلّاقات", "Protectors & straps", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `volt`'s hero.
    products: [
      ["clear-magnetic-case", "clear", "جراب شفاف بحلقة مغناطيس", "Clear Magnetic Case", shot("clear-magnetic-case"), 350, { isFeatured: true, compareAtPrice: 420, rating: 4.8, sold90: 264 }],
      ["sage-silicone-case", "silicone", "جراب سيليكون أخضر زيتي", "Sage Silicone Case", shot("sage-silicone-case"), 280, { isFeatured: true, rating: 4.7, sold90: 198 }],
      ["brown-leather-case", "leather", "جراب جلد طبيعي بني", "Brown Genuine Leather Case", shot("brown-leather-case"), 850, { isFeatured: true, compareAtPrice: 950, rating: 4.8, sold90: 87 }],
      ["tempered-glass-protector", "protection", "اسكرينة زجاج بإطار تركيب", "Tempered Glass Protector with Fitting Frame", shot("tempered-glass-protector"), 150, { isFeatured: true, rating: 4.7, sold90: 512 }],
      ["clear-slim-case", "clear", "جراب شفاف رفيع", "Clear Slim Case", shot("clear-slim-case"), 150, { rating: 4.5, sold90: 441 }],
      ["black-silicone-case", "silicone", "جراب سيليكون أسود", "Black Silicone Case", shot("black-silicone-case"), 280, { rating: 4.7, sold90: 356 }],
      ["black-wallet-flip-case", "leather", "جراب محفظة فليب جلد صناعي أسود", "Black Faux Leather Wallet Flip Case", shot("black-wallet-flip-case"), 450, { rating: 4.6, sold90: 142 }],
      ["camera-lens-protector", "protection", "حماية عدسة الكاميرا", "Camera Lens Protector", shot("camera-lens-protector"), 120, { rating: 4.5, sold90: 387 }],
      ["clear-bumper-case", "clear", "جراب شفاف بزوايا مقوّاة", "Clear Bumper Case with Reinforced Corners", shot("clear-bumper-case"), 200, { rating: 4.6, sold90: 309 }],
      ["pink-silicone-case", "silicone", "جراب سيليكون بينك", "Pink Silicone Case", shot("pink-silicone-case"), 280, { compareAtPrice: 340, rating: 4.7, sold90: 231 }],
      ["tan-card-slot-case", "leather", "جراب بجيب كروت جلد صناعي جملي", "Tan Faux Leather Card Slot Case", shot("tan-card-slot-case"), 380, { rating: 4.5, sold90: 118 }],
      ["beaded-phone-strap", "protection", "علّاقة موبايل خرز", "Beaded Phone Strap", shot("beaded-phone-strap"), 180, { rating: 4.6, sold90: 176 }],
      ["frosted-black-case", "clear", "جراب مطفي بحواف سودا", "Frosted Case with Black Edges", shot("frosted-black-case"), 250, { rating: 4.6, sold90: 214 }],
      ["navy-silicone-case", "silicone", "جراب سيليكون كحلي", "Navy Silicone Case", shot("navy-silicone-case"), 280, { rating: 4.6, sold90: 163 }],
      ["black-rugged-case", "leather", "جراب تقيل أسود بستاند", "Black Rugged Case with Kickstand", shot("black-rugged-case"), 400, { rating: 4.7, sold90: 189 }],
      ["crossbody-phone-lanyard", "protection", "علّاقة موبايل كروس أسود", "Black Crossbody Phone Lanyard", shot("crossbody-phone-lanyard"), 250, { rating: 4.5, sold90: 147 }],
    ],
  }),
  photos: {
    // Not drawn by `volt` (a big-word hero); kept for looks added later. A lilac silicone case and two plants on light wood.
    hero: { wide: pexels(2718446, 1920), tall: pexels(11059612, 1200) },
    tiles: TILES,
    // A phone on dark grained leather: it sits in the middle band, so a 21:9 crop keeps it.
    banner: pexels(1350462, 1920),
    // `volt`'s about page (4:5): a phone in a white bumper case, glasses and a notebook on black linen.
    story: pexels(8100970, 1200),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("اختار موديل موبايلك من صفحة المنتج", "Pick your phone model on the product page"),
    ],
    // `volt`: the header search placeholder, three things a buyer types.
    labels: { search: L("دوّر على جراب شفاف، سيليكون، اسكرينة…", "Search clear case, silicone, screen protector…") },
    hero: {
      alt: L("جراب سيليكون موف على خشب فاتح جنب زرعتين", "A lilac silicone case on light wood beside two plants"),
      eyebrow: L("لبّس موبايلك", "Dress your phone"),
      title: L("جراب على مقاس موبايلك", "A case that fits yours"),
      line: L(
        "جرابات واسكرينات لموديلات آيفون وسامسونج المشهورة، واختار موديلك من صفحة المنتج.",
        "Cases and protectors for popular iPhone and Samsung models. Pick yours on the product page.",
      ),
      cta: L("تسوّق الجرابات", "Shop cases"),
    },
    // `volt`: over the category chips.
    categories: { title: L("عايز جراب إيه؟", "Which case are you after?") },
    products: {
      primary: {
        // `volt`: the best sellers in compact rows, so the title says so.
        title: L("الأكتر طلبًا", "Most ordered"),
        line: L("الجرابات والاسكرينات اللي الناس بترجع تطلبها.", "The cases and protectors people order again."),
      },
    },
    story: {
      alt: L("موبايل في جراب أبيض جنب نضارة وكشكول على قماش أسود", "A phone in a white case beside glasses and a notebook on black linen"),
      eyebrow: L("إزاي بنختار", "How we pick"),
      title: L("بنجرّب المقاس قبل ما نبيع", "We check the fit before we sell"),
      text: L(
        "كل جراب بنركّبه على الموديل بتاعه ونتأكد من الزراير وفتحة الكاميرا قبل ما يدخل المحل.",
        "We fit every case on its model and check the buttons and the camera cut-out before it joins the shop.",
      ),
      cta: L("اعرف عننا", "About us"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنبعت طلبك لأي محافظة", "We send your order to any governorate") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("نساعدك تختار", "Help choosing"), line: L("ابعت موديل موبايلك ونقولك المناسب", "Send your phone model and we tell you what fits") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو الجراب مش على المقاس", "If the case does not fit") },
    ],
    newsletter: {
      title: L("اعرف الألوان الجديدة أول بأول", "Hear about new colours first"),
      line: L("هنبعتلك بس لما ينزل جراب أو لون جديد.", "We only write when a new case or colour arrives."),
    },
    about: {
      line: L("محل جرابات صغير بيختار كل قطعة بيبيعها.", "A small case shop that picks every piece it sells."),
      alt: L("موبايل في جراب أبيض جنب نضارة وكشكول", "A phone in a white case beside glasses and a notebook"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("زهقنا من الجراب اللي مش على المقاس", "Tired of cases that do not fit"),
      text: L(
        "بدأنا لأن كل جراب كنا بنشتريه يا إما الزراير بتاعته ناشفة يا إما الكاميرا مش في مكانها. دلوقتي بنجرّب كل جراب على موديله، وبنبيع بس اللي يقفل صح.",
        "We started because every case we bought had stiff buttons or a camera hole in the wrong place. Now we try each case on its model and only sell the ones that close right.",
      ),
      more: L("ولو مش عارف موديلك، ابعتلنا صورة ضهر الموبايل ونقولك.", "Not sure of your model? Send us a photo of the phone's back and we tell you."),
      // `volt`: to the best sellers.
      cta: L("ابدأ التسوق", "Start shopping"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("قولنا موبايلك إيه وبتحب الجراب شكله إيه، ونرشّحلك.", "Tell us your phone and the look you like, and we suggest a case."),
      heading: L("اسأل عن جراب أو اسكرينة", "Ask about a case or protector"),
    },
    faq: {
      line: L("الموديلات والتوصيل والاستبدال.", "Models, delivery and exchanges."),
      question: L("الجراب ده هيركب على موبايلي؟", "Will this case fit my phone?"),
      answer: L(
        "الجرابات والاسكرينات متاحة لموديلات آيفون وسامسونج المشهورة، واختار موديلك من صفحة المنتج. لو موديلك مش موجود ابعتلنا ونقولك.",
        "Cases and protectors come for popular iPhone and Samsung models: pick yours on the product page. If your model is not listed, message us and we will tell you.",
      ),
    },
    custom: {
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("درع", "SHIELD"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("استبدال لو مش على المقاس", "Exchange if it does not fit"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي جرّبوه", "From people who use it"), related: L("يكمّل معاه", "Pairs well with") } },
};
