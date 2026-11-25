import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * AI prompt records (0181) against the staging copy: a recorded prompt is
 * linked to the product saved next, and linking never touches another
 * seller's or another store's rows, a linked row, an old row or a row of the
 * other mode. Skipped when TEST_DATABASE_URL is unset, and each test returns
 * early when 0181 is not applied there.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("product AI prompts (integration)", { timeout: 90_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  const createdProducts: string[] = [];
  let categoryId = "";
  let applied = false;
  let prompts: typeof import("./ai-prompts.server");

  const rows = <T>(result: unknown) => [...(result as Iterable<T>)];

  async function newSeller() {
    const id = randomUUID();
    const sub = `aip-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await createAuthUsers(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'aip@example.com', 'approved')
    `);
    return id;
  }

  async function newStore(sellerId: string) {
    const id = randomUUID();
    const sub = `aip-${id.slice(0, 8)}`;
    await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain, status) VALUES (${id}, ${sellerId}, ${sub}, ${sub}, 'active')`);
    return id;
  }

  async function newProduct(sellerId: string, storeId: string) {
    const [row] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO products (seller_id, store_id, category_id, status, quantity, sku, images)
        VALUES (${sellerId}, ${storeId}, ${categoryId}, 'draft'::product_status, 1, ${`aip-${randomUUID().slice(0, 8)}`}, '[]'::jsonb)
        RETURNING id
      `),
    );
    createdProducts.push(row!.id);
    return row!.id;
  }

  const productOf = async (promptId: string) =>
    rows<{ product_id: string | null }>(await db.execute(sql`SELECT product_id FROM product_ai_prompts WHERE id = ${promptId}`))[0]?.product_id ?? null;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    prompts = await import("./ai-prompts.server");
    const [category] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM categories LIMIT 1`));
    categoryId = category!.id;
    const [reg] = rows<{ t: string | null }>(await db.execute(sql`SELECT to_regclass('public.product_ai_prompts')::text AS t`));
    applied = Boolean(reg?.t);
  }, 90_000);

  afterAll(async () => {
    if (createdProducts.length) await db.delete(s.products).where(inArray(s.products.id, createdProducts));
    if (createdUsers.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, createdUsers));
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  const record = (sellerId: string, storeId: string, mode: "add" | "edit" = "add", text = "Red shirt") =>
    prompts.recordAutofillPrompt({ sellerId, storeId, mode, text, imageCount: 1, hasPdf: false, cached: false });

  it("links the seller's prompt to the product saved in the same store, and lists it", async () => {
    if (!applied) return;
    const seller = await newSeller();
    const store = await newStore(seller);
    const id = await record(seller, store, "add", "  قميص قطن أحمر  ");
    expect(id).not.toBeNull();
    const product = await newProduct(seller, store);
    expect(await prompts.linkAutofillPrompts({ sellerId: seller, storeId: store, productId: product, mode: "add" })).toBe(1);
    expect(await productOf(id!)).toBe(product);
    const listed = await prompts.listProductAiPrompts(product);
    expect(listed).toMatchObject([{ id, mode: "add", source: "seller", promptText: "قميص قطن أحمر", imageCount: 1 }]);
    // Already linked: a second save links nothing more.
    expect(await prompts.linkAutofillPrompts({ sellerId: seller, storeId: store, productId: product, mode: "add" })).toBe(0);
  });

  it("never touches another seller's or another store's prompts", async () => {
    if (!applied) return;
    const seller = await newSeller();
    const other = await newSeller();
    const store = await newStore(seller);
    const secondStore = await newStore(seller);
    const otherStore = await newStore(other);
    const foreignSeller = await record(other, otherStore);
    const foreignStore = await record(seller, secondStore);
    const editMode = await record(seller, store, "edit");
    const old = await record(seller, store);
    await db.execute(sql`UPDATE product_ai_prompts SET created_at = now() - interval '25 hours' WHERE id = ${old}`);
    const product = await newProduct(seller, store);

    expect(await prompts.linkAutofillPrompts({ sellerId: seller, storeId: store, productId: product, mode: "add" })).toBe(0);
    for (const id of [foreignSeller, foreignStore, editMode, old]) expect(await productOf(id!)).toBeNull();

    // Another seller's product id can't be linked to, even to that seller's own prompts.
    expect(await prompts.linkAutofillPrompts({ sellerId: other, storeId: otherStore, productId: product, mode: "add" })).toBe(0);
    expect(await productOf(foreignSeller!)).toBeNull();
  });

  it("keeps an admin's prompts apart from the seller's", async () => {
    if (!applied) return;
    const seller = await newSeller();
    const admin = await newSeller();
    const store = await newStore(seller);
    const sellerPrompt = await record(seller, store);
    const adminPrompt = await prompts.recordAutofillPrompt({
      sellerId: seller, storeId: store, mode: "add", text: "admin brief", imageCount: 0, hasPdf: false, cached: true, source: "admin", adminId: admin,
    });
    const product = await newProduct(seller, store);
    expect(await prompts.linkAutofillPrompts({ sellerId: seller, storeId: store, productId: product, mode: "add", source: "admin", adminId: admin })).toBe(1);
    expect(await productOf(adminPrompt!)).toBe(product);
    expect(await productOf(sellerPrompt!)).toBeNull();
  });
});
