import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { bulkChangeSchema, bulkEditInputSchema, type BulkChangeInput } from "./bulk-edit.dto";
import {
  canonicalTime,
  currentValues,
  planProductEdit,
  previewLines,
  priceDisplay,
  sameValues,
  stableStringify,
  undoStatus,
  type BulkProductRow,
} from "./bulk-edit.lib";
import { deriveUndoKey, signUndoToken, verifyUndoToken } from "./bulk-edit-undo.lib";

const change = (input: BulkChangeInput) => bulkChangeSchema.parse(input);
const ctx = { canPublish: true };

function row(over: Partial<BulkProductRow> = {}): BulkProductRow {
  return {
    id: "p1",
    status: "active",
    images: ["a.jpg"],
    quantity: 10,
    price: { base: 200, list: 200, final: 150, discountType: "amount", discountValue: 50 },
    variants: [],
    ...over,
  };
}

const afterPrice = (r: BulkProductRow, c: BulkChangeInput) => {
  const plan = planProductEdit(r, change(c), ctx);
  if (plan.outcome !== "change") throw new Error(`expected change, got ${plan.outcome}`);
  return plan.after.price as Record<string, unknown>;
};

describe("price change", () => {
  it("raises every price by a percent, rounded to whole pounds", () => {
    const p = afterPrice(row(), { kind: "price", mode: "percent", direction: "increase", value: 10 });
    expect(p).toMatchObject({ base: 220, list: 220, final: 165, discountType: "amount", discountValue: 55 });
  });

  it("keeps piastres when whole-pound rounding is off", () => {
    const p = afterPrice(row({ price: { list: 99.99, final: 99.99 } }), {
      kind: "price", mode: "percent", direction: "increase", value: 7, roundWhole: false,
    });
    expect(p.final).toBe(106.99); // 9999 * 1.07 = 10698.93 → 10699 piastres
    expect(p.list).toBe(106.99);
  });

  it("rounds a percent result to the nearest pound by default", () => {
    const p = afterPrice(row({ price: { list: 99.99, final: 99.99 } }), {
      kind: "price", mode: "percent", direction: "increase", value: 7,
    });
    expect(p.final).toBe(107);
  });

  it("moves list and sale price by the same amount and keeps a percent discount value", () => {
    const p = afterPrice(row({ price: { list: 100, final: 80, discountType: "percent", discountValue: 20 } }), {
      kind: "price", mode: "amount", direction: "decrease", value: 10,
    });
    expect(p).toMatchObject({ list: 90, final: 70, discountType: "percent", discountValue: 20 });
  });

  it("skips the product when a price would be zero or less", () => {
    const plan = planProductEdit(row(), change({ kind: "price", mode: "amount", direction: "decrease", value: 150 }), ctx);
    expect(plan).toEqual({ id: "p1", outcome: "skip", reason: "priceTooLow" });
  });

  it("skips the whole product when one variant would go to zero", () => {
    const r = row({
      price: { list: 100, final: 100 },
      variants: [
        { id: "v1", title: "Big", price: { list: 100, final: 100 }, stock: 1, discountEndsAt: null },
        { id: "v2", title: "Small", price: { list: 5, final: 5 }, stock: 1, discountEndsAt: null },
      ],
    });
    const plan = planProductEdit(r, change({ kind: "price", mode: "amount", direction: "decrease", value: 5 }), ctx);
    expect(plan).toMatchObject({ outcome: "skip", reason: "priceTooLow" });
  });

  it("changes variants with their own price and leaves price-less variants alone", () => {
    const r = row({
      price: { list: 100, final: 100 },
      variants: [
        { id: "v1", title: "Red", price: { list: 120, final: 120 }, stock: 3, discountEndsAt: null },
        { id: "v2", title: "Blue", price: null, stock: 3, discountEndsAt: null },
      ],
    });
    const plan = planProductEdit(r, change({ kind: "price", mode: "percent", direction: "increase", value: 50 }), ctx);
    if (plan.outcome !== "change") throw new Error("expected change");
    expect(plan.after.variants).toEqual([{ id: "v1", price: { list: 180, final: 180 } }]);
    expect(plan.before.variants).toEqual([{ id: "v1", price: { list: 120, final: 120 } }]);
    const lines = previewLines(r, plan);
    expect(lines).toEqual([
      { label: null, field: "price", before: 100, after: 150, beforeList: null, afterList: null },
      { label: "Red", field: "price", before: 120, after: 180, beforeList: null, afterList: null },
    ]);
  });

  it("turns a legacy scalar price into a price object", () => {
    const p = afterPrice(row({ price: 50 }), { kind: "price", mode: "amount", direction: "increase", value: 5 });
    expect(p).toMatchObject({ base: 55, list: 55, final: 55, discountType: null, discountValue: null });
  });

  it("skips a product with no price", () => {
    const plan = planProductEdit(row({ price: null }), change({ kind: "price", mode: "percent", direction: "increase", value: 5 }), ctx);
    expect(plan).toMatchObject({ outcome: "skip", reason: "noPrice" });
  });
});

describe("discount", () => {
  it("sets a percent discount from the regular price", () => {
    const p = afterPrice(row({ price: { base: 200, list: 200, final: 200 } }), {
      kind: "discount", mode: "percent", value: 15, endsAt: "2026-11-05T22:00:00.000Z",
    });
    expect(p).toMatchObject({ list: 200, final: 170, discountType: "percent", discountValue: 15, discountEndsAt: "2026-11-05T22:00:00.000Z" });
  });

  it("sets an amount discount and refuses one as big as the price", () => {
    const p = afterPrice(row({ price: { list: 200, final: 200 } }), { kind: "discount", mode: "amount", value: 30 });
    expect(p).toMatchObject({ list: 200, final: 170, discountType: "amount", discountValue: 30 });
    const plan = planProductEdit(row({ price: { list: 200, final: 200 } }), change({ kind: "discount", mode: "amount", value: 200 }), ctx);
    expect(plan).toMatchObject({ outcome: "skip", reason: "discountTooHigh" });
  });

  it("removes a discount", () => {
    const p = afterPrice(row(), { kind: "discount", mode: "none" });
    expect(p).toMatchObject({ list: 200, final: 200, discountType: null, discountValue: null, discountEndsAt: null });
  });

  it("puts the end date on variants' own column", () => {
    const r = row({ variants: [{ id: "v1", title: "A", price: { list: 100, final: 100 }, stock: 1, discountEndsAt: null }] });
    const plan = planProductEdit(r, change({ kind: "discount", mode: "percent", value: 10, endsAt: "2026-11-05T22:00:00+02:00" }), ctx);
    if (plan.outcome !== "change") throw new Error("expected change");
    expect(plan.after.variants?.[0]).toEqual({ id: "v1", price: { list: 100, final: 90, base: 100, discountType: "percent", discountValue: 10 }, discountEndsAt: "2026-11-05T20:00:00.000Z" });
  });

  it("rejects out-of-range discounts in the schema", () => {
    expect(bulkChangeSchema.safeParse({ kind: "discount", mode: "percent", value: 100 }).success).toBe(false);
    expect(bulkChangeSchema.safeParse({ kind: "discount", mode: "amount", value: 0 }).success).toBe(false);
    expect(bulkChangeSchema.safeParse({ kind: "price", mode: "percent", direction: "increase", value: 5000 }).success).toBe(false);
    expect(bulkChangeSchema.safeParse({ kind: "price", mode: "amount", direction: "increase", value: -1 }).success).toBe(false);
  });
});

describe("stock", () => {
  const r = row({ quantity: 4, variants: [{ id: "v1", title: "A", price: null, stock: 2, discountEndsAt: null }] });

  it("sets, adds and subtracts (never below zero) on the product and its variants", () => {
    const set = planProductEdit(r, change({ kind: "stock", mode: "set", value: 7 }), ctx);
    expect(set).toMatchObject({ outcome: "change", after: { quantity: 7, variants: [{ id: "v1", stock: 7 }] } });
    const add = planProductEdit(r, change({ kind: "stock", mode: "add", value: 3 }), ctx);
    expect(add).toMatchObject({ after: { quantity: 7, variants: [{ id: "v1", stock: 5 }] }, before: { quantity: 4, variants: [{ id: "v1", stock: 2 }] } });
    const sub = planProductEdit(r, change({ kind: "stock", mode: "subtract", value: 3 }), ctx);
    expect(sub).toMatchObject({ after: { quantity: 1, variants: [{ id: "v1", stock: 0 }] } });
  });

  it("reports no change when stock already matches", () => {
    expect(planProductEdit(row({ quantity: 7 }), change({ kind: "stock", mode: "set", value: 7 }), ctx).outcome).toBe("same");
  });

  it("refuses non-integer stock", () => {
    expect(bulkChangeSchema.safeParse({ kind: "stock", mode: "set", value: 1.5 }).success).toBe(false);
  });
});

describe("status (same rules as the Publish switch)", () => {
  const publish = change({ kind: "status", publish: true });
  const unpublish = change({ kind: "status", publish: false });

  it("publishes a draft with an image for an approved seller", () => {
    expect(planProductEdit(row({ status: "draft" }), publish, ctx)).toMatchObject({ outcome: "change", before: { status: "draft" }, after: { status: "active" } });
  });

  it("needs an image, an approved seller, and never touches a rejected product", () => {
    expect(planProductEdit(row({ status: "draft", images: [] }), publish, ctx)).toMatchObject({ reason: "needsImage" });
    expect(planProductEdit(row({ status: "draft" }), publish, { canPublish: false })).toMatchObject({ reason: "cannotPublish" });
    expect(planProductEdit(row({ status: "rejected" }), publish, ctx)).toMatchObject({ reason: "rejected" });
    expect(planProductEdit(row({ status: "rejected" }), unpublish, ctx)).toMatchObject({ reason: "rejected" });
  });

  it("unpublishes live and legacy pending products", () => {
    expect(planProductEdit(row({ status: "pending" }), unpublish, ctx)).toMatchObject({ after: { status: "draft" } });
    expect(planProductEdit(row({ status: "draft" }), unpublish, ctx).outcome).toBe("same");
    expect(planProductEdit(row({ status: "active" }), publish, ctx).outcome).toBe("same");
  });

  it("undo re-checks the publish rules", () => {
    expect(undoStatus("active", { canPublish: true, hasImage: true })).toBe("active");
    expect(undoStatus("active", { canPublish: false, hasImage: true })).toBe("draft");
    expect(undoStatus("active", { canPublish: true, hasImage: false })).toBe("draft");
    expect(undoStatus("pending", { canPublish: false, hasImage: false })).toBe("pending");
  });
});

describe("undo comparison", () => {
  it("treats jsonb with reordered keys and Postgres timestamps as the same", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
    expect(canonicalTime("2026-11-01 00:00:00+00")).toBe("2026-11-01T00:00:00.000Z");
  });

  it("matches the current row against what the edit wrote", () => {
    const r = row({ variants: [{ id: "v1", title: "A", price: { final: 10, list: 10 }, stock: 2, discountEndsAt: null }] });
    const plan = planProductEdit(r, change({ kind: "stock", mode: "add", value: 1 }), ctx);
    if (plan.outcome !== "change") throw new Error("expected change");
    const written = { ...r, quantity: 11, variants: [{ ...r.variants[0]!, stock: 3 }] };
    expect(sameValues(currentValues(written, plan.after), plan.after)).toBe(true);
    const editedAgain = { ...written, quantity: 20 };
    expect(sameValues(currentValues(editedAgain, plan.after), plan.after)).toBe(false);
    const variantGone = { ...written, variants: [] };
    expect(sameValues(currentValues(variantGone, plan.after), plan.after)).toBe(false);
  });

  it("shows the regular price only when it is above the sale price", () => {
    expect(priceDisplay({ list: 200, final: 150 })).toEqual({ final: 150, list: 200 });
    expect(priceDisplay({ list: 150, final: 150 })).toEqual({ final: 150, list: null });
  });
});

describe("undo token", () => {
  const key = deriveUndoKey(randomBytes(32));
  const entries = [{ id: "p1", b: { quantity: 1 }, a: { quantity: 2 } }];

  it("round-trips for 10 minutes and then expires", () => {
    const now = 1_000_000;
    const { token, expiresAt } = signUndoToken("seller-1", entries, key, now);
    expect(expiresAt).toBe(now + 10 * 60 * 1000);
    expect(verifyUndoToken(token, key, now + 60_000)).toEqual({ sellerId: "seller-1", entries, expiresAt });
    expect(verifyUndoToken(token, key, expiresAt + 1)).toBeNull();
  });

  it("refuses a tampered token or another key", () => {
    const { token } = signUndoToken("seller-1", entries, key);
    const [body, sig] = token.split(".");
    expect(verifyUndoToken(`${body}x.${sig}`, key)).toBeNull();
    expect(verifyUndoToken(token, deriveUndoKey(randomBytes(32)))).toBeNull();
    expect(verifyUndoToken(123, key)).toBeNull();
  });

  it("keeps 500 products with variants under the server-action body limit", () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      b: { price: { base: 200 + i, list: 200 + i, final: 150 + i, discountType: "amount", discountValue: 50 }, variants: Array.from({ length: 5 }, (_, j) => ({ id: `v-${i}-${j}`, price: { list: 100 + j, final: 90 + j } })) },
      a: { price: { base: 220 + i, list: 220 + i, final: 165 + i, discountType: "amount", discountValue: 55 }, variants: Array.from({ length: 5 }, (_, j) => ({ id: `v-${i}-${j}`, price: { list: 110 + j, final: 99 + j } })) },
    }));
    const { token } = signUndoToken("seller-1", many, key);
    expect(token.length).toBeLessThan(900_000);
  });
});

describe("input", () => {
  it("caps the selection at 500 ids and needs uuids", () => {
    const c = { kind: "status", publish: true } as const;
    expect(bulkEditInputSchema.safeParse({ ids: ["not-a-uuid"], change: c }).success).toBe(false);
    expect(bulkEditInputSchema.safeParse({ ids: [], change: c }).success).toBe(false);
    const ids = Array.from({ length: 501 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(bulkEditInputSchema.safeParse({ ids, change: c }).success).toBe(false);
    expect(bulkEditInputSchema.safeParse({ ids: ids.slice(0, 500), change: c }).success).toBe(true);
  });
});
