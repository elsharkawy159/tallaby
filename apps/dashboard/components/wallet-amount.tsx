import { formatSignedWalletMoney, formatWalletMoney, isApproxWalletMoney, walletMoneyDir } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

/**
 * A store-wallet amount on a statement (ledger rows, transactions, a top-up
 * result). A USD amount reads in EGP at the live rate ("≈ 269 جنيه"), and the
 * exact dollars the ledger recorded stay beside it in small muted text (owner,
 * 2026-11-09). An EGP amount shows as it is. Display only.
 */
export function WalletAmount({
  value,
  currency,
  locale,
  rate,
  signed = false,
  className,
  exactClassName,
}: {
  value: string | number | null | undefined;
  currency: string | null | undefined;
  locale: string;
  rate: number | null | undefined;
  /** A "+" on a credit. */
  signed?: boolean;
  className?: string;
  exactClassName?: string;
}) {
  const format = signed ? formatSignedWalletMoney : formatWalletMoney;
  return (
    <>
      <bdi dir={walletMoneyDir(locale, currency, rate)} className={className}>
        {format(value, currency, locale, rate)}
      </bdi>
      {isApproxWalletMoney(currency, rate) && (
        <bdi dir="ltr" className={cn("block text-[11px] font-normal text-(--s-subtle) tabular-nums", exactClassName)}>
          {format(value, "USD", locale)}
        </bdi>
      )}
    </>
  );
}
