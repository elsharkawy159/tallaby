import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Template seed migrations that are applied and must never change.
 * frozen: applied on staging and production 2026-10-20; DB is the master copy (admin website builder).
 * The generator (`template:sql`) may now produce different output for these
 * templates (e.g. `ch` widths the sanitizer used to drop); the files stay as
 * applied, and live templates are edited in Admin, not re-seeded.
 */
export const FROZEN_SEEDS: Readonly<Record<string, string>> = {
  "0084_mobile_header_padding.sql": "90f03e8f937287e92573d34b9f75a7fb1bb4a96c1a410cf4c68a14855461fbc5",
  "0087_template_drafts.sql": "79948579f1858e299cda844f40ec9b23354ecbba94d5cf53214bb94676619790",
  // Templates 49–100. frozen: applied on staging and production 2026-10-21.
  "0090_library_templates_49_100.sql": "1b02f28d2487c1b1af0840cbffe4d80e3a8aa71ae0eb00c45e7b03d0a7bd12a6",
  // Templates 39–48 and 101–110. frozen: applied on staging and production 2026-10-23.
  "0095_library_templates_39_48_101_110.sql": "6c5c94b56e15d3bcff5f4df186f6854ac9a2784ee4004ba1ebb8b0f1fda74f01",
  // Section library seed. frozen: applied on staging and production 2026-10-20; DB is the master copy.
  // New designs go in a new migration from `section:sql --new-only NNNN_name.sql`.
  "0086_library_sections.sql": "98dd403f0e31efa5ec47f3ff6f80641d54e3103f12e621478c3c3d63a9d9efbe",
};

/** sha256 of a migration file with CRLF normalised to LF. */
export function migrationSha256(file: string): string {
  const sql = readFileSync(join(__dirname, "../../../db/migrations", file), "utf8").replace(/\r\n/g, "\n");
  return createHash("sha256").update(sql).digest("hex");
}
