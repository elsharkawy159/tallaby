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
};

/** sha256 of a migration file with CRLF normalised to LF. */
export function migrationSha256(file: string): string {
  const sql = readFileSync(join(__dirname, "../../../db/migrations", file), "utf8").replace(/\r\n/g, "\n");
  return createHash("sha256").update(sql).digest("hex");
}
