/**
 * Sports Luxe (2026-10-28, sports & fitness niche, premium / minimal): chalk
 * paper, deep pine ink and bronze, Noto Kufi Arabic headings over Readex Pro,
 * near-square 4px corners and a wide 1440px container. A quiet private-club
 * home: top bar header, a background video of a dumbbell rack in morning
 * haze, captioned category photos in one row, a featured piece beside the
 * best sellers, the club story on a full-bleed photo, four category rows
 * with portrait cards, an interests newsletter and the ruled footer. Built
 * from section library designs (`fromLibrary`).
 *
 * Edition-ready (ROADMAP F-90): the sections are built by `look(content,
 * journey)` from `DEFAULT_CONTENT`, and with it the look builds exactly its
 * v1 output (`../editions/__fixtures__/sports-luxe.v1.json`).
 *
 * Photos and video: Pexels, each checked by eye at about 2000px
 * (2026-10-28): equipment and empty courts only, no people or hands, no
 * readable brand lettering, none used twice. Video 6389051 (poster: a hex
 * dumbbell rack). About 40371850, about page 29224211. Tiles 8612034,
 * 6010279, 15521639, 18012594, 7011939, 13415390. Products as listed in
 * `DEMO`. QA swaps from the curator's list: 4451119 (stamped brand on a
 * plate) for 4793231; 27810157 (same shoot as 27810161) for 4164763;
 * 7671458 (logo on a slam ball) for 4793229; 27152933 (logo painted on the
 * strings) for 7438726; 29548834 (brand on the handle) for 40034693;
 * 38105639, 35571112, 6076409 and 22028582 (ball and bat brands) for
 * 32602955, 27583688, 17567330 and 38618006; 31200877 (printed lettering on
 * the lantern), 16427495 (same shoot as 17494903) and 6593994 (engraved
 * maker's name) for 40382481, 6271389 and 37270880; 6207527 (same shoot as
 * 6207519) and 6752177 (logo on the mat) for 7690201 and 16513600;
 * 40266598 (shop lettering and people behind a window) for 18953479.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const SPORTS_LUXE_KEY = "sports-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SPORTS_LUXE_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(6389051, "6389051-hd_1920_1080_25fps.mp4"),
  heroPoster: pexelsVideoPoster(6389051),
  clubFloor: pexels(40371850, 1200),
  hexGym: pexels(29224211, 1200),
  // Category tiles.
  catStrength: pexels(8612034, 1200),
  catRacket: pexels(6010279, 1200),
  catBall: pexels(15521639, 1200),
  catCamping: pexels(18012594, 1200),
  catAccessories: pexels(7011939, 1200),
  catCycling: pexels(13415390, 1200),
};

const NAME = L("مدار", "Madar");

/** Madar's own content (the sports gear club shop), copied from v1 character for character. */
const DEFAULT_CONTENT: LookDefaults = {
  announcement: [
    L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    L("ضمان سنة على كل الأجهزة", "One-year guarantee on all gear"),
    L("الدفع عند الاستلام", "Pay on delivery"),
  ],
  labels: { about: L("النادي", "The club") },
  hero: {
    alt: L("رف دمبلز سداسية في ضوء الصبح", "A hex dumbbell rack in the morning light"),
    eyebrow: L("مجموعة الخريف ٢٠٢٦", "Autumn 2026"),
    title: L("تمرين يليق بيك", "Training, refined"),
    line: L(
      "حديد مصبوب، مضارب متوازنة ومعدات رحلات بتعيش سنين. كل قطعة بنجربها في نادينا في الزمالك قبل ما تنزل.",
      "Cast iron, balanced rackets and outdoor gear that lasts for years. We test every piece at our Zamalek club before it joins the range.",
    ),
    cta: L("تسوّق المعدات", "Shop the gear"),
  },
  categories: { title: L("لكل رياضة ركنها", "A corner for every sport") },
  products: { primary: { eyebrow: L("اختيار النادي", "The club’s pick"), title: L("قطعة الموسم", "Piece of the season") } },
  story: {
    alt: L("صالة تدريب هادية فيها أجهزة قوة", "A calm training floor with strength machines"),
    eyebrow: L("نادي مدار", "The Madar club"),
    title: L("بنجرّب قبل ما نبيع", "We train with it before we sell it"),
    text: L(
      "فتحنا مدار في ٢٠١١ كصالة صغيرة في الزمالك. النهارده المدربين بتوعنا بيختاروا كل دمبل ومضرب وخيمة، وبيستخدموها أسابيع في النادي قبل ما تدخل المتجر.",
      "Madar opened in 2011 as a small Zamalek gym. Today our coaches choose every dumbbell, racket and tent, and use it for weeks at the club before it reaches the shop.",
    ),
    cta: L("اعرف النادي", "About the club"),
  },
  newsletter: {
    title: L("بتلعب إيه؟", "What do you play?"),
    line: L(
      "اختار رياضتك، وهنبعتلك المعدات الجديدة وبرنامج تمرين من مدربينا مرة في الشهر.",
      "Pick your sport and we will send new gear and a plan from our coaches, once a month.",
    ),
  },
  footer: {
    line: L(
      `معدات تدريب مختارة لصالة البيت والملعب. ١٧ شارع حسن صبري، الزمالك، القاهرة، ${phone("٠١٢٢ ٧٣١ ٤٨٠٥")}، ${handle("hello@madar.eg")}`,
      `Training gear chosen for the home gym and the court. 17 Hassan Sabri St, Zamalek, Cairo | ${phone("+20 122 731 4805")} | hello@madar.eg`,
    ),
  },
  about: {
    line: L("معدات تدريب مختارة من نادينا في الزمالك، من ٢٠١١.", "Training gear chosen at our Zamalek club, since 2011."),
    alt: L("صالة جيم بإضاءة سداسية في السقف", "A gym under hexagon ceiling lights"),
    eyebrow: L("النادي والمتجر", "Club and shop"),
    title: L("كل قطعة عدّت على مدربينا", "Every piece passed our coaches"),
    text: L(
      "بنجرب الحديد على الأرض، والمضارب في الملعب، والخيم في سيناء. اللي ما يكملش التجربة ما يدخلش المتجر.",
      "We test the iron on the floor, the rackets on court and the tents in Sinai. Whatever fails the test never reaches the shop.",
    ),
    more: L("وكل جهاز معاه ضمان سنة، والصيانة عندنا في النادي.", "Every piece carries a one-year guarantee, with servicing at the club."),
    cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
  },
  contact: {
    title: L("زور النادي أو كلمنا", "Visit the club or call us"),
    line: L(
      `١٧ شارع حسن صبري، الزمالك، القاهرة، ${phone("٠١٢٢ ٧٣١ ٤٨٠٥")}`,
      `17 Hassan Sabri St, Zamalek, Cairo | ${phone("+20 122 731 4805")}`,
    ),
    heading: L("اسأل مدرب عن أي قطعة", "Ask a coach about any piece"),
  },
  faq: {
    line: L("التوصيل والضمان والتجربة.", "Delivery, guarantee and trying gear."),
    question: L("أقدر أجرب المضرب قبل ما أشتري؟", "Can I try a racket before buying?"),
    answer: L(
      "أيوه، احجز ميعاد في النادي في الزمالك وجرّب أي مضرب في الملعب نص ساعة. والتوصيل في القاهرة والجيزة خلال يومين.",
      "Yes. Book a slot at our Zamalek club and try any racket on court for half an hour. Cairo and Giza delivery takes two days.",
    ),
  },
  custom: {
    // The header's and the footer's links to the whole catalog, named for the trade.
    "shop-all": L("كل المعدات", "Shop all"),
    "footer-shop-all": L("كل المعدات", "All gear"),
    // The footer's WhatsApp link: digits with the country code, the same on both sides.
    "phone-digits": L("201227314805", "201227314805"),
    // Four topics the letters cover (one or two words each).
    "newsletter-interest-1": L("صالة البيت", "Home gym"),
    "newsletter-interest-2": L("تنس وبادل", "Tennis & padel"),
    "newsletter-interest-3": L("رحلات وتخييم", "Camping"),
    "newsletter-interest-4": L("نصايح المدربين", "Coach tips"),
  },
  photos: {
    hero: { wide: PHOTOS.heroPoster, video: PHOTOS.heroVideo },
    story: PHOTOS.clubFloor,
    about: PHOTOS.hexGym,
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). Generic shop labels and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-topbar", {
    text: {
      "توصيل سريع لكل محافظات مصر": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تتبّع طلبك": L("تتبّع طلبك", "Track order"),
      "اسم متجرك": name,
      "المتجر": x["shop-all"]!,
      "العروض": L("وصل حديثًا", "New in"),
      "المدونة": L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about!,
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
  });

  const footer = lib("footer-ruled", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "منتجات أصلية بضمان، توصلك لحد البيت.": c.footer.line!,
      "تسوق": L("تسوّق", "Shop"),
      "كل المنتجات": x["footer-shop-all"]!,
      "العروض": L("الأعلى تقييمًا", "Top rated"),
      "المساعدة": L("المساعدة", "Help"),
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [SHOP, NEW, BEST, RATED], "https://wa.me/": `https://wa.me/${x["phone-digits"]!.en}` },
  });

  const home: Design[] = [
    lib("hero-video", {
      photo: [c.photos.hero.wide],
      nodes: { "الفيديو": { props: { url: c.photos.hero.video } }, "التعتيم": { style: { opacity: 35 } } },
      text: {
        "فيديو الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "مساحتك، بطريقتك": c.hero.title,
        "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "شوف الجديد": L("وصل حديثًا", "New in"),
      },
      links: { "/products": SHOP, "/products?sort=newest": NEW },
    }),
    lib("categories-captioned", {
      text: {
        "اكتشف الأقسام": c.categories.title,
        "كل الأقسام": L("الكل", "All"),
        "منتج": L("منتج", "items"),
      },
      // All six categories in one row (the design shows five).
      lists: [{ limit: 6 }],
      nodes: { "الأقسام": { style: { columns: 6 } } },
    }),
    lib("products-feature", {
      text: {
        "اختيارنا ليك": c.products.primary.eyebrow!,
        "اختيار الأسبوع": c.products.primary.title,
      },
      // The featured piece, then the main list (never the same product).
      lists: [undefined, { source: journey.primary }],
    }),
    lib("about-fullbleed", {
      photo: [undefined, undefined, c.photos.story],
      text: {
        "صورة القصة": c.story.alt,
        "حكايتنا": c.story.eyebrow,
        "تفاصيل صغيرة تصنع الفرق": c.story.title,
        "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": c.story.text,
        "اعرف أكثر": c.story.cta,
      },
    }),
    ...categoryRows(lib, {
      viewAll: L("الكل", "All"),
      nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
    }),
    lib("newsletter-interests", {
      text: {
        "إيه اللي يهمك؟": c.newsletter.title,
        "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": c.newsletter.line,
        "وصل حديثًا": x["newsletter-interest-1"]!,
        "العروض": x["newsletter-interest-2"]!,
        "هدايا": x["newsletter-interest-3"]!,
        "نصايح": x["newsletter-interest-4"]!,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.about ?? c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: primaryHref(journey.primary),
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, {
          title: c.contact.title,
          text: c.contact.line,
          heading: c.contact.heading,
        }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, {
          text: c.faq.line,
          question: c.faq.question,
          answer: c.faq.answer,
        }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("معدات تدريب ورياضة مختارة من نادينا في الزمالك.", "Training and sports gear chosen at our Zamalek club."),
  categories: [
    ["strength-training", "تمارين القوة", "Strength", PHOTOS.catStrength],
    ["racket-sports", "رياضات المضرب", "Racket sports", PHOTOS.catRacket],
    ["ball-sports", "رياضات الكرة", "Ball sports", PHOTOS.catBall],
    ["camping", "رحلات وتخييم", "Camping", PHOTOS.catCamping],
    ["training-accessories", "إكسسوارات التمرين", "Accessories", PHOTOS.catAccessories],
    ["cycling", "العجل", "Cycling", PHOTOS.catCycling],
  ],
  products: [
    // Strength
    ["hex-dumbbell-pair-10", "strength-training", "زوج دمبل سداسي ١٠ كجم", "Hex Dumbbell Pair, 10 kg", P(3931367), 2850, { isFeatured: true, rating: 4.9, sold90: 34 }],
    ["iron-plate-20", "strength-training", "طارة حديد ٢٠ كجم", "Iron Plate, 20 kg", P(4793231), 1650, { rating: 4.7, sold90: 41 }],
    ["chrome-plate-dumbbells", "strength-training", "دمبل كروم بطارات", "Chrome Plate Dumbbells", P(669580), 3200, { rating: 4.8, sold90: 29 }],
    ["cast-iron-kettlebell-16", "strength-training", "كيتل بل حديد زهر ١٦ كجم", "Cast Iron Kettlebell, 16 kg", P(27810161), 1950, { rating: 4.9, sold90: 88 }],
    ["adjustable-dumbbell-set", "strength-training", "طقم دمبل قابل للتعديل", "Adjustable Dumbbell Set", P(4793211), 4400, { compareAtPrice: 4900, rating: 4.6, sold90: 37 }],
    ["chrome-dumbbell-rack", "strength-training", "رف دمبل كروم ١-١٠ كجم", "Chrome Dumbbell Rack, 1–10 kg", P(4164763), 14500, { rating: 4.8, sold90: 12 }],
    ["hex-dumbbell-pair-15", "strength-training", "زوج دمبل سداسي ١٥ كجم", "Hex Dumbbell Pair, 15 kg", P(10448088), 3900, { rating: 4.7, sold90: 22 }],
    ["iron-plate-tree", "strength-training", "حامل طارات حديد", "Iron Plate Tree", P(4793229), 6800, { rating: 4.5, sold90: 9, inStock: false }],
    // Racket sports
    ["court-tennis-pair", "racket-sports", "طقم مضربين تنس وكورتين", "Court Tennis Pair", P(32201684), 3600, { isFeatured: true, rating: 4.8, sold90: 46 }],
    ["club-shuttlecock-tube", "racket-sports", "علبة ريش ريشة طائرة", "Club Shuttlecock Tube", P(6742704), 480, { rating: 4.7, sold90: 74 }],
    ["tour-tennis-trio", "racket-sports", "تلات مضارب تنس للنادي", "Tour Tennis Racket Trio", P(8224721), 7900, { rating: 4.6, sold90: 14 }],
    ["classic-table-tennis-set", "racket-sports", "طقم بينج بونج كلاسيك", "Classic Table Tennis Set", P(11891365), 950, { rating: 4.8, sold90: 52 }],
    ["heritage-wood-rackets", "racket-sports", "مضارب خشب هيرتدج", "Heritage Wood Rackets", P(37983095), 2400, { rating: 4.9, sold90: 11 }],
    ["badminton-racket-shuttle", "racket-sports", "مضرب ريشة مع ريشة", "Badminton Racket and Shuttle", P(6922586), 1150, { compareAtPrice: 1300, rating: 4.6, sold90: 27 }],
    ["home-table-tennis-pair", "racket-sports", "مضربين بينج بونج للبيت", "Home Table Tennis Pair", P(40034693), 620, { rating: 4.5, sold90: 31 }],
    ["feather-shuttlecock-trio", "racket-sports", "ريش طبيعي، ٣ قطع", "Feather Shuttlecocks, Set of 3", P(7438726), 290, { rating: 4.7, sold90: 19 }],
    // Ball sports
    ["match-football", "ball-sports", "كورة قدم ماتش", "Match Football", P(12585890), 1250, { rating: 4.8, sold90: 63 }],
    ["indoor-basketball-pair", "ball-sports", "كورتين سلة للصالات", "Indoor Basketball Pair", P(34688570), 2300, { rating: 4.7, sold90: 25 }],
    ["tour-golf-balls", "ball-sports", "كور جولف تور، ٣ قطع", "Tour Golf Balls, Set of 3", P(6572981), 690, { rating: 4.6, sold90: 18 }],
    ["indoor-volleyball", "ball-sports", "كورة طايرة للصالات", "Indoor Volleyball", P(32602955), 980, { rating: 4.8, sold90: 33 }],
    ["street-basketball", "ball-sports", "كورة سلة للشارع", "Street Basketball", P(27583688), 850, { rating: 4.5, sold90: 21 }],
    ["practice-golf-balls", "ball-sports", "كور جولف للتمرين، ٦ قطع", "Practice Golf Balls, Set of 6", P(6573695), 760, { compareAtPrice: 850, rating: 4.7, sold90: 15 }],
    ["court-basketball", "ball-sports", "كورة سلة كلاسيك", "Classic Court Basketball", P(17567330), 1100, { rating: 4.9, sold90: 40 }],
    ["outdoor-basketball", "ball-sports", "كورة سلة للملاعب المفتوحة", "Outdoor Basketball", P(38618006), 790, { rating: 4.4, sold90: 12 }],
    // Camping
    ["black-hurricane-lantern", "camping", "فانوس رياح أسود", "Black Hurricane Lantern", P(30763208), 890, { rating: 4.8, sold90: 39 }],
    ["steel-vacuum-flask", "camping", "ترمس ستانلس ١ لتر", "Steel Vacuum Flask, 1 L", P(29307238), 1150, { rating: 4.9, sold90: 57 }],
    ["brass-pocket-compass", "camping", "بوصلة نحاس بغطا", "Brass Pocket Compass", P(28143581), 650, { rating: 4.7, sold90: 23 }],
    ["tent-oil-lantern", "camping", "فانوس زيت للخيمة", "Tent Oil Lantern", P(17494903), 780, { rating: 4.6, sold90: 17 }],
    ["travel-tumbler", "camping", "مج سفر ستانلس", "Steel Travel Tumbler", P(3887709), 540, { rating: 4.7, sold90: 44 }],
    ["silver-camp-lantern", "camping", "فانوس تخييم فضي", "Silver Camp Lantern", P(40382481), 960, { compareAtPrice: 1100, rating: 4.5, sold90: 13 }],
    ["steel-hiking-compass", "camping", "بوصلة ستانلس للهايكنج", "Steel Hiking Compass", P(37270880), 520, { rating: 4.6, sold90: 20 }],
    ["green-gas-lantern", "camping", "فانوس غاز أخضر", "Green Gas Lantern", P(6271389), 1350, { rating: 4.8, sold90: 10 }],
    // Accessories
    ["grid-foam-roller", "training-accessories", "رول فوم مسنن", "Grid Foam Roller", P(6207519), 690, { rating: 4.7, sold90: 36 }],
    ["speed-jump-rope", "training-accessories", "حبل نط سرعة", "Speed Jump Rope", P(8032841), 390, { rating: 4.8, sold90: 48 }],
    ["insulated-bottle-pair", "training-accessories", "زمزميتين معزولين", "Insulated Bottle Pair", P(7690201), 880, { rating: 4.6, sold90: 22 }],
    ["bumper-plate-15", "training-accessories", "طارة بامبر ١٥ كجم", "Bumper Plate, 15 kg", P(16513600), 2100, { rating: 4.7, sold90: 16 }],
    // Cycling
    ["copper-city-bike", "cycling", "عجلة مدينة نحاسي", "Copper City Bike", P(19353575), 9800, { rating: 4.7, sold90: 8 }],
    ["classic-gents-bike", "cycling", "عجلة كلاسيك رجالي", "Classic Gents Bike", P(37858364), 11500, { rating: 4.8, sold90: 6 }],
    ["green-cargo-bike", "cycling", "عجلة بشنطة أمامية", "Green Front-Crate Bike", P(36463742), 8900, { rating: 4.5, sold90: 5 }],
    ["black-roadster-bike", "cycling", "عجلة رودستر أسود", "Black Roadster Bike", P(18953479), 10200, { rating: 4.6, sold90: 7 }],
  ],
});

export const SPORTS_LUXE = editionTemplate({
  key: SPORTS_LUXE_KEY,
  version: 1,
  name: L("مدار", "Madar"),
  description: L(
    "متجر رياضة راقي بهدوء: فيديو لرف الدمبلز، صور أقسام بعناوين وأربع صفوف للأقسام. لمتاجر المعدات المختارة.",
    "Quiet, premium sports: a dumbbell-rack video, captioned category photos and four category rows. For curated equipment stores.",
  ),
  category: "sports",
  style: ["luxe"],
  sortOrder: 1470,
  palette: ["#f5f4f0", "#e8e6df", "#1c2a26", "#a8874a"],
  colors: {
    primary: "#1c2a26",
    secondary: "#e8e6df",
    background: "#ffffff",
    foreground: "#151a18",
    muted: "#5d645f",
    border: "#d9d6cd",
    accent: "#a8874a",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Readex Pro" },
  radius: 4,
  containerMaxWidth: 1440,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "labels.about",
    "hero.alt",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "story",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.hero.video",
    "photos.story",
    "custom.shop-all",
    "custom.footer-shop-all",
    "custom.phone-digits",
    "custom.newsletter-interest-1",
    "custom.newsletter-interest-2",
    "custom.newsletter-interest-3",
    "custom.newsletter-interest-4",
  ],
  // `photos.about`: the about page's photo (falls back to the story's).
  optional: ["photos.about"],
  // The featured piece beside the best sellers; four category rows in order.
  journey: { primary: "best-sellers", rows: [1, 2, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("آراء أعضاء النادي", "What our members say"), related: L("يكمّل تمرينك", "Completes your training") },
  },
});
