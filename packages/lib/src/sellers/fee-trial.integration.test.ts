import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { getStoreForEditor, publishStoreSite, saveStorePageDraft } from "../store-sites/server";
import { startFeeTrialIfNeeded } from "./fee-trial.server";

/**
 * Fee trial start (PLAN.md §13.5, P6-03) against a real Postgres with 0059
 * applied (the staging copy). Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const hero = (title: string) => ({
  sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title } }],
});

describe.skipIf(!TEST_DATABASE_URL)("fee trial start (integration)", { timeout: 30_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const created: string[] = [];
  let categoryId: string;

  async function newSeller(opts: { eligible?: boolean } = {}) {
    const id = randomUUID();
    const sub = `ft-${id.slice(0, 8)}`;
    created.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "ft@example.com",
      status: "approved",
      ...(opts.eligible === undefined ? {} : { feeTrialEligible: opts.eligible }),
    });
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, id));
    return { id, storeId: store!.id };
  }

  async function trial(sellerId: string) {
    const [row] = await db
      .select({
        eligible: s.sellers.feeTrialEligible,
        startedAt: s.sellers.feeTrialStartedAt,
        endsAt: s.sellers.feeTrialEndsAt,
        trigger: s.sellers.feeTrialStartTrigger,
      })
      .from(s.sellers)
      .where(eq(s.sellers.id, sellerId));
    return row!;
  }

  async function publish(sellerId: string, storeId: string) {
    const editor = await getStoreForEditor(sellerId, storeId, db);
    const home = editor!.pages.find((p) => p.isHome)!;
    const saved = await saveStorePageDraft(sellerId, storeId, home.id, hero("Live"), home.draftVersion, {}, db);
    if (!saved.success) throw new Error(`save failed: ${saved.error}`);
    const published = await publishStoreSite(sellerId, storeId, sellerId, {}, db);
    if (!published.success) throw new Error(`publish failed: ${published.error}`);
  }

  async function insertProduct(sellerId: string, status: "active" | "pending" | "draft") {
    const [product] = await db
      .insert(s.products)
      .values({ sellerId, categoryId, status, quantity: "1", sku: `ft-${randomUUID().slice(0, 8)}` })
      .returning({ id: s.products.id });
    return product!.id;
  }

  beforeAll(async () => {
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
  });

  afterAll(async () => {
    if (created.length) {
      await db.delete(s.products).where(inArray(s.products.sellerId, created));
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  });

  it("new sellers are eligible and have not started", async () => {
    const seller = await newSeller();
    expect(await trial(seller.id)).toMatchObject({ eligible: true, startedAt: null, endsAt: null, trigger: null });
  });

  it("starts on the first publish for 30 days and never restarts on republish", async () => {
    const seller = await newSeller();
    await publish(seller.id, seller.storeId);
    const first = await trial(seller.id);
    expect(first.trigger).toBe("publish");
    expect(first.startedAt).not.toBeNull();
    const days = (new Date(first.endsAt!).getTime() - new Date(first.startedAt!).getTime()) / 86_400_000;
    expect(days).toBe(30);

    await publish(seller.id, seller.storeId);
    await db.update(s.stores).set({ siteStatus: "unpublished" }).where(eq(s.stores.id, seller.storeId));
    await publish(seller.id, seller.storeId);
    await db.update(s.stores).set({ templateKey: "tallaby-classic" }).where(eq(s.stores.id, seller.storeId));
    expect(await trial(seller.id)).toEqual(first);
  });

  it("starts when a product first becomes active, and a later publish keeps it", async () => {
    const seller = await newSeller();
    const productId = await insertProduct(seller.id, "pending");
    expect((await trial(seller.id)).startedAt).toBeNull();

    await db.update(s.products).set({ status: "active" }).where(eq(s.products.id, productId));
    const first = await trial(seller.id);
    expect(first.trigger).toBe("product_active");
    expect(first.startedAt).not.toBeNull();

    await publish(seller.id, seller.storeId);
    await db.update(s.products).set({ status: "draft" }).where(eq(s.products.id, productId));
    await db.update(s.products).set({ status: "active" }).where(eq(s.products.id, productId));
    expect(await trial(seller.id)).toEqual(first);
  });

  it("starts when a product is created active", async () => {
    const seller = await newSeller();
    await insertProduct(seller.id, "active");
    expect((await trial(seller.id)).trigger).toBe("product_active");
  });

  it("a second store does not start a new trial", async () => {
    const seller = await newSeller();
    await publish(seller.id, seller.storeId);
    const first = await trial(seller.id);
    expect(await startFeeTrialIfNeeded(db, seller.id, "publish")).toBe(false);
    expect(await trial(seller.id)).toEqual(first);
  });

  it("starts exactly once under concurrent triggers", async () => {
    const seller = await newSeller();
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        db.transaction((tx) => startFeeTrialIfNeeded(tx, seller.id, i % 2 ? "publish" : "product_active")),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await trial(seller.id)).startedAt).not.toBeNull();
  });

  it("never starts for sellers who are not eligible (existing sellers, D5)", async () => {
    const seller = await newSeller({ eligible: false });
    await insertProduct(seller.id, "active");
    await publish(seller.id, seller.storeId);
    expect(await startFeeTrialIfNeeded(db, seller.id, "admin")).toBe(false);
    expect(await trial(seller.id)).toMatchObject({ eligible: false, startedAt: null, endsAt: null });
  });

  it("rejects inconsistent trial dates", async () => {
    const seller = await newSeller();
    await expect(
      db.update(s.sellers).set({ feeTrialStartedAt: new Date().toISOString() }).where(eq(s.sellers.id, seller.id)),
    ).rejects.toThrow();
  });
});
