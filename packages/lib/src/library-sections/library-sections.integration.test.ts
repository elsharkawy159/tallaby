// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { describe, it } from "vitest";

describe.skip("disabled: templates and sections are code-only (0109)", () => {
  it("is disabled", () => {});
});

// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import { afterAll, describe, expect, it } from "vitest";
// import * as DB_SCHEMA from "@workspace/db/schema";
// import { DESIGNS, designSlotTree } from "@workspace/store-sections/render";
// import { listLibraryPresets, listPublishedLibrarySections } from "./server";
//
// /**
//  * The published section library (0086) against the staging copy. Rows added
//  * here live in a rolled-back transaction. Skipped without TEST_DATABASE_URL.
//  */
// const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
// const ROLLBACK = new Error("rollback");
//
// describe.skipIf(!TEST_DATABASE_URL)("library sections (integration)", { timeout: 60_000 }, () => {
//   const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 2 });
//   const db = drizzle(client, { schema: DB_SCHEMA });
//
//   afterAll(async () => {
//     await client.end();
//   });
//
//   it("lists the seeded designs in sort order as their code presets", async () => {
//     const rows = await listPublishedLibrarySections(db as never);
//     const seeded = rows.filter((row) => DESIGNS.some((d) => d.id === row.key));
//     expect(seeded.length).toBeGreaterThan(0);
//     const hero = rows.find((row) => row.key === "hero-classic");
//     expect(hero?.tree).toEqual(designSlotTree(DESIGNS.find((d) => d.id === "hero-classic")!));
//     const presets = await listLibraryPresets(db as never);
//     expect(presets.find((p) => p.id === "hero.classic")?.designKey).toBe("hero-classic");
//   });
//
//   it("leaves out hidden and deleted rows", async () => {
//     await expect(
//       db.transaction(async (tx) => {
//         const tree = { type: "section", props: {}, children: [] };
//         const base = { category: "hero", subcategory: "split", name: { ar: "س", en: "s" }, tree, sortOrder: -1 };
//         await tx.insert(DB_SCHEMA.librarySections).values([
//           { ...base, key: "zz-task10-visible" },
//           { ...base, key: "zz-task10-hidden", isHidden: true },
//           { ...base, key: "zz-task10-deleted", deletedAt: new Date().toISOString() },
//         ]);
//         const keys = (await listPublishedLibrarySections(tx as never)).map((row) => row.key);
//         expect(keys[0]).toBe("zz-task10-visible");
//         expect(keys).not.toContain("zz-task10-hidden");
//         expect(keys).not.toContain("zz-task10-deleted");
//         throw ROLLBACK;
//       }),
//     ).rejects.toBe(ROLLBACK);
//   });
// });
//
