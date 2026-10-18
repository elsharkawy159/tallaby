/**
 * The few fixed strings sections print themselves (everything else is seller
 * content in props). Arabic first; the brand name is طلبي.
 */
import type { SiteLocale } from "../config/schema";
import type { Localized } from "./types";

export const SECTION_COPY = {
  viewAll: { ar: "عرض الكل", en: "View all" },
  noProducts: { ar: "لا توجد منتجات هنا بعد.", en: "No products here yet." },
  noCategories: { ar: "لا توجد أقسام بعد.", en: "No categories yet." },
  outOfStock: { ar: "نفدت الكمية", en: "Out of stock" },
  menu: { ar: "القائمة", en: "Menu" },
  home: { ar: "الرئيسية", en: "Home" },
  contactUs: { ar: "تواصل معنا", en: "Contact us" },
  phone: { ar: "الهاتف", en: "Phone" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  address: { ar: "العنوان", en: "Address" },
  policies: { ar: "السياسات", en: "Policies" },
  followUs: { ar: "تابعنا", en: "Follow us" },
  policyReturn: { ar: "سياسة الاسترجاع", en: "Return policy" },
  policyShipping: { ar: "سياسة الشحن", en: "Shipping policy" },
  policyPrivacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  policyTerms: { ar: "الشروط والأحكام", en: "Terms and conditions" },
  copyright: { ar: "© {year} {store}. جميع الحقوق محفوظة.", en: "© {year} {store}. All rights reserved." },
  pickProduct: { ar: "اختر منتجًا لعرضه هنا.", en: "Choose a product to show here." },
  pickForm: { ar: "اختر نموذجًا لعرضه هنا.", en: "Choose a form to show here." },
  emptyCustom: { ar: "قسم فارغ. أضف عناصر من لوحة الإضافة.", en: "Empty section. Add elements from the Add panel." },
  formSubmit: { ar: "إرسال", en: "Send" },
  formSuccess: { ar: "شكرًا لك! وصلتنا رسالتك وسنتواصل معك قريبًا.", en: "Thank you! We received your message and will get back to you soon." },
  formSelect: { ar: "اختر…", en: "Choose…" },
  noPosts: { ar: "لا توجد مقالات منشورة بعد.", en: "No posts published yet." },
  noItems: { ar: "لا يوجد محتوى منشور هنا بعد.", en: "Nothing published here yet." },
  pickCollection: { ar: "اكتب عنوان المجموعة لعرض محتواها هنا.", en: "Enter a collection address to show its content here." },
  readMore: { ar: "اقرأ المزيد", en: "Read more" },
  allPosts: { ar: "كل المقالات", en: "All posts" },
  minutesRead: { ar: "{n} دقائق قراءة", en: "{n} min read" },
  // Editor-only empty states of dynamic sections (P4B-05); never shown on the storefront.
  emptyProductsTitle: { ar: "أضف منتجات لتظهر هنا", en: "Add products to show here" },
  emptyProductsBody: { ar: "ستظهر منتجاتك في هذا القسم بمجرد إضافتها إلى متجرك.", en: "Your products will appear in this section once you add them to your store." },
  emptyProductsAction: { ar: "إضافة منتجات", en: "Add products" },
  emptyProductsFilteredTitle: { ar: "لا توجد منتجات تطابق هذا الاختيار", en: "No products match this choice" },
  emptyProductsFilteredBody: { ar: "غيّر المصدر أو القسم من إعدادات القسم، أو أضف منتجات تطابقه.", en: "Change the source or category in this section's settings, or add products that match." },
  emptyCategoriesTitle: { ar: "أضف أقسامًا لتظهر هنا", en: "Add categories to show here" },
  emptyCategoriesBody: { ar: "تظهر هنا أقسام منتجاتك تلقائيًا.", en: "The categories of your products appear here automatically." },
  emptyCategoriesAction: { ar: "إضافة أقسام", en: "Add categories" },
  emptyBrandsTitle: { ar: "أضف علامات تجارية لتظهر هنا", en: "Add brands to show here" },
  emptyBrandsBody: { ar: "تظهر هنا العلامات التجارية التي تضيفها لمنتجاتك.", en: "The brands you add to your products appear here." },
  emptyBrandsAction: { ar: "إضافة علامات تجارية", en: "Add brands" },
  emptyReviewsTitle: { ar: "ستظهر تقييمات العملاء هنا", en: "Customer reviews will show here" },
  emptyReviewsBody: { ar: "تظهر التقييمات بعد أن يقيّم المشترون منتجاتك.", en: "Reviews appear after buyers rate your products." },
  emptyReviewsAction: { ar: "إدارة التقييمات", en: "Manage reviews" },
  emptyPromotionsTitle: { ar: "أنشئ عرضًا ليظهر هنا", en: "Create a promotion to show here" },
  emptyPromotionsBody: { ar: "اختر كوبونًا فعالًا لعرض كوده وموعد انتهائه.", en: "Pick an active coupon to show its code and end date." },
  emptyPromotionsAction: { ar: "إنشاء عرض", en: "Create promotion" },
  emptyArticlesTitle: { ar: "أضف مقالات لتظهر هنا", en: "Add articles to show here" },
  emptyArticlesBody: { ar: "تظهر هنا مقالات مدونتك المنشورة تلقائيًا.", en: "Your published blog posts appear here automatically." },
  emptyArticlesAction: { ar: "كتابة مقال", en: "Write an article" },
  emptyStoreInfoTitle: { ar: "أكمل بيانات متجرك", en: "Complete your store information" },
  emptyStoreInfoBody: { ar: "أضف الهاتف أو البريد أو واتساب في إعدادات المتجر لتظهر هنا.", en: "Add a phone, email or WhatsApp number in store settings to show them here." },
  emptyStoreInfoAction: { ar: "إعدادات المتجر", en: "Store settings" },
  emptyNavigationTitle: { ar: "أضف صفحات لتظهر في القائمة", en: "Add navigation links to show here" },
  emptyNavigationBody: { ar: "تظهر صفحات موقعك في القائمة تلقائيًا.", en: "The pages of your site appear in the menu automatically." },
  emptyNavigationAction: { ar: "إدارة الصفحات", en: "Manage pages" },
  emptyFormsTitle: { ar: "اختر نموذجًا ليظهر هنا", en: "Choose a form to show here" },
  emptyFormsBody: { ar: "أنشئ نموذجًا فيه حقل بريد إلكتروني، ثم اختره من إعدادات القسم.", en: "Create a form with an email field, then pick it in this section's settings." },
  emptyFormsAction: { ar: "إنشاء نموذج", en: "Create a form" },
  dataErrorTitle: { ar: "تعذّر تحميل بيانات متجرك", en: "Couldn't load your store data" },
  dataErrorBody: { ar: "تحقق من اتصالك وحاول مرة أخرى. تعديلاتك محفوظة.", en: "Check your connection and try again. Your edits are safe." },
  dataErrorRetry: { ar: "حاول مرة أخرى", en: "Try again" },
  dataLoading: { ar: "جارٍ تحميل بيانات متجرك…", en: "Loading your store data…" },
} as const satisfies Record<string, Localized>;

export type SectionCopyKey = keyof typeof SECTION_COPY;

export function sectionText(key: SectionCopyKey, locale: SiteLocale, values?: Record<string, string | number>): string {
  let text: string = SECTION_COPY[key][locale] ?? SECTION_COPY[key].ar;
  for (const [name, value] of Object.entries(values ?? {})) text = text.replace(`{${name}}`, String(value));
  return text;
}

export function localized(value: Localized, locale: SiteLocale): string {
  return value[locale] ?? value.ar;
}
