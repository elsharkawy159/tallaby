import { and, db, eq, inArray, orderItems, orders, sellerCustomDomains, stores } from "@workspace/db";
import { storeUrl } from "@workspace/lib/storefront";
import { resolveCustomerName, resolveCustomerPhone } from "@/app/(main)/orders/orders.lib";
import { amountToCollect } from "./print-orders.lib";
import type { PrintOrder, PrintSender } from "./print-orders.types";

const toPiastres = (value: string | null | undefined) => Math.round((Number(value) || 0) * 100);

/** Store logos are full URLs or paths in the public `sellers` bucket. */
const logoSrc = (logoUrl: string | null): string | null => {
  if (!logoUrl?.trim()) return null;
  if (/^https?:/.test(logoUrl)) return logoUrl;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const path = logoUrl.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/sellers/${path}`;
};

const contactPhone =(contact: unknown): string | null => {
  const phone = (contact as Record<string, unknown> | null)?.phone;
  return typeof phone === "string" && phone.trim() ? phone.trim() : null;
};

/**
 * Orders to print (ROADMAP.md F-04a), in the order asked for. Only orders with
 * at least one of the seller's lines are read, with only those lines; a store
 * is read only when it is the seller's. Ids the seller cannot see are dropped.
 */
export async function loadPrintOrders(
  sellerId: string,
  ids: readonly string[],
  marketplaceSender: Omit<PrintSender, "marketplace">,
): Promise<PrintOrder[]> {
  if (ids.length === 0) return [];

  const list = await db.query.orders.findMany({
    where: and(
      inArray(orders.id, [...ids]),
      inArray(
        orders.id,
        db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId)),
      ),
    ),
    columns: {
      id: true,
      orderNumber: true,
      storeId: true,
      createdAt: true,
      notes: true,
      isGift: true,
      giftMessage: true,
      paymentMethod: true,
      paymentStatus: true,
      subtotal: true,
      shippingCost: true,
      discountAmount: true,
      totalAmount: true,
    },
    with: {
      user: { columns: { email: true, fullName: true, phone: true, isGuest: true } },
      userAddress_shippingAddressId: true,
      orderItems: {
        columns: {
          id: true,
          sellerId: true,
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          price: true,
          total: true,
        },
      },
    },
  });
  if (list.length === 0) return [];

  const storeIds = [...new Set(list.map((o) => o.storeId).filter((id): id is string => Boolean(id)))];
  const [storeRows, domains] = storeIds.length
    ? await Promise.all([
        db
          .select({
            id: stores.id,
            name: stores.name,
            subdomain: stores.subdomain,
            logoUrl: stores.logoUrl,
            contact: stores.contact,
          })
          .from(stores)
          .where(and(eq(stores.sellerId, sellerId), inArray(stores.id, storeIds))),
        db
          .select({ storeId: sellerCustomDomains.storeId, domain: sellerCustomDomains.domain })
          .from(sellerCustomDomains)
          .where(
            and(
              eq(sellerCustomDomains.sellerId, sellerId),
              eq(sellerCustomDomains.status, "active"),
              inArray(sellerCustomDomains.storeId, storeIds),
            ),
          ),
      ])
    : [[], []];

  const domainByStore = new Map(domains.map((d) => [d.storeId, d.domain]));
  const senderByStore = new Map<string, PrintSender>(
    storeRows.map((s) => [
      s.id,
      {
        name: s.name,
        logoUrl: logoSrc(s.logoUrl),
        website: storeUrl(s.subdomain, domainByStore.get(s.id) ?? null).replace(/^https?:\/\//, ""),
        phone: contactPhone(s.contact),
        marketplace: false,
      },
    ]),
  );
  const marketplace: PrintSender = { ...marketplaceSender, marketplace: true };

  const byId = new Map(list.map((o) => [o.id, o]));
  return ids.flatMap((id) => {
    const o = byId.get(id);
    if (!o) return [];
    const mine = o.orderItems.filter((i) => i.sellerId === sellerId);
    const wholeOrder = mine.length === o.orderItems.length;
    const addr = o.userAddress_shippingAddressId;
    const totalAmount = o.totalAmount ?? "0";
    const order: PrintOrder = {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      // A store order whose store is not this seller's never happens; fall back to Tallaby anyway.
      sender: (o.storeId && senderByStore.get(o.storeId)) || marketplace,
      customerName: resolveCustomerName(o, ""),
      customerPhone: resolveCustomerPhone(o),
      address: addr
        ? {
            fullName: addr.fullName,
            phone: addr.phone,
            line: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
            area: [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
            instructions: addr.deliveryInstructions,
          }
        : null,
      notes: o.notes,
      giftMessage: o.isGift ? o.giftMessage : null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      lines: mine.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        quantity: i.quantity ?? 1,
        price: i.price ?? "0",
        total: i.total ?? "0",
      })),
      itemCount: mine.reduce((n, i) => n + (i.quantity ?? 1), 0),
      wholeOrder,
      linesTotal: (mine.reduce((sum, i) => sum + toPiastres(i.total), 0) / 100).toFixed(2),
      subtotal: o.subtotal ?? "0",
      shippingCost: o.shippingCost ?? "0",
      discountAmount: o.discountAmount ?? "0",
      totalAmount,
      // Another seller's lines share this order: the door amount is not this seller's to print.
      collect: wholeOrder
        ? amountToCollect({ paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, totalAmount })
        : null,
    };
    return [order];
  });
}
