/**
 * Mahr (template 85, gold by the gram; Claude Design "Storefront
 * Templates"): cream paper, an old gold for actions and a bright gold
 * highlight, Aref Ruqaa headings over Noto Kufi Arabic and tight 4px
 * corners. A gold shop priced by the day: today's gram rates, the most
 * bought pieces, instalments, ways to pay, the shops where you weigh it
 * and questions. The gram rates are typed copy (no live gold feed). Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wedding bands on wood,
 * marble and paper, bangles, chains on a rack, a bracelet in a box, a set in a red
 * box, hoops on a glass tray and a wooden jewellery box. No hands, necks,
 * ears or people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MAHR_KEY = "mahr";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MAHR_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const BEST = "/products?sort=popularity";
const MAPS = "https://maps.google.com/";

const PHOTOS = {
  bands: pexels(37488824, 900),
  hoopsTray: pexels(12753202, 900),
  boxBracelet: pexels(34399114, 900),
  bangles: pexels(37485307, 900),
  redBoxSet: pexels(34399026, 900),
  solitaire: pexels(5009521, 900),
  marbleBands: pexels(30206324, 900),
  chainsRack: pexels(7679824, 900),
  bridalTrio: pexels(21928764, 900),
  woodBox: pexels(16038184),
};

const NAME = L("مهر جولد", "Mahr Gold");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("الدهب بسعر اليوم · توصيل مأمّن", "Gold priced daily · Insured delivery"),
    "الكود: SAVE10": L("جرام ٢١ النهارده: ٣٨٢٠ ج.م", "21K today: EGP 3,820"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("دهب ٢١ و١٨ بسعر جرام النهارده.", "21K and 18K gold priced by today’s gram rate."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مهر جولد. كل الحقوق محفوظة.", "© 2026 Mahr Gold. All rights reserved."),
  },
});

const home: Design[] = [
  lib("stats-band", {
    name: L("سعر النهارده", "Today’s rate"),
    text: {
      "+٢٥ ألف": L("٣٨٢٠ ج.م", "EGP 3,820"),
      "طلب تم توصيله": L("جرام ٢١ النهارده", "21K per gram today"),
      "٢٧": L("٣٢٧٠ ج.م", "EGP 3,270"),
      "محافظة نوصل لها": L("جرام ١٨ النهارده", "18K per gram today"),
      "٤٫٨": L("٠٪", "0%"),
      "متوسط التقييم": L("مصنعية على السبايك", "workmanship on bars"),
      "١٤": L("٧", "7"),
      "يومًا للاسترجاع": L("أيام للاستبدال بالوزن", "days to exchange by weight"),
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر شراءً", "Most bought"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط الشبكة", "Spread the cost"),
      "٣": L("٦", "6"),
      "٦": L("١٢", "12"),
      "١٢": L("١٨", "18"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("بسعر جرام يوم الشراء، من غير فوايد مع شركات التقسيط.", "At the gram rate on the day you buy, interest-free with instalment partners."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("pay-methods", {
    text: {
      "ادفع بالطريقة اللي تريحك": L("ادفع بأمان", "Pay safely"),
      "كاش عند الاستلام": L("كاش في المحل", "Cash in store"),
      "ادفع للمندوب بعد ما تفتح الطلب.": L("ادفع بعد ما توزن القطعة قدامك.", "Pay after the piece is weighed in front of you."),
      "كارت بنكي": L("كارت بنكي", "Bank card"),
      "فيزا وماستركارد وميزة.": L("فيزا وماستركارد وميزة، أونلاين أو في المحل.", "Visa, Mastercard and Meeza, online or in store."),
      "لحد ٢٤ شهر من غير مقدم.": L("لحد ٢٤ شهر بسعر جرام يوم الشراء.", "Up to 24 months at the day’s gram rate."),
      "حوّل من موبايلك في ثانية.": L("حوّل وإحنا نشحن بتوصيل مأمّن.", "Transfer and we ship with insured delivery."),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("المحلات", "Shops"),
      "زورنا": L("اوزنه معانا", "Weigh it with us"),
      "فرع الدقي": L("الصاغة", "El Sagha"),
      "٢٤ شارع التحرير، الدقي": L("شارع الصاغة، القاهرة القديمة", "El Sagha St, Old Cairo"),
      "يوميًا من ١٢ الضهر لـ ١١ م": L("يوميًا من ١١ ص لـ ٩ م", "Daily, 11 am to 9 pm"),
      "فرع مدينة نصر": L("مدينة نصر", "Nasr City"),
      "سيتي ستارز، الدور الأول": L("شارع مكرم عبيد", "Makram Ebeid St"),
      "يوميًا من ١٠ ص لـ ١٠ م": L("يوميًا من ١٢ الضهر لـ ١١ م", "Daily, noon to 11 pm"),
      "فرع المعادي": L("المعادي", "Maadi"),
      "شارع ٩، المعادي": L("شارع ٩، المعادي", "Road 9, Maadi"),
    },
    links: { "https://maps.google.com": MAPS },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("السعر بيتحسب إزاي؟", "How is the price worked out?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "الوزن في سعر جرام النهارده، زائد المصنعية المكتوبة على كل قطعة.",
        "The weight times today’s gram rate, plus the workmanship shown on each piece.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("السعر بيتغير بعد ما أطلب؟", "Does the price change after I order?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("لأ، بنثبت سعر جرام يوم الطلب.", "No, we lock the gram rate on the day you order."),
      "كم يستغرق التوصيل؟": L("التوصيل مأمّن؟", "Is delivery insured?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "أيوه، كل شحنة متأمّن عليها بقيمتها لحد ما توصلك.",
        "Yes, every parcel is insured for its full value until it reaches you.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("فيه دمغة؟", "Is it hallmarked?"),
      "نعم، نوصل لكل محافظات مصر.": L("كل قطعة عليها دمغة مصلحة الدمغة والفاتورة فيها الوزن والعيار.", "Every piece carries the official hallmark, and the invoice lists weight and karat."),
      "ما طرق الدفع المتاحة؟": L("ينفع أبدّل قطعة؟", "Can I exchange a piece?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L("أيوه خلال ٧ أيام بالوزن في أي فرع.", "Yes, within 7 days by weight at any shop."),
      "ما سياسة الاسترجاع؟": L("بتشتروا دهب قديم؟", "Do you buy old gold?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L("أيوه، بسعر جرام النهارده بعد الوزن والفحص في المحل.", "Yes, at today’s gram rate after weighing and testing in store."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مهر", "About Mahr"), L("دهب بالجرام من الصاغة لكل بيت.", "Gold by the gram, from El Sagha to every home.")),
  aboutStory(lib, {
    photo: PHOTOS.woodBox,
    alt: L("علبة خشب فيها حلقان وخواتم وسلاسل دهب", "A wooden box of gold earrings, rings and chains"),
    eyebrow: L("الصاغة", "El Sagha"),
    title: L("الوزن قدامك والسعر بتاع النهارده", "Weighed in front of you, priced for today"),
    text: L("من تلات أجيال في الصاغة: بنوزن كل قطعة قدامك ونحسبها بسعر جرام اليوم.", "Three generations in El Sagha: we weigh every piece in front of you and price it at the day’s gram rate."),
    more: L("وكل فاتورة فيها الوزن والعيار والمصنعية.", "And every invoice lists weight, karat and workmanship."),
    button: L("تسوق الدهب", "Shop gold"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("دهب ٢١ و١٨ بسعر جرام النهارده.", "21K and 18K gold priced by today’s gram rate."),
  categories: [
    ["rings", "خواتم ودبل", "Rings & bands", PHOTOS.bands],
    ["earrings", "حلقان", "Earrings", PHOTOS.hoopsTray],
    ["bracelets", "غوايش", "Bracelets", PHOTOS.bangles],
    ["sets", "أطقم", "Sets", PHOTOS.redBoxSet],
  ],
  products: [
    ["wedding-bands-21k", "rings", "دبل دهب ٢١", "21K Wedding Bands", PHOTOS.bands, 13200, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["hoops-18k", "earrings", "حلق هوب ١٨", "18K Hoop Earrings", PHOTOS.hoopsTray, 7920, { sold90: 120 }],
    ["tennis-bracelet-18k", "bracelets", "غويشة تنس ١٨", "18K Tennis Bracelet", PHOTOS.boxBracelet, 11600, { sold90: 88 }],
    ["engraved-bangles-21k", "bracelets", "غوايش منقوشة ٢١", "21K Engraved Bangles", PHOTOS.bangles, 15400, { sold90: 64 }],
    ["circle-set-18k", "sets", "طقم دواير ١٨", "18K Circle Set", PHOTOS.redBoxSet, 23200, { compareAtPrice: 27200, isFeatured: true, sold90: 31 }],
    ["solitaire-ring-18k", "rings", "خاتم سوليتير ١٨", "18K Solitaire Ring", PHOTOS.solitaire, 9600, { compareAtPrice: 11200, sold90: 52 }],
    ["slim-bands-21k", "rings", "دبل رفيعة ٢١", "21K Slim Bands", PHOTOS.marbleBands, 7600, { sold90: 44 }],
    ["chain-21k", "sets", "سلسلة دهب ٢١", "21K Gold Chain", PHOTOS.chainsRack, 12800, { rating: 4.9, sold90: 70 }],
    ["bridal-ring-trio", "rings", "شبكة ٣ قطع", "Bridal Ring Trio", PHOTOS.bridalTrio, 14500, { inStock: false, sold90: 22 }],
  ],
});

export const MAHR = libraryTemplate({
  key: MAHR_KEY,
  version: 1,
  name: L("مهر", "Mahr"),
  description: L(
    "دهب بالجرام: سعر النهارده، الأكتر شراءً، التقسيط، طرق الدفع، المحلات والأسئلة. أربع صفحات جاهزة.",
    "Gold by the gram: today’s rate, most bought, instalments, ways to pay, the shops and questions. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 850,
  palette: ["#fffdf7", "#f7f0dc", "#f2d16b", "#8a6d1d"],
  colors: {
    primary: "#8a6d1d",
    secondary: "#f7f0dc",
    background: "#fffdf7",
    foreground: "#1f1a0e",
    muted: "#635a42",
    border: "#ece0bd",
    accent: "#f2d16b",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مهر", "About"), seo: { title: L("عن مهر", "About Mahr") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع الصاغة، القاهرة القديمة.", "El Sagha St, Old Cairo."),
        heading: L("اسأل عن قطعة أو سعر النهارده", "Ask about a piece or today’s rate"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("السعر والدمغة والتوصيل.", "Price, hallmark and delivery."),
        question: L("ينفع أبدّل قطعة؟", "Can I exchange a piece?"),
        answer: L("أيوه خلال ٧ أيام بالوزن في أي فرع.", "Yes, within 7 days by weight at any shop."),
      }),
    },
  ],
  demo: DEMO,
});
