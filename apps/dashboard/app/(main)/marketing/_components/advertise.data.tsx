import { getLocale } from "next-intl/server";
import { parsePriceJson } from "@workspace/lib";
import { getAdWallet, getSellerAdRequests } from "@/actions/ads";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { ProductStoreProvider } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";
import { listSellerProductOptions } from "@/app/(main)/stores/[storeId]/products/_components/products-list.query";
import { AdvertiseProducts } from "./advertise-products.client";
import type { AdProductOption } from "./product-picker";

/** Request statuses that still hold the product (mirrors the partial unique index). */
const OPEN_STATUSES = new Set(["pending", "approved", "active"]);

export async function AdvertiseData() {
  const [seller, locale, { selected }] = await Promise.all([requireSeller(), getLocale(), getSellerStores()]);
  // /marketing has no store in its URL: the picker offers the selected store's products (F-87c; none = the
  // account, as before) and createAdRequest checks the product against the same store again.
  const scope = selected ? await requireProductStore(selected.id, { read: true }) : null;
  const [productRows, requests, wallet] = await Promise.all([
    listSellerProductOptions(seller.sellerId, locale, scope?.inStore),
    getSellerAdRequests(),
    getAdWallet(),
  ]);

  const openProductIds = new Set(
    requests.filter((r) => OPEN_STATUSES.has(r.status)).map((r) => r.product.id)
  );

  const products: AdProductOption[] = productRows.map((p) => ({
    id: p.id,
    title: p.title ?? "",
    image: p.image,
    price: parsePriceJson(p.price).final ?? null,
    isActive: p.status === "active",
    hasOpenRequest: openProductIds.has(p.id),
  }));

  return (
    <ProductStoreProvider storeId={scope?.store.id ?? ""}>
      <AdvertiseProducts products={products} requests={requests} wallet={wallet} />
    </ProductStoreProvider>
  );
}
