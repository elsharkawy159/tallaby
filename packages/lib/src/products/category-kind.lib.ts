/**
 * Physical and digital Tallaby categories (ROADMAP.md F-108e, migration 0191).
 *
 * `categories.product_kind` says which product type a Tallaby category is for.
 * A product's category must be of its own type: the seller form and the agent
 * tools show only those, and the server refuses the other kind with
 * `category_kind_mismatch`. A missing or unknown kind is physical, like every
 * category before 0191. Pure: no DB, safe in client components.
 */

export const PRODUCT_KINDS = ["physical", "digital"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const DEFAULT_PRODUCT_KIND: ProductKind = "physical";

/** The error code for a product saved with a category of the other kind. */
export const CATEGORY_KIND_MISMATCH = "category_kind_mismatch" as const;
export type CategoryKindMismatch = typeof CATEGORY_KIND_MISMATCH;

/** A category kind or a product type, read loosely: anything but "digital" is physical. */
export function toProductKind(value: unknown): ProductKind {
  return value === "digital" ? "digital" : DEFAULT_PRODUCT_KIND;
}

/** True when a category of `kind` may hold a product of `productType`. */
export function categoryMatchesProductType(kind: unknown, productType: unknown): boolean {
  return toProductKind(kind) === toProductKind(productType);
}

type KindNode = { productKind?: string | null; categories?: readonly KindNode[] | null };

/**
 * The category tree with only the branches of `productType`'s kind. Children
 * are filtered too (a whole branch is one kind in the DB, but a node is never
 * trusted for its children). Nodes keep every other field.
 */
export function filterCategoryTreeByKind<T extends KindNode>(tree: readonly T[], productType: unknown): T[] {
  const kind = toProductKind(productType);
  const walk = (nodes: readonly KindNode[]): KindNode[] =>
    nodes
      .filter((node) => toProductKind(node.productKind) === kind)
      .map((node) => (Array.isArray(node.categories) ? { ...node, categories: walk(node.categories) } : node));
  return walk(tree) as T[];
}
