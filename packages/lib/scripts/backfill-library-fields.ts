/**
 * One-off: stores the field names in every library section's tree and draft tree
 * (owner, 2026-10-26; `src/admin/backfill-library-fields.server.ts`). Templates store
 * their section values by these names. Run it BEFORE `backfill:template-refs`, and before
 * admins edit library sections with the new editor. Idempotent; one transaction per row;
 * no version bump (the names are inert).
 *
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:library-fields            (dry run)
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:library-fields --apply    (writes)
 *
 * Dry run is the default. DATABASE_URL must be set explicitly in the environment (never read
 * from a file by this script); only its host is printed. Production runs need the owner's
 * go-ahead (CLAUDE.md rule 4).
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
  const { backfillLibraryFields, listLibraryFieldsBackfillKeys } = await import("../src/admin/backfill-library-fields.server");

  try {
    const keys = await listLibraryFieldsBackfillKeys(db);
    const totals = { named: 0, skipped: 0, failed: 0 };
    for (const key of keys) {
      try {
        const out = await backfillLibraryFields(db, key, { dryRun: !apply });
        totals[out.result] += 1;
        if (out.result === "named") console.log(`${key} ${apply ? "named" : "would be named"}: ${out.reason}`);
      } catch (error) {
        totals.failed += 1;
        console.log(`${key} failed: ${errorLine(error)}`);
      }
    }
    console.log(`Library sections: ${keys.length}. ${apply ? "Named" : "Would name"}: ${totals.named}. Skipped: ${totals.skipped}. Failed: ${totals.failed}.`);
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
