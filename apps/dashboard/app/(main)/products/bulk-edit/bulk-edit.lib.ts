import { hasProductImage, type ProductStatus } from "@/lib/products/product-status.lib";
import type { BulkChange, BulkPreviewLine, BulkPreviewRow, BulkSkipReason } from "./bulk-edit.dto";

/**
 * Pure planning for bulk product edits (ROADMAP.md F-24a). Given the rows the
 * server read (already scoped to the seller) and one change, it computes the
 * values to write, the values they replace (for Undo) and the preview lines.
 *
 * Money: every price is computed in integer piastres and written back to the
 * price jsonb as pounds with at most 2 decimals. With `roundWhole` (the UI
 * default) each new price is rounded to the nearest whole pound. A product is
 * skipped whole (never half-changed) when any of its prices would be <= 0.
 */

export type BulkVariantRow = {
  id: string;
  title: string | null;
  price: unknown;
  stock: number;
  discountEndsAt: string | null;
};

export type BulkProductRow = {
  id: string;
  status: ProductStatus;
  images: unknown;
  quantity: number;
  price: unknown;
  variants: BulkVariantRow[];
};

export type VariantValues = { id: string; price?: unknown; stock?: number; discountEndsAt?: string | null };
export type ProductValues = { price?: unknown; quantity?: number; status?: ProductStatus; variants?: VariantValues[] };

export type PlannedEdit =
  | { id: string; outcome: "change"; before: ProductValues; after: ProductValues }
  | { id: string; outcome: "same" }
  | { id: string; outcome: "skip"; reason: BulkSkipReason };

export type PlanContext = { canPublish: boolean };

type Fail = { fail: BulkSkipReason };
const isFail = (value: unknown): value is Fail => typeof value === "object" && value !== null && "fail" in value;

/** JSON with sorted object keys, so jsonb read back from Postgres compares equal. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** A timestamp in one canonical form (Postgres returns "2026-11-01 00:00:00+00"). */
export function canonicalTime(value: unknown): string | null {
  if (value == null || value === "") return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export const toPiastres = (pounds: number): number => Math.round(pounds * 100);
export const toPounds = (piastres: number): number => piastres / 100;
const roundWholePiastres = (piastres: number): number => Math.round(piastres / 100) * 100;

type PriceParts = { obj: Record<string, unknown>; base: number | null; list: number | null; final: number | null };

/** The price jsonb (or a legacy scalar) split into piastre parts. Null when there is no price at all. */
export function readPrice(price: unknown): PriceParts | null {
  if (typeof price === "number" || typeof price === "string") {
    const amount = num(price);
    if (amount == null || amount <= 0) return null;
    return { obj: {}, base: toPiastres(amount), list: null, final: toPiastres(amount) };
  }
  if (!price || typeof price !== "object" || Array.isArray(price)) return null;
  const obj = price as Record<string, unknown>;
  const piastres = (value: unknown) => {
    const n = num(value);
    return n != null && n > 0 ? toPiastres(n) : null;
  };
  const list = piastres(obj.list);
  const base = piastres(obj.base);
  const final = piastres(obj.final) ?? piastres(obj.current) ?? list ?? base;
  if (final == null) return null;
  return { obj, base, list, final };
}

/** Customer price and regular price (pounds) for previews. */
export function priceDisplay(price: unknown): { final: number | null; list: number | null } {
  const parts = readPrice(price);
  if (!parts) return { final: null, list: null };
  const list = parts.list != null && parts.list > (parts.final ?? 0) ? toPounds(parts.list) : null;
  return { final: parts.final != null ? toPounds(parts.final) : null, list };
}

function adjustPrice(price: unknown, change: Extract<BulkChange, { kind: "price" }>): unknown | Fail {
  const parts = readPrice(price);
  if (!parts) return { fail: "noPrice" };
  const sign = change.direction === "increase" ? 1 : -1;
  const step = (p: number) => {
    const next =
      change.mode === "percent"
        ? Math.round(p * (1 + (sign * change.value) / 100))
        : p + sign * toPiastres(change.value);
    return change.roundWhole ? roundWholePiastres(next) : next;
  };
  const base = parts.base != null ? step(parts.base) : null;
  const list = parts.list != null ? step(parts.list) : null;
  const final = step(parts.final!);
  if (final <= 0 || (base != null && base <= 0) || (list != null && list <= 0)) return { fail: "priceTooLow" };

  const next: Record<string, unknown> = { ...parts.obj, final: toPounds(final) };
  if (base != null) next.base = toPounds(base);
  if (list != null) next.list = toPounds(list);
  if (typeof price !== "object") {
    next.base = toPounds(final);
    next.list = toPounds(final);
    next.discountType = null;
    next.discountValue = null;
  }
  // An amount discount keeps saying what the shopper saves; a percent one is unchanged.
  if (parts.obj.discountType === "amount" && list != null) {
    next.discountValue = toPounds(Math.max(0, list - final));
  }
  return next;
}

function applyDiscount(price: unknown, change: Extract<BulkChange, { kind: "discount" }>, isProduct: boolean): unknown | Fail {
  const parts = readPrice(price);
  if (!parts) return { fail: "noPrice" };
  // The regular price the discount is taken from.
  const regular = parts.list ?? parts.base ?? parts.final!;
  let final: number;
  if (change.mode === "none") {
    final = regular;
  } else if (change.mode === "percent") {
    final = Math.round(regular * (1 - change.value / 100));
    if (change.roundWhole) final = roundWholePiastres(final);
    if (final <= 0) return { fail: "priceTooLow" };
  } else {
    final = regular - toPiastres(change.value);
    if (final <= 0) return { fail: "discountTooHigh" };
    if (change.roundWhole) final = roundWholePiastres(final);
    if (final <= 0) return { fail: "discountTooHigh" };
  }
  if (final > regular) final = regular;

  const next: Record<string, unknown> = {
    ...(typeof price === "object" ? parts.obj : {}),
    list: toPounds(regular),
    final: toPounds(final),
    discountType: change.mode === "none" ? null : change.mode,
    discountValue: change.mode === "none" ? null : change.mode === "percent" ? change.value : toPounds(regular - final),
  };
  if (parts.base == null) next.base = toPounds(regular);
  // The product keeps its discount end date inside the price jsonb; variants have a column.
  if (isProduct) next.discountEndsAt = change.mode === "none" ? null : canonicalTime(change.endsAt);
  return next;
}

function nextStock(current: number, change: Extract<BulkChange, { kind: "stock" }>): number {
  if (change.mode === "set") return change.value;
  if (change.mode === "add") return current + change.value;
  return Math.max(0, current - change.value);
}

/** The values of `row` for exactly the fields present in `shape` (used by Undo's "still unchanged?" check). */
export function currentValues(row: BulkProductRow, shape: ProductValues): ProductValues {
  const out: ProductValues = {};
  if ("price" in shape) out.price = row.price ?? null;
  if ("quantity" in shape) out.quantity = row.quantity;
  if ("status" in shape) out.status = row.status;
  if (shape.variants) {
    out.variants = shape.variants.map((v) => {
      const current = row.variants.find((r) => r.id === v.id);
      const value: VariantValues = { id: v.id };
      if ("price" in v) value.price = current ? (current.price ?? null) : "__missing__";
      if ("stock" in v) value.stock = current ? current.stock : -1;
      if ("discountEndsAt" in v) value.discountEndsAt = current ? canonicalTime(current.discountEndsAt) : "__missing__";
      return value;
    });
  }
  return out;
}

export function sameValues(a: ProductValues, b: ProductValues): boolean {
  return stableStringify(a) === stableStringify(b);
}

/** Plans one change for one product (and all of its variants). */
export function planProductEdit(row: BulkProductRow, change: BulkChange, ctx: PlanContext): PlannedEdit {
  const after: ProductValues = {};

  if (change.kind === "status") {
    if (row.status === "rejected") return { id: row.id, outcome: "skip", reason: "rejected" };
    if (change.publish) {
      if (row.status === "active") return { id: row.id, outcome: "same" };
      if (!ctx.canPublish) return { id: row.id, outcome: "skip", reason: "cannotPublish" };
      if (!hasProductImage(row.images)) return { id: row.id, outcome: "skip", reason: "needsImage" };
      after.status = "active";
    } else {
      if (row.status === "draft") return { id: row.id, outcome: "same" };
      after.status = "draft";
    }
  } else if (change.kind === "stock") {
    after.quantity = nextStock(row.quantity, change);
    after.variants = row.variants.map((v) => ({ id: v.id, stock: nextStock(v.stock, change) }));
  } else {
    const transform = (price: unknown, isProduct: boolean) =>
      change.kind === "price" ? adjustPrice(price, change) : applyDiscount(price, change, isProduct);
    const productPrice = transform(row.price, true);
    if (isFail(productPrice)) return { id: row.id, outcome: "skip", reason: productPrice.fail };
    after.price = productPrice;
    const variants: VariantValues[] = [];
    for (const v of row.variants) {
      // A variant with no price of its own uses the product's; leave it alone.
      if (!readPrice(v.price)) continue;
      const price = transform(v.price, false);
      if (isFail(price)) return { id: row.id, outcome: "skip", reason: price.fail };
      const value: VariantValues = { id: v.id, price };
      if (change.kind === "discount") value.discountEndsAt = change.mode === "none" ? null : canonicalTime(change.endsAt);
      variants.push(value);
    }
    after.variants = variants;
  }

  if (after.variants && after.variants.length === 0) delete after.variants;
  const before = currentValues(row, after);
  if (sameValues(before, after)) return { id: row.id, outcome: "same" };
  return { id: row.id, outcome: "change", before, after };
}

export function planBulkEdit(rows: BulkProductRow[], change: BulkChange, ctx: PlanContext): PlannedEdit[] {
  return rows.map((row) => planProductEdit(row, change, ctx));
}

function priceLine(label: string | null, before: unknown, after: unknown): BulkPreviewLine | null {
  const b = priceDisplay(before);
  const a = priceDisplay(after);
  if (b.final === a.final && b.list === a.list) return null;
  return { label, field: "price", before: b.final ?? 0, after: a.final ?? 0, beforeList: b.list, afterList: a.list };
}

/** Before → after lines for the preview table (product first, then each changed variant). */
export function previewLines(row: BulkProductRow, plan: PlannedEdit): BulkPreviewLine[] {
  if (plan.outcome !== "change") return [];
  const lines: BulkPreviewLine[] = [];
  const { before, after } = plan;
  if ("status" in after) lines.push({ label: null, field: "status", before: before.status ?? "", after: after.status ?? "" });
  if ("quantity" in after && before.quantity !== after.quantity) {
    lines.push({ label: null, field: "stock", before: before.quantity ?? 0, after: after.quantity ?? 0 });
  }
  if ("price" in after) {
    const line = priceLine(null, before.price, after.price);
    if (line) lines.push(line);
  }
  for (const v of after.variants ?? []) {
    const old = before.variants?.find((x) => x.id === v.id);
    const label = row.variants.find((x) => x.id === v.id)?.title?.trim() || "—";
    if ("price" in v) {
      const line = priceLine(label, old?.price, v.price);
      if (line) lines.push(line);
    }
    if ("stock" in v && old?.stock !== v.stock) {
      lines.push({ label, field: "stock", before: old?.stock ?? 0, after: v.stock ?? 0 });
    }
  }
  return lines;
}

export function previewRows(
  rows: (BulkProductRow & { title: string })[],
  plans: PlannedEdit[],
  missingIds: string[] = [],
): BulkPreviewRow[] {
  const out: BulkPreviewRow[] = rows.map((row, i) => {
    const plan = plans[i]!;
    return {
      id: row.id,
      title: row.title,
      outcome: plan.outcome,
      ...(plan.outcome === "skip" ? { reason: plan.reason } : {}),
      lines: previewLines(row, plan),
    };
  });
  for (const id of missingIds) out.push({ id, title: "", outcome: "skip", reason: "notFound", lines: [] });
  return out;
}

/**
 * The status Undo puts back. Restoring "active" re-checks the Publish rules
 * (approved seller, an image), so Undo can never make live what the Publish
 * switch would refuse.
 */
export function undoStatus(previous: ProductStatus, ctx: { canPublish: boolean; hasImage: boolean }): ProductStatus {
  if (previous === "active" && !(ctx.canPublish && ctx.hasImage)) return "draft";
  if (previous === "rejected") return "draft";
  return previous;
}
