/**
 * The one category tree of the section library (P4B-05). The Add panel,
 * search and tests read it from here; nothing else lists categories. The
 * categories, their order and names follow the Claude Design section library
 * (2026-10-19); the Add panel hides a category until it has a design (only the product page, for now).
 */
import type { LibraryCategory, LibraryCategoryId } from "./types";

const sub = (id: string, ar: string, en: string) => ({ id, name: { ar, en } });

export const LIBRARY_CATEGORIES: readonly LibraryCategory[] = [
  {
    id: "headers",
    name: { ar: "الهيدر", en: "Headers" },
    description: { ar: "أول ما يراه العميل في كل صفحة: الشعار والقائمة والسلة.", en: "The first thing shoppers see on every page: logo, menu and cart." },
    icon: "panel-top",
    subcategories: [
      sub("minimal", "بسيط", "Minimal"),
      sub("centered-logo", "شعار في المنتصف", "Centered logo"),
      sub("announcement", "مع شريط إعلان", "Announcement bar"),
      sub("mega-menu", "مع بحث", "With search"),
      sub("commerce", "للمتاجر", "Commerce"),
      sub("floating", "شريط عائم", "Floating bar"),
    ],
  },
  {
    id: "hero",
    name: { ar: "الواجهة الرئيسية", en: "Hero" },
    description: { ar: "افتتاحية الصفحة الرئيسية: حملة أو ملصق أو منتج واحد.", en: "The opening of the home page: a campaign, a poster or one product." },
    icon: "image",
    subcategories: [
      sub("split", "مقسوم", "Split"),
      sub("full-width", "بعرض الصفحة", "Full width"),
      sub("product", "يبرز منتجًا", "Product focused"),
      sub("editorial", "تحريري", "Editorial"),
      sub("sale", "حملة وعرض", "Campaign & sale"),
    ],
  },
  {
    id: "categories",
    name: { ar: "الأقسام", en: "Categories" },
    description: { ar: "مداخل الكتالوج: أقسام متجرك بصورها وروابطها.", en: "Entry points into the catalogue: your categories with images and links." },
    icon: "layout-grid",
    subcategories: [
      sub("grid", "شبكة", "Grid"),
      sub("circles", "دوائر", "Circles"),
      sub("collections", "مجموعات مختارة", "Featured collections"),
      sub("editorial", "بطاقات تحريرية", "Editorial cards"),
    ],
  },
  {
    id: "products",
    name: { ar: "المنتجات", en: "Products" },
    description: { ar: "منتجاتك الحقيقية بصورها وأسعارها وتقييمها.", en: "Your real products with their images, prices and ratings." },
    icon: "shopping-bag",
    subcategories: [
      sub("new-arrivals", "وصل حديثًا", "New arrivals"),
      sub("featured", "مميزة", "Featured"),
      sub("best-sellers", "الأكثر مبيعًا", "Best sellers"),
      sub("shelf", "رف بروابط", "Shelf with links"),
      sub("list", "قائمة مدمجة", "Compact list"),
    ],
  },
  {
    id: "promotions",
    name: { ar: "العروض", en: "Promotions" },
    description: { ar: "عروض ومجموعات وكوبونات وتخفيضات لوقت محدود.", en: "Offers, bundles, coupons and time-limited deals." },
    icon: "ticket-percent",
    subcategories: [
      sub("full-width", "شريط", "Strip"),
      sub("split", "كروت عروض", "Promo cards"),
      sub("countdown", "عد تنازلي", "Countdown"),
      sub("tiles", "مربعات عروض", "Promo tiles"),
      sub("coupon", "كوبون", "Coupon"),
    ],
  },
  {
    id: "features",
    name: { ar: "المميزات", en: "Features" },
    description: { ar: "وعود الخدمة: التوصيل والاسترجاع والضمان والدعم.", en: "Service promises: delivery, returns, warranty and support." },
    icon: "sparkles",
    subcategories: [
      sub("icon-grid", "أيقونات", "Icon grid"),
      sub("benefits-bar", "شريط مزايا", "Benefits bar"),
      sub("image-features", "صورة ومزايا", "Image + features"),
      sub("steps", "خطوات", "Numbered steps"),
    ],
  },
  {
    id: "statistics",
    name: { ar: "الأرقام", en: "Stats" },
    description: { ar: "إثبات بالأرقام: الطلبات والتغطية والتقييم.", en: "Proof in numbers: orders, coverage and rating." },
    icon: "chart-no-axes-column",
    subcategories: [
      sub("counters", "أرقام", "Number counters"),
      sub("trust-badges", "شريط أرقام", "Number strip"),
      sub("stats-content", "أرقام مع محتوى", "Stats + content"),
    ],
  },
  {
    id: "image-text",
    name: { ar: "صورة ونص", en: "Image with text" },
    description: { ar: "قصة المتجر وقيمه وطريقة شغله بصور ونص.", en: "Your story, values and how you work, in photos and text." },
    icon: "book-open",
    subcategories: [sub("story", "القصة", "Story"), sub("values", "الرسالة والقيم", "Mission & values"), sub("rows", "صفوف متبادلة", "Alternating rows")],
  },
  {
    id: "video",
    name: { ar: "فيديو", en: "Video" },
    description: { ar: "عرض منتج أو فتح علبة أو فيلم للعلامة.", en: "Product demos, unboxings and brand films." },
    icon: "video",
    subcategories: [
      sub("wide", "بعرض الصفحة", "Wide"),
      sub("with-text", "فيديو ونص", "With text"),
      sub("cinematic", "سينمائي", "Cinematic"),
      sub("playlist", "قائمة فيديوهات", "Playlist"),
      sub("reels", "ريلز", "Reels"),
    ],
  },
  {
    id: "gallery",
    name: { ar: "معرض صور", en: "Gallery" },
    description: { ar: "صور إنستجرام وصور العملاء واللوكبوك.", en: "Instagram feeds, customer photos and lookbooks." },
    icon: "images",
    subcategories: [
      sub("instagram", "إنستجرام", "Instagram feed"),
      sub("lookbook", "لوكبوك", "Lookbook"),
      sub("customer-photos", "صور العملاء", "Customer photos"),
      sub("strip", "شريط صور", "Photo strip"),
    ],
  },
  {
    id: "brands",
    name: { ar: "الماركات", en: "Brands" },
    description: { ar: "شعارات الماركات التي تبيعها أو من كتبوا عنك.", en: "Logos of the brands you carry or the press that featured you." },
    icon: "badge-check",
    subcategories: [
      sub("logo-grid", "شبكة شعارات", "Logo grid"),
      sub("logo-carousel", "شريط شعارات", "Logo carousel"),
      sub("brand-cards", "بطاقات", "Brand cards"),
      sub("press", "كتبوا عنا", "As seen in"),
    ],
  },
  {
    id: "testimonials",
    name: { ar: "آراء العملاء", en: "Testimonials" },
    description: { ar: "آراء العملاء وتقييماتهم.", en: "What customers say and how they rate you." },
    icon: "message-square-quote",
    subcategories: [
      sub("review-grid", "كروت آراء", "Review cards"),
      sub("carousel", "آراء بالصور", "Photo reviews"),
      sub("quote", "اقتباس مميز", "Featured quote"),
      sub("rating-summary", "ملخص التقييم", "Rating summary"),
    ],
  },
  {
    id: "faq",
    name: { ar: "الأسئلة الشائعة", en: "FAQ" },
    description: { ar: "أسئلة وأجوبة عن الشحن والدفع والاسترجاع.", en: "Questions and answers about shipping, payment and returns." },
    icon: "circle-help",
    subcategories: [
      sub("grouped", "أسئلة بمجموعات", "Grouped"),
      sub("simple", "قائمة بسيطة", "Simple list"),
      sub("side-title", "عنوان جانبي", "Side title"),
      sub("cards", "كروت أجوبة", "Answer cards"),
      sub("help-center", "مركز مساعدة", "Help center"),
    ],
  },
  {
    id: "blog",
    name: { ar: "المدونة", en: "Blog" },
    description: { ar: "مقالات مدونة متجرك.", en: "Articles from your store blog." },
    icon: "newspaper",
    subcategories: [sub("cards", "كروت مقالات", "Post cards"), sub("featured", "مقال مميز", "Featured post"), sub("list", "قائمة عناوين", "Headline list")],
  },
  {
    id: "newsletter",
    name: { ar: "النشرة البريدية", en: "Newsletter" },
    description: { ar: "اشتراك العملاء في عروضك وجديدك.", en: "Let customers sign up for your offers and news." },
    icon: "mail",
    subcategories: [sub("panel", "لوحة اشتراك", "Sign-up panel"), sub("image", "صورة ونموذج", "Photo split"), sub("coupon", "كوبون ترحيب", "Welcome coupon")],
  },
  {
    id: "contact",
    name: { ar: "التواصل والفروع", en: "Contact" },
    description: { ar: "طرق التواصل والعنوان والفروع ومواعيد العمل.", en: "Ways to reach you, your address, branches and hours." },
    icon: "phone",
    subcategories: [
      sub("info", "بيانات التواصل", "Contact info"),
      sub("address", "العنوان والفروع", "Address & branches"),
      sub("whatsapp", "واتساب", "WhatsApp"),
      sub("form", "نماذج", "Forms"),
    ],
  },
  {
    id: "rich-text",
    name: { ar: "نص منسق وسياسات", en: "Rich text & policies" },
    description: { ar: "السياسات والتنبيهات والنصوص الطويلة.", en: "Policies, notices and long-form text." },
    icon: "file-text",
    subcategories: [
      sub("policy", "سياسة", "Policy"),
      sub("notice", "ملاحظة", "Notice"),
      sub("callout", "إعلان ملوّن", "Callout"),
      sub("columns", "عمودين", "Two columns"),
      sub("quote", "اقتباس", "Pull quote"),
    ],
  },
  {
    id: "page-header",
    name: { ar: "عنوان الصفحة والبانر", en: "Page header & banner" },
    description: { ar: "رأس الصفحات الداخلية وصفحات الأقسام.", en: "The header strip of inner pages and category pages." },
    icon: "heading",
    subcategories: [
      sub("title", "عنوان الصفحة", "Page title"),
      sub("category-banner", "بانر القسم", "Category banner"),
      sub("image-banner", "صورة عريضة", "Image banner"),
      sub("subcategories", "أقسام فرعية", "Sub-categories"),
      sub("promo", "بانر بعرض", "Promo header"),
    ],
  },
  {
    id: "product-page",
    name: { ar: "صفحة المنتج", en: "Product page" },
    description: { ar: "أقسام صفحة تفاصيل المنتج.", en: "Sections for the product detail page." },
    icon: "package",
    subcategories: [sub("buy-box", "معرض وشراء", "Gallery & buy box"), sub("details", "التفاصيل", "Details"), sub("upsell", "بيتشروا معاه", "Bought together")],
  },
  {
    id: "footers",
    name: { ar: "الفوتر", en: "Footer" },
    description: { ar: "أسفل كل صفحة: الروابط والتواصل وطرق الدفع.", en: "The bottom of every page: links, contact and payment." },
    icon: "panel-bottom",
    subcategories: [
      sub("minimal", "بسيط", "Minimal"),
      sub("multi-column", "أعمدة", "Multi-column"),
      sub("payment-trust", "في المنتصف", "Centered"),
      sub("newsletter", "مع النشرة", "With sign-up"),
      sub("commerce", "اسم كبير", "Wordmark"),
    ],
  },
];

export function libraryCategory(id: LibraryCategoryId): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => c.id === id);
}
