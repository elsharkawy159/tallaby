import { ShoppingCart, Wallet } from "lucide-react";
import { formatCurrency } from "@workspace/lib";
import { storeTone, type EntityChipProps } from "./entity-chip";
import { customerHref, ordersHref, sellerHref, sellerWalletHref, storeHref } from "./entity-href.lib";
import type { AccountRelations } from "./relations.server";

type Part = "person" | "seller" | "stores" | "wallet" | "orders";

/**
 * The relation chips for one account, in the same order everywhere:
 * person → seller account → stores → wallet → orders. Pages leave out the
 * part they already are (the store page has no use for a chip to itself).
 */
export function accountChips(
  account: AccountRelations,
  options: { omit?: Part[]; excludeStoreId?: string; personRole?: string; ordersFilter?: "seller" | "customer" } = {},
): EntityChipProps[] {
  const omit = new Set(options.omit ?? []);
  const { user, seller, stores } = account;
  const chips: EntityChipProps[] = [];

  if (!omit.has("person")) {
    chips.push({
      href: customerHref(user.id),
      role: options.personRole ?? "Account",
      name: user.fullName || user.email || "Customer",
      kind: "person",
      src: user.avatarUrl,
      seed: user.id,
    });
  }
  if (seller && !omit.has("seller")) {
    chips.push({
      href: sellerHref(seller.id),
      role: "Seller",
      name: seller.name,
      kind: "store",
      src: seller.logoUrl,
      seed: seller.id,
      tone: seller.status === "approved" ? "good" : seller.status === "pending" ? "warn" : "off",
    });
  }
  if (seller && !omit.has("stores")) {
    for (const store of stores.filter((s) => s.id !== options.excludeStoreId)) {
      chips.push({
        href: storeHref(store.id),
        role: "Store",
        name: store.name,
        kind: "store",
        src: store.logoUrl,
        seed: store.id,
        tone: storeTone(store.siteStatus, store.status),
      });
    }
  }
  if (seller && !omit.has("wallet")) {
    const balance = seller.walletBalance != null ? Number(seller.walletBalance) : null;
    chips.push({
      href: sellerWalletHref(seller.id),
      role: "Wallet",
      name: balance != null ? formatCurrency(balance) : "No wallet yet",
      icon: Wallet,
      tone: balance != null && balance < 0 ? "warn" : undefined,
    });
  }
  if (!omit.has("orders")) {
    const bySeller = options.ordersFilter === "seller" && seller;
    chips.push({
      href: bySeller ? ordersHref({ seller: seller.id }) : ordersHref({ customer: user.id }),
      role: bySeller ? "Sales" : "Orders",
      name: bySeller ? "Orders with their products" : "Orders they placed",
      icon: ShoppingCart,
    });
  }
  return chips;
}
