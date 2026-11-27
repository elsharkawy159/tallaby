import { Link } from "@/i18n/navigation";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { EmptyState, IconTile, SellerButton, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { loadOrderLock } from "@/lib/auth/require-seller.server";
import { formatDate } from "@/lib/i18n/format";
import { translateStatus } from "@/lib/i18n/status";
import { ENTRIES_PAGE_SIZE, ENTRY_FILTERS, entryCursor, listStoreWalletEntries, type EntryFilter } from "../store-wallet.server";
import { walletMoney } from "../store-wallet.lib";

const PATH = "/wallet/transactions";

/**
 * Wallet › Transactions (owner, 2026-11-27): every store wallet entry, newest first, with the same
 * filters and "older" cursor it had on /wallet. Always the session seller's own ledger (rule 5).
 */
export async function WalletTransactionsSection({
  sellerId,
  filter,
  before,
}: {
  sellerId: string;
  filter: EntryFilter;
  before: string | null;
}) {
  const { ordersLocked: locked } = await loadOrderLock(sellerId);
  const [rows, t, tStatus, locale] = await Promise.all([
    listStoreWalletEntries(sellerId, { filter, before, hideSales: locked }),
    getTranslations("storeWallet"),
    getTranslations("status"),
    getLocale(),
  ]);
  const entries = rows.slice(0, ENTRIES_PAGE_SIZE);
  const next = rows.length > ENTRIES_PAGE_SIZE ? entryCursor(entries[entries.length - 1]!) : null;
  const href = (params: Record<string, string | null>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    const query = search.toString();
    return query ? `${PATH}?${query}` : PATH;
  };

  return (
    <SellerCard aria-labelledby="wallet-entries-title" className="sui-rise">
      <SellerCardHeader
        id="wallet-entries-title"
        title={t("entriesTitle")}
        description={t("entriesDescription")}
        className="flex-wrap items-center"
        action={
          <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-1.5">
            {ENTRY_FILTERS.filter((key) => !locked || key !== "sales").map((key) => (
              <Link
                key={key}
                href={href({ entries: key === "all" ? null : key })}
                aria-current={filter === key ? "page" : undefined}
                className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[12.5px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-[current=page]:border-(--s-solid) aria-[current=page]:bg-(--s-solid) aria-[current=page]:text-(--s-solid-fg) max-[600px]:h-10"
              >
                {t(`filters.${key}`)}
              </Link>
            ))}
          </nav>
        }
      />
      {entries.length === 0 ? (
        <EmptyState icon={ReceiptText} image={filter === "all" && !before ? "/illustrations/empty/wallet.png" : undefined} title={t("empty")} />
      ) : (
        <ul className="flex flex-col px-3 pb-3.5 pt-2.5">
          {entries.map((entry) => {
            const amount = Number(entry.amount);
            const incoming = amount > 0;
            return (
              <li
                key={entry.id}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-2xl px-2.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft) max-[720px]:gap-2.5"
              >
                <IconTile
                  icon={incoming ? ArrowDownLeft : ArrowUpRight}
                  tone={incoming ? "success" : "danger"}
                  className="size-10 rounded-[13px] max-[720px]:size-9"
                />
                <div className="min-w-0">
                  <b className="block text-[13.5px] font-bold text-(--s-text)">{translateStatus(tStatus, "transaction", entry.type)}</b>
                  {entry.description && <small className="block text-xs text-(--s-subtle)">{entry.description}</small>}
                  <small className="block text-xs text-(--s-subtle)">
                    {entry.storeName ?? t("accountLevel")}
                    {entry.orderId && entry.orderNumber && (
                      <>
                        {" · "}
                        <Link href={`/orders?order=${entry.orderId}`} className="text-(--s-link) underline-offset-2 hover:underline">
                          {entry.orderNumber}
                        </Link>
                      </>
                    )}
                    {" · "}
                    {formatDate(entry.createdAt, locale)}
                  </small>
                </div>
                <div className="text-end">
                  {/* bdi keeps the number's own direction while the cell aligns with the row. */}
                  <bdi
                    className={cn(
                      "block font-montserrat text-sm font-bold tabular-nums",
                      amount < 0 ? "text-destructive" : amount > 0 ? "text-success" : "text-(--s-ink)",
                    )}
                  >
                    {amount > 0 ? "+" : ""}
                    {walletMoney(amount, entry.currency, locale)}
                  </bdi>
                  {entry.balanceAfter != null && (
                    <small className="block text-xs text-(--s-subtle)">
                      {t("columns.balance")}{" "}
                      <bdi className="font-montserrat tabular-nums">{walletMoney(Number(entry.balanceAfter), entry.currency, locale)}</bdi>
                    </small>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {next && (
        <div className="flex justify-center pb-[18px]">
          <SellerButton asChild variant="mini" size="xs">
            <Link href={href({ entries: filter === "all" ? null : filter, before: next })}>{t("older")}</Link>
          </SellerButton>
        </div>
      )}
    </SellerCard>
  );
}
