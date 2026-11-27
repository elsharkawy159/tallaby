/**
 * Copy of the one-time download page (F-108c), kept here rather than in
 * messages/*.json: the page is plain server HTML outside next-intl.
 * `{store}` is the store's name (or Tallaby's), `{minutes}` the storage
 * link lifetime. Arabic first; both locales have the same keys.
 */
export type DownloadPageLocale = "ar" | "en";

export interface DownloadPageMessages {
  pageTitle: string;
  heading: string;
  from: string;
  files: string;
  download: string;
  getPurchase: string;
  onceNote: string;
  readyHeading: string;
  readyNote: string;
  licenseKey: string;
  openLink: string;
  instructions: string;
  unavailableHeading: string;
  unavailableBody: string;
  errorHeading: string;
  errorBody: string;
  platformName: string;
}

export const DOWNLOAD_PAGE_MESSAGES: Record<DownloadPageLocale, DownloadPageMessages> = {
  ar: {
    pageTitle: "تحميل مشترياتك",
    heading: "مشترياتك جاهزة للتحميل",
    from: "من {store}",
    files: "الملفات",
    download: "تحميل",
    getPurchase: "عرض مشترياتك",
    onceNote: "يعمل هذا الرابط مرة واحدة فقط. بعد الضغط على الزر لن يعمل مرة أخرى، لذلك احفظ الملفات على جهازك.",
    readyHeading: "حمّل ملفاتك الآن",
    readyNote: "تعمل هذه الروابط {minutes} دقيقة فقط، ولن تظهر هذه الصفحة مرة أخرى.",
    licenseKey: "مفتاح الترخيص",
    openLink: "فتح الرابط",
    instructions: "التعليمات",
    unavailableHeading: "هذا الرابط غير متاح",
    unavailableBody: "ربما استُخدم الرابط من قبل أو انتهت صلاحيته. تواصل مع المتجر لإرسال رابط جديد.",
    errorHeading: "تعذّر تجهيز التحميل",
    errorBody: "لم يُستخدم الرابط بعد. حاول مرة أخرى بعد قليل.",
    platformName: "طلبي",
  },
  en: {
    pageTitle: "Download your purchase",
    heading: "Your purchase is ready to download",
    from: "From {store}",
    files: "Files",
    download: "Download",
    getPurchase: "Show my purchase",
    onceNote: "This link works once. After you tap the button it won't open again, so save the files to your device.",
    readyHeading: "Download your files now",
    readyNote: "These links work for {minutes} minutes only, and this page won't show again.",
    licenseKey: "License key",
    openLink: "Open link",
    instructions: "Instructions",
    unavailableHeading: "This link isn't available",
    unavailableBody: "It may have been used already or expired. Contact the store for a new link.",
    errorHeading: "We couldn't prepare your download",
    errorBody: "Your link wasn't used. Please try again in a moment.",
    platformName: "Tallaby",
  },
};
