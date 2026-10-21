import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Checkout shipping display (store shipping spec §6.5): the summary must show
 * what placeOrderFromCart bills. The store's zones are mocked here; the order
 * side is covered by
 * packages/lib/src/orders/place-order-storefront-shipping.integration.test.ts.
 */
const STORE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock("@workspace/lib/stores/server", () => ({ getStorefrontShippingContext: mocks.context }));

const { getCheckoutShipping } = await import("./shipping.server");
const { buildSummaryWithCoupon, calculateCouponDiscount } = await import("./coupon-utils");
type CouponData = import("./coupon-utils").CouponData;

const scope = { storeId: STORE, sellerId: "s1" } as Parameters<typeof getCheckoutShipping>[2];
const cairo = { country: "Egypt", state: "Cairo", city: "Nasr City" };

const physical = (price: string, over: { freeDelivery?: boolean } = {}) => ({
  quantity: 1,
  price,
  sellerId: "s1",
  product: { productType: "physical", sellerId: "s1", seller: { freeDelivery: over.freeDelivery ?? false } },
});
const digital = (price: string) => ({ quantity: 1, price, sellerId: "s1", product: { productType: "digital", sellerId: "s1" } });

const zoneContext = {
  settings: { method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "refuse" },
  zones: [
    {
      id: "z1",
      nameAr: "القاهرة",
      nameEn: "Cairo",
      places: ["EG/CAIRO"],
      price: 55,
      freeOver: 1000,
      deliveryDaysMin: 1,
      deliveryDaysMax: 3,
      codEnabled: true,
      enabled: true,
    },
  ],
};

const freeShippingCoupon: CouponData = {
  id: "c1",
  sellerId: null,
  code: "FREESHIP",
  name: "Free shipping",
  description: null,
  discountType: "free_shipping",
  discountValue: "0",
  minimumPurchase: null,
  maximumDiscount: null,
  isActive: true,
  isOneTimeUse: false,
  usageLimit: null,
  usageCount: 0,
  perUserLimit: null,
  applicableTo: null,
  excludeItems: null,
  startsAt: "2026-01-01",
  expiresAt: "2027-01-01",
};

/** The base summary the checkout actions build from getCheckoutShipping. */
function baseSummary(subtotal: number, shipping: Awaited<ReturnType<typeof getCheckoutShipping>>) {
  return {
    subtotal,
    tax: 0,
    shippingCost: shipping.shippingCost,
    total: subtotal + (shipping.shippingCost ?? 0),
    itemCount: 1,
    sellerFreeDeliveryDiscount: shipping.sellerFreeDeliveryDiscount,
    storeShipping: shipping.storeShipping,
  };
}

beforeEach(() => {
  mocks.context.mockReset();
  mocks.context.mockResolvedValue(zoneContext);
});

describe("getCheckoutShipping on a store website", () => {
  it("does not run the zone quote for a digital-only cart", async () => {
    // "refuse" would give not_covered for any address if the quote ran.
    const result = await getCheckoutShipping([digital("100.00")], { country: "Egypt", state: "Aswan" }, scope);
    expect(mocks.context).not.toHaveBeenCalled();
    expect(result.storeShipping).toBeNull();
    expect(result.shippingCost).not.toBeNull();
  });

  it("prices a zone order and applies no Tallaby cart threshold", async () => {
    const items = [physical("900.00")];
    const shipping = await getCheckoutShipping(items, cairo, scope);
    expect(shipping).toMatchObject({ shippingCost: 55, sellerFreeDeliveryDiscount: 0, storeShipping: { kind: "zone" } });
    const summary = buildSummaryWithCoupon(baseSummary(900, shipping), null, null);
    // placeOrderFromCart: threshold is 0 on a zone order, so 55 is billed.
    expect(summary.shippingDiscount).toBe(0);
    expect(summary.totalAfterDiscount).toBe(955);
  });

  it("matches placeOrderFromCart for a free-shipping coupon on a zone order", async () => {
    const items = [physical("200.00")];
    const shipping = await getCheckoutShipping(items, cairo, scope);
    const calc = calculateCouponDiscount(
      freeShippingCoupon,
      [{ id: "i1", productId: "p1", sellerId: "s1", quantity: 1, price: "200.00" }],
      shipping.shippingCost ?? 0,
      true,
    );
    const summary = buildSummaryWithCoupon(baseSummary(200, shipping), freeShippingCoupon, calc);
    // placeOrderFromCart: shippingDiscount = max(threshold 0, seller 0, shippingCost 55)
    // = 55; merchandise discount 0; total = 200 + 55 − 55.
    expect(summary.shippingCost).toBe(55);
    expect(summary.discountAmount).toBe(0);
    expect(summary.shippingDiscount).toBe(55);
    expect(summary.totalAfterDiscount).toBe(200);
  });

  it("waives the whole zone price for a seller with free delivery", async () => {
    const items = [physical("200.00", { freeDelivery: true })];
    const shipping = await getCheckoutShipping(items, cairo, scope);
    expect(shipping.shippingCost).toBe(55);
    expect(shipping.sellerFreeDeliveryDiscount).toBe(55);
    const summary = buildSummaryWithCoupon(baseSummary(200, shipping), null, null);
    expect(summary.shippingDiscount).toBe(55);
    expect(summary.totalAfterDiscount).toBe(200);
  });

  it("reports a refused place with no price", async () => {
    const shipping = await getCheckoutShipping([physical("200.00")], { country: "Egypt", state: "Aswan" }, scope);
    expect(shipping).toEqual({ shippingCost: null, sellerFreeDeliveryDiscount: 0, storeShipping: { kind: "not_covered" } });
  });
});
