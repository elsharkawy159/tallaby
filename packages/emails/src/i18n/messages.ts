import type { EmailLocale } from "./locale.js";
import {
  transactionalAr,
  transactionalEn,
  type TransactionalCopy,
} from "./transactional.js";

export interface EmailCommonCopy {
  copyright: string;
  privacy: string;
  terms: string;
  contactPrefix: string;
}

export interface OrderConfirmationCopy {
  preview: string;
  subject: string;
  statusEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  orderNumber: string;
  orderDate: string;
  viewOrder: string;
  items: string;
  qty: string;
  soldBy: string;
  subtotal: string;
  shipping: string;
  discount: string;
  discountWithCoupon: string;
  /** Tallaby Pay fee the customer paid (F-100j). */
  onlinePaymentFee: string;
  onlinePaymentFeeNoRate: string;
  total: string;
  shippingTo: string;
  estimatedDelivery: string;
  payment: string;
  needHelp: string;
  helpReply: string;
  helpTrack: string;
  orderPage: string;
  disclaimer: string;
}

export interface WelcomeCopy {
  preview: string;
  subject: string;
  heroHeading: string;
  heroSubheading: string;
  greeting: string;
  body1: string;
  body2: string;
  offerLabel: string;
  offerDescription: string;
  useCode: string;
  shopNow: string;
  benefitShipping: string;
  benefitReturns: string;
  benefitSecure: string;
  connect: string;
  questions: string;
}

export interface DigitalDeliveryCopy {
  preview: string;
  subject: string;
  greeting: string;
  body: string;
  licenseKey: string;
  accessDownload: string;
  /** The link opens once (F-108c). */
  once: string;
  /** Links made before F-108c, with more than one download. */
  maxDownloads: string;
  expires: string;
  saveFiles: string;
  /** {store}: the store's name, or Tallaby's. */
  needNewLink: string;
  /** Tallaby's name in this language, for a marketplace order. */
  platformName: string;
}

export interface FeeTrialReminderCopy {
  previewT7: string;
  previewT1: string;
  subjectT7: string;
  subjectT1: string;
  greeting: string;
  bodyT7: string;
  bodyT1: string;
  feeNote: string;
  /** {fee}: the order fee in EGP at the live rate ("≈ 1.62 EGP"); sellers never see a dollar price. */
  feeNoteUsd: string;
  /** The same with no amount, when the sender has no rate. */
  feeNoteUsdNoAmount: string;
  cta: string;
}

export interface EmailMessages extends TransactionalCopy {
  common: EmailCommonCopy;
  orderConfirmation: OrderConfirmationCopy;
  welcome: WelcomeCopy;
  digitalDelivery: DigitalDeliveryCopy;
  feeTrialReminder: FeeTrialReminderCopy;
  paymentMethods: Record<string, string>;
}

const en: EmailMessages = {
  ...transactionalEn,
  common: {
    copyright: "© {year} Tallaby. All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    contactPrefix: "Questions? Contact us at",
  },
  orderConfirmation: {
    preview:
      "Order {orderNumber} confirmed — {total}. We'll email you again when it ships.",
    subject: "Order confirmed — #{orderNumber}",
    statusEyebrow: "Order confirmed",
    heroTitle: "Thanks, {name}",
    heroCopy:
      "We've received your order and are getting it ready. A receipt is below — we'll email you again when it ships.",
    orderNumber: "Order number",
    orderDate: "Order date",
    viewOrder: "View your order",
    items: "Items",
    qty: "Qty {quantity} · {unitPrice}",
    soldBy: "Sold by {sellerName}",
    subtotal: "Subtotal",
    shipping: "Shipping",
    discount: "Discount",
    discountWithCoupon: "Discount · {couponCode}",
    onlinePaymentFee: "Online payment fee ({percent}%)",
    onlinePaymentFeeNoRate: "Online payment fee",
    total: "Total",
    shippingTo: "Shipping to",
    estimatedDelivery: "Estimated delivery",
    payment: "Payment",
    needHelp: "Need help with this order?",
    helpReply: "Reply to this email or write to",
    helpTrack: "Track it any time from",
    orderPage: "your order page",
    disclaimer:
      "Transactional confirmation for order #{orderNumber}, sent to {email}.",
  },
  welcome: {
    preview:
      "Welcome to Tallaby! Discover curated collections and enjoy a welcome offer on your first order.",
    subject: "Welcome to Tallaby",
    heroHeading: "Welcome to Tallaby",
    heroSubheading: "Discover carefully curated collections",
    greeting: "Hi {name},",
    body1:
      "We're thrilled to have you join the Tallaby community. From timeless essentials to unique statement pieces, we curate collections that celebrate your individual style.",
    body2:
      "Whether you're looking for everyday staples or something special, we've got you covered.",
    offerLabel: "Exclusive first-time offer",
    offerDescription: "Your first purchase",
    useCode: "Use code:",
    shopNow: "Shop now",
    benefitShipping: "Fast shipping",
    benefitReturns: "Easy returns",
    benefitSecure: "Secure checkout",
    connect: "Connect with us",
    questions: "Questions? Contact us at",
  },
  digitalDelivery: {
    preview: "Your order {orderNumber} is ready to download",
    subject: "Your order #{orderNumber} is ready to download",
    greeting: "Hi {name},",
    body: "Thanks for buying from {store}. Download what you bought from the links below.",
    licenseKey: "License key:",
    accessDownload: "Download",
    once: "This link works once.",
    maxDownloads: "Downloads allowed: {count}.",
    expires: "It expires on {date}.",
    saveFiles: "Save the files to your device after you download them.",
    needNewLink: "If a link doesn't work, contact {store} for a new one.",
    platformName: "Tallaby",
  },
  feeTrialReminder: {
    previewT7: "Your free trial ends in 7 days. No platform fee until {date}.",
    previewT1: "Your free trial ends tomorrow. No platform fee until {date}.",
    subjectT7: "Your Tallaby free trial ends in 7 days",
    subjectT1: "Your Tallaby free trial ends tomorrow",
    greeting: "Hi {name},",
    bodyT7: "Your 7-day free trial ends on {date}. Until then, Tallaby charges no platform fee on your orders.",
    bodyT1: "Your 7-day free trial ends on {date}. Orders placed after that pay the platform fee.",
    feeNote: "The platform fee is a flat EGP 5 per delivered order, taken from your Tallaby wallet.",
    feeNoteUsd: "On the Free plan, the platform fee is {fee} per order, taken from your Tallaby wallet. The Pro plan has no order fee.",
    feeNoteUsdNoAmount: "On the Free plan, a small platform fee per order is taken from your Tallaby wallet. The Pro plan has no order fee.",
    cta: "Open your dashboard",
  },
  paymentMethods: {
    cash: "Cash",
    cash_on_delivery: "Cash on delivery",
    online_payment: "Online payment (card)",
    card: "Card",
    credit_card: "Credit card",
    debit_card: "Debit card",
    wallet: "Wallet",
    bank_transfer: "Bank transfer",
  },
};

const ar: EmailMessages = {
  ...transactionalAr,
  common: {
    copyright: "© {year} طلبي. جميع الحقوق محفوظة.",
    privacy: "الخصوصية",
    terms: "الشروط",
    contactPrefix: "لديك سؤال؟ تواصل معنا عبر",
  },
  orderConfirmation: {
    preview:
      "تم تأكيد الطلب {orderNumber} — {total}. سنرسل لك رسالة أخرى عند الشحن.",
    subject: "تم تأكيد الطلب — #{orderNumber}",
    statusEyebrow: "تم تأكيد الطلب",
    heroTitle: "شكرًا لك، {name}",
    heroCopy:
      "استلمنا طلبك ونجهزه الآن. تفاصيل الفاتورة بالأسفل — وسنراسلُك مرة أخرى عند الشحن.",
    orderNumber: "رقم الطلب",
    orderDate: "تاريخ الطلب",
    viewOrder: "عرض طلبك",
    items: "المنتجات",
    qty: "الكمية {quantity} · {unitPrice}",
    soldBy: "يُباع بواسطة {sellerName}",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    discount: "الخصم",
    discountWithCoupon: "الخصم · {couponCode}",
    onlinePaymentFee: "رسوم الدفع الإلكتروني ({percent}%)",
    onlinePaymentFeeNoRate: "رسوم الدفع الإلكتروني",
    total: "الإجمالي",
    shippingTo: "الشحن إلى",
    estimatedDelivery: "التوصيل المتوقع",
    payment: "طريقة الدفع",
    needHelp: "تحتاج مساعدة في هذا الطلب؟",
    helpReply: "يمكنك الرد على هذه الرسالة أو الكتابة إلى",
    helpTrack: "تابع الطلب في أي وقت من",
    orderPage: "صفحة طلبك",
    disclaimer: "تأكيد معاملات للطلب #{orderNumber}، أُرسل إلى {email}.",
  },
  welcome: {
    preview:
      "مرحبًا بك في طلبي! اكتشف مجموعات مختارة واستفد من عرض الترحيب على طلبك الأول.",
    subject: "مرحبًا بك في طلبي",
    heroHeading: "مرحبًا بك في طلبي",
    heroSubheading: "اكتشف مجموعات مختارة بعناية",
    greeting: "مرحبًا {name}،",
    body1:
      "يسعدنا انضمامك إلى مجتمع طلبي. من القطع الأساسية الخالدة إلى القطع المميزة، نختار مجموعات تحتفي بأسلوبك.",
    body2: "سواء كنت تبحث عن أساسيات يومية أو قطعة مميزة، ستجد ما يناسبك.",
    offerLabel: "عرض حصري لأول طلب",
    offerDescription: "على مشترياتك الأولى",
    useCode: "استخدم الرمز:",
    shopNow: "تسوّق الآن",
    benefitShipping: "شحن سريع",
    benefitReturns: "إرجاع سهل",
    benefitSecure: "دفع آمن",
    connect: "تابعنا",
    questions: "لديك سؤال؟ تواصل معنا عبر",
  },
  digitalDelivery: {
    preview: "طلبك {orderNumber} جاهز للتحميل",
    subject: "طلبك #{orderNumber} جاهز للتحميل",
    greeting: "مرحبًا {name}،",
    body: "شكرًا لشرائك من {store}. يمكنك تحميل مشترياتك من الروابط أدناه.",
    licenseKey: "مفتاح الترخيص:",
    accessDownload: "تحميل",
    once: "يعمل الرابط مرة واحدة فقط.",
    maxDownloads: "عدد مرات التحميل: {count}.",
    expires: "ينتهي في {date}.",
    saveFiles: "احفظ الملفات على جهازك بعد تحميلها.",
    needNewLink: "إذا لم يعمل أحد الروابط، تواصل مع {store} لإرسال رابط جديد.",
    platformName: "طلبي",
  },
  feeTrialReminder: {
    previewT7: "تنتهي تجربتك المجانية بعد 7 أيام. لا رسوم منصة حتى {date}.",
    previewT1: "تنتهي تجربتك المجانية غدًا. لا رسوم منصة حتى {date}.",
    subjectT7: "تنتهي تجربتك المجانية على طلبي بعد 7 أيام",
    subjectT1: "تنتهي تجربتك المجانية على طلبي غدًا",
    greeting: "مرحبًا {name}،",
    bodyT7: "تنتهي تجربتك المجانية لمدة 7 أيام في {date}. وحتى ذلك الوقت لا يحصل طلبي على أي رسوم منصة من طلباتك.",
    bodyT1: "تنتهي تجربتك المجانية لمدة 7 أيام في {date}. الطلبات التي تصل بعد ذلك تُحسب عليها رسوم المنصة.",
    feeNote: "رسوم المنصة 5 جنيهات ثابتة عن كل طلب يتم توصيله، تُخصم من محفظتك على طلبي.",
    feeNoteUsd: "رسوم المنصة في الباقة المجانية {fee} عن كل طلب، تُخصم من محفظتك على طلبي. باقة Pro بدون رسوم طلبات.",
    feeNoteUsdNoAmount: "تُخصم من محفظتك على طلبي رسوم منصة بسيطة عن كل طلب في الباقة المجانية. باقة Pro بدون رسوم طلبات.",
    cta: "افتح لوحة التحكم",
  },
  paymentMethods: {
    cash: "نقدًا",
    cash_on_delivery: "الدفع عند الاستلام",
    online_payment: "دفع إلكتروني (بطاقة)",
    card: "بطاقة",
    credit_card: "بطاقة ائتمان",
    debit_card: "بطاقة خصم",
    wallet: "المحفظة",
    bank_transfer: "تحويل بنكي",
  },
};

const catalog: Record<EmailLocale, EmailMessages> = { en, ar };

export function getEmailMessages(locale: EmailLocale): EmailMessages {
  return catalog[locale] ?? catalog.en;
}

export function formatPaymentMethodLabel(
  method: string | null | undefined,
  locale: EmailLocale,
): string | null {
  if (!method) return null;
  const messages = getEmailMessages(locale);
  const known = messages.paymentMethods[method.toLowerCase()];
  if (known) return known;
  return method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, " ");
}
