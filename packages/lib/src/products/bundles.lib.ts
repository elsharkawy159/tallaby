/**
 * Product bundles (0188, ROADMAP.md F-07f; docs/plans/bundles.md). Pure, so the
 * dashboard editor, the storefront and checkout share one rule.
 *
 * A bundle (`products.is_bundle`) holds no stock of its own (a DB trigger keeps
 * `track_stock = false`): its availability is computed from its items, and an
 * order line snapshots the items (`order_items.bundle_items`) so cancel and
 * return restore what was sold. v1: a fixed variant per item, 1–10 items,
 * quantity 1–99 each. The DB guards (`product_bundle_items_guard`) check
 * store, Trash, pre-order and digital items; this file checks the input shape.
 */
import { z } from "zod";

export const BUNDLE_MAX_ITEMS = 10;
export const BUNDLE_MAX_ITEM_QUANTITY = 99;

const itemKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? ""}`;

export const bundleItemSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable(),
  quantity: z.number().int().min(1).max(BUNDLE_MAX_ITEM_QUANTITY),
});

export type BundleItemInput = z.infer<typeof bundleItemSchema>;

export const bundleItemsSchema = z
  .array(bundleItemSchema)
  .min(1)
  .max(BUNDLE_MAX_ITEMS)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const key = itemKey(item.productId, item.variantId);
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: "duplicate_item", path: [index] });
      }
      seen.add(key);
    });
  });

export type BundleItemsError = "invalid" | "self";

/** Parses a bundle's items for saving; a bundle can't contain itself. */
export function validateBundleItems(
  bundleId: string,
  input: unknown
): { ok: true; items: BundleItemInput[] } | { ok: false; error: BundleItemsError } {
  const parsed = bundleItemsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data.some((item) => item.productId === bundleId)) return { ok: false, error: "self" };
  return { ok: true, items: parsed.data };
}

export type BundleAvailabilityItem = {
  /** Units of this item in one bundle. */
  quantity: number;
  /** `products.track_stock` of the item; false = unlimited. */
  trackStock: boolean;
  /** The item's stock: the chosen variant's stock, else the product's own quantity. Null = untracked variant. */
  stock: number | null;
  /** In Trash or purged. */
  trashed: boolean;
  /** The item product has variants. */
  hasVariants: boolean;
  variantId: string | null;
  /** Pre-order on (0179). The 0188 guard refuses it only when the item is added, so it is checked here too. */
  preorder?: boolean;
  /** `products.product_type = 'digital'`. Same as `preorder`. */
  digital?: boolean;
};

/**
 * How many bundles can be sold now: the smallest `floor(stock / quantity)` over
 * the items; null = unlimited (every item is untracked). A trashed item, an
 * item with variants but none chosen, or an item that became a pre-order or
 * digital after it was added makes it 0; so does a bundle with no items.
 */
export function bundleAvailability(items: readonly BundleAvailabilityItem[]): number | null {
  if (items.length === 0) return 0;
  let available: number | null = null;
  for (const item of items) {
    if (item.trashed || item.preorder || item.digital || (item.hasVariants && !item.variantId)) return 0;
    if (!item.trackStock || item.stock == null) continue;
    const perItem = item.quantity > 0 ? Math.floor(Math.max(item.stock, 0) / item.quantity) : 0;
    available = available == null ? perItem : Math.min(available, perItem);
  }
  return available;
}

/** One item of `order_items.bundle_items`. */
export type BundleSnapshotItem = {
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  variantName: string | null;
  /** Units of this item in one bundle (the order line's quantity multiplies it). */
  quantity: number;
};

/** The snapshot written on the order line, in the bundle's item order. */
export function bundleSnapshot(
  items: readonly {
    productId: string;
    variantId: string | null;
    sku: string | null;
    name: string | null;
    variantName: string | null;
    quantity: number;
  }[]
): BundleSnapshotItem[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    sku: item.sku ?? "",
    name: item.name ?? "",
    variantName: item.variantName ?? null,
    quantity: item.quantity,
  }));
}

/** Reads a stored snapshot; drops bad rows, null when nothing usable is left. */
export function parseBundleSnapshot(value: unknown): BundleSnapshotItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: BundleSnapshotItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.productId !== "string" || row.productId.length === 0) continue;
    if (typeof row.quantity !== "number" || !Number.isInteger(row.quantity) || row.quantity < 1) continue;
    if (row.variantId != null && (typeof row.variantId !== "string" || row.variantId.length === 0)) continue;
    items.push({
      productId: row.productId,
      variantId: typeof row.variantId === "string" ? row.variantId : null,
      sku: typeof row.sku === "string" ? row.sku : "",
      name: typeof row.name === "string" ? row.name : "",
      variantName: typeof row.variantName === "string" ? row.variantName : null,
      quantity: row.quantity,
    });
  }
  return items.length > 0 ? items : null;
}

/** Why a bundle can't be ordered as it stands. */
export type BundleOrderProblem =
  | "no_items"
  | "item_trashed"
  | "item_outside_store"
  | "variant_missing"
  | "item_preorder"
  | "item_digital";

/**
 * Checkout's refusal rule: a bundle needs items, none in Trash, all in the
 * order's store, and a chosen variant on every item that has variants. An item
 * that became a pre-order or digital after it was added is refused too (the
 * 0188 guard checks that only when the item is added). Stock is not checked
 * here: the atomic decrement does that. Null = it can be ordered.
 */
export function bundleOrderProblem(
  storeId: string,
  items:
    | readonly {
        trashed: boolean;
        storeId: string | null;
        hasVariants: boolean;
        variantId: string | null;
        preorder?: boolean;
        digital?: boolean;
      }[]
    | undefined
): BundleOrderProblem | null {
  if (!items || items.length === 0) return "no_items";
  for (const item of items) {
    if (item.trashed) return "item_trashed";
    if (item.storeId !== storeId) return "item_outside_store";
    if (item.hasVariants && !item.variantId) return "variant_missing";
    if (item.preorder) return "item_preorder";
    if (item.digital) return "item_digital";
  }
  return null;
}

/** A product row as the storefront reads it for stock: only what the overlay needs. */
export type BundleStockRow = {
  id: string;
  isBundle?: boolean | null;
  trackStock?: boolean | null;
  quantity?: unknown;
};

/**
 * Shows a bundle's computed availability on storefront rows (docs/plans/bundles.md
 * §2): a bundle row gets `trackStock: true` and `quantity` = how many can be sold
 * (a string when the row's quantity is the numeric column's string, else a
 * number); null availability (every item unlimited) keeps it untracked. A
 * bundle missing from the map is 0. Other rows are returned as they are. Never
 * mutates: rows may come from a cache.
 */
export function overlayBundleAvailability<T extends BundleStockRow>(
  rows: readonly T[],
  availability: ReadonlyMap<string, number | null>
): T[] {
  return rows.map((row) => {
    if (row.isBundle !== true) return row;
    const available = availability.has(row.id) ? (availability.get(row.id) ?? null) : 0;
    if (available === null) return { ...row, trackStock: false };
    return { ...row, trackStock: true, quantity: typeof row.quantity === "string" ? String(available) : available };
  });
}

/** One item of a bundle as the cart and the order views list it. */
export type BundleLineItem = { name: string; variantName: string | null; quantity: number };

/** "Oud (50 ml) ×1, Box ×2": a bundle's items on one line, in the order given. */
export function formatBundleIncludes(items: readonly BundleLineItem[], locale: string): string {
  return items
    .map((item) => `${item.name.trim()}${item.variantName?.trim() ? ` (${item.variantName.trim()})` : ""} ×${item.quantity}`)
    .join(locale === "ar" ? "، " : ", ");
}

/** One item of the product page's "What's in the bundle" block. */
export type BundleContentItem = BundleLineItem & {
  productId: string;
  /** Raw storage path or URL of the variant's photo, else the product's first one. */
  image: string | null;
  /** The item's product page slug; null when it can't be opened (not active, in Trash, or no slug). */
  slug: string | null;
};

/** The block's items: a link only to an item shoppers can open. */
export function bundleContentItems(
  items: readonly {
    productId: string;
    name: string;
    variantName: string | null;
    quantity: number;
    image: string | null;
    slug: string | null;
    status: string | null;
    trashed: boolean;
  }[]
): BundleContentItem[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    variantName: item.variantName,
    quantity: item.quantity,
    image: item.image,
    slug: item.status === "active" && !item.trashed && item.slug ? item.slug : null,
  }));
}
