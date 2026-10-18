/**
 * The one category tree of the section library (P4B-05). The Add panel,
 * search and tests read it from here; nothing else lists categories.
 */
import type { LibraryCategory, LibraryCategoryId } from "./types";

const sub = (id: string, ar: string, en: string) => ({ id, name: { ar, en } });

export const LIBRARY_CATEGORIES: readonly LibraryCategory[] = [
  {
    id: "headers",
    name: { ar: "الرأس والقائمة", en: "Headers & navigation" },
    description: { ar: "الشعار والقائمة والبحث والسلة.", en: "Logo, menu, search and cart." },
    icon: "panel-top",
    subcategories: [
      sub("minimal", "بسيط", "Minimal"),
      sub("centered-logo", "شعار في المنتصف", "Centered logo"),
      sub("announcement", "مع شريط إعلان", "Announcement bar"),
      sub("mega-menu", "قائمة أقسام", "Mega menu"),
      sub("commerce", "للمتاجر", "Commerce"),
    ],
  },
  {
    id: "hero",
    name: { ar: "الواجهة الرئيسية", en: "Hero" },
    description: { ar: "أول ما يراه العميل: صورة وعنوان وزر.", en: "The first thing customers see: image, title and button." },
    icon: "image",
    subcategories: [
      sub("split", "مقسوم", "Split"),
      sub("full-width", "بعرض الصفحة", "Full width"),
      sub("centered", "في المنتصف", "Centered"),
      sub("product", "يبرز منتجًا", "Product focused"),
      sub("editorial", "تحريري", "Editorial"),
      sub("video", "فيديو وحركة", "Video & motion"),
    ],
  },
  {
    id: "categories",
    name: { ar: "الأقسام والمجموعات", en: "Categories & collections" },
    description: { ar: "أقسام متجرك بصورها وروابطها.", en: "Your store's categories with images and links." },
    icon: "layout-grid",
    subcategories: [
      sub("grid", "شبكة", "Grid"),
      sub("circles", "دوائر", "Circles"),
      sub("carousel", "شريط متحرك", "Carousel"),
      sub("collections", "مجموعات مختارة", "Featured collections"),
      sub("editorial", "بطاقات تحريرية", "Editorial cards"),
    ],
  },
  {
    id: "products",
    name: { ar: "المنتجات", en: "Products" },
    description: { ar: "منتجاتك الحقيقية بالترتيب الذي تختاره.", en: "Your real products, in the order you choose." },
    icon: "shopping-bag",
    subcategories: [
      sub("featured", "مميزة", "Featured"),
      sub("best-sellers", "الأكثر مبيعًا", "Best sellers"),
      sub("new-arrivals", "وصل حديثًا", "New arrivals"),
      sub("trending", "رائجة الآن", "Trending"),
      sub("discounted", "عليها خصم", "Discounted"),
      sub("by-category", "من قسم", "By category"),
      sub("carousel", "شريط متحرك", "Carousel"),
    ],
  },
  {
    id: "product-cards",
    name: { ar: "بطاقات المنتج", en: "Product cards" },
    description: { ar: "شكل بطاقة المنتج داخل أقسام المنتجات.", en: "How each product looks inside product sections." },
    icon: "credit-card",
    subcategories: [
      sub("minimal", "بسيطة", "Minimal"),
      sub("sale", "للتخفيضات", "Sale"),
      sub("quick-actions", "بأزرار سريعة", "Quick actions"),
      sub("rating", "مع التقييم", "With rating"),
      sub("horizontal", "أفقية", "Horizontal"),
      sub("editorial", "تحريرية", "Editorial"),
    ],
  },
  {
    id: "brands",
    name: { ar: "العلامات التجارية", en: "Brands" },
    description: { ar: "شعارات العلامات التي تبيعها.", en: "Logos of the brands you sell." },
    icon: "badge-check",
    subcategories: [sub("logo-grid", "شبكة شعارات", "Logo grid"), sub("logo-carousel", "شريط شعارات", "Logo carousel"), sub("brand-cards", "بطاقات", "Brand cards")],
  },
  {
    id: "promotions",
    name: { ar: "العروض والبانرات", en: "Banners & promotions" },
    description: { ar: "عروضك وكوبوناتك وحملاتك.", en: "Your offers, coupons and campaigns." },
    icon: "ticket-percent",
    subcategories: [
      sub("full-width", "بعرض الصفحة", "Full width"),
      sub("split", "مقسوم", "Split"),
      sub("sale", "حملة تخفيضات", "Sale campaign"),
      sub("countdown", "عد تنازلي", "Countdown"),
      sub("tiles", "مربعات عروض", "Promo tiles"),
    ],
  },
  {
    id: "features",
    name: { ar: "المميزات", en: "Features & benefits" },
    description: { ar: "لماذا يشتري العملاء منك.", en: "Why customers buy from you." },
    icon: "sparkles",
    subcategories: [
      sub("icon-grid", "أيقونات", "Icon grid"),
      sub("benefits-bar", "شريط مزايا", "Benefits bar"),
      sub("image-features", "صورة ومزايا", "Image + features"),
      sub("steps", "خطوات", "Numbered steps"),
    ],
  },
  {
    id: "testimonials",
    name: { ar: "الآراء والتقييمات", en: "Testimonials & reviews" },
    description: { ar: "تقييمات العملاء الحقيقية وآراء تكتبها بنفسك.", en: "Real customer reviews and quotes you write yourself." },
    icon: "message-square-quote",
    subcategories: [
      sub("review-grid", "تقييمات العملاء", "Review grid"),
      sub("carousel", "شريط آراء", "Testimonial carousel"),
      sub("quote", "اقتباس مميز", "Featured quote"),
      sub("rating-summary", "ملخص التقييم", "Rating summary"),
    ],
  },
  {
    id: "about",
    name: { ar: "من نحن", en: "About & brand story" },
    description: { ar: "قصتك وقيمك وفريقك.", en: "Your story, values and team." },
    icon: "book-open",
    subcategories: [sub("story", "القصة", "Brand story"), sub("values", "الرسالة والقيم", "Mission & values"), sub("team", "الفريق والمؤسس", "Team & founder"), sub("timeline", "مسيرتنا", "Timeline")],
  },
  {
    id: "statistics",
    name: { ar: "أرقام وثقة", en: "Statistics & trust" },
    description: { ar: "أرقام وشارات تكتبها بنفسك.", en: "Numbers and badges you enter yourself." },
    icon: "chart-no-axes-column",
    subcategories: [sub("counters", "أرقام", "Number counters"), sub("trust-badges", "شارات ثقة", "Trust badges"), sub("stats-content", "أرقام مع نص", "Stats + content")],
  },
  {
    id: "content",
    name: { ar: "أسئلة ومحتوى", en: "FAQ & content" },
    description: { ar: "أسئلة شائعة ونصوص ومقالات وصور.", en: "FAQs, text, articles and images." },
    icon: "file-text",
    subcategories: [
      sub("faq", "أسئلة شائعة", "FAQ accordion"),
      sub("qa", "سؤال وجواب", "Questions & answers"),
      sub("rich-text", "نص", "Rich text"),
      sub("articles", "مقالات", "Blog & articles"),
      sub("gallery", "معرض صور", "Image gallery"),
    ],
  },
  {
    id: "forms",
    name: { ar: "النشرة والنماذج", en: "Newsletter & lead capture" },
    description: { ar: "اجمع بريد العملاء وطلباتهم.", en: "Collect customer emails and requests." },
    icon: "mail",
    subcategories: [sub("newsletter", "اشتراك بالنشرة", "Newsletter signup"), sub("image-newsletter", "صورة ونشرة", "Image + newsletter"), sub("lead", "نموذج طلب", "Lead forms")],
  },
  {
    id: "contact",
    name: { ar: "التواصل والموقع", en: "Contact & location" },
    description: { ar: "طرق التواصل من إعدادات متجرك.", en: "Ways to reach you, from your store settings." },
    icon: "phone",
    subcategories: [sub("form", "نموذج تواصل", "Contact form"), sub("info", "بيانات التواصل", "Contact info"), sub("address", "العنوان", "Address & map"), sub("whatsapp", "واتساب", "WhatsApp")],
  },
  {
    id: "footers",
    name: { ar: "التذييل", en: "Footers" },
    description: { ar: "أسفل كل صفحة: الروابط والتواصل والدفع.", en: "The bottom of every page: links, contact and payment." },
    icon: "panel-bottom",
    subcategories: [
      sub("minimal", "بسيط", "Minimal"),
      sub("multi-column", "أعمدة", "Multi-column"),
      sub("newsletter", "مع النشرة", "Newsletter"),
      sub("payment-trust", "الدفع والثقة", "Payment & trust"),
      sub("commerce", "للمتاجر", "Rich commerce"),
    ],
  },
];

export function libraryCategory(id: LibraryCategoryId): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => c.id === id);
}
