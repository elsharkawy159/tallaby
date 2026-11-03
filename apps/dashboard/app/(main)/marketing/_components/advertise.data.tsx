import { getLocale } from "next-intl/server";
import { parsePriceJson } from "@workspace/lib";
import { getAdWallet, getSellerAdRequests } from "@/actions/ads";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { listSellerProductOptions } from "../../products/_components/products-list.query";
import { AdvertiseProducts } from "./advertise-products.client";
import type { AdProductOption } from "./product-picker";

/** Request statuses that still hold the product (mirrors the partial unique index). */
const OPEN_STATUSES = new Set(["pending", "approved", "active"]);

export async function AdvertiseData() {
  const [seller, locale] = await Promise.all([requireSeller(), getLocale()]);
  const [productRows, requests, wallet] = await Promise.all([
    listSellerProductOptions(seller.sellerId, locale),
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

  return <AdvertiseProducts products={products} requests={requests} wallet={wallet} />;
}
