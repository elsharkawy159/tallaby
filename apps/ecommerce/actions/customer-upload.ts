"use server";

import { headers } from "next/headers";
import { and, db, eq, products } from "@workspace/db";
import { parseCustomerFields } from "@workspace/lib/products/customer-fields";
import { signCustomerUpload } from "@workspace/lib/products/customer-fields/server";
import { getOrCreateCurrentUserId } from "@/lib/get-current-user-id";
import { getCartScope } from "@/lib/storefront.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Signs one customer photo upload for a product's "Customer requirements"
 * (F-91) into the private `order-customer-uploads` bucket (0167, no storage
 * policies): `<store id|market>/<user id>/<uuid>.<ext>`. The store is the
 * request host's and the user the session's (signed in, or the guest, created
 * here so guest checkout works), never ids from the client. Only an active
 * product with an image field gets a URL, and each visitor and IP is rate
 * limited. Add-to-cart checks the path, type and size again before keeping it.
 */

const perVisitor = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });
const perIp = createRateLimiter({ limit: 80, windowMs: 10 * 60_000 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CustomerUploadUrlResult =
  | { success: true; path: string; token: string }
  | { success: false; error: "invalidFile" | "rateLimited" | "notAllowed" | "generic" };

export async function createCustomerUploadUrl(input: { productId: string; mime: string; size: number }): Promise<CustomerUploadUrlResult> {
  try {
    const productId = String(input?.productId ?? "");
    if (!UUID.test(productId)) return { success: false, error: "notAllowed" };

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    if (!perIp.check(`customer-upload-ip:${ip}`)) return { success: false, error: "rateLimited" };

    const [product, scope] = await Promise.all([
      db.query.products.findFirst({
        where: and(eq(products.id, productId), eq(products.status, "active")),
        columns: { id: true, sellerId: true, storeId: true, customerFields: true },
      }),
      getCartScope(),
    ]);
    if (!product || !parseCustomerFields(product.customerFields).some((field) => field.type === "image")) {
      return { success: false, error: "notAllowed" };
    }
    // On a store host, only that store's products (the store comes from the host).
    if (scope && product.sellerId !== scope.sellerId) return { success: false, error: "notAllowed" };

    const userId = await getOrCreateCurrentUserId();
    if (!userId) return { success: false, error: "notAllowed" };
    if (!perVisitor.check(`customer-upload:${userId}`)) return { success: false, error: "rateLimited" };

    const signed = await signCustomerUpload({ storeId: scope?.storeId ?? null, userId, mime: input?.mime, size: input?.size });
    if (!signed) return { success: false, error: "invalidFile" };
    return { success: true, ...signed };
  } catch (error) {
    console.error("[customer-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
