/**
 * The PC and gaming accessories pack (niche editions, ROADMAP F-90): a gear
 * shop, "Klik", with keyboards, mice, headsets and audio, and controllers and
 * desk gear, sixteen products in four categories of four. Data only; the
 * looks draw it. No React here.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("pc-gaming", <slug>)`), square, front three-quarter
 * view, RGB off.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * gear on desks and in dark rooms, no people, hands or body parts, no brand
 * marks or readable lettering (keycap legends aside), none used by a template
 * or another pack, none twice.
 * Hero 1820328 (wide: three monitors with a mountain dawn on a dark desk, a
 * plain keyboard and mouse) and 13728045 (tall: a white and red mechanical
 * keyboard on navy; only key legends). Tiles: keyboards 37722338 (black
 * keycaps lit blue to pink), mice 19120448 (a black mouse side-on, red
 * monitor glow behind), headsets 7858756 (a black and red headset on a dark
 * desk, a blurred screen behind), controllers 27271924 (a pale grey
 * controller on a dark desk mat). Banner 14205160 (a black controller in
 * low red light). Story 28350931 (a light corner desk by the window:
 * curved monitor, headset on a stand, controller, plants), for `volt`'s white
 * page. Dark story 7862237 (an empty dark game lounge, two white controllers
 * on a yellow table), for `arena`'s about page. Video poster 17821147 (a
 * white wireless mouse on black).
 * Left out after the check: 28993064 and 28993061 (brand marks on the
 * headset, mouse and pad), 7720712 (a mark on the cooler, lettering on the
 * pad), 30469968 and 30469971 (motherboard lettering, an anime figure on
 * screen), 9128851 (a number plate on screen), 17350368 and 17350370 (toy
 * figures of a film franchise), 14263450, 13870516 and 6932748 (a brand on
 * the mouse), 28350924 and 28350925 (a readable menu bar), 12252924 (a
 * clock, card lettering and line-drawn faces), 16445673 (character emblems
 * on the sticks), 33357097 (a signature keycap and a game-ball keycap),
 * 34946383 (a monitor brand and app icons), 32532386 (a brand mark on the
 * frame), 7862493 (game characters on screen, a brand on the headset),
 * 9794458 ("hello" neon), 1038916 (clock digits), 12719132, 30353201 and
 * 12718986 (console logos), 1644557, 1486294, 2115256, 37958688,
 * 29259392, 29017683 and 33845371 (brand marks on the mice), 8414344 and
 * 10942520 (brand names on headphones), 37698747 and 7031697 (screens full
 * of text), 20213732 (a small brand mark on the mouse, papers), and photos
 * of people. Already used by a template: 30469973, 7862505, 12561283,
 * 6804466, 4792732, 38094551, 28842075, 35504606, 7887636, 34704932,
 * 20510003, 5931186, 18295023, 11945638, 15372898, 5269752, 30836158,
 * 33456959, 9785238, 17895080, 7862496.
 *
 * Looks: `arena` (dark page: its about photo comes from `photos.dark.story`),
 * then `volt`. Neither has category rows. Four featured products: `volt`'s
 * hero shows the first featured one (the full-size keyboard, wide, so it
 * stays first). `arena`'s brand cards are left out (no invented brands);
 * its three figures are the store's own terms (warranty, returns, delivery).
 * No `reviews`: a pack holds no invented buyer quotes, and without them
 * `volt` leaves its messages section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "pc-gaming";
const shot = (slug: string) => editionPhoto(NICHE, slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(37722338, 1200), // black keycaps lit blue to pink
  pexels(19120448, 1200), // a black mouse side-on, red monitor glow behind
  pexels(7858756, 1200), // a black and red headset on a dark desk
  pexels(27271924, 1200), // a pale grey controller on a dark desk mat
];

export const PC_GAMING: Edition = {
  niche: NICHE,
  looks: ["arena", "volt"],
  priceBand: { min: 250, max: 6000 },
  // Square packshots on pure white: a square white stage shows each piece whole, and the grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("كليك", "Klik"),
    description: L(
      "كيبوردات وماوسات وسماعات ودراعات للجيمنج، متجربة قبل ما توصلك.",
      "Gaming keyboards, mice, headsets and controllers, tested before they reach you.",
    ),
    categories: [
      ["keyboards", "كيبوردات", "Keyboards", TILES[0]!],
      ["mice", "ماوسات", "Mice", TILES[1]!],
      ["audio", "سماعات وصوت", "Headsets & audio", TILES[2]!],
      ["desk", "دراعات وإكسسوارات المكتب", "Controllers & desk gear", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `volt`'s hero (a wide photo reads best there).
    products: [
      ["black-full-size-gaming-keyboard", "keyboards", "كيبورد جيمنج كامل أسود بمسند إيد", "Black Full-Size Gaming Keyboard with Wrist Rest", shot("black-full-size-gaming-keyboard"), 2450, { isFeatured: true, compareAtPrice: 2800, rating: 4.8, sold90: 176 }],
      ["white-wireless-gaming-mouse", "mice", "ماوس جيمنج وايرلس أبيض", "White Wireless Gaming Mouse", shot("white-wireless-gaming-mouse"), 1350, { isFeatured: true, compareAtPrice: 1550, rating: 4.7, sold90: 214 }],
      ["black-gaming-headset-boom-mic", "audio", "سماعة جيمنج سودا بمايك", "Black Gaming Headset with Boom Mic", shot("black-gaming-headset-boom-mic"), 1650, { isFeatured: true, rating: 4.7, sold90: 158 }],
      ["black-wireless-gamepad", "desk", "دراع وايرلس أسود", "Black Wireless Gamepad", shot("black-wireless-gamepad"), 1450, { isFeatured: true, rating: 4.6, sold90: 189 }],
      ["pink-compact-mechanical-keyboard", "keyboards", "كيبورد ميكانيكال صغير بينك", "Pink Compact Mechanical Keyboard", shot("pink-compact-mechanical-keyboard"), 1750, { rating: 4.8, sold90: 97 }],
      ["black-honeycomb-lightweight-mouse", "mice", "ماوس خفيف مخرّم أسود", "Black Honeycomb Lightweight Mouse", shot("black-honeycomb-lightweight-mouse"), 1150, { rating: 4.6, sold90: 143 }],
      ["black-red-gaming-headset", "audio", "سماعة جيمنج أسود وأحمر", "Black and Red Gaming Headset", shot("black-red-gaming-headset"), 1250, { rating: 4.5, sold90: 201 }],
      ["black-usb-desk-microphone", "desk", "مايك USB للمكتب أسود", "Black USB Desk Microphone", shot("black-usb-desk-microphone"), 1850, { rating: 4.7, sold90: 68 }],
      ["black-mechanical-keyboard-white-keycaps", "keyboards", "كيبورد ميكانيكال أسود بزراير بيضا", "Black Mechanical Keyboard with White Keycaps", shot("black-mechanical-keyboard-white-keycaps"), 1950, { rating: 4.7, sold90: 121 }],
      ["black-wired-gaming-mouse", "mice", "ماوس جيمنج سلك أسود", "Black Wired Gaming Mouse", shot("black-wired-gaming-mouse"), 450, { rating: 4.5, sold90: 327 }],
      ["white-gaming-headset-boom-mic", "audio", "سماعة جيمنج بيضا بمايك", "White Gaming Headset with Boom Mic", shot("white-gaming-headset-boom-mic"), 1750, { rating: 4.8, sold90: 112 }],
      ["black-xl-desk-mousepad", "desk", "ماوس باد كبير أسود", "Black Large Desk Mousepad", shot("black-xl-desk-mousepad"), 350, { rating: 4.6, sold90: 288 }],
      ["white-compact-mechanical-keyboard", "keyboards", "كيبورد ميكانيكال صغير أبيض", "White Compact Mechanical Keyboard", shot("white-compact-mechanical-keyboard"), 1850, { rating: 4.7, sold90: 104 }],
      ["black-vertical-ergonomic-mouse", "mice", "ماوس عمودي مريح أسود", "Black Vertical Ergonomic Mouse", shot("black-vertical-ergonomic-mouse"), 650, { rating: 4.4, sold90: 76 }],
      ["black-gaming-earbuds-case", "audio", "سماعة إيربودز جيمنج سودا", "Black Gaming Earbuds", shot("black-gaming-earbuds-case"), 1100, { compareAtPrice: 1300, rating: 4.5, sold90: 133 }],
      ["black-headset-stand", "desk", "ستاند سماعة أسود", "Black Headset Stand", shot("black-headset-stand"), 400, { rating: 4.6, sold90: 95 }],
    ],
  }),
  photos: {
    // `arena`'s full-bleed hero (dark page): three monitors with a mountain dawn; the desk sits in the lower third, so the copy reads over the dark wall.
    hero: { wide: pexels(1820328, 1920), tall: pexels(13728045, 1200) },
    tiles: TILES,
    // A black controller in low red light (it sits in the middle band, so a 21:9 crop keeps it).
    banner: pexels(14205160, 1920),
    // `volt`'s about page (4:5, white page): a light corner desk by the window.
    story: pexels(28350931, 1200),
    // `arena`'s video block poster (16:9): a white wireless mouse on black.
    custom: { "video-poster": pexels(17821147, 1920) },
    // `arena`'s page is dark: its about page shows an empty dark game lounge instead.
    dark: { story: pexels(7862237, 1200) },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("ضمان سنة على كل قطعة", "One-year warranty on every piece"),
    ],
    labels: { search: L("دوّر على كيبورد، ماوس، سماعة…", "Search keyboards, mice, headsets…") },
    hero: {
      alt: L("تلات شاشات عليها جبال وقت الفجر فوق مكتب ضلمة", "Three monitors showing mountains at dawn on a dark desk"),
      eyebrow: L("متجرب قبل ما يوصلك", "Tested before it ships"),
      title: L("جهّز السيت أب بتاعك", "Build your setup"),
      line: L(
        "كيبوردات وماوسات وسماعات ودراعات، بضمان سنة وتوصيل لحد باب البيت.",
        "Keyboards, mice, headsets and controllers, with a one-year warranty and delivery to your door.",
      ),
      // `arena`: the hero's first button, to the whole catalog.
      cta: L("تسوق الأدوات", "Shop the gear"),
    },
    // `arena`: over the photo tiles; `volt`: over the category chips. Fits both.
    categories: { title: L("بتدوّر على إيه؟", "What are you after?") },
    products: {
      primary: {
        // `arena`: the panel's two-word label over the best-seller rail.
        eyebrow: L("الأكثر طلبًا", "Most ordered"),
        // `arena`: the panel's title; `volt`: the title over the quick-buy rows.
        title: L("اختيارات اللعيبة", "Players’ picks"),
        // `arena` only: the panel's line.
        line: L("اللي بيرجعوا يطلبوه تاني: كيبورد، ماوس، سماعة ودراع.", "What players order again: keyboards, mice, headsets and controllers."),
      },
    },
    story: {
      alt: L("مكتب فاتح جنب الشباك عليه شاشة وسماعة على ستاند ودراع", "A light desk by the window with a monitor, a headset on a stand and a controller"),
      eyebrow: L("إزاي بنشتغل", "How we work"),
      title: L("كل قطعة بتتجرب قبل ما تخرج", "Every piece is tested before it ships"),
      text: L(
        "بنوصّل كل كيبورد وماوس وسماعة ونجرّبهم قبل التغليف: الزراير والسنسور والمايك والوايرلس.",
        "We plug in every keyboard, mouse and headset and test it before packing: the keys, the sensor, the mic and the wireless.",
      ),
      cta: L("اعرف حكايتنا", "Our story"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنبعت طلبك لأي محافظة", "We send your order to any governorate") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("ضمان سنة", "One-year warranty"), line: L("على كل كيبورد وماوس وسماعة", "On every keyboard, mouse and headset") },
      { title: L("استرجاع ١٤ يوم", "14-day returns"), line: L("لو القطعة ما ناسبتكش", "If the piece is not right for you") },
    ],
    newsletter: {
      // `arena`: the question over four interest chips (`custom.newsletter-interest-N`).
      title: L("بتلعب على إيه؟", "What do you play on?"),
      line: L("اختار وهنبعتلك الجديد اللي يخص السيت أب بتاعك بس.", "Pick one and we only send new gear for your setup."),
    },
    // `arena`: the footer's sign-off, a few words.
    footer: { line: L("GG، نتقابل الماتش الجاي", "GG. See you next match") },
    about: {
      line: L("محل جيمنج صغير بيختار كل قطعة بيبيعها.", "A small gaming shop that picks every piece it sells."),
      // `arena` shows the dark lounge, `volt` the light desk: both are quiet places to play.
      alt: L("ركن لعب هادي فيه دراعات", "A quiet gaming corner with controllers"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("لعيبة بيختاروا للعيبة", "Players picking for players"),
      text: L(
        "بدأنا لأننا كنا بنتعب عشان نلاقي كيبورد أو سماعة كويسة بسعر معقول. دلوقتي بنجرّب كل قطعة بنفسنا، وما بنبيعش حاجة ما نلعبش بيها.",
        "We started because finding a good keyboard or headset at a fair price was hard work. Now we test every piece ourselves and sell nothing we would not play with.",
      ),
      more: L("ولو محتار ابعتلنا إنت بتلعب إيه ونرشّحلك.", "Not sure? Tell us what you play and we suggest the gear."),
      // `arena`: to the whole catalog; `volt`: to the best sellers. Fits both.
      cta: L("شوف الأدوات", "Browse the gear"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("قولنا بتلعب إيه وعلى أنهي جهاز ونرشّحلك القطعة المناسبة.", "Tell us what you play and on what, and we suggest the right piece."),
      heading: L("اسأل لعيب", "Ask a player"),
    },
    faq: {
      line: L("الضمان والتوصيل والاسترجاع.", "Warranty, delivery and returns."),
      question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
      answer: L(
        "سنة على السويتشات والسنسور والبطارية والكابل. الوقعات والسوايل مش داخلين، ولو فيه عيب صناعة بنبدّلها.",
        "One year on switches, sensors, batteries and cables. Drops and liquid damage are not covered; a manufacturing fault gets a replacement.",
      ),
    },
    custom: {
      // `arena`: three figures the store stands behind (its own terms), each value at most 6 characters.
      "stats-1-value": L("سنة", "1 yr"),
      "stats-1-label": L("ضمان على كل قطعة", "Warranty on every piece"),
      "stats-2-value": L("١٤", "14"),
      "stats-2-label": L("يوم للاسترجاع", "Days to return"),
      "stats-3-value": L("٢٧", "27"),
      "stats-3-label": L("محافظة بنوصلها", "Governorates we deliver to"),
      // `arena`: the video block over a row of products.
      "video-eyebrow": L("تسوق السيت أب", "Shop the setup"),
      "video-title": L("كل اللي على المكتب", "Everything on the desk"),
      "video-alt": L("ماوس وايرلس أبيض على خلفية سودا", "A white wireless mouse on black"),
      // `arena`: the sign-up's four chips, answers to "What do you play on?".
      "newsletter-interest-1": L("كمبيوتر", "PC"),
      "newsletter-interest-2": L("كونسول", "Console"),
      "newsletter-interest-3": L("موبايل", "Mobile"),
      "newsletter-interest-4": L("ستريم", "Streaming"),
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("جيم", "GAME"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("ضمان سنة", "One-year warranty"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللعيبة", "What players say"), related: L("تكمّل السيت أب", "To finish your setup") } },
};
