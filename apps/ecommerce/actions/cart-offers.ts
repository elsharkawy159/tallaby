"use server";

import { cacheProfiles, createCachedQuery, productTags, storeTags } from "@workspace/cache";
import { and, asc, cartItems, couponUsage, coupons, db, eq, inArray, isNull, productQuantityOffers, products, productTranslations, productVariants, sql } from "@workspace/db";
import { giftRuleReached, isRuleLive } from "@workspace/lib/orders/automatic-discounts";
import { isCouponAllowedOnChannel, isLineEligibleForCoupon } from "@workspace/lib/orders/coupon-scope";
import { giftUnitAvailable, removeInvalidCartGifts, storeCartDiscounts } from "@workspace/lib/orders/line-discounts/server";
import type { LineOfferKind } from "@workspace/lib/orders/line-discounts";
import type { QuantityOfferType } from "@workspace/lib/orders/quantity-offers";
import { storeSellsProduct } from "@workspace/lib/stores/server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getPendingCouponCode } from "@/lib/affiliate-coupon-cookie";
import { touchCartActivity } from "@/lib/cart-activity.server";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { activeCartWhere, getCartScope } from "@/lib/storefront.server";
import { isSwitchOn } from "@/lib/platform-switches.server";
import { productShownInStore } from "@workspace/lib/stores/scope/server";

export type QuantityTierCard = {
  minQuantity: number;
  discountType: QuantityOfferType;
  discountValue: number;
};

/**
 * The active tiers a product page shows, only for a product this store shows
 * (`productInStore`, scope `shown`). Per store and catalog mode (F-87c). A
 * preview: the checkout reads them fresh.
 */
const loadTiers = createCachedQuery({
  name: "storefront:quantity-offers:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, productId: string, _catalogSplit: boolean) => [
    productTags.quantityOffers(sellerId, productId),
    productTags.detail(productId),
    storeTags.catalog(sellerId, storeId),
  ],
  query: async (sellerId: string, storeId: string, productId: string, catalogSplit: boolean): Promise<QuantityTierCard[]> => {
    const rows = await db
      .select({ minQuantity: productQuantityOffers.minQuantity, discountType: productQuantityOffers.discountType, discountValue: productQuantityOffers.discountValue })
      .from(productQuantityOffers)
      .innerJoin(products, eq(products.id, productQuantityOffers.productId))
      .where(
        and(
          eq(productQuantityOffers.sellerId, sellerId),
          eq(productQuantityOffers.productId, productId),
          eq(productQuantityOffers.isActive, true),
          productShownInStore({ storeId, catalogSplit }),
        ),
      )
      .orderBy(asc(productQuantityOffers.minQuantity));
    return rows.map((row) => ({
      minQuantity: row.minQuantity,
      discountType: row.discountType === "fixed" ? "fixed" : "percent",
      discountValue: Number(row.discountValue),
    }));
  },
});

/** The tiers of a product, for this request's own store. The seller comes from the host. */
export async function getQuantityTiers(productId: string): Promise<QuantityTierCard[]> {
  try {
    const scope = await getCartScope();
    if (!scope?.sellerId || typeof productId !== "string") return [];
    return await loadTiers(scope.sellerId, scope.storeId, productId, await isSwitchOn("stores_catalog_split"));
  } catch (error) {
    console.error("[quantity-offers] tiers failed", (error as Error)?.name);
    return [];
  }
}

export type CartCouponCard = {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minimumPurchase: number | null;
  /** The cart reaches the coupon's minimum. */
  usable: boolean;
};

export type CartGiftChoice = {
  ruleId: string;
  ruleName: string;
  /** The gift this customer already picked for this rule. */
  chosenProductId: string | null;
  products: { id: string; title: string; image: string | null; variants: { id: string; title: string }[] }[];
};

export type CartOffersView = {
  /** Per cart item id: what its offer takes off, in piastres. */
  lines: Record<string, { kind: LineOfferKind; discountPiastres: number; label?: string }>;
  totalPiastres: number;
  coupons: CartCouponCard[];
  appliedCouponCode: string | null;
  gifts: CartGiftChoice[];
  /** The nearest gift the cart has not reached, and how much more it needs. */
  nextGift: { ruleName: string; shortPiastres: number } | null;
  /** Gift lines just taken out because they no longer qualify. */
  removedGifts: boolean;
};

const EMPTY_VIEW: CartOffersView = { lines: {}, totalPiastres: 0, coupons: [], appliedCouponCode: null, gifts: [], nextGift: null, removedGifts: false };

/** The seller's coupons they chose to show in the cart, that this customer can still use. Never cached. */
async function loadCartCoupons(
  sellerId: string,
  userId: string,
  lines: readonly { productId: string; sellerId: string; netPiastres: number }[],
): Promise<CartCouponCard[]> {
  const rows = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.sellerId, sellerId),
        eq(coupons.showInCart, true),
        eq(coupons.isActive, true),
        sql`${coupons.startsAt} <= NOW()`,
        sql`${coupons.expiresAt} >= NOW()`,
        sql`(${coupons.usageLimit} IS NULL OR COALESCE(${coupons.usageCount}, 0) < ${coupons.usageLimit})`,
      ),
    )
    .orderBy(asc(coupons.expiresAt))
    .limit(10);
  if (rows.length === 0) return [];

  const usage = await db
    .select({ couponId: couponUsage.couponId, count: sql<number>`count(*)::int` })
    .from(couponUsage)
    .where(and(eq(couponUsage.userId, userId), inArray(couponUsage.couponId, rows.map((row) => row.id))))
    .groupBy(couponUsage.couponId);
  const used = new Map(usage.map((row) => [row.couponId, row.count]));

  return rows.flatMap((coupon): CartCouponCard[] => {
    if (!isCouponAllowedOnChannel(coupon, "storefront")) return [];
    const count = used.get(coupon.id) ?? 0;
    if ((coupon.isOneTimeUse && count > 0) || (coupon.perUserLimit !== null && count >= coupon.perUserLimit)) return [];
    const eligible = lines.filter((line) => isLineEligibleForCoupon(coupon, line));
    if (eligible.length === 0) return [];
    const eligiblePiastres = eligible.reduce((sum, line) => sum + line.netPiastres, 0);
    const minimum = coupon.minimumPurchase === null ? null : Number(coupon.minimumPurchase);
    return [
      {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minimumPurchase: minimum,
        usable: minimum === null || eligiblePiastres >= Math.round(minimum * 100),
      },
    ];
  });
}

/**
 * What the offers take off this customer's cart, priced by the same function as
 * the order, plus the coupons and gifts on offer. Never cached. Marketplace carts
 * have none.
 */
export async function getCartOffers(): Promise<CartOffersView> {
  try {
    const userId = await getCurrentUserId();
    const scope = await getCartScope();
    if (!userId || !scope) return EMPTY_VIEW;
    const cart = await db.query.carts.findFirst({ where: activeCartWhere(userId, scope) });
    if (!cart) return EMPTY_VIEW;
    const removed = await removeInvalidCartGifts(cart);
    const items = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.savedForLater, false)));
    if (items.length === 0) return { ...EMPTY_VIEW, removedGifts: removed.length > 0 };

    const offers = await storeCartDiscounts(cart.storeId, items);
    const lines: CartOffersView["lines"] = {};
    items.forEach((item, index) => {
      const offer = offers.lines[index];
      if (offer) lines[item.id] = { kind: offer.kind, discountPiastres: offer.discountPiastres, label: offer.label };
    });

    const [cartCoupons, appliedCouponCode, giftView] = await Promise.all([
      loadCartCoupons(
        scope.sellerId,
        userId,
        items
          .filter((item) => !item.giftRuleId)
          .map((item) => ({
            productId: item.productId,
            sellerId: item.sellerId,
            netPiastres: Math.round(Number(item.price) * 100) * item.quantity - (offers.lines[items.indexOf(item)]?.discountPiastres ?? 0),
          })),
      ),
      getPendingCouponCode(),
      loadGiftChoices(scope.storeId, offers, items),
    ]);
    return {
      lines,
      totalPiastres: offers.totalPiastres,
      coupons: cartCoupons,
      appliedCouponCode: appliedCouponCode ?? null,
      gifts: giftView.gifts,
      nextGift: giftView.nextGift,
      removedGifts: removed.length > 0,
    };
  } catch (error) {
    console.error("[cart-offers] failed", (error as Error)?.name);
    return EMPTY_VIEW;
  }
}

async function loadGiftChoices(
  storeId: string,
  offers: Awaited<ReturnType<typeof storeCartDiscounts>>,
  items: readonly { productId: string; giftRuleId: string | null }[],
): Promise<Pick<CartOffersView, "gifts" | "nextGift">> {
  const now = new Date();
  const store = { sellerId: offers.sellerId, storeId };
  const live = offers.rules.filter((rule) => rule.ruleType === "free_gift" && isRuleLive(rule, store, now));
  if (live.length === 0 || offers.paidUnits <= 0) return { gifts: [], nextGift: null };

  const reached = live.filter((rule) => giftRuleReached(rule, offers));
  const short = live
    .filter((rule) => !reached.includes(rule))
    .map((rule) => ({ ruleName: rule.name, shortPiastres: (rule.minSubtotalPiastres ?? 0) - offers.netPiastres }))
    .sort((a, b) => a.shortPiastres - b.shortPiastres);
  const nextGift = short[0] ?? null;
  if (reached.length === 0) return { gifts: [], nextGift };

  const ids = [...new Set(reached.flatMap((rule) => rule.giftProductIds))];
  const locale = await getLocale();
  const [rows, titles, variants] = await Promise.all([
    db.select().from(products).where(and(inArray(products.id, ids), eq(products.status, "active"), isNull(products.deletedAt))),
    db.select().from(productTranslations).where(inArray(productTranslations.productId, ids)),
    db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
  ]);
  const choices = await Promise.all(
    rows.map(async (product) => {
      if (!(await storeSellsProduct(storeId, product.id))) return null;
      const tracked = product.trackStock !== false;
      const own = variants.filter((variant) => variant.productId === product.id);
      const inStock = own.filter((variant) => !tracked || Number(variant.stock ?? 0) > 0);
      if (own.length > 0 ? inStock.length === 0 : tracked && Number(product.quantity ?? 0) <= 0) return null;
      const translations = titles.filter((title) => title.productId === product.id);
      return {
        id: product.id,
        title: (translations.find((title) => title.locale === locale) ?? translations[0])?.title ?? "",
        image: (product.images as string[] | null)?.[0] ?? null,
        variants: inStock.map((variant) => ({ id: variant.id, title: variant.title ?? "" })),
      };
    }),
  );
  const available = choices.filter((choice) => choice !== null);
  const gifts = reached.flatMap((rule): CartGiftChoice[] => {
    const own = available.filter((choice) => rule.giftProductIds.includes(choice.id));
    if (own.length === 0) return [];
    return [
      {
        ruleId: rule.id,
        ruleName: rule.name,
        chosenProductId: items.find((item) => item.giftRuleId === rule.id)?.productId ?? null,
        products: own,
      },
    ];
  });
  return { gifts, nextGift };
}

/**
 * Puts a free gift in this customer's cart, replacing their earlier pick for the
 * rule. The rule, the amount, the product, the variant and the stock are all checked
 * here against the database, and again when the order is placed. Price 0, quantity 1.
 */
export async function chooseFreeGift(input: { ruleId: string; productId: string; variantId?: string | null }): Promise<{ success: boolean }> {
  try {
    const userId = await getCurrentUserId();
    const scope = await getCartScope();
    if (!userId || !scope || typeof input?.ruleId !== "string" || typeof input?.productId !== "string") return { success: false };
    const cart = await db.query.carts.findFirst({ where: activeCartWhere(userId, scope) });
    if (!cart || cart.storeId !== scope.storeId) return { success: false };

    const items = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.savedForLater, false)));
    const offers = await storeCartDiscounts(cart.storeId, items);
    const rule = offers.rules.find((candidate) => candidate.id === input.ruleId);
    if (
      !rule ||
      rule.ruleType !== "free_gift" ||
      !isRuleLive(rule, { sellerId: offers.sellerId, storeId: scope.storeId }, new Date()) ||
      !giftRuleReached(rule, offers) ||
      !rule.giftProductIds.includes(input.productId)
    ) {
      return { success: false };
    }

    const own = await db.select().from(productVariants).where(eq(productVariants.productId, input.productId));
    const variant = own.find((row) => row.id === input.variantId) ?? null;
    if (own.length > 0 && !variant) return { success: false };
    if (!(await giftUnitAvailable(scope.storeId, offers.sellerId, input.productId, variant?.id ?? null))) return { success: false };

    await db.transaction(async (tx) => {
      await tx.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.giftRuleId, rule.id)));
      await tx.insert(cartItems).values({
        cartId: cart.id,
        productId: input.productId,
        sellerId: offers.sellerId!,
        quantity: 1,
        price: "0.00",
        giftRuleId: rule.id,
        variant: variant
          ? {
              id: variant.id,
              title: variant.title,
              price: variant.price,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              sku: variant.sku,
              imageUrl: variant.imageUrl,
            }
          : null,
      });
    });
    await touchCartActivity(cart.id);
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("[cart-offers] gift failed", (error as Error)?.name);
    return { success: false };
  }
}
