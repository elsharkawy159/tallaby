import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Storefront form action (PLAN.md §8.4, P4-10): store from the host only,
 * honeypot, flood limit, hashed IP. Data access is mocked here; the DB rules
 * (form must belong to the host's store, replay, validation) are covered by
 * packages/lib/src/store-forms/store-forms.integration.test.ts.
 */
const HOST_STORE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FORM = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const mocks = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  scope: null as null | { storeId: string; sellerId: string },
  submit: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => ({ get: (k: string) => mocks.headers.get(k) ?? null }) }));
vi.mock("@/lib/storefront.server", () => ({ getCartScope: async () => mocks.scope }));
vi.mock("@/lib/auth/current-user", () => ({ getAuthUser: async () => null }));
vi.mock("@workspace/lib/store-forms/server", () => ({ submitStoreForm: mocks.submit }));

const { submitStorefrontForm } = await import("./submit.server");

let ipCounter = 0;
function freshVisitor() {
  ipCounter += 1;
  mocks.headers.set("x-forwarded-for", `203.0.113.${ipCounter}, 10.0.0.1`);
}

beforeEach(() => {
  mocks.headers.clear();
  mocks.headers.set("host", "sara.tallaby.com");
  mocks.headers.set("referer", "https://sara.tallaby.com/contact?x=1");
  mocks.scope = { storeId: HOST_STORE, sellerId: "s" };
  mocks.submit.mockReset();
  mocks.submit.mockResolvedValue({ success: true, duplicate: false, successMessage: "Thanks" });
  process.env.FORM_IP_HASH_SALT = "test-salt";
  freshVisitor();
});

describe("submitStorefrontForm", () => {
  it("submits to the store of the request host with a hashed IP", async () => {
    const result = await submitStorefrontForm({ formId: FORM, values: { name: "Sara" } });
    expect(result).toEqual({ ok: true, message: "Thanks" });
    const [storeId, formId, values, meta] = mocks.submit.mock.calls[0]!;
    expect(storeId).toBe(HOST_STORE);
    expect(formId).toBe(FORM);
    expect(values).toEqual({ name: "Sara" });
    expect(meta.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(meta)).not.toContain("203.0.113.");
    expect(meta.sourceUrl).toBe("https://sara.tallaby.com/contact");
  });

  it("refuses a store id in the body (the store only comes from the host)", async () => {
    const result = await submitStorefrontForm({ formId: FORM, values: {}, storeId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" });
    expect(result).toEqual({ ok: false, error: "invalid" });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("refuses on the marketplace host (no store)", async () => {
    mocks.scope = null;
    expect(await submitStorefrontForm({ formId: FORM, values: {} })).toEqual({ ok: false, error: "notFound" });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("passes on a 'not found' from data access (form of another store)", async () => {
    mocks.submit.mockResolvedValue({ success: false, error: "not_found" });
    expect(await submitStorefrontForm({ formId: FORM, values: {} })).toEqual({ ok: false, error: "notFound" });
  });

  it("returns field errors from validation", async () => {
    mocks.submit.mockResolvedValue({ success: false, error: "invalid", fieldErrors: { email: "invalid" } });
    expect(await submitStorefrontForm({ formId: FORM, values: { email: "x" } })).toEqual({
      ok: false,
      error: "invalid",
      fieldErrors: { email: "invalid" },
    });
  });

  it("fakes success for a filled honeypot and stores nothing", async () => {
    expect(await submitStorefrontForm({ formId: FORM, values: { name: "bot" }, honeypot: "http://spam" })).toEqual({ ok: true, message: "" });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("rate-limits a flood from one visitor on one store", async () => {
    const results = [];
    for (let i = 0; i < 7; i++) results.push(await submitStorefrontForm({ formId: FORM, values: { n: String(i) } }));
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toEqual({ ok: false, error: "rateLimited" });
    expect(mocks.submit).toHaveBeenCalledTimes(5);

    // The same visitor on another store has its own budget.
    mocks.scope = { storeId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", sellerId: "s" };
    expect((await submitStorefrontForm({ formId: FORM, values: {} })).ok).toBe(true);
  });

  it("hashes the same IP differently per store", async () => {
    await submitStorefrontForm({ formId: FORM, values: {} });
    mocks.scope = { storeId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", sellerId: "s" };
    await submitStorefrontForm({ formId: FORM, values: {} });
    const [a, b] = mocks.submit.mock.calls.map((call) => call[3].ipHash);
    expect(a).not.toBe(b);
  });

  it("ignores a referer from another host", async () => {
    mocks.headers.set("referer", "https://evil.example/x");
    await submitStorefrontForm({ formId: FORM, values: {} });
    expect(mocks.submit.mock.calls[0]![3].sourceUrl).toBeNull();
  });
});
