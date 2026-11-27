/**
 * One-off, owner-approved (2026-11-27): delete every stored seller document
 * (`documents/` in the public `sellers` storage bucket) after migration 0187
 * dropped `seller_documents`. Supabase blocks deleting `storage.objects` rows
 * with SQL, so this goes through the Storage API with the service role.
 *
 * Covers both layouts: `documents/<sellerId>/<file>` (0152 on) and the older
 * flat `documents/<file>`. Touches nothing outside `documents/`.
 *
 * Dry run by default (lists and counts only); `--apply` deletes.
 * Logs counts only: no file names, no seller ids, never the key.
 *
 * Usage (from the repo root; same project as the database 0187 ran on):
 *   node --env-file=<env file> packages/db/scripts/delete-seller-documents-files.mjs
 *   node --env-file=<env file> packages/db/scripts/delete-seller-documents-files.mjs --apply
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "sellers";
const ROOT = "documents";
const PAGE = 1000;
const REMOVE_BATCH = 500;

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const storage = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }).storage.from(BUCKET);

/** Every object path under `prefix`, depth-first. Folders come back with `id === null`. */
async function listAll(prefix) {
  const files = [];
  const folders = [prefix];
  while (folders.length) {
    const dir = folders.pop();
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await storage.list(dir, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw new Error(`list failed: ${error.message}`);
      for (const entry of data ?? []) {
        const path = `${dir}/${entry.name}`;
        if (entry.id === null) folders.push(path);
        else files.push(path);
      }
      if (!data || data.length < PAGE) break;
    }
  }
  return files;
}

const files = await listAll(ROOT);
const sellerFolders = new Set(files.map((p) => p.split("/")).filter((s) => s.length > 2).map((s) => s[1]));
console.log(`${BUCKET}/${ROOT}: ${files.length} file(s) in ${sellerFolders.size} seller folder(s), ${files.filter((p) => p.split("/").length === 2).length} at the top level`);

if (!apply) {
  console.log("Dry run: nothing deleted. Re-run with --apply to delete.");
  process.exit(0);
}

let removed = 0;
for (let i = 0; i < files.length; i += REMOVE_BATCH) {
  const batch = files.slice(i, i + REMOVE_BATCH);
  const { data, error } = await storage.remove(batch);
  if (error) throw new Error(`remove failed after ${removed} file(s): ${error.message}`);
  removed += data?.length ?? 0;
}
const left = (await listAll(ROOT)).length;
console.log(`Deleted ${removed} file(s); ${left} left under ${ROOT}/.`);
process.exit(left === 0 ? 0 : 1);
