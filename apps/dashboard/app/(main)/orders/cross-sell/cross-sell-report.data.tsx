import { getTranslations } from "next-intl/server";
import { requireOrdersStore } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { loadStoreMoney } from "@/lib/stores/account-money.server";
import type { MoneyUnit } from "@/lib/i18n/format";
import { CrossSellReportView } from "./cross-sell-report.client";
import { parseCrossSellReportFilters } from "./cross-sell-report.lib";
import { loadCrossSellReport, type CrossSellReport } from "./cross-sell-report.query";

const EMPTY: CrossSellReport = { rows: [], totals: { orders: 0, units: 0, discount: "0.00" }, total: 0, page: 1, pages: 1, size: 20 };

/**
 * Orders › Cross-sell report (ROADMAP.md F-32f) for a store the session's seller
 * owns. The URL's store wins when it is one of theirs, else the sidebar's selected
 * store. Read fresh on every request.
 */
export async function CrossSellReportData({
  storeId,
  searchParams,
}: {
  storeId: string | null;
  searchParams: { days?: unknown; page?: unknown; size?: unknown };
}) {
  const [{ stores, selected }, t] = await Promise.all([getSellerStores(), getTranslations("crossSellReport")]);
  const picked = stores.find((s) => s.id === storeId) ?? selected;
  const filters = parseCrossSellReportFilters(searchParams);

  let report = EMPTY;
  let storeName: string | null = null;
  let money: MoneyUnit | undefined;
  if (picked) {
    const { seller, store } = await requireOrdersStore(picked.id);
    report = await loadCrossSellReport(seller.sellerId, store.id, filters);
    money = (await loadStoreMoney(seller.sellerId))[store.id];
    storeName = stores.length > 1 ? store.name : null;
  }

  return (
    <section aria-label={t("title")} className="space-y-5">
      {/* No page title: the header breadcrumb already names the page. */}
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <CrossSellReportView key={picked?.id ?? "none"} money={money} report={report} days={filters.days} storeName={storeName} />
    </section>
  );
}
