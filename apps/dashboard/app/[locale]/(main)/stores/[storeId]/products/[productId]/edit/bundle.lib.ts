/**
 * Pure rules of the product edit page's "This product is a bundle" section
 * (ROADMAP.md F-07f; docs/plans/bundles.md §4). The DB guards of 0188 are the
 * last word; these give the seller a clear reason before (and after) them.
 */

export type BundleBlockedReason = "hasVariants" | "isItem" | "digital";

export type BundleItemProblem = "itemIsBundle" | "itemTrashed" | "itemPreorder" | "itemDigital" | "variantRequired" | "invalid";

export type BundleSaveError =
  | BundleBlockedReason
  | BundleItemProblem
  | "self"
  | "notFound"
  | "rateLimited"
  | "generic";

/**
 * Why this product can't be turned into a bundle (0188 `products_bundle_guard`); null = it can.
 * A digital product (F-108) can't be one either: its line would deliver files and take items' stock.
 */
export function bundleBlockedReason(product: {
  hasVariants: boolean;
  isItemOfBundle: boolean;
  productType?: string | null;
}): BundleBlockedReason | null {
  if (product.hasVariants) return "hasVariants";
  if (product.isItemOfBundle) return "isItem";
  if (product.productType === "digital") return "digital";
  return null;
}

/** What the 0188 item guard would refuse about one item, in the same order; null = fine. */
export function bundleItemProblem(item: {
  isBundle: boolean;
  trashed: boolean;
  preorder: boolean;
  digital: boolean;
  /** The item's variant ids. */
  variantIds: readonly string[];
  variantId: string | null;
}): BundleItemProblem | null {
  if (item.isBundle) return "itemIsBundle";
  if (item.trashed) return "itemTrashed";
  if (item.preorder) return "itemPreorder";
  if (item.digital) return "itemDigital";
  if (item.variantId) return item.variantIds.includes(item.variantId) ? null : "invalid";
  return item.variantIds.length > 0 ? "variantRequired" : null;
}

/** Postgres check_violation (23514) from a 0188 guard, also when the driver wraps it: the seller-facing error. */
export function bundleCheckError(error: unknown): BundleSaveError | null {
  for (let e = error, depth = 0; e && typeof e === "object" && depth < 4; depth++) {
    const { code, message } = e as { code?: unknown; message?: unknown };
    if (code === "23514") return bundleGuardMessageError(typeof message === "string" ? message : "");
    e = (e as { cause?: unknown }).cause;
  }
  return null;
}

/** Maps a 0188 guard message (`RAISE EXCEPTION` text) to an error key. */
export function bundleGuardMessageError(message: string): BundleSaveError {
  if (message.includes("has variants and can't be a bundle")) return "hasVariants";
  if (message.includes("is an item of a bundle")) return "isItem";
  if (message.includes("can't contain itself")) return "self";
  if (message.includes("has variants; choose one")) return "variantRequired";
  if (message.includes("is in Trash")) return "itemTrashed";
  if (message.includes("is a pre-order")) return "itemPreorder";
  if (message.includes("is digital")) return "itemDigital";
  if (/item \S+ is a bundle/.test(message)) return "itemIsBundle";
  if (message.includes("is in another store")) return "notFound";
  return "invalid";
}

export type BundleZeroReason = "noItems" | "chooseVariant" | "itemTrashed" | "itemPreorder" | "itemDigital" | "outOfStock";

/** Why a bundle's availability is 0, for the note under it; null when it is not 0. */
export function bundleZeroReason(
  available: number | null,
  items: readonly { hasVariants: boolean; variantId: string | null; trashed: boolean; preorder?: boolean; digital?: boolean }[],
): BundleZeroReason | null {
  if (available !== 0) return null;
  if (items.length === 0) return "noItems";
  if (items.some((item) => item.trashed)) return "itemTrashed";
  if (items.some((item) => item.preorder)) return "itemPreorder";
  if (items.some((item) => item.digital)) return "itemDigital";
  if (items.some((item) => item.hasVariants && !item.variantId)) return "chooseVariant";
  return "outOfStock";
}
