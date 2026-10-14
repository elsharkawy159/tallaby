import Link from "next/link";
import { Megaphone, ShoppingBag } from "lucide-react";
import { getLocale, getNow, getTranslations } from "next-intl/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { formatDate, formatMoney, formatRelativeTime } from "@/lib/i18n/format";
import { translateStatus } from "@/lib/i18n/status";
import {
  getOrderDisplayNumber,
  resolveCustomerName,
  resolveVendorOrderStatus,
} from "../orders/orders.lib";
import { getRecentOrders } from "./home.queries";
import { EmptyState, HeaderLink, HomeCard, HomeCardHeader } from "./home-ui";

type StatusTone = "warning" | "info" | "success" | "danger" | "muted";

const STATUS_TONE: Record<string, StatusTone> = {
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
    <HomeCard aria-labelledby="orders-title" className="overflow-hidden">
      <HomeCardHeader
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
          action={
            <Button asChild variant="neutral" size="sm" className="rounded-[9px]">
              <Link href="/marketing">
                <Megaphone aria-hidden />
                {t("promote")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-3.5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-muted/60 text-xs text-muted-foreground">
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium">{t("table.order")}</th>
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium">{t("table.customer")}</th>
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium max-sm:hidden">{t("table.product")}</th>
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium max-sm:hidden">{t("table.date")}</th>
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium">{t("table.total")}</th>
                <th className="whitespace-nowrap border-y px-5 py-2.5 text-start font-medium">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => {
                const status = resolveVendorOrderStatus(item);
                const customer = resolveCustomerName(item.order, t("guest"));
                const href = `/orders?order=${item.orderId}`;
                return (
                  <tr key={item.id} className="relative border-b last:border-b-0 hover:bg-muted/60">
                    <td className="whitespace-nowrap px-5 py-3">
                      {/* The order number link covers the row for pointer users. */}
                      <Link
                        href={href}
                        dir="ltr"
                        className="font-mono text-xs text-foreground after:absolute after:inset-0 hover:text-primary-ink focus-visible:underline focus-visible:outline-none"
                      >
                        {getOrderDisplayNumber(item)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink"
                          aria-hidden
                        >
                          {customer.trim().charAt(0).toUpperCase()}
                        </span>
                        {customer}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate whitespace-nowrap px-5 py-3 max-sm:hidden">
                      {item.productTitle}
                      {item.quantity > 1 && <span className="text-muted-foreground"> × {item.quantity}</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground max-sm:hidden">
                      {when(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-semibold tabular-nums" dir="ltr">
                      {formatMoney(item.total, locale)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <Badge variant={STATUS_TONE[status] ?? "muted"} className="h-6 gap-1.5 px-2.5 font-medium">
                        <i className="size-1.5 rounded-full bg-current" aria-hidden />
                        {translateStatus(tStatus, "order", status)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </HomeCard>
  );
}
