import { getLocale } from "next-intl/server";
import { parsePriceJson } from "@workspace/lib";
import { getSellerAdRequests } from "@/actions/ads";
import { getSellerProducts } from "@/actions/products";
import { AdvertiseProducts } from "./advertise-products.client";
import type { AdProductOption } from "./product-picker";

/** Request statuses that still hold the product (mirrors the partial unique index). */
const OPEN_STATUSES = new Set(["pending", "approved", "active"]);

export async function AdvertiseData() {
  const [locale, productsResult, requests] = await Promise.all([
    getLocale(),
    getSellerProducts(),
    getSellerAdRequests(),
  ]);

  const openProductIds = new Set(
    requests.filter((r) => OPEN_STATUSES.has(r.status)).map((r) => r.product.id)
  );

  const products: AdProductOption[] = (productsResult.data ?? []).map((p) => {
    const translations = p.productTranslations ?? [];
    const title =
      translations.find((t) => t.locale === locale)?.title ?? p.title;
    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    return {
      id: p.id,
      title,
      image: images[0] ?? null,
      price: parsePriceJson(p.price).final ?? null,
      isActive: p.status === "active",
      hasOpenRequest: openProductIds.has(p.id),
    };
  });

  return <AdvertiseProducts products={products} requests={requests} />;
}
