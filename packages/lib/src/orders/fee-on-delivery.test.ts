import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FEE_ON_DELIVERY_SWITCH } from "@workspace/db/wallet";
import { PLATFORM_SWITCHES } from "../stores/platform-switches.lib";

/**
 * Fee on delivery (owner, 2026-11-26; PLAN.md §13.3). With the switch on, the
 * delivery charge is where the fee is taken, so a path that marks an order or
 * a seller's lines delivered without calling `creditSellerOnDelivery` loses
 * the fee (the 14-day job is only the backstop). This scans the apps and
 * packages for code that writes a delivered status and checks each file is a
 * known writer that calls it.
 */

const ROOT = resolve(__dirname, "../../../..");

/** Every file that writes `delivered` onto orders, order_items or shipments, and calls the delivery charge. */
const DELIVERED_WRITERS = [
  "apps/admin/actions/orders.ts", // Admin › Orders: updateOrderStatus("delivered")
  "apps/dashboard/actions/orders.ts", // updateOrderItemStatus (a seller's line)
  "apps/shipping/lib/apply-shipment-status.ts", // shipping app: admin board, bulk, rider
  "packages/lib/src/shipping/apply-seller-shipment.server.ts", // seller orders, bulk, delivery workspace, Bosta webhook and sync
];

/** How a delivered write looks in this codebase (a delivered timestamp set, or the status patched to delivered). */
const WRITES_DELIVERED = [
  /deliveredAt\s*:\s*(new Date|now\b|sql|stamp\b)/,
  /\{\s*status:\s*["']delivered["']\s*,\s*deliveredAt/,
  /\.status\s*=\s*["']delivered["']\s*;/, // a JS assignment (`patch.status = "delivered";`), not an SQL filter
  /\bUPDATE\s+\w+\s+SET\b[^;`]*?\bstatus\s*=\s*'delivered'/i,
];

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".turbo", "migrations", "coverage"]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(path);
  }
  return out;
}

describe("fee on delivery", () => {
  it("the switch key read by packages/db is a known platform switch", () => {
    expect(PLATFORM_SWITCHES).toContain(FEE_ON_DELIVERY_SWITCH);
  });

  it("every path that marks something delivered takes the delivery fee", () => {
    const files = [...sourceFiles(join(ROOT, "apps")), ...sourceFiles(join(ROOT, "packages"))];
    const writers = files
      .filter((file) => WRITES_DELIVERED.some((pattern) => pattern.test(readFileSync(file, "utf8"))))
      .map((file) => relative(ROOT, file).replace(/\\/g, "/"))
      .sort();
    expect(writers).toEqual([...DELIVERED_WRITERS].sort());
    for (const file of DELIVERED_WRITERS) {
      expect(readFileSync(join(ROOT, file), "utf8"), file).toMatch(/creditSellerOnDelivery\(tx,/);
    }
  });
});
