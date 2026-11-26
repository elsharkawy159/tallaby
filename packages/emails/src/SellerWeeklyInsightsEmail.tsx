import { emailDateLocale, emailIntlLocale, type EmailLocale } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  emailFrame,
  EmailShell,
  FooterLines,
  FooterLink,
  H1,
  InlineLink,
  Lead,
  MetaGrid,
  SectionTitle,
  SellerHelpLine,
  Text,
} from "./kit/components.js";

/*
 * Weekly store insights (ROADMAP.md F-113, owner 2026-11-26): activated
 * sellers, once per finished week counted from sign-up; week 1 replaces F-104's
 * first-week email. One section per store: visits (GA4), real orders, sales in
 * the store's currency and the best sellers, each with last week's number.
 * Arabic is what goes out; English exists for the preview.
 */

const copy = {
  ar: {
    subject: "ملخص متجرك الأسبوعي على طلبي",
    heading: "ملخص الأسبوع",
    lead: (from: string, to: string) => `هذا أداء متجرك من ${from} إلى ${to}.`,
    leadFirst: (from: string, to: string) => `هذا أداء متجرك في أول أسبوع لك على طلبي، من ${from} إلى ${to}.`,
    visits: "الزيارات",
    orders: "الطلبات",
    sales: "المبيعات",
    unavailable: "غير متاحة",
    previous: (value: string) => `الأسبوع السابق: ${value}`,
    top: "الأكثر مبيعًا",
    noSales: "لا توجد مبيعات هذا الأسبوع.",
    units: (n: string) => `${n} قطعة`,
    analytics: "عرض تحليلات المتجر",
    visitsNote: "بيانات الزيارات غير متاحة حاليًا.",
    footerReason: "يصلك هذا الملخص كل أسبوع لأنك تاجر على طلبي.",
    optOut: "إيقاف الملخص الأسبوعي",
  },
  en: {
    subject: "Your weekly store summary on Tallaby",
    heading: "Your week",
    lead: (from: string, to: string) => `Here's how your store did from ${from} to ${to}.`,
    leadFirst: (from: string, to: string) => `Here's how your store did in your first week on Tallaby, from ${from} to ${to}.`,
    visits: "Visits",
    orders: "Orders",
    sales: "Sales",
    unavailable: "Not available",
    previous: (value: string) => `Last week: ${value}`,
    top: "Best sellers",
    noSales: "No sales this week.",
    units: (n: string) => `${n} sold`,
    analytics: "View store analytics",
    visitsNote: "Visit data is not available right now.",
    footerReason: "You get this summary every week because you sell on Tallaby.",
    optOut: "Stop the weekly summary",
  },
};

export type WeeklyInsightsPair = { current: number; previous: number | null };

export interface WeeklyInsightsStore {
  name: string;
  analyticsUrl: string;
  /** ISO 4217 code of the store's currency. */
  currency: string;
  /** Null when GA4 couldn't report (shown as "not available", never 0). */
  visits: { current: number | null; previous: number | null } | null;
  orders: WeeklyInsightsPair;
  /** Integer piastres (hundredths). */
  sales: WeeklyInsightsPair;
  topProducts: { name: string; units: number }[];
}

export interface SellerWeeklyInsightsEmailProps {
  locale?: EmailLocale;
  /** First and last Cairo day of the week, `YYYY-MM-DD`. */
  weekStart: string;
  weekLastDay: string;
  /** Week 1 (no week before it to compare with). */
  firstWeek: boolean;
  stores: WeeklyInsightsStore[];
  /** One-click "stop the weekly summary" link (absolute). */
  optOutUrl: string;
}

export function sellerWeeklyInsightsSubject(locale: EmailLocale = "ar") {
  return copy[locale].subject;
}

function formatDay(ymd: string, locale: EmailLocale): string {
  const date = new Date(`${ymd}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return ymd;
  return date.toLocaleDateString(emailDateLocale(locale), { day: "numeric", month: "long", timeZone: "UTC" });
}

/** Piastres as money in the store's currency; EGP reads "1,250 جنيه" in Arabic (owner, 2026-11-06). */
export function formatInsightsMoney(piastres: number, currency: string, locale: EmailLocale): string {
  const amount = Math.trunc(piastres) / 100;
  if (currency === "EGP") {
    const n = new Intl.NumberFormat(emailIntlLocale(locale), { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    return locale === "ar" ? `${n} جنيه` : `EGP ${n}`;
  }
  try {
    return new Intl.NumberFormat(emailIntlLocale(locale), {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function SellerWeeklyInsightsEmail({
  locale = "ar",
  weekStart,
  weekLastDay,
  firstWeek,
  stores,
  optOutUrl,
}: SellerWeeklyInsightsEmailProps) {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const t = copy[locale];
  const numbers = new Intl.NumberFormat(emailIntlLocale(locale));
  const from = formatDay(weekStart, locale);
  const to = formatDay(weekLastDay, locale);
  const lead = firstWeek ? t.leadFirst(from, to) : t.lead(from, to);
  const anyVisitsMissing = stores.some((store) => store.visits === null || store.visits.current === null);

  const value = (main: string, previous: string | null) => (
    <>
      {main}
      {previous !== null && !firstWeek ? (
        <div style={{ fontSize: 12, lineHeight: "18px", fontWeight: 400, color: "#6b7280" }}>{t.previous(previous)}</div>
      ) : null}
    </>
  );

  const footer = (
    <>
      <SellerHelpLine f={f} />
      <FooterLines
        f={f}
        lead={
          <>
            {t.footerReason} <FooterLink href={optOutUrl}>{t.optOut}</FooterLink>
          </>
        }
      />
    </>
  );

  return (
    <EmailShell f={f} audience="seller" title={t.subject} preview={lead} headerMeta={stores[0]?.name} footer={footer}>
      <Block f={f} padding="36px 32px 8px">
        <H1 f={f} flush>
          {t.heading}
        </H1>
        <Lead f={f}>{lead}</Lead>
      </Block>
      {stores.map((store, i) => {
        const visits = store.visits?.current ?? null;
        return (
          <Block key={i} f={f} divider padding="0 32px 24px" last={i === stores.length - 1 && !anyVisitsMissing}>
            <SectionTitle f={f}>{store.name}</SectionTitle>
            <MetaGrid
              f={f}
              marginTop={14}
              items={[
                {
                  label: t.visits,
                  value: value(
                    visits === null ? t.unavailable : numbers.format(visits),
                    visits === null || store.visits?.previous == null ? null : numbers.format(store.visits.previous),
                  ),
                },
                {
                  label: t.orders,
                  value: value(
                    numbers.format(store.orders.current),
                    store.orders.previous === null ? null : numbers.format(store.orders.previous),
                  ),
                },
                {
                  label: t.sales,
                  value: value(
                    formatInsightsMoney(store.sales.current, store.currency, locale),
                    store.sales.previous === null ? null : formatInsightsMoney(store.sales.previous, store.currency, locale),
                  ),
                },
              ]}
            />
            <Text f={f} pad={16}>
              <strong>{t.top}</strong>
            </Text>
            {store.topProducts.length === 0 ? (
              <Text f={f} muted>
                {t.noSales}
              </Text>
            ) : (
              store.topProducts.map((product, j) => (
                <Text key={j} f={f}>
                  {j + 1}. {product.name} · {t.units(numbers.format(product.units))}
                </Text>
              ))
            )}
            <Text f={f} pad={14}>
              <InlineLink f={f} href={store.analyticsUrl}>
                {t.analytics}
              </InlineLink>
            </Text>
          </Block>
        );
      })}
      {anyVisitsMissing ? (
        <Block f={f} padding="0 32px 24px" last>
          <Text f={f} muted size={13}>
            {t.visitsNote}
          </Text>
        </Block>
      ) : null}
    </EmailShell>
  );
}
