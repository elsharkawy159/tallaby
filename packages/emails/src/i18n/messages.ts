import type { EmailLocale } from "./locale.js";

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
  maxDownloads: string;
  expires: string;
  noExpiration: string;
  findPurchases: string;
  myDigitalProducts: string;
  questions: string;
}

export interface EmailMessages {
  common: EmailCommonCopy;
  orderConfirmation: OrderConfirmationCopy;
  welcome: WelcomeCopy;
  digitalDelivery: DigitalDeliveryCopy;
  paymentMethods: Record<string, string>;
}

const en: EmailMessages = {
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
    preview: "Your digital order {orderNumber} is ready — access it now",
    subject: "Your digital order #{orderNumber} is ready",
    greeting: "Hi {name},",
    body: "Your digital order #{orderNumber} is ready. Your download links and access details are below.",
    licenseKey: "License key:",
    accessDownload: "Access / Download",
    maxDownloads: "Up to {count} downloads.",
    expires: "Link expires {date}.",
    noExpiration: "No expiration.",
    findPurchases: "You can always find your purchases under",
    myDigitalProducts: "My Digital Products",
    questions: "Questions? Contact us at",
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
  common: {
    copyright: "© {year} تلابي. جميع الحقوق محفوظة.",
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
      "مرحبًا بك في تلابي! اكتشف مجموعات مختارة واستفد من عرض الترحيب على طلبك الأول.",
    subject: "مرحبًا بك في تلابي",
    heroHeading: "مرحبًا بك في تلابي",
    heroSubheading: "اكتشف مجموعات مختارة بعناية",
    greeting: "مرحبًا {name}،",
    body1:
      "يسعدنا انضمامك إلى مجتمع تلابي. من القطع الأساسية الخالدة إلى القطع المميزة، نختار مجموعات تحتفي بأسلوبك.",
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
    preview: "طلبك الرقمي {orderNumber} جاهز — يمكنك الوصول إليه الآن",
    subject: "طلبك الرقمي #{orderNumber} جاهز",
    greeting: "مرحبًا {name}،",
    body: "طلبك الرقمي #{orderNumber} جاهز. روابط التحميل وتفاصيل الوصول أدناه.",
    licenseKey: "مفتاح الترخيص:",
    accessDownload: "الوصول / التحميل",
    maxDownloads: "حتى {count} تحميلات.",
    expires: "ينتهي الرابط في {date}.",
    noExpiration: "بدون تاريخ انتهاء.",
    findPurchases: "يمكنك دائمًا العثور على مشترياتك من",
    myDigitalProducts: "منتجاتي الرقمية",
    questions: "لديك سؤال؟ تواصل معنا عبر",
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
  locale: EmailLocale
): string | null {
  if (!method) return null;
  const messages = getEmailMessages(locale);
  const known = messages.paymentMethods[method.toLowerCase()];
  if (known) return known;
  return method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, " ");
}
