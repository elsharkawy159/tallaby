import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@workspace/lib";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { sellerHref, sellerWalletHref } from "../../_components/entity/entity-href.lib";
import { PlatformFeeSummary } from "../../_components/entity/platform-fee.chunks";
import type { AccountRelations } from "../../_components/entity/relations.server";
import { StoreCard } from "../../_components/entity/store-card";

/** This customer also sells: their seller account, fee, wallet and stores. */
export function CustomerSellerAccount({ account }: { account: AccountRelations }) {
  const { seller, stores } = account;
  if (!seller) return null;
  const balance = seller.walletBalance != null ? Number(seller.walletBalance) : null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">This customer is also a seller</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href={sellerHref(seller.id)}>
            Open seller account
            <ArrowUpRight className="ms-1 size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Seller</p>
            <Link href={sellerHref(seller.id)} className="font-medium hover:underline">
              {seller.name}
            </Link>
            <p className="text-xs text-muted-foreground capitalize">
              {seller.status ?? "pending"} · {seller.plan} plan
            </p>
          </div>
          <PlatformFeeSummary seller={seller} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Store wallet</p>
            <Link
              href={sellerWalletHref(seller.id)}
              className={cn("text-lg font-semibold tabular-nums hover:underline", balance != null && balance < 0 && "text-destructive")}
            >
              {balance != null ? formatCurrency(balance) : "No wallet yet"}
            </Link>
          </div>
        </div>
        {stores.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {stores.length} store{stores.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No stores yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
