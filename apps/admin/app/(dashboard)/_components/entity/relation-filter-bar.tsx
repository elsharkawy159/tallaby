import Link from "next/link";
import { X } from "lucide-react";
import { EntityChip } from "./entity-chip";
import { customerHref, sellerHref, storeHref } from "./entity-href.lib";
import type { getRelationFilterLabels } from "./relations.server";

type Labels = Awaited<ReturnType<typeof getRelationFilterLabels>>;

/**
 * Shown above a list opened from an entity page ("Orders with their
 * products"): what it is filtered to, a link back, and a way to see all.
 */
export function RelationFilterBar({ labels, clearHref, noun }: { labels: Labels; clearHref: string; noun: string }) {
  const { seller, store, customer } = labels;
  if (!seller && !store && !customer) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-primary-soft/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Showing {noun} for</span>
      {seller ? <EntityChip href={sellerHref(seller.id)} role="Seller" name={seller.name} kind="store" seed={seller.id} /> : null}
      {store ? (
        <EntityChip href={storeHref(store.id)} role="Store" name={store.name} kind="store" src={store.logoUrl} seed={store.id} />
      ) : null}
      {customer ? (
        <EntityChip
          href={customerHref(customer.id)}
          role="Customer"
          name={customer.name}
          kind="person"
          src={customer.avatarUrl}
          seed={customer.id}
        />
      ) : null}
      <Link
        href={clearHref}
        className="ms-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden />
        Show all {noun}
      </Link>
    </div>
  );
}
