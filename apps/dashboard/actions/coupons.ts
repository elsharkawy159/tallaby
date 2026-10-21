"use server";

import { db, coupons, couponUsage, products, sellers } from "@workspace/db";
import { uniqueViolationConstraint } from "@workspace/lib/fulfillment/server";
import { parsePriceJson } from "@workspace/lib";
import {
  SELLER_COUPON_DISCOUNT_TYPES,
  getCouponChannels,
  getCouponProductIds,
  type CouponChannel,
  type SellerCouponDiscountType,
} from "@workspace/lib/orders/coupon-scope";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getUser } from "./auth";

export type SellerCouponRow = {
  id: string;
  code: string;
  name: string;
  discountType: SellerCouponDiscountType;
  discountValue: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  productIds: string[] | null;
  channels: CouponChannel[];
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string | null;
  discountGiven: number;
};

export type CouponProductOption = {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  isActive: boolean;
};

export type SellerCouponsPage = {
  coupons: SellerCouponRow[];
  products: CouponProductOption[];
  storeHost: string | null;
};

/** Error codes the client maps to `coupons.errors.*` messages. */
export type SaveCouponError =
  | "unauthorized"
  | "invalid_input"
  | "code_taken"
  | "invalid_dates"
  | "invalid_products"
  | "not_found"
  | "unknown";

const STORE_ROOT_DOMAIN = "tallaby.com";

const optionalAmount = z.number().positive().max(10_000_000).nullable();
const optionalCount = z.number().int().positive().max(1_000_000).nullable();

const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,24}$/),
    name: z.string().trim().min(1).max(80),
    discountType: z.enum(SELLER_COUPON_DISCOUNT_TYPES),
    discountValue: z.number().positive(),
    minimumPurchase: optionalAmount,
    maximumDiscount: optionalAmount,
    usageLimit: optionalCount,
    perUserLimit: optionalCount,
    productIds: z.array(z.string().uuid()).max(500).nullable(),
    // Seller coupons work on the seller's own store(s) only (owner,
    // 2026-10-21): a marketplace channel is refused, not silently kept.
    channels: z.array(z.literal("storefront")).min(1),
    startsAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (v) =>
      v.discountType === "percentage"
        ? v.discountValue <= 90
        : v.discountValue <= 10_000_000,
    { path: ["discountValue"] }
  );

export type SellerCouponInput = z.input<typeof couponInputSchema>;

async function getSellerId() {
  const session = await getUser().catch(() => null);
  return session?.user?.id ?? null;
}

function toRow(
  coupon: typeof coupons.$inferSelect,
  discountGiven: number
): SellerCouponRow {
  return {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    discountType:
      coupon.discountType === "fixed_amount" ? "fixed_amount" : "percentage",
    discountValue: Number(coupon.discountValue),
    minimumPurchase:
      coupon.minimumPurchase != null ? Number(coupon.minimumPurchase) : null,
    maximumDiscount:
      coupon.maximumDiscount != null ? Number(coupon.maximumDiscount) : null,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount ?? 0,
    perUserLimit: coupon.perUserLimit,
    productIds: getCouponProductIds(coupon.applicableTo),
    channels: getCouponChannels(coupon.applicableTo),
    isActive: coupon.isActive ?? false,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    createdAt: coupon.createdAt,
    discountGiven,
  };
}

/** Everything the coupons page needs, in one round trip. */
export async function getSellerCouponsPage(): Promise<SellerCouponsPage> {
  const sellerId = await getSellerId();
  if (!sellerId) return { coupons: [], products: [], storeHost: null };

  const locale = await getLocale();

  const [couponRows, discountRows, productRows, seller] = await Promise.all([
    db.query.coupons.findMany({
      where: eq(coupons.sellerId, sellerId),
      orderBy: [desc(coupons.createdAt)],
    }),
    db
      .select({
        couponId: couponUsage.couponId,
        total: sql<string>`coalesce(sum(${couponUsage.discountAmount}), 0)`,
      })
      .from(couponUsage)
      .innerJoin(coupons, eq(coupons.id, couponUsage.couponId))
      .where(eq(coupons.sellerId, sellerId))
      .groupBy(couponUsage.couponId),
    db.query.products.findMany({
      where: eq(products.sellerId, sellerId),
      columns: { id: true, images: true, price: true, status: true },
      with: { productTranslations: { columns: { locale: true, title: true } } },
      orderBy: [desc(products.createdAt)],
    }),
    db.query.sellers.findFirst({
      where: eq(sellers.id, sellerId),
      columns: { subdomain: true },
    }),
  ]);

  const discountByCoupon = new Map(
    discountRows.map((r) => [r.couponId, Number(r.total)])
  );

  return {
    coupons: couponRows.map((c) => toRow(c, discountByCoupon.get(c.id) ?? 0)),
    products: productRows.map((p) => {
      const translations = p.productTranslations ?? [];
      const title =
        translations.find((t) => t.locale === locale)?.title ??
        translations[0]?.title ??
        "";
      const images = Array.isArray(p.images) ? (p.images as string[]) : [];
      return {
        id: p.id,
        title,
        image: images[0] ?? null,
        price: parsePriceJson(p.price).final ?? null,
        isActive: p.status === "active",
      };
    }),
    storeHost: seller?.subdomain
      ? `${seller.subdomain}.${STORE_ROOT_DOMAIN}`
      : null,
  };
}

/** Creates a coupon, or updates one when `couponId` is given. */
export async function saveSellerCoupon(
  input: SellerCouponInput,
  couponId?: string
): Promise<
  { success: true; data: SellerCouponRow } | { success: false; error: SaveCouponError }
> {
  const sellerId = await getSellerId();
  if (!sellerId) return { success: false, error: "unauthorized" };

  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const v = parsed.data;

  if (new Date(v.expiresAt) <= new Date(v.startsAt)) {
    return { success: false, error: "invalid_dates" };
  }

  const productIds = v.productIds?.length ? [...new Set(v.productIds)] : null;
  if (productIds) {
    const owned = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.sellerId, sellerId), inArray(products.id, productIds)));
    if (owned.length !== productIds.length) {
      return { success: false, error: "invalid_products" };
    }
  }

  const values = {
    code: v.code,
    name: v.name,
    discountType: v.discountType,
    discountValue: v.discountValue.toFixed(2),
    minimumPurchase: v.minimumPurchase?.toFixed(2) ?? null,
    // A cap only means something on a percentage off.
    maximumDiscount:
      v.discountType === "percentage" ? v.maximumDiscount?.toFixed(2) ?? null : null,
    usageLimit: v.usageLimit,
    perUserLimit: v.perUserLimit,
    applicableTo: {
      ...(productIds ? { productIds } : {}),
      channels: [...new Set(v.channels)],
    },
    startsAt: new Date(v.startsAt).toISOString(),
    expiresAt: new Date(v.expiresAt).toISOString(),
  };

  try {
    const [saved] = couponId
      ? await db
          .update(coupons)
          .set({ ...values, updatedAt: new Date().toISOString() })
          .where(and(eq(coupons.id, couponId), eq(coupons.sellerId, sellerId)))
          .returning()
      : await db
          .insert(coupons)
          .values({ ...values, sellerId, isActive: true, usageCount: 0 })
          .returning();

    if (!saved) return { success: false, error: "not_found" };

    revalidatePath("/coupons");
    return { success: true, data: toRow(saved, 0) };
  } catch (error) {
    if (uniqueViolationConstraint(error) !== null) {
      return { success: false, error: "code_taken" };
    }
    console.error("Error saving coupon:", error);
    return { success: false, error: "unknown" };
  }
}

export async function setSellerCouponActive(
  couponId: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  const sellerId = await getSellerId();
  if (!sellerId) return { success: false };

  const updated = await db
    .update(coupons)
    .set({ isActive, updatedAt: new Date().toISOString() })
    .where(and(eq(coupons.id, couponId), eq(coupons.sellerId, sellerId)))
    .returning({ id: coupons.id });

  revalidatePath("/coupons");
  return { success: updated.length > 0 };
}

/**
 * Deletes an unused coupon. A coupon that already discounted an order is
 * kept for the order history and switched off instead.
 */
export async function deleteSellerCoupon(
  couponId: string
): Promise<{ success: boolean; archived?: boolean }> {
  const sellerId = await getSellerId();
  if (!sellerId) return { success: false };

  const owned = await db.query.coupons.findFirst({
    where: and(eq(coupons.id, couponId), eq(coupons.sellerId, sellerId)),
    columns: { id: true },
  });
  if (!owned) return { success: false };

  const used = await db.query.couponUsage.findFirst({
    where: eq(couponUsage.couponId, couponId),
    columns: { id: true },
  });

  if (used) {
    await db
      .update(coupons)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(coupons.id, couponId));
    revalidatePath("/coupons");
    return { success: true, archived: true };
  }

  await db.delete(coupons).where(eq(coupons.id, couponId));
  revalidatePath("/coupons");
  return { success: true };
}
