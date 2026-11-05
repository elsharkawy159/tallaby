import Link from "next/link";
import { Megaphone, ShoppingBag } from "lucide-react";
import { getLocale, getNow, getTranslations } from "next-intl/server";
import {
  EmptyState,
  ResponsiveTable,
  SellerButton,
  SellerCard,
  SellerCardHeader,
  StatusBadge,
  type BadgeTone,
} from "@/components/seller-ui";
import { formatDate, formatRelativeTime, moneyDir } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { translateStatus } from "@/lib/i18n/status";
import {
  getOrderDisplayNumber,
  resolveCustomerName,
  resolveVendorOrderStatus,
} from "../orders/orders.lib";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { getRecentOrders } from "./home.queries";
import { HeaderLink } from "./home-ui";

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  payment_processing: "warning",
  confirmed: "warning",
  shipping_soon: "info",
  assigned: "info",
  shipped: "info",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "danger",
  failed: "danger",
  refund_requested: "danger",
  refunded: "muted",
  returned: "muted",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function RecentOrdersData() {
  // Names and totals stay hidden until the first top-up (F-68).
  if ((await currentOrderLock()).locked) return null;
  const locale = await getLocale();
  const [orders, t, tStatus, now] = await Promise.all([
    getRecentOrders(locale),
    getTranslations("home.orders"),
    getTranslations("status"),
    getNow(),
  ]);

  // Recent dates read better as "12 minutes ago"; older ones as a date.
  const when = (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    return now.getTime() - date.getTime() < WEEK_MS
      ? formatRelativeTime(date, locale, now)
      : formatDate(date, locale);
  };

  return (
    <SellerCard aria-labelledby="orders-title" className="overflow-hidden">
      <SellerCardHeader
        id="orders-title"
        title={t("title")}
        description={orders.length ? t("description", { count: orders.length }) : undefined}
        action={<HeaderLink href="/orders">{t("viewAll")}</HeaderLink>}
      />
      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          // No orders means nobody to email yet, so this opens the shareable catalog (F-65a).
          action={
            <SellerButton asChild variant="outline" size="sm">
              <Link href="/marketing/catalog">
                <Megaphone aria-hidden />
                {t("promote")}
              </Link>
            </SellerButton>
          }
        />
      ) : (
        <div className="mt-3.5 max-[720px]:mt-2 max-[720px]:border-t max-[720px]:border-(--s-line-soft)">
          <ResponsiveTable
            label={t("title")}
            rows={orders}
            rowKey={(item) => item.id}
            rowHref={(item) => `/orders?order=${item.orderId}`}
            rowLabel={(item) => getOrderDisplayNumber(item)}
            columns={[
              {
                key: "order",
                header: t("table.order"),
                phone: "sub",
                className: "whitespace-nowrap",
                cell: (item) => (
                  <span dir="ltr" className="font-mono text-xs font-semibold text-(--s-link)">
                    {getOrderDisplayNumber(item)}
                  </span>
                ),
              },
              {
                key: "customer",
                header: t("table.customer"),
                phone: "title",
                className: "whitespace-nowrap",
                cell: (item) => {
                  const customer = resolveCustomerName(item.order, t("guest"));
                  return (
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="grid size-[30px] shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink"
                      >
                        {customer.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 truncate min-[721px]:max-w-[190px]">{customer}</span>
                    </span>
                  );
                },
              },
              {
                key: "product",
                header: t("table.product"),
                phone: "hide",
                wideOnly: true,
                className: "max-w-[240px] truncate whitespace-nowrap text-(--s-muted)",
                cell: (item) => (
                  <>
                    {item.productTitle}
                    {item.quantity > 1 && <span className="text-(--s-subtle)"> × {item.quantity}</span>}
                  </>
                ),
              },
              {
                key: "date",
                header: t("table.date"),
                phone: "hide",
                className: "whitespace-nowrap text-(--s-subtle)",
                cell: (item) => when(item.createdAt),
              },
              {
                key: "total",
                header: t("table.total"),
                phone: "end",
                className: "whitespace-nowrap font-bold text-(--s-ink) tabular-nums",
                cell: (item) => (
                  <span dir={moneyDir(locale, { currency: item.order?.currency })}>
                    <Money value={item.total} locale={locale} unit={{ currency: item.order?.currency }} />
                  </span>
                ),
              },
              {
                key: "status",
                header: t("table.status"),
                phone: "endSub",
                className: "whitespace-nowrap",
                cell: (item) => {
                  const status = resolveVendorOrderStatus(item);
                  return (
                    <StatusBadge tone={STATUS_TONE[status] ?? "muted"}>
                      {translateStatus(tStatus, "order", status)}
                    </StatusBadge>
                  );
                },
              },
            ]}
          />
        </div>
      )}
    </SellerCard>
  );
}
