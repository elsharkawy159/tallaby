"use server";

import { revalidatePath } from "next/cache";
import { db } from "@workspace/db";
import { carts, cartItems, userAddresses, users } from "@workspace/db";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getAdminUser } from "./auth";

const ABANDONED_DAYS = 7;

export type PendingCartsView = "all" | "with-items" | "abandoned";
export type PendingCartsSortId =
  | "lastActivity"
  | "createdAt"
  | "itemCount"
  | "totalValue";

export interface PendingCartsQuery {
  limit?: number;
  offset?: number;
  view?: PendingCartsView;
  search?: string;
  /** "reminded" | "not-reminded" */
  reminder?: string[];
  /** "guest" | "registered" */
  customer?: string[];
  /** "opted-in" | "opted-out" */
  marketing?: string[];
  sort?: { id: PendingCartsSortId; desc: boolean } | null;
}

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

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * `cart_items.variant` is a snapshot written by the storefront's addToCart:
 * { id, title, price (jsonb), option1-3, sku, imageUrl }. Pick out the
 * display fields; price comes from `cart_items.price` instead.
 */
function parseVariantSnapshot(variant: unknown) {
  if (!variant || typeof variant !== "object") {
    return {
      variantTitle: nonEmptyString(variant),
      variantOptions: [] as string[],
      variantSku: null,
      variantImage: null,
    };
  }
  const snapshot = variant as Record<string, unknown>;
  return {
    variantTitle: nonEmptyString(snapshot.title),
    variantOptions: [snapshot.option1, snapshot.option2, snapshot.option3]
      .map(nonEmptyString)
      .filter((option): option is string => option !== null),
    variantSku: nonEmptyString(snapshot.sku),
    variantImage: nonEmptyString(snapshot.imageUrl),
  };
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
    const variant = parseVariantSnapshot(item.variant);
    return {
      id: item.id,
      productId: item.productId,
      sellerId: item.sellerId,
      quantity,
      price,
      lineTotal: price * quantity,
      savedForLater: item.savedForLater ?? false,
      ...variant,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productTitle: getProductTitle(item.product?.productTranslations),
      productSku: item.product?.sku ?? null,
      productImage:
        variant.variantImage ?? getProductImage(item.product?.images),
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

const cartDetailRelations = {
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

/** Per-cart item aggregates, joined into the list query. */
function cartItemAggregates() {
  return db
    .select({
      cartId: cartItems.cartId,
      itemCount:
        sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int`.as(
          "item_count"
        ),
      totalValue:
        sql<number>`coalesce(sum(${cartItems.quantity} * ${cartItems.price}::numeric), 0)::float`.as(
          "total_value"
        ),
    })
    .from(cartItems)
    .groupBy(cartItems.cartId)
    .as("cart_item_agg");
}

/** Server-side filtered, sorted and paginated list (no nested items). */
export async function getPendingCarts(params: PendingCartsQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;
    const agg = cartItemAggregates();
    const itemCount = sql<number>`coalesce(${agg.itemCount}, 0)`;
    const totalValue = sql<number>`coalesce(${agg.totalValue}, 0)`;
    const lastActivity = sql<string>`coalesce(${carts.lastActivity}, ${carts.updatedAt}, ${carts.createdAt})`;

    const conditions: SQL[] = [eq(carts.status, "active")];

    if (params.view === "with-items" || params.view === "abandoned") {
      conditions.push(sql`${itemCount} > 0`);
    }
    if (params.view === "abandoned") {
      conditions.push(sql`${lastActivity} < ${abandonedCutoffIso()}`);
    }

    const reminder = new Set(params.reminder ?? []);
    if (reminder.size === 1) {
      conditions.push(
        reminder.has("reminded")
          ? isNotNull(carts.reminderSentAt)
          : isNull(carts.reminderSentAt)
      );
    }

    const customer = new Set(params.customer ?? []);
    if (customer.size === 1) {
      conditions.push(eq(users.isGuest, customer.has("guest")));
    }

    const marketing = new Set(params.marketing ?? []);
    if (marketing.size === 1) {
      conditions.push(
        marketing.has("opted-in")
          ? sql`coalesce(${users.receiveMarketingEmails}, true) = true`
          : sql`${users.receiveMarketingEmails} = false`
      );
    }

    const search = params.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.fullName, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern),
          sql`${carts.id}::text ilike ${pattern}`
        )!
      );
    }

    const where = and(...conditions);
    const sortColumn = {
      lastActivity,
      createdAt: carts.createdAt,
      itemCount,
      totalValue,
    }[params.sort?.id ?? "lastActivity"];
    const direction = params.sort?.desc === false ? asc : desc;

    // Sequential on purpose — see getPendingCartStats for the pool deadlock.
    const rows = await db
      .select({
        id: carts.id,
        userId: carts.userId,
        sessionId: carts.sessionId,
        status: carts.status,
        currency: carts.currency,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
        lastActivity,
        reminderSentAt: carts.reminderSentAt,
        itemCount,
        totalValue,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          isGuest: users.isGuest,
          receiveMarketingEmails: users.receiveMarketingEmails,
          preferredLanguage: users.preferredLanguage,
        },
      })
      .from(carts)
      .leftJoin(users, eq(users.id, carts.userId))
      .leftJoin(agg, eq(agg.cartId, carts.id))
      .where(where)
      .orderBy(sql`${direction(sortColumn)} nulls last`, desc(carts.id))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(carts)
      .leftJoin(users, eq(users.id, carts.userId))
      .leftJoin(agg, eq(agg.cartId, carts.id))
      .where(where);

    const data = rows.map((row) => {
      const count = Number(row.itemCount ?? 0);
      return {
        id: row.id,
        userId: row.userId,
        sessionId: row.sessionId,
        status: row.status ?? "active",
        currency: row.currency ?? "EGP",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        lastActivity: row.lastActivity,
        reminderSentAt: row.reminderSentAt,
        itemCount: count,
        totalValue: Number(row.totalValue ?? 0),
        isAbandoned: isAbandonedCart(count, row.lastActivity),
        user: row.user?.id ? mapUser(row.user) : null,
        fallbackPhone: null as string | null,
        items: [] as ReturnType<typeof mapCartItems>,
      };
    });

    return {
      success: true,
      data,
      totalCount: Number(countRow?.count ?? 0),
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

    // WhatsApp fallback when the account itself has no phone on file.
    const [address] = cart.user?.phone
      ? []
      : await db
          .select({ phone: userAddresses.phone })
          .from(userAddresses)
          .where(eq(userAddresses.userId, cart.userId))
          .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt))
          .limit(1);

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
        reminderSentAt: cart.reminderSentAt,
        itemCount,
        totalValue,
        isAbandoned: isAbandonedCart(itemCount, lastActivity),
        user: mapUser(cart.user),
        fallbackPhone: address?.phone ?? null,
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

/**
 * Record that a WhatsApp reminder was sent. Only the first call wins, so two
 * admins can't both remind the same customer.
 */
export async function markCartReminded(cartId: string) {
  try {
    const { user } = await getAdminUser();

    const [updated] = await db
      .update(carts)
      .set({
        reminderSentAt: sql`now()`,
        // The auth id may not have a public.users row; keep the FK valid.
        reminderSentBy: sql`(select ${users.id} from ${users} where ${users.id} = ${user.id})`,
      })
      .where(and(eq(carts.id, cartId), isNull(carts.reminderSentAt)))
      .returning({ reminderSentAt: carts.reminderSentAt });

    if (!updated) {
      const [existing] = await db
        .select({ reminderSentAt: carts.reminderSentAt })
        .from(carts)
        .where(eq(carts.id, cartId))
        .limit(1);
      if (!existing) return { success: false, error: "Cart not found" };
      return {
        success: false,
        alreadyReminded: true,
        reminderSentAt: existing.reminderSentAt,
        error: "A reminder was already sent for this cart",
      };
    }

    revalidatePath("/pending-carts");
    return { success: true, reminderSentAt: updated.reminderSentAt };
  } catch (error) {
    console.error("Error marking cart reminded:", error);
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

    // One round-trip. A 4-way Promise.all here oversubscribed the serverless
    // postgres-js pool (max:4 on Vercel + sidebar layout queries) and wedged
    // forever against the :6543 transaction pooler — Suspense never resolved.
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM ${carts} WHERE ${carts.status} = 'active') AS active_carts,
        (
          SELECT count(DISTINCT ${carts.id})::int
          FROM ${carts}
          INNER JOIN ${cartItems} ON ${cartItems.cartId} = ${carts.id}
          WHERE ${carts.status} = 'active'
        ) AS with_items,
        (
          SELECT coalesce(sum(${cartItems.quantity} * ${cartItems.price}::numeric), 0)::float
          FROM ${cartItems}
          INNER JOIN ${carts} ON ${carts.id} = ${cartItems.cartId}
          WHERE ${carts.status} = 'active'
        ) AS cart_value,
        (
          SELECT count(DISTINCT ${carts.id})::int
          FROM ${carts}
          INNER JOIN ${cartItems} ON ${cartItems.cartId} = ${carts.id}
          WHERE ${carts.status} = 'active'
            AND coalesce(${carts.lastActivity}, ${carts.updatedAt}, ${carts.createdAt}) < ${cutoff}
        ) AS abandoned,
        (
          SELECT count(*)::int FROM ${carts}
          WHERE ${carts.status} = 'active' AND ${carts.reminderSentAt} IS NOT NULL
        ) AS reminded
    `);

    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);
    const row = (rows[0] ?? {}) as Record<string, unknown>;

    return {
      success: true,
      data: {
        activeCarts: Number(row.active_carts ?? 0),
        withItems: Number(row.with_items ?? 0),
        cartValue: Number(row.cart_value ?? 0),
        abandoned: Number(row.abandoned ?? 0),
        reminded: Number(row.reminded ?? 0),
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
