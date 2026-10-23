/**
 * One-off: gives every existing store the template's product page (spec
 * 2026-10-23-template-product-page-design.md §8). Idempotent; one transaction per store.
 *
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:product-pages            (dry run)
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:product-pages --apply    (writes)
 *
 * Dry run is the default. DATABASE_URL must be set explicitly in the environment (never read from
 * a file by this script); only its host is printed. A published store gets a new live revision
 * (old live snapshot + the product page; revisions are append-only). After each such store, the published-site cache tags are broadcast to the other apps (needs REVALIDATE_SECRET
 * and ECOMMERCE_URL in the environment; without them the cache clears by its TTL).
 * Production runs need the owner's go-ahead (CLAUDE.md rule 4).
 */
async function main() {
  const apply = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Set it explicitly to the database you mean to change.");
    process.exit(1);
  }
  let host: string;
  try {
    host = new URL(url).host.replace(/^[^@]*@/, "");
  } catch {
    console.error("DATABASE_URL is not a valid URL.");
    process.exit(1);
  }
  console.log(`Target database host: ${host}`);
  console.log(apply ? "Mode: APPLY (writes)" : "Mode: dry run (no writes; pass --apply to write)");
  if (apply && (!process.env.REVALIDATE_SECRET || !process.env.ECOMMERCE_URL)) {
    console.warn("WARNING: REVALIDATE_SECRET and/or ECOMMERCE_URL is not set. The storefront cache will not be cleared now; it clears only when its TTL expires.");
  }

  // Imported after the check so @workspace/db only connects once the target is confirmed.
  const { db } = await import("@workspace/db");
  const { backfillStoreProductPageDetailed, listBackfillStoreIds } = await import("../src/store-sites/backfill-product-page.server");
  const { broadcastInvalidation, invalidateStoreSite } = await import("@workspace/cache");

  try {
    const ids = await listBackfillStoreIds(db);
    const totals = { added: 0, skipped: 0, failed: 0, liveUpdated: 0 };
    for (const id of ids) {
      try {
        const out = await backfillStoreProductPageDetailed(db, id, { dryRun: !apply });
        totals[out.result] += 1;
        console.log(`${id} ${out.subdomain ?? "-"} template=${out.templateKey ?? "-"} ${out.result}${apply || out.result === "skipped" ? "" : " (would add)"}: ${out.reason}`);
        if (out.publishedUpdated) totals.liveUpdated += 1;
        if (apply && out.publishedUpdated && out.sellerId && out.subdomain) {
          await broadcastInvalidation(invalidateStoreSite(out.sellerId, id, out.subdomain), "admin");
        }
      } catch (error) {
        totals.failed += 1;
        console.log(`${id} - template=- failed: ${errorLine(error)}`);
      }
    }
    console.log(`Stores: ${ids.length}. ${apply ? "Added" : "Would add"}: ${totals.added}. Skipped: ${totals.skipped}. Failed: ${totals.failed}. New live revisions ${apply ? "published" : "to publish"}: ${totals.liveUpdated}.`);
    if (totals.failed) process.exitCode = 1;
  } catch (error) {
    console.error(`Backfill aborted: ${errorLine(error)}`);
    process.exitCode = 1;
  } finally {
    await db.$client.end({ timeout: 5 });
  }
}

/** One line, message only (no stack), with anything that looks like a connection URL masked. */
function errorLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return (message.split(/\r?\n/)[0] ?? "").replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://***").slice(0, 300);
}

void main();
