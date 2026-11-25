import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AI prompt records (0181): what is stored, the tenant filter of the link,
 * and that nothing ever throws into the autofill route or the product save
 * (missing table included). The database is a fake that records every write
 * and WHERE and never connects; the SQL itself runs in
 * ai-prompts.integration.test.ts.
 */

const fake = vi.hoisted(() => {
  const state = {
    writes: [] as unknown[],
    wheres: [] as unknown[],
    calls: [] as string[],
    result: [] as unknown[],
    error: null as unknown,
  };
  const chain = (): unknown => {
    const proxy: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            (state.error ? Promise.reject(state.error) : Promise.resolve(state.result)).then(resolve, reject);
        }
        if (prop === "values" || prop === "set") return (arg: unknown) => (state.writes.push(arg), proxy);
        if (prop === "where") return (arg: unknown) => (state.wheres.push(arg), proxy);
        return () => proxy;
      },
    });
    return proxy;
  };
  const kind = (name: string) => () => (state.calls.push(name), chain());
  return { state, db: { insert: kind("insert"), update: kind("update"), select: kind("select") } };
});

vi.mock("@workspace/db", async (importOriginal) => ({ ...(await importOriginal<typeof import("@workspace/db")>()), db: fake.db }));

import { AUTOFILL_LIMITS } from "./autofill/autofill.dto";
import { linkAutofillPrompts, listProductAiPrompts, promptTextForStorage, recordAutofillPrompt } from "./ai-prompts.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "33333333-3333-4333-8333-333333333333";
const ADMIN = "44444444-4444-4444-8444-444444444444";

const dialect = new PgDialect();
const rendered = (where: unknown) => dialect.sqlToQuery(where as SQL);

const base = { sellerId: SELLER, storeId: STORE, mode: "add" as const, text: "  Red cotton shirt  ", imageCount: 2, hasPdf: false, cached: false };

beforeEach(() => {
  fake.state.writes = [];
  fake.state.wheres = [];
  fake.state.calls = [];
  fake.state.result = [];
  fake.state.error = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("promptTextForStorage", () => {
  it("trims and caps at the autofill text limit", () => {
    expect(promptTextForStorage("  hi  ")).toBe("hi");
    expect(promptTextForStorage("x".repeat(AUTOFILL_LIMITS.maxTextLength + 50))).toHaveLength(AUTOFILL_LIMITS.maxTextLength);
    expect(promptTextForStorage(undefined)).toBe("");
  });
});

describe("recordAutofillPrompt", () => {
  it("stores the trimmed text and counts only", async () => {
    fake.state.result = [{ id: "row" }];
    expect(await recordAutofillPrompt(base)).toBe("row");
    expect(fake.state.writes[0]).toEqual({
      sellerId: SELLER,
      storeId: STORE,
      mode: "add",
      source: "seller",
      adminId: null,
      promptText: "Red cotton shirt",
      imageCount: 2,
      hasPdf: false,
      cached: false,
    });
  });

  it("keeps the admin id only for admin rows", async () => {
    fake.state.result = [{ id: "row" }];
    await recordAutofillPrompt({ ...base, adminId: ADMIN });
    await recordAutofillPrompt({ ...base, source: "admin", adminId: ADMIN });
    expect(fake.state.writes).toMatchObject([{ source: "seller", adminId: null }, { source: "admin", adminId: ADMIN }]);
  });

  it("refuses bad ids or mode without a query", async () => {
    expect(await recordAutofillPrompt({ ...base, storeId: "nope" })).toBeNull();
    expect(await recordAutofillPrompt({ ...base, mode: "other" as never })).toBeNull();
    expect(fake.state.calls).toEqual([]);
  });

  it("never throws, also without the table, and logs no prompt text", async () => {
    fake.state.error = Object.assign(new Error("relation does not exist"), { code: "42P01" });
    expect(await recordAutofillPrompt(base)).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
    fake.state.error = new Error("Red cotton shirt boom");
    expect(await recordAutofillPrompt(base)).toBeNull();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("Red cotton");
  });
});

describe("linkAutofillPrompts", () => {
  it("links only the seller+store's unlinked rows of the mode, and the product must be the seller's", async () => {
    fake.state.result = [{ id: "a" }, { id: "b" }];
    expect(await linkAutofillPrompts({ sellerId: SELLER, storeId: STORE, productId: PRODUCT, mode: "edit" })).toBe(2);
    expect(fake.state.writes[0]).toMatchObject({ productId: PRODUCT });
    const { sql, params } = rendered(fake.state.wheres[0]);
    expect(sql).toContain('"product_ai_prompts"."seller_id" = $1');
    expect(sql).toContain('"product_ai_prompts"."store_id" = $2');
    expect(sql).toContain('"product_ai_prompts"."product_id" is null');
    expect(sql).toContain('"product_ai_prompts"."created_at" >');
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM "products" WHERE "products"."id" = \$\d+ AND "products"."seller_id" = \$\d+\)/);
    expect(sql).not.toContain("admin_id");
    expect(params).toEqual(expect.arrayContaining([SELLER, STORE, "edit", "seller", PRODUCT]));
  });

  it("scopes an admin link to that admin", async () => {
    await linkAutofillPrompts({ sellerId: SELLER, storeId: STORE, productId: PRODUCT, mode: "add", source: "admin", adminId: ADMIN });
    const { sql, params } = rendered(fake.state.wheres[0]);
    expect(sql).toContain('"product_ai_prompts"."admin_id"');
    expect(params).toEqual(expect.arrayContaining(["admin", ADMIN]));
    // No admin id, no link.
    fake.state.calls = [];
    expect(await linkAutofillPrompts({ sellerId: SELLER, storeId: STORE, productId: PRODUCT, mode: "add", source: "admin" })).toBe(0);
    expect(fake.state.calls).toEqual([]);
  });

  it("never throws", async () => {
    fake.state.error = new Error("db down");
    expect(await linkAutofillPrompts({ sellerId: SELLER, storeId: STORE, productId: PRODUCT, mode: "add" })).toBe(0);
  });
});

describe("listProductAiPrompts", () => {
  it("returns null when the rows can't be read, so Admin shows 'not recorded'", async () => {
    fake.state.error = Object.assign(new Error("missing"), { code: "42P01" });
    expect(await listProductAiPrompts(PRODUCT)).toBeNull();
  });

  it("returns [] for a bad id without a query", async () => {
    expect(await listProductAiPrompts("x")).toEqual([]);
    expect(fake.state.calls).toEqual([]);
  });
});
