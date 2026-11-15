"use server";

import { and, db, eq, orderItems, orders, stores } from "@workspace/db";
import { parseCustomerInputsSnapshot, snapshotFiles } from "@workspace/lib/products/customer-fields";
import { signCustomerUploadDownload, signCustomerUploadViews } from "@workspace/lib/products/customer-fields/server";
import { isAccessError, requireOrderSeller } from "@/lib/auth/require-seller.server";

export type CustomerUploadLinks = { path: string; view: string; download: string | null }[];

/**
 * The customer's photos on one order line (Customer requirements, 0167,
 * ROADMAP.md F-91) as short-lived links: a 10-minute view and a 5-minute
 * download each. Only for the session's seller, whose line it is, on an order
 * of one of their own stores (CLAUDE.md rule 5); the ids from the client only
 * pick the line, never grant it. Paths come from the stored snapshot, so a
 * forged path can't be signed. The bucket is private with no policies.
 */
export async function getOrderLineUploads(orderId: string, orderItemId: string): Promise<CustomerUploadLinks> {
  try {
    const { sellerId } = await requireOrderSeller(String(orderId));
    const [line] = await db
      .select({ customerInputs: orderItems.customerInputs })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .where(
        and(
          eq(orderItems.id, String(orderItemId)),
          eq(orderItems.orderId, String(orderId)),
          eq(orderItems.sellerId, sellerId),
          eq(stores.sellerId, sellerId),
        ),
      )
      .limit(1);
    const paths = snapshotFiles(parseCustomerInputsSnapshot(line?.customerInputs));
    if (!paths.length) return [];

    const views = await signCustomerUploadViews(paths);
    return Promise.all(
      paths
        .filter((path) => views[path])
        .map(async (path, index) => ({
          path,
          view: views[path]!,
          download: await signCustomerUploadDownload(path, `order-${String(orderId).slice(0, 8)}-${index + 1}.${path.split(".").pop() ?? "jpg"}`),
        })),
    );
  } catch (error) {
    if (!isAccessError(error)) console.error("[customer-inputs] uploads read failed", (error as Error)?.message);
    return [];
  }
}
