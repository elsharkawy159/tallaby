import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { decrementStock, InsufficientStockError, restoreStock } from "./stock";
import { claimCouponUsage } from "../coupons/claim";

// Mirrors packages/db/src/drizzle/database.ts's schema merge exactly — the
// production db.transaction()'s `tx` type only structurally matches this
// merged shape (schema + relations), not the raw schema module alone.
// Built locally rather than importing database.ts itself, which opens a
// connection to DATABASE_URL as a side effect of import.
const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Integration tests against a REAL Postgres instance — these exercise the
 * actual concurrency guarantees (atomic UPDATE ... WHERE, CHECK constraints)
 * that cannot be verified against a mock. Skipped entirely when
 * TEST_DATABASE_URL is not set (e.g. in an environment with no scratch DB).
 *
 * Point TEST_DATABASE_URL at a disposable database — this suite creates and
 * deletes real rows in products/product_variants/coupons/users/categories/sellers.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("inventory concurrency (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused");
  const db = drizzle(client, { schema });

  let sellerId: string;
  let categoryId: string;

  async function makeProduct(quantity: number) {
    const id = randomUUID();
    await db.insert(schema.products).values({
      id,
      sellerId,
      categoryId,
      sku: `test-${id}`,
      quantity: String(quantity),
      status: "active",
      price: { base: 10, list: 10, final: 10 },
    });
    return id;
  }

  async function makeVariant(productId: string, stock: number) {
    const id = randomUUID();
    await db.insert(schema.productVariants).values({
      id,
      productId,
      title: "Test variant",
      stock,
    });
    return id;
  }

  async function makeCoupon(usageLimit: number | null) {
    const id = randomUUID();
    await db.insert(schema.coupons).values({
      id,
      code: `TEST-${id}`,
      name: "Test coupon",
      discountType: "fixed_amount",
      discountValue: "5",
      usageLimit: usageLimit ?? undefined,
      usageCount: 0,
      startsAt: new Date(Date.now() - 86_400_000).toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    return id;
  }

  beforeAll(async () => {
    const userId = randomUUID();
    await db.insert(schema.users).values({ id: userId, isGuest: true });
    sellerId = userId;
    await db.insert(schema.sellers).values({
      id: sellerId,
      businessName: "Test Seller",
      displayName: "Test Seller",
      slug: `test-seller-${randomUUID()}`,
      businessType: "individual",
      legalAddress: {},
      supportEmail: "test@example.com",
    });

    const catId = randomUUID();
    await db.insert(schema.categories).values({ id: catId, name: "Test Category", slug: `test-cat-${catId}` });
    categoryId = catId;
  });

  afterAll(async () => {
    await db.delete(schema.products).where(eq(schema.products.sellerId, sellerId));
    await db.delete(schema.sellers).where(eq(schema.sellers.id, sellerId));
    await db.delete(schema.users).where(eq(schema.users.id, sellerId));
    await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
    await client.end();
  });

  it("exactly one of N concurrent orders succeeds when stock is 1, and stock never goes negative", async () => {
    const productId = await makeProduct(1);
    const attempts = 5;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        db.transaction((tx) => decrementStock(tx, [{ kind: "product", id: productId, quantity: 1 }]))
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(attempts - 1);
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError);
    }

    const [row] = await db
      .select({ quantity: schema.products.quantity })
      .from(schema.products)
      .where(eq(schema.products.id, productId));
    expect(Number(row?.quantity)).toBe(0);
  });

  it("exactly one of N concurrent orders succeeds against variant stock of 1", async () => {
    const productId = await makeProduct(100);
    const variantId = await makeVariant(productId, 1);
    const attempts = 5;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        db.transaction((tx) => decrementStock(tx, [{ kind: "variant", id: variantId, quantity: 1 }]))
      )
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);

    const [row] = await db
      .select({ stock: schema.productVariants.stock })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, variantId));
    expect(row?.stock).toBe(0);
  });

  it("a multi-line order decrements all lines atomically with no deadlock under crossed concurrent ordering", async () => {
    const productA = await makeProduct(10);
    const productB = await makeProduct(10);

    // Two transactions touch the same two rows in opposite order; sortedLines()
    // inside decrementStock should make both acquire locks in the same order.
    const results = await Promise.allSettled([
      db.transaction((tx) =>
        decrementStock(tx, [
          { kind: "product", id: productA, quantity: 1 },
          { kind: "product", id: productB, quantity: 1 },
        ])
      ),
      db.transaction((tx) =>
        decrementStock(tx, [
          { kind: "product", id: productB, quantity: 1 },
          { kind: "product", id: productA, quantity: 1 },
        ])
      ),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const rows = await db
      .select({ id: schema.products.id, quantity: schema.products.quantity })
      .from(schema.products)
      .where(eq(schema.products.sellerId, sellerId));
    for (const r of rows) {
      if (r.id === productA || r.id === productB) expect(Number(r.quantity)).toBe(8);
    }
  });

  it("the non-negative CHECK constraint rejects a write that would drive stock negative outside the guarded path", async () => {
    const productId = await makeProduct(1);
    await expect(
      db.execute(
        sql`update products set quantity = quantity - 5 where id = ${productId}`
      )
    ).rejects.toThrow();
  });

  it("restoreStock reverses a decrement and reports the boundary crossing back to in-stock", async () => {
    const productId = await makeProduct(1);
    await db.transaction((tx) => decrementStock(tx, [{ kind: "product", id: productId, quantity: 1 }]));

    const [result] = await db.transaction((tx) =>
      restoreStock(tx, [{ kind: "product", id: productId, quantity: 1 }])
    );
    expect(result?.stockBoundaryCrossed).toBe(true);
    expect(result?.quantity).toBe(1);
  });

  it("concurrent double-cancel restores stock exactly once per legitimate cancellation (idempotent guard is the caller's WHERE status IN (...))", async () => {
    // restoreStock itself is not idempotent by design (it's a plain atomic +N) —
    // idempotency against double-cancel is enforced by the order-status
    // transition guard in the caller (WHERE status IN (cancellable) RETURNING),
    // which ensures restoreStock is invoked at most once per order. This test
    // documents that restoreStock always adds when called, so the guard is load-bearing.
    const productId = await makeProduct(0);
    const [a, b] = await Promise.all([
      db.transaction((tx) => restoreStock(tx, [{ kind: "product", id: productId, quantity: 1 }])),
      db.transaction((tx) => restoreStock(tx, [{ kind: "product", id: productId, quantity: 1 }])),
    ]);
    expect(a[0]?.quantity).toBeDefined();
    expect(b[0]?.quantity).toBeDefined();

    const [row] = await db
      .select({ quantity: schema.products.quantity })
      .from(schema.products)
      .where(eq(schema.products.id, productId));
    // Both calls succeeded and both added 1 -- proving restoreStock alone does
    // NOT guard against being called twice; the order-status transition must.
    expect(Number(row?.quantity)).toBe(2);
  });

  it("a failure mid-transaction leaves stock untouched (rollback)", async () => {
    const productId = await makeProduct(5);
    await expect(
      db.transaction(async (tx) => {
        await decrementStock(tx, [{ kind: "product", id: productId, quantity: 1 }]);
        throw new Error("simulated failure after decrement, before commit");
      })
    ).rejects.toThrow("simulated failure");

    const [row] = await db
      .select({ quantity: schema.products.quantity })
      .from(schema.products)
      .where(eq(schema.products.id, productId));
    expect(Number(row?.quantity)).toBe(5);
  });

  it("coupon usageLimit is never exceeded under concurrent claims", async () => {
    const couponId = await makeCoupon(3);
    const attempts = 10;

    const results = await Promise.all(
      Array.from({ length: attempts }, () => db.transaction((tx) => claimCouponUsage(tx, couponId)))
    );
    const claimed = results.filter(Boolean).length;
    expect(claimed).toBe(3);

    const [row] = await db
      .select({ usageCount: schema.coupons.usageCount })
      .from(schema.coupons)
      .where(eq(schema.coupons.id, couponId));
    expect(row?.usageCount).toBe(3);
  });

  it("an unlimited coupon (usageLimit null) always succeeds", async () => {
    const couponId = await makeCoupon(null);
    const claimed = await db.transaction((tx) => claimCouponUsage(tx, couponId));
    expect(claimed).toBe(true);
  });
});
