import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nested store categories against staging (ROADMAP.md F-95, 0171): the
 * `seller_product_categories_parent_guard` trigger, the sibling-unique name
 * index and ON DELETE SET NULL. Two throwaway sellers, each with its primary
 * store (the 0050 trigger). Runs only when TEST_DATABASE_URL is set (and 0171
 * is applied there); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("nested store categories (integration)", { timeout: 120_000 }, () => {
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const world = { storeA: "", storeB: "" };

  const load = async () => import("@workspace/db");

  const makeSeller = async (id: string) => {
    const { db, sql, stores, eq } = await load();
    const email = `qa-ct-${id.slice(0, 8)}@example.test`;
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA tree', 'QA tree', ${`qa-ct-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, id));
    return store!.id;
  };

  const add = async (sellerId: string, storeId: string, name: string, parentId: string | null = null) => {
    const { db, sql } = await load();
    const rows = await db.execute(sql`
      INSERT INTO seller_product_categories (seller_id, store_id, name, parent_id)
      VALUES (${sellerId}, ${storeId}, ${name}, ${parentId}) RETURNING id`);
    return (rows as unknown as { id: string }[])[0]!.id;
  };
  const codeOf = async (run: () => Promise<unknown>) => {
    try {
      await run();
      return null;
    } catch (error) {
      for (let e: unknown = error, depth = 0; e && typeof e === "object" && depth < 4; depth++) {
        const code = (e as { code?: unknown }).code;
        if (typeof code === "string") return code;
        e = (e as { cause?: unknown }).cause;
      }
      return "unknown";
    }
  };

  beforeAll(async () => {
    world.storeA = await makeSeller(sellerA);
    world.storeB = await makeSeller(sellerB);
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades every row this test made (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerA}, ${sellerB})`);
  }, 120_000);

  it("keeps two levels in one store, names unique among siblings, and frees children when a parent goes", async () => {
    const { db, sql } = await load();
    const rough = await add(sellerA, world.storeA, "QA Rough-in");
    const finish = await add(sellerA, world.storeA, "QA Finishing");
    const wires = await add(sellerA, world.storeA, "QA Accessories", rough);
    // The same name under another parent, and at the top level, is fine.
    await add(sellerA, world.storeA, "QA Accessories", finish);
    const topAccessories = await add(sellerA, world.storeA, "QA Accessories");
    // Twice under one parent is not.
    expect(await codeOf(() => add(sellerA, world.storeA, "qa accessories ", rough))).toBe("23505");

    // A parent from another store / seller, a sub-category as parent, itself as parent.
    const foreign = await add(sellerB, world.storeB, "QA Foreign");
    expect(await codeOf(() => add(sellerA, world.storeA, "QA X", foreign))).toBe("23514");
    expect(await codeOf(() => add(sellerA, world.storeA, "QA Y", wires))).toBe("23514");
    expect(await codeOf(() => db.execute(sql`UPDATE seller_product_categories SET parent_id = id WHERE id = ${rough}`))).toBe("23514");
    // A category with sub-categories can't get a parent.
    expect(await codeOf(() => db.execute(sql`UPDATE seller_product_categories SET parent_id = ${finish} WHERE id = ${rough}`))).toBe("23514");

    // Deleting a main category whose sub-category would clash with a main category's name is refused.
    expect(await codeOf(() => db.execute(sql`DELETE FROM seller_product_categories WHERE id = ${rough}`))).toBe("23505");
    await db.execute(sql`DELETE FROM seller_product_categories WHERE id = ${topAccessories}`);
    // Deleting a main category makes its sub-categories main categories; nothing else is deleted.
    await db.execute(sql`DELETE FROM seller_product_categories WHERE id = ${rough}`);
    const left = (await db.execute(sql`SELECT id, parent_id FROM seller_product_categories WHERE id = ${wires}`)) as unknown as {
      id: string;
      parent_id: string | null;
    }[];
    expect(left).toEqual([{ id: wires, parent_id: null }]);
  });
});
