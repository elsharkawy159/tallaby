/**
 * A digital product is never live without a file (ROADMAP.md F-108a/b): every
 * path that can make a product `active` (the list switch and bulk publish, the
 * edit page's Publish button, the agent's `set_product_status`) refuses a
 * digital product with no `digital_files` row and no legacy
 * `digital_products.file_url`. Pure; the query is in digital-publish.server.ts.
 */

/** The refusal code (`AgentProductError` code, dashboard error key). */
export const DIGITAL_FILE_REQUIRED = "digital_file_required";

/** The digital products of `digitalIds` that have no file, in input order, without duplicates. */
export function digitalIdsWithoutFiles(digitalIds: readonly string[], withFile: Iterable<string>): string[] {
  const has = new Set(withFile);
  return [...new Set(digitalIds)].filter((id) => !has.has(id));
}
