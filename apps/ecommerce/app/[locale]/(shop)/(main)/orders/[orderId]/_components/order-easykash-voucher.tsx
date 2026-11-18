import { db, eq, orders } from "@workspace/db";
import { EASYKASH_CASH_EXPIRY_HOURS } from "@workspace/lib/easykash";
import { getEasykashVoucher } from "@workspace/lib/payments/store-gateways/server";
import { Card, CardContent } from "@workspace/ui/components/card";
import { getTranslations } from "next-intl/server";
import { OrderVoucherCopy } from "./order-voucher-copy.client";

/**
 * The Fawry / Aman payment number of an unpaid EasyKash cash payment
 * (ROADMAP.md F-98e, docs/easykash.md §4.4). Server-only and uncached
 * (CLAUDE.md rule 8). Render it ONLY after the viewer has been authorised
 * for this order (getOrderConfirmationData succeeded): the voucher is read
 * through EasyKash's Inquiry API with the seller's key, never from the return
 * URL's query. Any failure renders nothing.
 */
export async function OrderEasykashVoucher({ orderId }: { orderId: string }) {
  const voucher = await db.query.orders
    .findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        storeId: true,
        currency: true,
        metadata: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        depositStatus: true,
        depositAmount: true,
      },
    })
    .then((order) => (order ? getEasykashVoucher(order) : null))
    .catch((error: unknown) => {
      console.error("[order-easykash-voucher] failed", (error as Error)?.name);
      return null;
    });
  if (!voucher) return null;

  const t = await getTranslations("orders.easykashVoucher");
  return (
    <Card className="rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50/60">
      <CardContent className="space-y-3 py-3 md:py-4 text-xs md:text-sm text-amber-900">
        <p className="font-semibold text-sm md:text-base">{t("title")}</p>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-gray-500">{t("label")}</p>
            <bdi dir="ltr" className="block truncate font-mono text-xl md:text-2xl font-bold tracking-wider text-gray-900">
              {voucher.voucher}
            </bdi>
          </div>
          <OrderVoucherCopy value={voucher.voucher} />
        </div>
        <p>{t("howTo")}</p>
        <p className="text-amber-800">{t("expires", { hours: EASYKASH_CASH_EXPIRY_HOURS })}</p>
      </CardContent>
    </Card>
  );
}
