import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  Banknote,
  Hourglass,
  Landmark,
  Receipt,
  TrendingDown,
  Wallet as WalletIcon,
} from "lucide-react";
import type { StoreWalletTotals } from "@workspace/lib/admin/server";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { egp } from "./store-wallets.lib";
import type { WalletsScope } from "./store-wallets.params";

/** Seller wallets (store wallets, the seller ledger) vs customer wallets (user_wallets). */
export function WalletsScopeNav({ scope }: { scope: WalletsScope }) {
  const items: { value: WalletsScope; label: string; href: string }[] = [
    { value: "sellers", label: "Seller wallets", href: "/wallets" },
    { value: "customers", label: "Customer wallets", href: "/wallets?scope=customers" },
  ];
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Wallet type">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          aria-current={scope === item.value ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm",
            scope === item.value
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

type Tile = { label: string; value: string; hint?: string; icon: typeof WalletIcon; tone?: "danger" | "warn"; href?: string };

export function StoreWalletTotalsCards({ totals }: { totals: StoreWalletTotals }) {
  const tiles: Tile[] = [
    {
      label: "Held for sellers",
      value: egp(totals.totalHeld),
      hint: `Net ${egp(totals.netBalance)} across ${totals.walletCount.toLocaleString()} wallets`,
      icon: Landmark,
    },
    {
      label: "Owed by sellers",
      value: egp(totals.totalOwed),
      hint: `${totals.negativeCount.toLocaleString()} wallets below zero`,
      icon: TrendingDown,
      tone: totals.negativeCount > 0 ? "danger" : undefined,
      href: "/wallets?balance=negative",
    },
    {
      label: "Top-ups to review",
      value: totals.pendingReviewCount.toLocaleString(),
      hint: egp(totals.pendingReviewAmount),
      icon: Hourglass,
      tone: totals.pendingReviewCount > 0 ? "warn" : undefined,
      href: "/wallets?tab=topups&status=pending&provider=vodafone_cash,instapay",
    },
    {
      label: "Fees earned, 30 days",
      value: egp(totals.fees30d),
      hint: `All time ${egp(totals.feesAllTime)} (net of reversals)`,
      icon: Receipt,
    },
    { label: "Top-ups credited, 30 days", value: egp(totals.topUps30d), icon: ArrowDownToLine },
    { label: "Sales credited, 30 days", value: egp(totals.sales30d), icon: Banknote },
    {
      label: "Ledger check",
      value: totals.mismatchCount === 0 ? "All match" : `${totals.mismatchCount} mismatch`,
      hint:
        totals.inactiveCount > 0
          ? `${totals.inactiveCount} wallets frozen or closed`
          : "Balance = sum of entries, for every wallet",
      icon: AlertTriangle,
      tone: totals.mismatchCount > 0 ? "danger" : undefined,
      href: totals.mismatchCount > 0 ? "/wallets?check=mismatch" : undefined,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {tiles.map((tile) => {
        const body = (
          <Card
            className={cn(
              "h-full",
              tile.tone === "danger" && "border-red-300",
              tile.tone === "warn" && "border-amber-300",
              tile.href && "transition-colors hover:bg-muted/50",
            )}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className={cn(
                  "rounded-full p-2",
                  tile.tone === "danger" ? "bg-red-100" : tile.tone === "warn" ? "bg-amber-100" : "bg-primary/10",
                )}
              >
                <tile.icon
                  className={cn(
                    "h-4 w-4",
                    tile.tone === "danger" ? "text-red-700" : tile.tone === "warn" ? "text-amber-700" : "text-primary",
                  )}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <p className="text-lg font-semibold tabular-nums">{tile.value}</p>
                {tile.hint && <p className="text-xs text-muted-foreground">{tile.hint}</p>}
              </div>
            </CardContent>
          </Card>
        );
        return tile.href ? (
          <Link key={tile.label} href={tile.href} className="block rounded-xl focus-visible:outline-2">
            {body}
          </Link>
        ) : (
          <div key={tile.label}>{body}</div>
        );
      })}
    </div>
  );
}
