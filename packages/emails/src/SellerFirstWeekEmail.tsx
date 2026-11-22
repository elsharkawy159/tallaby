import { emailIntlLocale, type EmailLocale } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import { Block, Cta, emailFrame, EmailShell, H1, Lead, MetaGrid, SellerHelpLine, Text } from "./kit/components.js";

const copy = {
  ar: {
    subject: "ملخص أسبوعك الأول على طلبي",
    lead: "إليك أداء متجرك خلال أول سبعة أيام تقويمية من تسجيلك.",
    visits: "زيارات المتجر",
    orders: "الطلبات المستلمة",
    unavailable: "بيانات الزيارات غير متاحة حاليًا.",
    cta: "عرض تحليلات المتجر",
  },
  en: {
    subject: "Your first week on Tallaby",
    lead: "Here’s how your store performed over your first seven calendar days after signing up.",
    visits: "Store visits",
    orders: "Orders received",
    unavailable: "Visit data is currently unavailable.",
    cta: "View store analytics",
  },
};

export interface SellerFirstWeekEmailProps {
  locale?: EmailLocale;
  storeName: string;
  analyticsUrl: string;
  visits: number | null;
  orders: number;
}

export function sellerFirstWeekSubject(locale: EmailLocale = "ar") {
  return copy[locale].subject;
}

export function SellerFirstWeekEmail({ locale = "ar", storeName, analyticsUrl, visits, orders }: SellerFirstWeekEmailProps) {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const t = copy[locale];
  const numbers = new Intl.NumberFormat(emailIntlLocale(locale));
  const metrics = [
    ...(visits === null ? [] : [{ label: t.visits, value: numbers.format(visits), ltr: true }]),
    { label: t.orders, value: numbers.format(orders), ltr: true },
  ];

  return (
    <EmailShell f={f} audience="seller" title={t.subject} preview={t.lead} headerMeta={storeName} footer={<SellerHelpLine f={f} />}>
      <Block f={f} padding="36px 32px" last>
        <H1 f={f} flush>{t.subject}</H1>
        <Lead f={f}>{t.lead}</Lead>
        <MetaGrid f={f} items={metrics} />
        {visits === null ? <Text f={f} muted pad={12}>{t.unavailable}</Text> : null}
        <Cta f={f} href={analyticsUrl} label={t.cta} />
      </Block>
    </EmailShell>
  );
}
