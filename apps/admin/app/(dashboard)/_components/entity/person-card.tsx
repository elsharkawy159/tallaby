import Link from "next/link";
import { Mail, Phone, ShoppingCart, Store, UserRound, Wallet } from "lucide-react";
import { formatCurrency } from "@workspace/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { EntityAvatar } from "./entity-avatar";
import { EntityChipList, storeTone } from "./entity-chip";
import { customerHref, ordersHref, sellerHref, sellerWalletHref, storeHref } from "./entity-href.lib";
import type { AccountRelations } from "./relations.server";
import { RoleBadges } from "./role-badges";

const JOINED = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

/**
 * A small profile of one account: who they are, what they are on Tallaby and
 * where to go next. The store page shows it as "Store owner", the order page
 * as "Customer", the product page as "Seller".
 */
export function PersonCard({
  title,
  account,
  excludeStoreId,
  className,
}: {
  title: string;
  account: AccountRelations;
  /** The store already on screen, left out of "Their stores". */
  excludeStoreId?: string;
  className?: string;
}) {
  const { user, seller, stores } = account;
  const name = user.fullName || seller?.name || user.email || "Unnamed account";
  const otherStores = stores.filter((store) => store.id !== excludeStoreId);
  const balance = seller?.walletBalance != null ? Number(seller.walletBalance) : null;

  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href={customerHref(user.id)} className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <EntityAvatar name={name} src={user.avatarUrl} seed={user.id} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold group-hover:underline">{name}</p>
            <p className="text-xs text-muted-foreground">
              {user.createdAt ? `Joined ${JOINED.format(new Date(user.createdAt))}` : "Account"}
            </p>
          </div>
        </Link>

        <RoleBadges role={user.role} isGuest={user.isGuest} seller={seller} />

        <dl className="space-y-1.5 text-sm">
          {user.email ? (
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Email</dt>
              <dd className="truncate" dir="ltr">
                <a href={`mailto:${user.email}`} className="hover:underline">
                  {user.email}
                </a>
              </dd>
            </div>
          ) : null}
          {user.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Phone</dt>
              <dd dir="ltr">
                <a href={`tel:${user.phone}`} className="hover:underline">
                  {user.phone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        {otherStores.length > 0 && seller ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{excludeStoreId ? "Their other stores" : "Their stores"}</p>
            <EntityChipList
              max={4}
              moreHref={sellerHref(seller.id, "stores")}
              items={otherStores.map((store) => ({
                href: storeHref(store.id),
                name: store.name,
                kind: "store" as const,
                src: store.logoUrl,
                seed: store.id,
                tone: storeTone(store.siteStatus, store.status),
              }))}
            />
          </div>
        ) : null}

        <nav aria-label={`${title} links`} className="grid grid-cols-2 gap-1.5 border-t pt-3 text-sm">
          <CardLink href={customerHref(user.id)} icon={UserRound} label="Customer profile" />
          <CardLink href={ordersHref({ customer: user.id })} icon={ShoppingCart} label="Their orders" />
          {seller ? (
            <>
              <CardLink href={sellerHref(seller.id)} icon={Store} label="Seller account" />
              <CardLink
                href={sellerWalletHref(seller.id)}
                icon={Wallet}
                label={balance != null ? formatCurrency(balance) : "Store wallet"}
                emphasis={balance != null && balance < 0 ? "negative" : undefined}
              />
            </>
          ) : null}
        </nav>
      </CardContent>
    </Card>
  );
}

function CardLink({
  href,
  icon: Icon,
  label,
  emphasis,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  emphasis?: "negative";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-primary-soft",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        emphasis === "negative" && "text-destructive",
      )}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate tabular-nums">{label}</span>
    </Link>
  );
}
