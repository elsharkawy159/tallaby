import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { postStoreWalletEntry } from "@workspace/db/wallet";
import { getStoreForEditor, publishStoreSite, saveStorePageDraft } from "../store-sites/server";

/**
 * The EGP 100 welcome gift (0119) against the staging copy: granted once to a
 * new seller who finished setup, never to existing sellers or on an admin's
 * template, clears debt, and on expiry takes back only the unspent part.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const hero = (title: string) => ({
  sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title } }],
});

describe.skipIf(!TEST_DATABASE_URL)("welcome gift (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const created: string[] = [];
  let categoryId: string;
  let gifts: typeof import("./welcome-gift.server");

  async function newSeller(opts: { giftEligible: boolean }) {
    const id = randomUUID();
    const sub = `wg-${id.slice(0, 8)}`;
    created.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    // Raw insert: the schema can be ahead of staging (another session's 0113 columns).
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status,
                           fee_trial_eligible, welcome_gift_eligible)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'wg@example.com', 'approved',
              false, ${opts.giftEligible})
    `);
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, id));
    return { id, storeId: store!.id };
  }

  async function chooseTemplate(storeId: string, by: string) {
    await db.insert(s.templateInstalls).values({ templateKey: "tallaby-classic", templateVersion: 1, storeId, installedBy: by });
  }

  async function publish(sellerId: string, storeId: string) {
    const editor = await getStoreForEditor(sellerId, storeId, db);
    const home = editor!.pages.find((p) => p.isHome)!;
    const saved = await saveStorePageDraft(sellerId, storeId, home.id, hero("Live"), home.draftVersion, {}, db);
    if (!saved.success) throw new Error(`save failed: ${saved.error}`);
    const published = await publishStoreSite(sellerId, storeId, sellerId, {}, db);
    if (!published.success) throw new Error(`publish failed: ${published.error}`);
  }

  async function addProduct(sellerId: string) {
    await db.execute(sql`
      INSERT INTO products (seller_id, category_id, status, quantity, sku)
      VALUES (${sellerId}, ${categoryId}, 'active', 1, ${`wg-${randomUUID().slice(0, 8)}`})
    `);
  }

  const balance = async (sellerId: string) =>
    (await db.select({ b: s.sellerWallet.balance }).from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerId)))[0]?.b ?? "0";
  const gift = async (sellerId: string) =>
    (await db.select().from(s.sellerWelcomeGifts).where(eq(s.sellerWelcomeGifts.sellerId, sellerId)))[0];
  const giftEntries = (sellerId: string) =>
    db
      .select({ amount: s.walletTransactions.amount, ref: s.walletTransactions.referenceType })
      .from(s.walletTransactions)
      .where(
        and(
          eq(s.walletTransactions.sellerId, sellerId),
          inArray(s.walletTransactions.referenceType, ["welcome_gift", "welcome_gift_expiry"]),
        ),
      );
  const fee = (sellerId: string, amount: string) =>
    db.transaction((tx) =>
      postStoreWalletEntry(tx, {
        sellerId,
        type: "fee",
        amount,
        referenceType: "order",
        referenceId: randomUUID(),
        description: "test fee",
      }),
    );

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    gifts = await import("./welcome-gift.server");
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
  });

  afterAll(async () => {
    if (created.length) {
      await db.delete(s.sellerWelcomeGifts).where(inArray(s.sellerWelcomeGifts.sellerId, created));
      await db.delete(s.products).where(inArray(s.products.sellerId, created));
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  });

  it("grants EGP 100 once, only when template, product and publish are all done", async () => {
    const seller = await newSeller({ giftEligible: true });
    await chooseTemplate(seller.storeId, seller.id);
    await publish(seller.id, seller.storeId);
    // Published, but no product yet.
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: false });
    expect(await gifts.getWelcomeGiftWatch(seller.id, db)).toEqual({ state: "pending" });

    await addProduct(seller.id);
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: true });
    expect(Number(await balance(seller.id))).toBe(100);
    const row = await gift(seller.id);
    expect(row).toMatchObject({ storeId: seller.storeId, amount: "100.00", debtCleared: "0.00" });
    const days = (new Date(row!.expiresAt).getTime() - new Date(row!.grantedAt).getTime()) / 86_400_000;
    expect(days).toBe(30);
    expect(await gifts.getWelcomeGiftWatch(seller.id, db)).toMatchObject({ state: "unseen", amount: "100.00" });

    // Replays, republish and a check never pay again.
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: false });
    await publish(seller.id, seller.storeId);
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: false });
    expect(await giftEntries(seller.id)).toHaveLength(1);
    expect(Number(await balance(seller.id))).toBe(100);

    const [bell] = await db
      .select({ type: s.sellerNotifications.type })
      .from(s.sellerNotifications)
      .where(eq(s.sellerNotifications.sellerId, seller.id));
    expect(bell?.type).toBe("welcome_gift_granted");

    await gifts.markWelcomeGiftPopupSeen(seller.id, db);
    expect(await gifts.getWelcomeGiftWatch(seller.id, db)).toEqual({ state: "none" });
  });

  it("never grants to existing sellers", async () => {
    const seller = await newSeller({ giftEligible: false });
    await chooseTemplate(seller.storeId, seller.id);
    await addProduct(seller.id);
    await publish(seller.id, seller.storeId);
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: false });
    expect(await gifts.getWelcomeGiftWatch(seller.id, db)).toEqual({ state: "none" });
    expect(await gift(seller.id)).toBeUndefined();
  });

  it("does not count a template someone else (an admin) installed", async () => {
    const seller = await newSeller({ giftEligible: true });
    const admin = randomUUID();
    created.push(admin);
    await db.insert(s.users).values({ id: admin, isGuest: false, role: "admin", isVerified: true });
    await chooseTemplate(seller.storeId, admin);
    await addProduct(seller.id);
    await publish(seller.id, seller.storeId);
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: false });
  });

  it("clears debt, then on expiry takes back only the unspent gift", async () => {
    const seller = await newSeller({ giftEligible: true });
    // EGP 20 of fees owed before the gift (marketplace orders while offline).
    await fee(seller.id, "-20.00");
    await chooseTemplate(seller.storeId, seller.id);
    await addProduct(seller.id);
    await publish(seller.id, seller.storeId);
    expect(await gifts.grantWelcomeGiftIfEligible(seller.id, db)).toEqual({ granted: true });
    expect((await gift(seller.id))?.debtCleared).toBe("20.00");
    expect(Number(await balance(seller.id))).toBe(80);

    // Two fees after the grant spend the gift first.
    await fee(seller.id, "-5.00");
    await fee(seller.id, "-5.00");
    expect((await gifts.getWelcomeGiftStatus(seller.id, db))?.remaining).toBe("70.00");

    // Not due yet.
    expect(await gifts.expireWelcomeGift(seller.id, db)).toBe("not_due");

    // 30 days later (expires_at must stay after granted_at).
    await db
      .update(s.sellerWelcomeGifts)
      .set({ expiresAt: sql`now()` }) // due now; grantedAt stays, so earlier entries don't count
      .where(eq(s.sellerWelcomeGifts.sellerId, seller.id));
    expect(await gifts.expireWelcomeGift(seller.id, db)).toBe("expired");
    expect(Number(await balance(seller.id))).toBe(0);
    expect(await gift(seller.id)).toMatchObject({ expiredAmount: "70.00" });

    // A second run takes nothing more.
    expect(await gifts.expireWelcomeGift(seller.id, db)).toBe("not_due");
    expect(await giftEntries(seller.id)).toHaveLength(2);
    expect(Number(await balance(seller.id))).toBe(0);
  });

  it("never takes the seller's own money on expiry", async () => {
    const seller = await newSeller({ giftEligible: true });
    await chooseTemplate(seller.storeId, seller.id);
    await addProduct(seller.id);
    await publish(seller.id, seller.storeId);
    await gifts.grantWelcomeGiftIfEligible(seller.id, db);
    // An admin adjustment takes EGP 90 (not a gift charge): only EGP 10 is left in the wallet.
    await db.transaction((tx) =>
      postStoreWalletEntry(tx, {
        sellerId: seller.id,
        type: "adjustment",
        amount: "-90.00",
        referenceType: "admin",
        referenceId: randomUUID(),
        description: "test adjustment",
      }),
    );
    await db
      .update(s.sellerWelcomeGifts)
      .set({ expiresAt: sql`now()` }) // due now; grantedAt stays, so earlier entries don't count
      .where(eq(s.sellerWelcomeGifts.sellerId, seller.id));
    expect(await gifts.expireWelcomeGift(seller.id, db)).toBe("expired");
    expect(Number(await balance(seller.id))).toBe(0);
    expect(await gift(seller.id)).toMatchObject({ expiredAmount: "10.00" });
  });
});
