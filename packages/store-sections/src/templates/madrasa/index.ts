/**
 * Madrasa (template 88, school supplies; Claude Design "Storefront
 * Templates"): white paper, a school blue for actions and a pencil yellow
 * highlight, Alexandria throughout and 12px corners. A back-to-school
 * shop that packs your list: search what is on the list, send your list
 * in four steps, on every list, the starter pack price drop and how to
 * send us your list. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): pencils, ruler and
 * eraser laid flat, coloured pencils, scissors, a kraft notebook, coloured
 * card, lunch boxes, a leather messenger bag, counting and letter blocks
 * and books on a classroom shelf. The design's photo of children was
 * replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MADRASA_KEY = "madrasa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MADRASA_KEY, getDesign(id)!, { corners: 12, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  readers: pexels(8364640, 900),
  countingBlocks: pexels(311268, 900),
  letterBlocks: pexels(1822568, 900),
  messenger: pexels(1152077, 900),
  pencils: pexels(12585758, 900),
  flatLay: pexels(5445610, 900),
  flatLayWide: pexels(5445610),
  scissors: pexels(5412228, 900),
  lunchBoxes: pexels(5971976, 900),
  notebook: pexels(7657381, 900),
  colourCard: pexels(8559022, 900),
};

const NAME = L("مدرسة شوب", "Madrasa Shop");

const header = lib("header-search", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن كتب، شنط، ألوان…", "Search books, bags, colours…"),
    "العروض": L("شنط", "Bags"),
    "هدايا": L("ألوان", "Colours"),
    "إكسسوارات": L("كراسات", "Notebooks"),
    "توصيل خلال ٤٨ ساعة": L("بنجهز لستة المدرسة", "We pack school lists"),
  },
  links: { "/products": [undefined, NEW, BEST, search("شنطة"), search("ألوان"), search("كراسة")] },
});

const footer = lib("footer-help", {
  text: {
    "تتبع طلبك": L("ابعت اللستة", "Send your list"),
    "برقم الطلب": L("صورة ولا كتابة", "A photo or typed"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مدرسة شوب. كل الحقوق محفوظة.", "© 2026 Madrasa Shop. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("إيه اللي في اللستة؟", "What is on the list?"),
      "اكتب اسم المنتج": L("كتاب، شنطة، ألوان", "Book, bag, colours"),
    },
  }),
  lib("categories-big-type", { text: { "الأقسام": L("في الشنطة", "In the bag") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("في كل لستة", "On every list") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("ابعت اللستة", "Send your list"),
      "ابعتلنا على واتساب": L("صوّر اللستة", "Take a photo"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("ابعتلنا صورة لستة المدرسة على واتساب.", "WhatsApp us a photo of the school list."),
      "جهّز المنتج": L("السعر", "The quote"),
      "في علبته الأصلية بكل الإكسسوارات.": L("بنبعتلك الإجمالي في ساعة، وتقدر تشيل أو تزود.", "We send the total within an hour; add or remove anything."),
      "المندوب يستلم": L("التجهيز", "Packing"),
      "خلال يومين شغل من عنوانك.": L("كل حاجة بتتغلف ومتقسمة بالمادة وعليها اسم الطالب.", "Everything is packed by subject and labelled with the pupil’s name."),
      "فلوسك ترجع": L("التوصيل", "Delivery"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("في يومين، وادفع عند الاستلام.", "In two days, and pay at the door."),
    },
  }),
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد الأول": L("قوايم السنة الجديدة", "New school-year lists"),
      "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": L("بنبعتلك أول ما كتب وأدوات الترم الجديد توصل.", "We let you know as soon as next term’s books and supplies arrive."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مدرسة شوب", "About Madrasa Shop"), L("مكتبة أدوات مدرسية في مصر الجديدة.", "A school supplies shop in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLayWide,
    alt: L("أقلام ومسطرة وأستيكة على ورق ملوّن", "Pencils, a ruler and an eraser on coloured paper"),
    eyebrow: L("مصر الجديدة", "Heliopolis"),
    title: L("لستة المدرسة من غير لف", "The school list without the running around"),
    text: L("ابعتلنا اللستة وإحنا نجمّع كل حاجة: كتب وكراسات وألوان وشنط.", "Send us the list and we gather everything: books, notebooks, colours and bags."),
    more: L("وبنغلف كل مادة لوحدها وعليها اسم الطالب.", "And we pack each subject on its own, labelled with the pupil’s name."),
    button: L("تسوق الأدوات", "Shop supplies"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("لستة المدرسة، متجهزة ومتوصلة.", "Back-to-school lists, packed and delivered."),
  categories: [
    ["books", "كتب", "Books", PHOTOS.readers],
    ["learn", "اتعلم والعب", "Learn & play", PHOTOS.countingBlocks],
    ["bags", "شنط", "Bags", PHOTOS.messenger],
    ["stationery", "أدوات", "Stationery", PHOTOS.flatLay],
  ],
  products: [
    ["first-readers-set", "books", "طقم أول قراية", "First Readers Set", PHOTOS.readers, 340, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["counting-blocks", "learn", "مكعبات العد", "Counting Blocks", PHOTOS.countingBlocks, 260, { sold90: 88 }],
    ["school-messenger", "bags", "شنطة مدرسة جلد", "Leather School Messenger", PHOTOS.messenger, 890, { compareAtPrice: 1050, sold90: 40 }],
    ["arabic-letter-blocks", "learn", "مكعبات الحروف", "Letter Blocks", PHOTOS.letterBlocks, 490, { sold90: 72 }],
    ["coloured-pencils-24", "stationery", "ألوان خشب ٢٤ لون", "Coloured Pencils, 24", PHOTOS.pencils, 180, { rating: 4.9, sold90: 240 }],
    ["pencil-ruler-set", "stationery", "طقم أقلام ومسطرة وأستيكة", "Pencil, Ruler & Eraser Set", PHOTOS.flatLay, 120, { isFeatured: true, sold90: 210 }],
    ["kraft-notebook", "stationery", "كراسة كرافت ٦٠ ورقة", "Kraft Notebook, 60 sheets", PHOTOS.notebook, 45, { sold90: 320 }],
    ["colour-card-pack", "stationery", "ورق ألوان ٢٠ لون", "Colour Card Pack, 20", PHOTOS.colourCard, 90, { sold90: 130 }],
    ["scissors-and-clips", "stationery", "مقص ومشابك", "Scissors & Clips", PHOTOS.scissors, 75, { sold90: 95 }],
    ["lunch-box-set", "bags", "طقم علب لانش", "Lunch Box Set", PHOTOS.lunchBoxes, 320, { inStock: false, sold90: 60 }],
  ],
});

export const MADRASA = libraryTemplate({
  key: MADRASA_KEY,
  version: 3,
  changelog: "Madrasa v3: categories after the hero, one list service, newsletter close",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للمستلزمات", "Back to the supplies"), reviews: L("رأي أولياء الأمور", "Parents say"), related: L("أضفه لقائمتك", "Add to your list") } },
  name: L("مدرسة", "Madrasa"),
  description: L(
    "أدوات مدرسية: ابحث في اللستة، ابعت اللستة وفي كل لستة. أربع صفحات جاهزة.",
    "School supplies: search the list, send your list and on every list. Four ready pages.",
  ),
  category: "books",
  sortOrder: 880,
  palette: ["#ffffff", "#eef4ff", "#ffcc00", "#2251cc"],
  colors: {
    primary: "#2251cc",
    secondary: "#eef4ff",
    background: "#ffffff",
    foreground: "#10213f",
    muted: "#4e5d78",
    border: "#d9e5ff",
    accent: "#ffcc00",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مدرسة شوب", "About"), seo: { title: L("عن مدرسة شوب", "About Madrasa Shop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٩ شارع الأهرام، الكوربة، مصر الجديدة.", "9 El Ahram St, Korba, Heliopolis."),
        heading: L("ابعتلنا لستة المدرسة", "Send us your school list"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("اللستة والتجهيز والتوصيل.", "Lists, packing and delivery."),
        question: L("لو حاجة في اللستة مش موجودة؟", "What if something on the list is out of stock?"),
        answer: L("بنقولك قبل التجهيز ونقترح بديل بنفس السعر أو أقل.", "We tell you before packing and suggest an alternative at the same price or less."),
      }),
    },
  ],
  demo: DEMO,
});
