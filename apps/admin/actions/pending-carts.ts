"use server";

import { db } from "@workspace/db";
import { carts, cartItems } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
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

function mapCartRow(cart: {
  id: string;
  userId: string;
  sessionId: string | null;
  status: string | null;
  currency: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActivity: string | null;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    isGuest: boolean;
    receiveMarketingEmails: boolean | null;
    preferredLanguage: string | null;
  } | null;
  cartItems: Array<{
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
      productTranslations?: Array<{ locale: string; title: string; slug: string | null }>;
    } | null;
    seller: {
      id: string;
      displayName: string;
      businessName?: string | null;
    } | null;
  }>;
}) {
  const items = (cart.cartItems ?? []).map((item) => {
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const lastActivity = cart.lastActivity ?? cart.updatedAt ?? cart.createdAt;
  const isAbandoned =
    itemCount > 0 &&
    !!lastActivity &&
    new Date(lastActivity).getTime() < Date.now() - ABANDONED_DAYS * 24 * 60 * 60 * 1000;

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
    isAbandoned,
    user: cart.user
      ? {
          id: cart.user.id,
          fullName: cart.user.fullName,
          email: cart.user.email,
          phone: cart.user.phone,
          avatarUrl: cart.user.avatarUrl,
          isGuest: cart.user.isGuest,
          receiveMarketingEmails: cart.user.receiveMarketingEmails ?? true,
          preferredLanguage: cart.user.preferredLanguage,
        }
      : null,
    items,
  };
}

const cartWithRelations = {
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

export async function getPendingCarts(params?: {
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser();

    const cartsList = await db.query.carts.findMany({
      where: eq(carts.status, "active"),
      with: cartWithRelations,
      orderBy: [desc(carts.lastActivity)],
      limit: params?.limit || 200,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(carts)
      .where(eq(carts.status, "active"));

    return {
      success: true,
      data: cartsList.map(mapCartRow),
      totalCount: Number(totalCount[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching pending carts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPendingCartById(cartId: string) {
  try {
    await getAdminUser();

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, cartId), eq(carts.status, "active")),
      with: cartWithRelations,
    });

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    return {
      success: true,
      data: mapCartRow(cart),
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
