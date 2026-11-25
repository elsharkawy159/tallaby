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
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace every Pexels photo
 * `arena` draws: the hero, the four tiles, the dark story and the video
 * poster. Still Pexels, drawn by no look: hero tall 13728045, banner
 * 14205160 and the light story 28350931.
 *
 * Looks: `arena` (dark page: its about photo comes from `photos.dark.story`),
 * then `volt`. `arena` shows the 1st category (keyboards) as a carousel. Four featured products: `volt`'s
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
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // a black mechanical keyboard lit violet to lime on a dark mat
  scene("tile-2"), // a black honeycomb mouse side-on, a violet glow behind
  scene("tile-3"), // a black headset with a boom mic on a stand, violet rim light
  scene("tile-4"), // a black gamepad and a desk microphone on a dark mat, a lime edge
];

export const PC_GAMING: Edition = {
  niche: NICHE,
  looks: ["arena"],
  priceBand: { min: 250, max: 6000 },
  // Square packshots on pure white: a square white stage shows each piece whole, and the grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("كليك", "Klik"),
    description: L(
      "لوحات مفاتيح وماوس وسماعات وأذرع تحكم لألعاب الفيديو.",
      "Gaming keyboards, mice, headsets and controllers.",
    ),
    categories: [
      ["keyboards", "لوحات المفاتيح", "Keyboards", TILES[0]!],
      ["mice", "الماوس", "Mice", TILES[1]!],
      ["audio", "السماعات والصوت", "Headsets & audio", TILES[2]!],
      ["desk", "أذرع التحكم وإكسسوارات المكتب", "Controllers & desk gear", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `volt`'s hero (a wide photo reads best there).
    products: [
      ["black-full-size-gaming-keyboard", "keyboards", "لوحة مفاتيح ألعاب كاملة سوداء بمسند", "Black Full-Size Gaming Keyboard with Wrist Rest", shot("black-full-size-gaming-keyboard"), 2450, { isFeatured: true, compareAtPrice: 2800, rating: 4.8, sold90: 176 }],
      ["white-wireless-gaming-mouse", "mice", "ماوس ألعاب لاسلكي أبيض", "White Wireless Gaming Mouse", shot("white-wireless-gaming-mouse"), 1350, { isFeatured: true, compareAtPrice: 1550, rating: 4.7, sold90: 214 }],
      ["black-gaming-headset-boom-mic", "audio", "سماعة ألعاب سوداء بميكروفون", "Black Gaming Headset with Boom Mic", shot("black-gaming-headset-boom-mic"), 1650, { isFeatured: true, rating: 4.7, sold90: 158 }],
      ["black-wireless-gamepad", "desk", "يد تحكم لاسلكية سوداء", "Black Wireless Gamepad", shot("black-wireless-gamepad"), 1450, { isFeatured: true, rating: 4.6, sold90: 189 }],
      ["pink-compact-mechanical-keyboard", "keyboards", "لوحة مفاتيح ميكانيكية صغيرة وردية", "Pink Compact Mechanical Keyboard", shot("pink-compact-mechanical-keyboard"), 1750, { rating: 4.8, sold90: 97 }],
      ["black-honeycomb-lightweight-mouse", "mice", "ماوس خفيف مثقّب أسود", "Black Honeycomb Lightweight Mouse", shot("black-honeycomb-lightweight-mouse"), 1150, { rating: 4.6, sold90: 143 }],
      ["black-red-gaming-headset", "audio", "سماعة ألعاب بالأسود والأحمر", "Black and Red Gaming Headset", shot("black-red-gaming-headset"), 1250, { rating: 4.5, sold90: 201 }],
      ["black-usb-desk-microphone", "desk", "ميكروفون USB مكتبي أسود", "Black USB Desk Microphone", shot("black-usb-desk-microphone"), 1850, { rating: 4.7, sold90: 68 }],
      ["black-mechanical-keyboard-white-keycaps", "keyboards", "لوحة مفاتيح ميكانيكية سوداء بأزرار بيضاء", "Black Mechanical Keyboard with White Keycaps", shot("black-mechanical-keyboard-white-keycaps"), 1950, { rating: 4.7, sold90: 121 }],
      ["black-wired-gaming-mouse", "mice", "ماوس ألعاب سلكي أسود", "Black Wired Gaming Mouse", shot("black-wired-gaming-mouse"), 450, { rating: 4.5, sold90: 327 }],
      ["white-gaming-headset-boom-mic", "audio", "سماعة ألعاب بيضاء بميكروفون", "White Gaming Headset with Boom Mic", shot("white-gaming-headset-boom-mic"), 1750, { rating: 4.8, sold90: 112 }],
      ["black-xl-desk-mousepad", "desk", "لوحة ماوس كبيرة سوداء", "Black Large Desk Mousepad", shot("black-xl-desk-mousepad"), 350, { rating: 4.6, sold90: 288 }],
      ["white-compact-mechanical-keyboard", "keyboards", "لوحة مفاتيح ميكانيكية صغيرة بيضاء", "White Compact Mechanical Keyboard", shot("white-compact-mechanical-keyboard"), 1850, { rating: 4.7, sold90: 104 }],
      ["black-vertical-ergonomic-mouse", "mice", "ماوس عمودي مريح أسود", "Black Vertical Ergonomic Mouse", shot("black-vertical-ergonomic-mouse"), 650, { rating: 4.4, sold90: 76 }],
      ["black-gaming-earbuds-case", "audio", "سماعة أذن لاسلكية للألعاب سوداء", "Black Gaming Earbuds", shot("black-gaming-earbuds-case"), 1100, { compareAtPrice: 1300, rating: 4.5, sold90: 133 }],
      ["black-headset-stand", "desk", "حامل سماعة أسود", "Black Headset Stand", shot("black-headset-stand"), 400, { rating: 4.6, sold90: 95 }],
    ],
  }),
  photos: {
    // `arena`'s full-bleed hero (dark page): a dark desk, a curved monitor that is off and a violet wall glow; the desk sits in the lower third, so the copy reads over the dark wall.
    hero: { wide: scene("hero-wide"), tall: pexels(13728045, 1200) },
    tiles: TILES,
    // A black controller in low red light (it sits in the middle band, so a 21:9 crop keeps it).
    banner: pexels(14205160, 1920),
    // `volt`'s about page (4:5, white page): a light corner desk by the window.
    story: pexels(28350931, 1200),
    // `arena`'s video block poster (16:9): a white mouse and a compact white keyboard on a black mat.
    custom: { "video-poster": scene("video-poster") },
    // `arena`'s page is dark: its about page shows an empty dark game lounge instead.
    dark: { story: scene("story-dark") },
  },
  copy: {
    announcement: [
      L("أدوات ألعاب الفيديو للكمبيوتر وأجهزة الألعاب", "Gaming gear for PC and console"),
      L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن لوحة مفاتيح، ماوس، سماعة…", "Search keyboards, mice, headsets…") },
    hero: {
      alt: L("مكتب ألعاب داكن عليه شاشة منحنية مطفأة وإضاءة بنفسجية على الجدار", "A dark gaming desk with a curved monitor that is off and a violet wall glow"),
      eyebrow: L("أدوات ألعاب الفيديو", "Gaming gear"),
      title: L("جهّز مكتب الألعاب", "Build your setup"),
      line: L(
        "لوحات مفاتيح وماوس وسماعات وأذرع تحكم لألعاب الفيديو.",
        "Keyboards, mice, headsets and controllers for gaming.",
      ),
      // `arena`: the hero's first button, to the whole catalog.
      cta: L("تسوّق الأدوات", "Shop the gear"),
    },
    // `arena`: over the photo tiles; `volt`: over the category chips. Fits both.
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        // `arena`: the panel's two-word label over the best-seller rail.
        eyebrow: L("الأكثر طلبًا", "Most ordered"),
        // `arena`: the panel's title; `volt`: the title over the quick-buy rows.
        title: L("اختيارات اللاعبين", "Players’ picks"),
        // `arena` only: the panel's line.
        line: L("لوحات مفاتيح وماوس وسماعات وأذرع تحكم.", "Keyboards, mice, headsets and controllers."),
      },
    },
    story: {
      alt: L("مكتب فاتح بجوار النافذة عليه شاشة وسماعة على حامل ويد تحكم", "A light desk by the window with a monitor, a headset on a stand and a controller"),
      eyebrow: L("المواصفات", "Specs"),
      title: L("مواصفات واضحة لكل قطعة", "Clear specs for every piece"),
      text: L(
        "نذكر في صفحة كل قطعة نوع الاتصال والأزرار والمستشعر والميكروفون.",
        "Each piece's page lists its connection, keys, sensor and mic.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    trust: [
      { title: L("صور ومواصفات", "Photos and specs"), line: L("لكل منتج", "For every product") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("للكمبيوتر وأجهزة الألعاب", "For PC and console") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      // `arena`: the question over four interest chips (`custom.newsletter-interest-N`).
      title: L("على أي جهاز تلعب؟", "What do you play on?"),
      line: L("اختر جهازك لتصلك أحدث الأدوات الخاصة به فقط.", "Pick one and we only send new gear for it."),
    },
    // `arena`: the footer's sign-off, a few words.
    footer: { line: L("أدوات ألعاب لكل مكتب", "Gaming gear for every desk") },
    about: {
      line: L("متجر لأدوات ألعاب الفيديو، نختار كل قطعة بعناية.", "A gaming gear shop that picks every piece with care."),
      // `arena` shows the dark lounge, `volt` the light desk: both are quiet places to play.
      alt: L("ركن ألعاب هادئ فيه أذرع تحكم", "A quiet gaming corner with controllers"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات مختارة للاعبين", "Gear chosen for players"),
      text: L(
        "نقدّم لوحات مفاتيح وماوس وسماعات وأذرع تحكم للكمبيوتر وأجهزة الألعاب، ونذكر مواصفات كل قطعة في صفحتها.",
        "We offer keyboards, mice, headsets and controllers for PC and console, with each piece's specs on its page.",
      ),
      more: L("ولأي سؤال عن اختيار الأدوات، تواصل معنا.", "For any question about choosing gear, contact us."),
      // `arena`: to the whole catalog; `volt`: to the best sellers. Fits both.
      cta: L("تصفّح الأدوات", "Browse the gear"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي قطعة أو عن الأنسب لجهازك.", "Ask us about any piece or what suits your device."),
      heading: L("اسأل عن منتج", "Ask about a product"),
    },
    faq: {
      line: L("المنتجات والمواصفات وطريقة الطلب.", "Products, specs and ordering."),
      question: L("كيف أعرف أن القطعة تناسب جهازي؟", "How do I know a piece works with my device?"),
      answer: L(
        "نذكر في صفحة كل قطعة الأجهزة المتوافقة معها ونوع الاتصال. ولأي سؤال، تواصل معنا.",
        "Each piece's page lists the devices it works with and its connection type. For any question, contact us.",
      ),
    },
    custom: {
      // `arena`: three figures the store stands behind (its own terms), each value at most 6 characters.
      "stats-1-value": L("٤", "4"),
      "stats-1-label": L("أقسام للأدوات", "Gear categories"),
      "stats-2-value": L("١٦", "16"),
      "stats-2-label": L("قطعة في التشكيلة", "Pieces in the range"),
      "stats-3-value": L("٣", "3"),
      "stats-3-label": L("منصات: كمبيوتر وجهاز ألعاب وهاتف", "Platforms: PC, console, phone"),
      // `arena`: the video block over a row of products.
      "video-eyebrow": L("تسوّق أدوات المكتب", "Shop the setup"),
      "video-title": L("كل ما تحتاجه على المكتب", "Everything on the desk"),
      "video-alt": L("ماوس ولوحة مفاتيح صغيرة بيضاء على لوحة ماوس سوداء", "A white mouse and a compact white keyboard on a black desk mat"),
      // `arena`: the sign-up's four chips, answers to "What do you play on?".
      "newsletter-interest-1": L("كمبيوتر", "PC"),
      "newsletter-interest-2": L("جهاز ألعاب", "Console"),
      "newsletter-interest-3": L("الهاتف", "Mobile"),
      "newsletter-interest-4": L("البث المباشر", "Streaming"),
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("لعب", "GAME"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("مواصفات واضحة لكل قطعة", "Clear specs for every piece"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل مكتب الألعاب", "To finish your setup") } },
};
