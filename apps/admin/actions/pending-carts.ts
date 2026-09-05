"use server";

import { db } from "@workspace/db";
import { carts, cartItems } from "@workspace/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getAdminUser } from "./auth";

const ABANDONED_DAYS = 7;

function abandonedCutoffIso(): string {
  const date = new Date();
  date.setDate(date.getDate() - ABANDONED_DAYS);
  return date.toISOString();
}

function getProductTitle(
  translations?: Array<{ locale: string; title: string }> | null
): string {
  if (!translations?.length) return "Unknown product";
  return (
    translations.find((t) => t.locale === "en")?.title ??
    translations[0]?.title ??
    "Unknown product"
  );
}

function getProductImage(images: unknown): string | null {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      return String((first as { url: string }).url);
    }
  }
  return null;
}

function mapUser(user: {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  receiveMarketingEmails: boolean | null;
  preferredLanguage: string | null;
} | null) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isGuest: user.isGuest,
    receiveMarketingEmails: user.receiveMarketingEmails ?? true,
    preferredLanguage: user.preferredLanguage,
  };
}

function mapCartItems(
  cartItemsRows: Array<{
    id: string;
    productId: string;
    sellerId: string;
    quantity: number;
    price: string;
    savedForLater: boolean | null;
    variant: unknown;
    createdAt: string | null;
    updatedAt: string | null;
    product: {
      id: string;
      sku: string | null;
      images: unknown;
      productTranslations?: Array<{
        locale: string;
        title: string;
        slug: string | null;
      }>;
    } | null;
    seller: {
      id: string;
      displayName: string;
      businessName?: string | null;
    } | null;
  }>
) {
  return cartItemsRows.map((item) => {
    const price = Number(item.price) || 0;
    const quantity = item.quantity || 0;
    return {
      id: item.id,
      productId: item.productId,
      sellerId: item.sellerId,
      quantity,
      price,
      lineTotal: price * quantity,
      savedForLater: item.savedForLater ?? false,
      variant: item.variant,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productTitle: getProductTitle(item.product?.productTranslations),
      productSku: item.product?.sku ?? null,
      productImage: getProductImage(item.product?.images),
      productSlug:
        item.product?.productTranslations?.find((t) => t.locale === "en")
          ?.slug ??
        item.product?.productTranslations?.[0]?.slug ??
        null,
      sellerName:
        item.seller?.displayName ||
        item.seller?.businessName ||
        "Unknown seller",
    };
  });
}

function isAbandonedCart(
  itemCount: number,
  lastActivity: string | null
): boolean {
  return (
    itemCount > 0 &&
    !!lastActivity &&
    new Date(lastActivity).getTime() <
      Date.now() - ABANDONED_DAYS * 24 * 60 * 60 * 1000
  );
}

const cartListRelations = {
  user: {
    columns: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      isGuest: true,
      receiveMarketingEmails: true,
      preferredLanguage: true,
    },
  },
} as const;

const cartDetailRelations = {
  ...cartListRelations,
  cartItems: {
    with: {
      product: {
        columns: {
          id: true,
          sku: true,
          images: true,
        },
        with: {
          productTranslations: {
            columns: {
              locale: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      seller: {
        columns: {
          id: true,
          displayName: true,
          businessName: true,
        },
      },
    },
  },
} as const;

/** Lightweight list: cart + user + item aggregates (no nested products). */
export async function getPendingCarts(params?: {
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser();

    const limit = params?.limit || 200;
    const offset = params?.offset || 0;

    const cartsList = await db.query.carts.findMany({
      where: eq(carts.status, "active"),
      with: cartListRelations,
      orderBy: [desc(carts.lastActivity)],
      limit,
      offset,
    });

    const cartIds = cartsList.map((cart) => cart.id);
    const aggregates =
      cartIds.length === 0
        ? []
        : await db
            .select({
              cartId: cartItems.cartId,
              itemCount: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int`,
              totalValue: sql<number>`coalesce(sum(${cartItems.quantity} * ${cartItems.price}::numeric), 0)::float`,
            })
            .from(cartItems)
            .where(inArray(cartItems.cartId, cartIds))
            .groupBy(cartItems.cartId);

    const aggregatesByCartId = new Map(
      aggregates.map((row) => [
        row.cartId,
        {
          itemCount: Number(row.itemCount ?? 0),
          totalValue: Number(row.totalValue ?? 0),
        },
      ])
    );

    const [totalCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(carts)
      .where(eq(carts.status, "active"));

    const data = cartsList.map((cart) => {
      const lastActivity =
        cart.lastActivity ?? cart.updatedAt ?? cart.createdAt;
      const { itemCount, totalValue } = aggregatesByCartId.get(cart.id) ?? {
        itemCount: 0,
        totalValue: 0,
      };

      return {
        id: cart.id,
        userId: cart.userId,
        sessionId: cart.sessionId,
        status: cart.status ?? "active",
        currency: cart.currency ?? "EGP",
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        lastActivity,
        itemCount,
        totalValue,
        isAbandoned: isAbandonedCart(itemCount, lastActivity),
        user: mapUser(cart.user),
        items: [] as ReturnType<typeof mapCartItems>,
      };
    });

    return {
      success: true,
      data,
      totalCount: Number(totalCountRow?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching pending carts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Full cart detail for quick-view (includes nested product/seller). */
export async function getPendingCartById(cartId: string) {
  try {
    await getAdminUser();

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, cartId), eq(carts.status, "active")),
      with: cartDetailRelations,
    });

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    const items = mapCartItems(cart.cartItems ?? []);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const lastActivity =
      cart.lastActivity ?? cart.updatedAt ?? cart.createdAt;

    return {
      success: true,
      data: {
        id: cart.id,
        userId: cart.userId,
        sessionId: cart.sessionId,
        status: cart.status ?? "active",
        currency: cart.currency ?? "EGP",
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        lastActivity,
        itemCount,
        totalValue,
        isAbandoned: isAbandonedCart(itemCount, lastActivity),
        user: mapUser(cart.user),
        items,
      },
    };
  } catch (error) {
    console.error("Error fetching pending cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPendingCartStats() {
  try {
    await getAdminUser();

    const cutoff = abandonedCutoffIso();

    const [activeResult, withItemsResult, valueResult, abandonedResult] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(carts)
          .where(eq(carts.status, "active")),
        db.execute(sql`
          SELECT count(DISTINCT ${carts.id})::int AS count
          FROM ${carts}
          INNER JOIN ${cartItems} ON ${cartItems.cartId} = ${carts.id}
          WHERE ${carts.status} = 'active'
        `),
        db.execute(sql`
          SELECT coalesce(sum(${cartItems.quantity} * ${cartItems.price}::numeric), 0)::float AS total
          FROM ${cartItems}
          INNER JOIN ${carts} ON ${carts.id} = ${cartItems.cartId}
          WHERE ${carts.status} = 'active'
        `),
        db.execute(sql`
          SELECT count(DISTINCT ${carts.id})::int AS count
          FROM ${carts}
          INNER JOIN ${cartItems} ON ${cartItems.cartId} = ${carts.id}
          WHERE ${carts.status} = 'active'
            AND ${carts.lastActivity} < ${cutoff}
        `),
      ]);

    const withItemsRows = Array.isArray(withItemsResult)
      ? withItemsResult
      : ((withItemsResult as { rows?: Array<Record<string, unknown>> }).rows ??
        []);
    const valueRows = Array.isArray(valueResult)
      ? valueResult
      : ((valueResult as { rows?: Array<Record<string, unknown>> }).rows ?? []);
    const abandonedRows = Array.isArray(abandonedResult)
      ? abandonedResult
      : ((abandonedResult as { rows?: Array<Record<string, unknown>> }).rows ??
        []);

    return {
      success: true,
      data: {
        activeCarts: Number(activeResult[0]?.count ?? 0),
        withItems: Number((withItemsRows[0] as { count?: number })?.count ?? 0),
        cartValue: Number((valueRows[0] as { total?: number })?.total ?? 0),
        abandoned: Number((abandonedRows[0] as { count?: number })?.count ?? 0),
        abandonedDays: ABANDONED_DAYS,
      },
    };
  } catch (error) {
    console.error("Error fetching pending cart stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
