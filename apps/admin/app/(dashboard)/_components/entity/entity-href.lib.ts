/**
 * Every admin link to a person, seller, store, order or product is built here,
 * so pages link to each other the same way and a route change is one edit.
 */

/** A person's account page. Every seller is also a user (`sellers.id = users.id`). */
export function customerHref(userId: string): string {
  return `/customers/${userId}`;
}

export type SellerTab =
  | "overview"
  | "stores"
  | "integrations"
  | "coupons"
  | "wallet"
  | "fulfillment"
  | "ads"
  | "audit";

export function sellerHref(sellerId: string, tab?: SellerTab): string {
  return withTab(`/sellers/${sellerId}`, tab);
}

export type StoreTab =
  | "overview"
  | "website"
  | "catalog"
  | "commerce"
  | "integrations"
  | "forms"
  | "content"
  | "media"
  | "audit";

export function storeHref(storeId: string, tab?: StoreTab): string {
  return withTab(`/stores/${storeId}`, tab);
}

export function orderHref(orderId: string): string {
  return `/orders/${orderId}`;
}

export function productHref(productId: string): string {
  return `/products/${productId}`;
}

/** The seller's store-wallet ledger (one wallet per seller account). */
export function sellerWalletHref(sellerId: string): string {
  return `/wallets/sellers/${sellerId}`;
}

/** The orders list filtered to one seller, store or customer (`orders.params.ts`). */
export function ordersHref(filter: { seller?: string; store?: string; customer?: string } = {}): string {
  const params = new URLSearchParams();
  if (filter.seller) params.set("seller", filter.seller);
  if (filter.store) params.set("store", filter.store);
  if (filter.customer) params.set("customer", filter.customer);
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

function withTab(base: string, tab: string | undefined): string {
  return tab && tab !== "overview" ? `${base}?tab=${tab}` : base;
}
