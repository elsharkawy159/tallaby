/**
 * One-off: gives every existing store the template's product page (spec
 * 2026-10-23-template-product-page-design.md §8). Idempotent; one transaction per store.
 *
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:product-pages            (dry run)
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:product-pages --apply    (writes)
 *
 * Dry run is the default. DATABASE_URL must be set explicitly in the environment (never read from
 * a file by this script); only its host is printed. After each store that changed its live
 * snapshot, the published-site cache tags are broadcast to the other apps (needs REVALIDATE_SECRET
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

  // Imported after the check so @workspace/db only connects once the target is confirmed.
  const { db } = await import("@workspace/db");
  const { backfillStoreProductPageDetailed, listBackfillStoreIds } = await import("../src/store-sites/backfill-product-page.server");
  const { broadcastInvalidation, invalidateStoreSite } = await import("@workspace/cache");

  const ids = await listBackfillStoreIds(db);
  const totals = { added: 0, skipped: 0, failed: 0, liveUpdated: 0 };
  for (const id of ids) {
    try {
      const out = await backfillStoreProductPageDetailed(db, id, { dryRun: !apply });
      totals[out.result] += 1;
      console.log(`${id} ${out.subdomain ?? "-"} template=${out.templateKey ?? "-"} ${out.result}${apply || out.result === "skipped" ? "" : " (would add)"}: ${out.reason}`);
      if (apply && out.publishedUpdated && out.sellerId && out.subdomain) {
        totals.liveUpdated += 1;
        await broadcastInvalidation(invalidateStoreSite(out.sellerId, id, out.subdomain), "admin");
      }
    } catch (error) {
      totals.failed += 1;
      console.log(`${id} - template=- failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(`Stores: ${ids.length}. ${apply ? "Added" : "Would add"}: ${totals.added}. Skipped: ${totals.skipped}. Failed: ${totals.failed}. Live snapshots ${apply ? "updated" : "to update"}: ${apply ? totals.liveUpdated : "see per-store lines"}.`);
  process.exit(totals.failed ? 1 : 0);
}

void main();
