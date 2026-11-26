/**
 * Jewelry Luxe (2026-10-28, jewelry niche, premium / minimal): porcelain
 * paper, ink black and champagne gold, Amiri headings over Readex Pro,
 * near-square 2px corners and a wide 1440px container. A quiet, atelier-like
 * home: top bar header, a background video of woven gold wire, portrait
 * category tiles, a grid of the newest pieces (v3; a three-piece spotlight before), the atelier story in an inset
 * photo, four category rows on white studio shots, a centred newsletter and
 * the light centred footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye at full size (2026-10-28,
 * again at 2000px after browser QA): jewelry, brooches, hair accessories,
 * sunglasses and bags on white, marble and linen only, no people or hands,
 * no readable brand or model lettering, none used twice. Video 5815082
 * (poster: woven gold wire on black); spotlight 40179571; about 7248760,
 * about page 11952736; tiles 30541177, 34444210, 12585697, 32988531,
 * 8100398, 29274467, 36367488; products as listed in `DEMO`.
 * Swapped before QA: rings 28843818 (monogram on the box lid), 28843749,
 * 28843820 and 28843819 (one ring box shot five ways); necklaces 12194264,
 * 29502932, 4735895 (near copies) and 26570970 (engraved word); bracelet
 * 34399150 (a hand); sunglasses tile 6127368 (printed page) and 40183053
 * (shirt label). Swapped after QA: watches (dial brand lettering on every
 * clean candidate) became brooches and hair accessories; spotlight 30541188
 * and rings 30541170, 30541175 (one shoot with the rings tile) for
 * 40179571, 14466162 and 12194367; bags 22432991 and 22432985 (embossed
 * logo) for 12640675; sunglasses 29538716 and 27353350 (model numbers on
 * the arms) for 18092127; necklace 860009 (earbuds beside it) for 17833829.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Masa itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 1.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";
import { templatePreview } from "../preview";

export const JEWELRY_LUXE_KEY = "jewelry-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(JEWELRY_LUXE_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(5815082, "5815082-hd_1920_1080_25fps.mp4"),
  heroPoster: pexelsVideoPoster(5815082),
  story: pexels(7248760, 1200),
  aboutPage: pexels(11952736, 1200),
  // Category tiles.
  catRings: pexels(30541177, 1200),
  catNecklaces: pexels(34444210, 1200),
  catEarrings: pexels(12585697, 1200),
  catBracelets: pexels(32988531, 1200),
  catBrooches: pexels(8100398, 1200),
  catSunglasses: pexels(29274467, 1200),
  catBags: pexels(36367488, 1200),
};

const NAME = L("ماسة", "Masa");

/**
 * Masa's own content: what the look is built with when no edition is applied
 * (the template `jewelry-luxe` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The top bar shows two lines (the third place is "Track your order").
  announcement: [L("خواتم وسلاسل وحلقان وأساور", "Rings, necklaces, earrings and bracelets"), L("العيار والوزن موضحان لكل قطعة", "Karat and weight shown for every piece")],
  labels: { about: L("من نحن", "About us") },
  hero: {
    alt: L("سلك ذهب مجدول على خلفية سوداء", "Woven gold wire on black"),
    eyebrow: L("مجموعة الشتاء ٢٠٢٦", "The Winter 2026 collection"),
    title: L("ذهب للارتداء كل يوم", "Gold to wear every day"),
    line: L(
      "ذهب عيار ١٨ وألماس بتشطيب يدوي، مع العيار والوزن لكل قطعة.",
      "18-karat gold and diamonds with a hand finish, with the karat and weight of every piece.",
    ),
    cta: L("اكتشف المجموعة", "Explore the collection"),
  },
  categories: { title: L("تسوّق حسب القطعة", "Shop by piece") },
  products: {
    // The home grid's title (v3; its line is the shop's own for what it shows).
    primary: {
      title: L("قطع مناسبة للإهداء", "Pieces to give as gifts"),
      // The button goes to the best sellers.
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
  },
  story: {
    eyebrow: L("كيف نعمل", "How we work"),
    title: L("العيار والوزن لكل قطعة", "Karat and weight for every piece"),
    text: L(
      "نعرض لكل قطعة العيار والوزن ونوع الأحجار وصورًا واضحة من كل الجهات.",
      "Every piece shows its karat, weight, stones and clear photos from every side.",
    ),
    cta: L("اعرف حكايتنا", "Our story"),
    alt: L("خواتم وسلسلة ذهب في طبق رخام أبيض", "Gold rings and a chain in a white marble dish"),
  },
  newsletter: {
    title: L("كن أول من يعرف بالمجموعات الجديدة", "Hear about new collections first"),
    line: L(
      "رسالة واحدة في الشهر: قطع جديدة ونصائح للعناية بالذهب.",
      "One letter a month: new pieces and tips for caring for gold.",
    ),
    // Optional: the line under the form. Without it the design's own "No spam" line stays.
    note: L("بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
  },
  // Under the footer's logo: what the store is, then its address, phone and email.
  footer: {
    line: L(
      `ذهب وألماس بتصميم هادئ. ٩ شارع حسن صبري، الزمالك، القاهرة · ${phone("٠١٢٧ ٤٠٨ ٥٥١٣")} · ${handle("hello@masa.eg")}`,
      "Quiet gold and diamonds. 9 Hassan Sabry St, Zamalek, Cairo · +20 127 408 5513 · hello@masa.eg",
    ),
  },
  about: {
    line: L("ذهب وألماس بتصميم هادئ.", "Quiet gold and diamonds."),
    alt: L("عقد وحلق وخاتم على قماش دانتيل أبيض", "A necklace, earrings and a ring on white lace"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("قطع مختارة بعناية", "Pieces chosen with care"),
    text: L(
      "نختار الخواتم والسلاسل والحلقان والأساور بعناية، ونعرض العيار والوزن لكل قطعة بوضوح.",
      "We choose rings, necklaces, earrings and bracelets with care and show every piece's karat and weight clearly.",
    ),
    more: L("تواصل معنا لأي سؤال عن المقاسات أو العيار.", "Contact us with any question about sizes or karat."),
    // The button goes to the best sellers.
    cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L("٩ شارع حسن صبري، الزمالك، القاهرة.", "9 Hassan Sabry St, Zamalek, Cairo."),
    heading: L("اسألنا عن المقاس المناسب", "Ask us about the right size"),
  },
  faq: {
    line: L("المقاسات والعيار والعناية.", "Sizing, karat and care."),
    question: L("كيف أعرف مقاس الخاتم؟", "How do I find my ring size?"),
    answer: L(
      "دليل المقاسات موجود في صفحة كل خاتم. وإذا كان لديك سؤال، تواصل معنا.",
      "A size guide is on every ring's page. If you have a question, contact us.",
    ),
  },
  photos: {
    // The poster is drawn first; the video plays over it.
    hero: { wide: PHOTOS.heroPoster, video: PHOTOS.heroVideo },
    // The inset photo of the home story: 4:5 (landscape on phones).
    story: PHOTOS.story,
    // The about page's photo, landscape. Optional: without it the page shows `story`.
    about: PHOTOS.aboutPage,
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New in, Best sellers, Track your order) and the layout stay here; "Shop all"
 * is an optional custom slot.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  // Optional wording a trade may replace: the link to the whole catalog (header, footer and the home grid's "view all").
  const shopAll = c.custom?.["shop-all"] ?? L("كل القطع", "Shop all");
  // What the home grid shows.
  const grid = journey.primary;

  const header = lib("header-topbar", {
    text: {
      "تسوّق سهل من هاتفك": c.announcement[0]!,
      "الدفع عند الاستلام": c.announcement[1]!,
      "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
      "اسم متجرك": name,
      "المتجر": shopAll,
      "العروض": L("وصل حديثًا", "New in"),
      "المدونة": L("الأكثر طلبًا", "Best sellers"),
      "من نحن": c.labels.about,
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
  });

  const footer = lib("footer-centered-light", {
    text: {
      "اسم متجرك": name,
      "قطع مختارة بعناية لكل يوم.": c.footer.line,
      "المتجر": shopAll,
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "https://wa.me/": "https://wa.me/201274085513" },
  });

  const video = c.photos.hero.video;
  const note = c.newsletter.note;
  const home: Design[] = [
    lib("hero-video", {
      photo: [c.photos.hero.wide],
      // Without a video the design shows its poster alone.
      nodes: { ...(video && { "الفيديو": { props: { url: video } } }), "التعتيم": { style: { opacity: 35 } } },
      text: {
        "فيديو الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "تصميم هادئ لكل يوم": c.hero.title,
        "قطع مختارة بعناية لكل يوم.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "اكتشف الجديد": L("وصل حديثًا", "New in"),
      },
      links: { "/products": SHOP, "/products?sort=newest": NEW },
    }),
    lib("categories-photo-tiles", {
      text: { "تسوّق حسب القسم": c.categories.title },
    }),
    // v3: a grid of eight in the three-piece spotlight's place (the fixed home keeps its nine sections).
    lib("products-grid", {
      text: {
        "وصل حديثًا": c.products.primary.title,
        ...(grid === "best-sellers" && { "أحدث المنتجات في المتجر.": L("القطع الأكثر طلبًا في المتجر.", "The store's most ordered pieces.") }),
        ...(grid === "newest" && { "أحدث المنتجات في المتجر.": L("أحدث القطع في المتجر.", "The newest pieces in the store.") }),
        ...(grid === "featured" && { "أحدث المنتجات في المتجر.": L("قطع مختارة من المتجر.", "Pieces picked by the store.") }),
        // Its "view all" is the link to the whole catalog, as the spotlight's was.
        "عرض الكل": shopAll,
      },
      lists: [{ source: grid, limit: 8 }],
    }),
    lib("about-inset", {
      photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, c.photos.story],
      text: {
        "كيف نعمل": c.story.eyebrow,
        "تفاصيل واضحة لكل منتج": c.story.title,
        "نعرض لكل منتج صورًا ومواصفات ومقاسات واضحة.": c.story.text,
        "اعرف أكثر": c.story.cta,
        "صورة المتجر": c.story.alt,
      },
    }),
    // The store's first four categories, in order (`journey.rows` is not read: `categoryRows` makes places 1 to 4).
    ...categoryRows(lib, { viewAll: L("عرض الكل", "View all"), muted: [2, 4] }),
    lib("newsletter-centered", {
      text: {
        "النشرة": L(`رسالة ${name.ar}`, `The ${name.en} letter`),
        "اشترك في نشرتنا البريدية": c.newsletter.title,
        "اشترك لتصلك أخبار المنتجات الجديدة.": c.newsletter.line,
        ...(note && { "بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.": note }),
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
      href: BEST,
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
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("ذهب وألماس بتصميم هادئ.", "Quiet gold and diamonds."),
  categories: [
    ["rings", "الخواتم", "Rings", PHOTOS.catRings],
    ["necklaces", "السلاسل والعقود", "Necklaces", PHOTOS.catNecklaces],
    ["earrings", "الحلقان", "Earrings", PHOTOS.catEarrings],
    ["bracelets", "الأساور", "Bracelets", PHOTOS.catBracelets],
    ["brooches", "البروشات والشعر", "Brooches & hair", PHOTOS.catBrooches],
    ["sunglasses", "النظارات الشمسية", "Sunglasses", PHOTOS.catSunglasses],
    ["bags", "الحقائب", "Bags", PHOTOS.catBags],
  ],
  products: [
    // Rings
    ["rose-solitaire-ring", "rings", "خاتم سوليتير روز جولد", "Rose Gold Solitaire", P(14466162), 34500, { rating: 4.9, sold90: 48 }],
    ["ruby-sunburst-ring", "rings", "خاتم ياقوت بهالة باجيت", "Ruby Sunburst Ring", P(32622561), 54900, { rating: 5, sold90: 12 }],
    ["pave-halo-ring", "rings", "خاتم هالة بافيه", "Pavé Halo Ring", P(28843741), 38500, { compareAtPrice: 42000, rating: 4.8, sold90: 44 }],
    ["aquamarine-cascade-ring", "rings", "خاتم أكوامارين شلال", "Aquamarine Cascade Ring", P(32786084), 21500, { rating: 4.7, sold90: 18 }],
    ["oval-solitaire-set", "rings", "طقم سوليتير بيضاوي", "Oval Solitaire Set", P(30541186), 68500, { rating: 4.9, sold90: 31 }],
    ["sapphire-cluster-ring", "rings", "خاتم صفير كلاستر", "Sapphire Cluster Ring", P(11560352), 32500, { rating: 4.6, sold90: 15 }],
    ["white-gold-solitaires", "rings", "خاتمان من الذهب الأبيض", "White Gold Solitaire Pair", P(13787988), 46900, { rating: 4.8, sold90: 22, inStock: false }],
    ["twin-halo-ring", "rings", "خاتم هالتين دهب", "Twin Halo Ring", P(12194367), 27900, { rating: 4.7, sold90: 27 }],
    // Necklaces
    ["filigree-disc-pendant", "necklaces", "سلسلة بدلاية فيليجري", "Filigree Disc Pendant", P(4735885), 8900, { rating: 4.9, sold90: 63 }],
    ["sunburst-pendant-set", "necklaces", "طقم سلاسل شمس", "Sunburst Pendant Set", P(29502931), 12500, { rating: 4.8, sold90: 38 }],
    ["fine-gold-chain", "necklaces", "سلسلة ذهب رفيعة", "Fine Gold Chain", P(12194263), 6400, { rating: 4.7, sold90: 71 }],
    ["rope-chain-necklace", "necklaces", "سلسلة ذهب مجدولة", "Gold Rope Chain", P(12194343), 11900, { compareAtPrice: 13500, rating: 4.6, sold90: 29 }],
    ["heart-charm-chains", "necklaces", "سلاسل بقلب وتشارمز", "Heart and Charm Chains", P(26791734), 9800, { rating: 4.8, sold90: 33 }],
    ["pave-ring-pendant", "necklaces", "سلسلة بدلاية حلقة بافيه", "Pavé Circle Pendant", P(9149232), 7200, { rating: 4.7, sold90: 25 }],
    ["filigree-necklace-trio", "necklaces", "ثلاث سلاسل فيليجري", "Filigree Necklace Trio", P(4735892), 14900, { rating: 4.9, sold90: 17 }],
    ["starburst-pendant", "necklaces", "سلسلة نجمة بفصوص", "Starburst Pendant", P(17833829), 5600, { rating: 4.5, sold90: 21 }],
    // Earrings
    ["six-prong-studs", "earrings", "حلق سوليتير ستة مخالب", "Six-Prong Diamond Studs", P(28389455), 24500, { rating: 5, sold90: 41 }],
    ["pave-heart-studs", "earrings", "حلق قلب بافيه ذهب", "Gold Pavé Heart Studs", P(29193422), 6900, { rating: 4.8, sold90: 58 }],
    ["sapphire-studs", "earrings", "حلق صفير أزرق", "Blue Sapphire Studs", P(5370643), 15800, { rating: 4.7, sold90: 19 }],
    ["scalloped-hoops", "earrings", "حلق دائري ذهب مموج", "Scalloped Gold Hoops", P(12194363), 9400, { compareAtPrice: 10900, rating: 4.8, sold90: 36 }],
    ["claw-set-stud", "earrings", "حلق ذهب بمخالب", "Gold Claw-Set Stud", P(28389453), 12900, { rating: 4.6, sold90: 14 }],
    ["pearl-heart-earrings", "earrings", "حلق قلب لولي روز", "Rose Gold Pearl Hearts", P(31605846), 4800, { rating: 4.7, sold90: 47 }],
    ["birthstone-studs", "earrings", "طقم حلقان أحجار الميلاد", "Birthstone Stud Set", P(5370641), 7600, { rating: 4.5, sold90: 23 }],
    ["chain-link-hoops", "earrings", "حلق دائري جنزير", "Chunky Link Hoops", P(38909373), 8200, { rating: 4.8, sold90: 30 }],
    // Bracelets
    ["pave-bangle", "bracelets", "غويشة ذهب بافيه", "Gold Pavé Bangle", P(12194309), 26500, { rating: 4.9, sold90: 26 }],
    ["smoky-quartz-bracelet", "bracelets", "أسورة كوارتز مدخن", "Smoky Quartz Bracelet", P(10950896), 2900, { rating: 4.6, sold90: 39 }],
    ["open-wave-cuff", "bracelets", "أسورة ذهب مفتوحة بموجة", "Open Wave Gold Cuff", P(38827915), 13800, { rating: 4.8, sold90: 22 }],
    ["serpent-bracelet", "bracelets", "أسورة ذهب على شكل ثعبان", "Gold Serpent Bracelet", P(34399115), 18900, { isFeatured: true, compareAtPrice: 21500, rating: 4.7, sold90: 18 }],
    ["aqua-pearl-bracelet", "bracelets", "أسورة أكوا ولولي", "Aqua Glass and Pearl Bracelet", P(10197832), 3400, { rating: 4.5, sold90: 27 }],
    ["crystal-leaf-chain", "bracelets", "أسورة جنزير ورق كريستال", "Crystal Leaf Chain Bracelet", P(29502912), 5900, { rating: 4.8, sold90: 33 }],
    ["butterfly-charm-bangle", "bracelets", "غويشة تشارمز فراشة", "Butterfly Charm Bangle", P(10845718), 6700, { rating: 4.7, sold90: 20 }],
    ["onyx-filigree-bracelet", "bracelets", "أسورة فيليجري بالعقيق الأسود", "Onyx Filigree Bracelet", P(15491661), 11500, { rating: 4.9, sold90: 15 }],
    // Brooches & hair
    ["pearl-daisy-brooch", "brooches", "بروش وردة باللولي", "Pearl Daisy Brooch", P(17434770), 9800, { isFeatured: true, rating: 4.9, sold90: 24 }],
    ["pearl-hair-clips", "brooches", "توك شعر باللولي", "Pearl Hair Clips", P(31854724), 1450, { rating: 4.7, sold90: 37 }],
    ["seahorse-pin", "brooches", "بروش حصان البحر ذهب", "Gold Seahorse Pin", P(16262631), 3900, { rating: 4.8, sold90: 16 }],
    ["amber-claw-clip", "brooches", "مشبك شعر كهرماني", "Amber Claw Clip", P(20166054), 650, { rating: 4.6, sold90: 42 }],
    // Sunglasses
    ["classic-square-sunglasses", "sunglasses", "نظارة شمسية مربعة كلاسيكية", "Classic Square Sunglasses", P(26575042), 2400, { rating: 4.7, sold90: 34 }],
    ["round-black-sunglasses", "sunglasses", "نظارة شمسية دائرية سوداء", "Round Black Sunglasses", P(14090246), 2200, { rating: 4.6, sold90: 28 }],
    ["silver-chain-sunglasses", "sunglasses", "نظارة شمسية فضية بسلسلة", "Silver Chain Sunglasses", P(10220086), 3600, { rating: 4.8, sold90: 19 }],
    ["silver-aviators", "sunglasses", "نظارة أفياتور فضية", "Silver Aviators", P(18092127), 2900, { rating: 4.7, sold90: 22 }],
    // Bags
    ["croc-tote-trio", "bags", "حقيبة توت بنقشة التمساح", "Croc-Embossed Tote", P(22434775), 6900, { rating: 4.7, sold90: 21 }],
    ["soft-shopper-pair", "bags", "حقيبة تسوق من الجلد الطري", "Soft Leather Shopper", P(36367484), 5400, { rating: 4.6, sold90: 17 }],
    ["crescent-shoulder-bag", "bags", "حقيبة كتف هلالية بيضاء", "White Crescent Bag", P(12640675), 4800, { isFeatured: true, rating: 4.8, sold90: 26 }],
    ["mini-satchel-set", "bags", "حقيبة ساتشل صغيرة", "Mini Satchel Bag", P(8335273), 3200, { rating: 4.7, sold90: 18 }],
  ],
});

export const JEWELRY_LUXE = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(JEWELRY_LUXE_KEY, "gold-jewelry", { ar: 2812, en: 2812 }),
  key: JEWELRY_LUXE_KEY,
  // v3 (2026-11-16, owner): every home has at least one real products grid (it replaces the three-piece spotlight).
  version: 4,
  changelog: "Jewelry Luxe v3: a products grid on the home",
  name: L("ماسة", "Masa"),
  description: L(
    "مجوهرات فاخرة بهدوء: فيديو دهب، صور ستوديو بيضا وأربع صفوف للأقسام. لمحلات الدهب والألماس الراقية.",
    "Quiet luxury jewelry: a gold video, white studio photos and four category rows. For fine gold and diamond houses.",
  ),
  category: "jewelry",
  style: ["luxe"],
  sortOrder: 1410,
  palette: ["#faf8f4", "#efebe4", "#1c1b19", "#b4935c"],
  colors: {
    primary: "#1c1b19",
    secondary: "#efebe4",
    background: "#ffffff",
    foreground: "#161514",
    muted: "#6a645c",
    border: "#e2dcd2",
    accent: "#b4935c",
  },
  fonts: { heading: "Amiri", body: "Readex Pro" },
  radius: 2,
  containerMaxWidth: 1440,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "labels.about",
    "hero",
    "categories.title",
    "products.primary.title",
    "story",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
  ],
  // `custom.shop-all`: the link to the whole catalog in the header, the footer and the home grid (default "كل القطع / Shop all").
  optional: ["photos.hero.video", "photos.about", "newsletter.note", "custom.shop-all"],
  // The grid shows the newest pieces (v3; the spotlight showed the three featured), then the store's first four categories as rows.
  journey: { primary: "newest", rows: [1, 2, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") },
  },
});
