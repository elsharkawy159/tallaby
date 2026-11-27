import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The welcome page's store check and loader against the staging database:
 * another seller's store is a 404 before anything is read, and the owner gets
 * the store's setup data. Rows are removed afterwards. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/auth/session.server", () => ({ getSessionUser: async () => ({ id: session.userId }) }));
vi.mock("next-intl/server", async (original) => ({ ...(await original<object>()), getLocale: async () => "ar" }));

describe.skipIf(!TEST_DATABASE_URL)("welcome page loader (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const storeId = randomUUID();

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@/lib/stores/store-page.server")),
    ...(await import("./welcome.data")),
  });

  beforeAll(async () => {
    const { db, sql } = await load();
    for (const id of [sellerId, otherSellerId]) {
      const email = `qa-${id.slice(0, 8)}@example.test`;
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
      await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, support_email, status)
        VALUES (${id}, 'QA welcome', 'QA welcome', ${`qa-${id.slice(0, 8)}`}, 'x@example.com', 'approved')
      `);
    }
    await db.execute(sql`
      INSERT INTO stores (id, seller_id, name, subdomain, status, store_category, store_category_ar)
      VALUES (${storeId}, ${sellerId}, 'QA welcome', ${`qa-w-${run}`}, 'active', 'Fashion', 'أزياء')
    `);
  });

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades to everything they own (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSellerId})`);
  }, 120_000);

  it("is a 404 for another seller's store", async () => {
    const { loadStorePage } = await load();
    session.userId = otherSellerId;
    await expect(loadStorePage(storeId)).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });

  it("loads the owner's store setup", async () => {
    const { loadStorePage, loadWelcomeData } = await load();
    session.userId = sellerId;
    const store = await loadStorePage(storeId);
    const data = await loadWelcomeData(store, "ar");
    expect(data?.storeId).toBe(storeId);
    expect(data?.readOnly).toBe(false);
    expect(data?.flags.product).toBe(false);
    expect(data?.industry.id).toBe("fashion");
  });
});
