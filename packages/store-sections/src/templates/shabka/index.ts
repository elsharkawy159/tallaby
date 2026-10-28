/**
 * Shabka (template 44, bridal and engagement gold; Claude Design
 * "Storefront Templates"): ivory paper, a garnet for actions and a gold
 * highlight, Aref Ruqaa headings over Noto Kufi Arabic and sharp 2px
 * corners. A family goldsmith for the shabka (v3, section order): the
 * bridal set beside a quiet panel, the collections in big type, the most
 * chosen pieces, the founder's note, booking a private fitting and
 * questions before you visit. Built from section library designs
 * (`fromLibrary`).
 *
 * Gold is priced per product (no live gram rate) and there is no engraving
 * field.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a bridal set on a shop
 * display, rings on a plinth, diamond hoops on white, a braided bracelet on
 * velvet, bands and earrings in a shop window, a ring stack in a white
 * niche, two bands on old wood, a necklace set in a red box, sculpted studs
 * on a stone disc and a wooden jewellery box. The design's photo of rings
 * on a hand was replaced. No hands, ears, necks or people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SHABKA_KEY = "shabka";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SHABKA_KEY, getDesign(id)!, { corners: 2, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const SETS = search("طقم");

const PHOTOS = {
  bridalSet: pexels(20858959, 900),
  bridalSetWide: pexels(20858959),
  gemRing: pexels(15684127, 900),
  hoops: pexels(20943477, 900),
  braided: pexels(12124662, 900),
  shopBands: pexels(298852, 900),
  stackRings: pexels(30541169, 900),
  woodBands: pexels(37488824, 900),
  redBoxSet: pexels(34399026, 900),
  studs: pexels(12194361, 900),
  woodBox: pexels(16038184),
};

const NAME = L("شبكة جولد", "Shabka Gold");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("احجزي قياس خاص", "Book a private fitting"),
    "الدفع عند الاستلام": L("كروت هدية من ٥٠٠ ج.م", "Gift cards from EGP 500"),
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المجوهرات", "All jewellery"),
    "العروض": L("أطقم الفرح", "Bridal sets"),
    "المدونة": L("محلاتنا", "Our shops"),
  },
  links: { "/products": [undefined, SETS, undefined, undefined, SETS], "/blog": "/contact" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شبكة جولد. كل الحقوق محفوظة.", "© 2026 Shabka Gold. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.bridalSetWide],
    text: {
      "صورة الواجهة": L("طقم شبكة دهب على ستاند عرض", "A bridal gold set on a display stand"),
      "المجموعة الجديدة": L("عرايس ٢٠٢٦", "Bridal 2026"),
      "معمول بكميات صغيرة": L("شبكتك، تختاريها في أوضة هادية", "Your shabka, chosen in a quiet room"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "قياس خاص، والسعر مكتوب على كل قطعة، والحفر مجاناً.",
        "Private fittings, the price on every piece, and engraving included.",
      ),
      "تسوّق المجموعة": L("شوفي أطقم الفرح", "See bridal sets"),
      "حكايتنا": L("احجزي قياس", "Book a fitting"),
    },
    links: { "/products": SETS, "/about": "/contact" },
  }),
  lib("categories-big-type"),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر اختياراً الموسم ده", "Chosen most this season"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("team-founder", {
    text: {
      "عايزين كل حد يشتري من عندنا مرة يرجع تاني من غير ما نفكره.": L(
        "جدتي باعت أول خاتم من صينية في الشارع ده. لسه بنوزن كل قطعة قدامك.",
        "My grandmother sold her first ring from a tray on this street. We still weigh every piece in front of you.",
      ),
      "م": L("س", "S"),
      "منى عادل": L("سامية زكي", "Samia Zaki"),
      "المؤسسة": L("صايغة من الجيل التالت", "Third-generation goldsmith"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجزي قياس خاص", "Book a private fitting"),
      "تركيب شاشة · حوالي ساعة": L("قياس شبكة في خان الخليلي · حوالي ساعة ونص", "Bridal fitting at Khan El Khalili · about 90 minutes"),
      "مواعيد الزيارات": L("المواعيد المتاحة", "Available times"),
      "١٠ ص": L("١٢ الضهر", "12 pm"),
      "١٢ الضهر": L("٢ م", "2 pm"),
      "٢ م": L("٤ م", "4 pm"),
      "٤ م": L("٦ م", "6 pm"),
      "٦ م": L("٨ م", "8 pm"),
      "٨ م": L("٩ م", "9 pm"),
      "من السبت للخميس": L("كل يوم", "Every day"),
      "أو احجز على واتساب": L("أو احجزي على واتساب", "Or book on WhatsApp"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("قبل ما تيجي", "Before you visit"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("لازم أحجز قبل ما آجي؟", "Do I need to book before I come?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "الحجز بيضمنلك أوضة لوحدك وحد فاضي ليكي، بس المحل مفتوح للكل.",
        "Booking gets you a private room and someone free for you, but the shop is open to everyone.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("الحفر بياخد قد إيه؟", "How long does engraving take?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("يومين، ومجاناً على الدبل والخواتم.", "Two days, and free on bands and rings."),
      "كم يستغرق التوصيل؟": L("التوصيل مأمّن؟", "Is delivery insured?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "أيوه، كل شحنة متأمّن عليها بقيمتها لحد ما توصلك.",
        "Yes, every parcel is insured for its full value until it reaches you.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("الفاتورة فيها الوزن؟", "Does the invoice show the weight?"),
      "نعم، نوصل لكل محافظات مصر.": L("أيوه، الوزن والعيار والمصنعية مكتوبين على كل فاتورة.", "Yes, weight, karat and workmanship are on every invoice."),
      "ما طرق الدفع المتاحة؟": L("ينفع أغيّر المقاس؟", "Can I change the size?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L("أيوه، تظبيط مقاس الخاتم مجاناً في أي محل.", "Yes, ring resizing is free at either shop."),
      "ما سياسة الاسترجاع؟": L("ينفع آجي مع العريس؟", "Can I come with the groom?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L("أكيد، والأوضة بتكفي العيلة كلها.", "Of course, and the room fits the whole family."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شبكة جولد", "About Shabka Gold"), L("صايغ عائلي في شارع الصاغة من ٣ أجيال.", "A family goldsmith on El Sagha Street for three generations.")),
  aboutStory(lib, {
    photo: PHOTOS.woodBox,
    alt: L("علبة خشب فيها حلقان وخواتم وسلاسل دهب", "A wooden box of gold earrings, rings and chains"),
    eyebrow: L("الصاغة", "El Sagha"),
    title: L("الوزن قدامك، والشبكة على راحتك", "Weighed in front of you, chosen at your pace"),
    text: L("من ٣ أجيال في شارع الصاغة: بنوزن كل قطعة قدامك، والاختيار في أوضة هادية.", "Three generations on El Sagha Street: we weigh every piece in front of you, and you choose in a quiet room."),
    more: L("والحفر على الدبل مجاناً، وجاهز في يومين.", "And engraving on bands is free, ready in two days."),
    button: L("شوفي أطقم الفرح", "See bridal sets"),
    href: SETS,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("دهب الشبكة والفرح، بالقياس عندنا.", "Engagement and bridal gold, fitted in person."),
  categories: [
    ["sets", "أطقم الفرح", "Bridal sets", PHOTOS.bridalSet],
    ["rings", "خواتم", "Rings", PHOTOS.gemRing],
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "غوايش", "Bracelets", PHOTOS.braided],
    ["bands", "دبل", "Wedding bands", PHOTOS.shopBands],
    ["necklaces", "عقود", "Necklaces", PHOTOS.redBoxSet],
  ],
  products: [
    ["bridal-gold-set-21k", "sets", "طقم شبكة دهب عيار ٢١", "Bridal Gold Set, 21K", PHOTOS.bridalSet, 48500, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["gem-promise-ring", "rings", "خاتم خطوبة بفص", "Gem Promise Ring", PHOTOS.gemRing, 6500, { sold90: 112 }],
    ["engraved-wedding-bands", "bands", "دبل محفورة", "Engraved Wedding Bands", PHOTOS.shopBands, 9800, { rating: 4.8, sold90: 96 }],
    ["diamond-hoop-earrings", "earrings", "حلق هوب ألماظ", "Diamond Hoop Earrings", PHOTOS.hoops, 24900, { isFeatured: true, sold90: 31 }],
    ["rope-chain-bracelet", "bracelets", "غويشة سلسلة مبرومة", "Rope Chain Bracelet", PHOTOS.braided, 18500, { compareAtPrice: 19900, sold90: 45 }],
    ["stacking-ring-set", "rings", "طقم خواتم ستاك", "Stacking Ring Set", PHOTOS.stackRings, 7200, { sold90: 28 }],
    ["classic-bands-21k", "bands", "دبل كلاسيك عيار ٢١", "Classic Bands, 21K", PHOTOS.woodBands, 11800, { sold90: 60 }],
    ["circle-necklace-set", "necklaces", "طقم عقد دواير", "Circle Necklace Set", PHOTOS.redBoxSet, 21500, { sold90: 22 }],
    ["sculpted-studs", "earrings", "حلق منحوت", "Sculpted Studs", PHOTOS.studs, 5400, { inStock: false, sold90: 18 }],
  ],
});

export const SHABKA = libraryTemplate({
  key: SHABKA_KEY,
  version: 3,
  changelog: "Shabka v3: split hero, categories, section order",
  productPage: { surface: "flat", gallery: "end", thumbs: "bottom", button: "outline", band: "brand", extras: ["product-shipping"], copy: { reviews: L("كلمة العرايس والأهل", "Words from brides and families"), related: L("قطع تكمّل الشبكة", "Pieces to complete the set") } },
  name: L("شبكة", "Shabka"),
  description: L(
    "دهب الشبكة والفرح: قياس خاص، هدايا حسب الشخص، الأكتر اختياراً، حجز قياس، كلمة الصايغة، كارت هدية، المحلات والأسئلة. أربع صفحات جاهزة.",
    "Bridal and engagement gold: private fittings, gifts by person, most chosen, a fitting booking, the goldsmith's note, a gift card, the shops and questions. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 440,
  palette: ["#fbf7ef", "#f1e6cf", "#d9b25f", "#7a1f2b"],
  colors: {
    primary: "#7a1f2b",
    secondary: "#f1e6cf",
    background: "#fbf7ef",
    foreground: "#2a1416",
    muted: "#6a5658",
    border: "#e6d8bd",
    accent: "#d9b25f",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شبكة جولد", "About"), seo: { title: L("عن شبكة جولد", "About Shabka Gold") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("شارع الصاغة، خان الخليلي. القياس بالحجز.", "El Sagha St, Khan El Khalili. Fittings by appointment."),
        heading: L("احجزي قياس أو اطلبي كارت هدية", "Book a fitting or order a gift card"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("القياس والحفر والتوصيل.", "Fittings, engraving and delivery."),
        question: L("ينفع أبدّل قطعة؟", "Can I exchange a piece?"),
        answer: L("أيوه خلال ٧ أيام بالوزن في أي محل.", "Yes, within 7 days by weight at either shop."),
      }),
    },
  ],
  demo: DEMO,
});
