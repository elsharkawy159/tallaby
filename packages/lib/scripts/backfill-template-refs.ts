/**
 * One-off: stores every template's library sections as refs (owner, 2026-10-25;
 * `src/store-sites/backfill-template-refs.server.ts`), so a library section edit reaches
 * every template that uses it. Each converted template gets a new version; sections an
 * admin edited keep their trees. Idempotent; one transaction per template.
 *
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:template-refs            (dry run)
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:template-refs --apply    (writes)
 *
 * Deploy the code that reads refs FIRST (an older app shows a ref section as empty).
 * Dry run is the default. DATABASE_URL must be set explicitly in the environment (never read
 * from a file by this script); only its host is printed. After writing, the template catalog
 * cache tag is broadcast (needs REVALIDATE_SECRET and ECOMMERCE_URL; else it clears by TTL).
 * Rollback per template: make the previous version current again.
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
  const { backfillTemplateRefs, listTemplateRefsBackfillKeys } = await import("../src/store-sites/backfill-template-refs.server");
  const { broadcastInvalidation, invalidateTemplateCatalog } = await import("@workspace/cache");

  try {
    const keys = await listTemplateRefsBackfillKeys(db);
    const totals = { converted: 0, skipped: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 };
    for (const key of keys) {
      try {
        const out = await backfillTemplateRefs(db, key, { dryRun: !apply });
        totals[out.result] += 1;
        totals.bytesBefore += out.bytesBefore ?? 0;
        totals.bytesAfter += out.bytesAfter ?? 0;
        const stats = out.refs === undefined ? "" : ` ${out.refs}/${out.sections} sections as refs, ${out.bytesBefore} → ${out.bytesAfter} bytes`;
        console.log(`${key} ${out.result}${apply || out.result === "skipped" ? "" : " (would convert)"}: ${out.reason}${stats}`);
      } catch (error) {
        totals.failed += 1;
        console.log(`${key} failed: ${errorLine(error)}`);
      }
    }
    console.log(
      `Templates: ${keys.length}. ${apply ? "Converted" : "Would convert"}: ${totals.converted}. Skipped: ${totals.skipped}. Failed: ${totals.failed}. Config bytes: ${totals.bytesBefore} → ${totals.bytesAfter}.`,
    );
    if (apply && totals.converted) {
      if (process.env.REVALIDATE_SECRET && process.env.ECOMMERCE_URL) await broadcastInvalidation(invalidateTemplateCatalog(), "admin");
      else console.warn("REVALIDATE_SECRET and/or ECOMMERCE_URL is not set: the template caches clear when their TTL expires.");
    }
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
