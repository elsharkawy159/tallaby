"use client";

import { createContext, use } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { EGP_ACCOUNT, type AccountMoney } from "@/lib/stores/account-money.lib";
import { cn } from "@/lib/utils";

const AccountMoneyContext = createContext<Promise<AccountMoney> | null>(null);

/** Set once by the dashboard layout, from the session seller's stores, as a promise so the frame never waits for it. Display only. */
export function AccountMoneyProvider({ value, children }: { value: Promise<AccountMoney>; children: React.ReactNode }) {
  return <AccountMoneyContext value={value}>{children}</AccountMoneyContext>;
}

/**
 * The currency of amounts that belong to the account, not to one store: product prices, coupons, offers.
 * Suspends until it arrives: call it under a <Suspense> boundary (every (main) page has a loading.tsx above it).
 */
export function useAccountMoney() {
  const value = use(AccountMoneyContext);
  return value ? use(value) : EGP_ACCOUNT;
}

/** Beside account-level amounts when the seller's stores use different currencies. */
export function MixedCurrencyNote({ className }: { className?: string }) {
  const { mixed } = useAccountMoney();
  const t = useTranslations("common");
  if (!mixed) return null;
  return (
    <p className={cn("flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-pretty text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {t("mixedCurrencyNote")}
    </p>
  );
}
