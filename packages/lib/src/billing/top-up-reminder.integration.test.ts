import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";
import { isTopUpReminderDue } from "./top-up-reminder.lib";
import { insertTopUpReminders, loadTopUpReminderCandidates } from "./top-up-reminder.server";

/**
 * The 24-hour top-up reminder (0172) against a real Postgres. Only this file's
 * own sellers are read or written (always by seller id), so it never reminds
 * anyone real. The insert test runs only where 0172 is applied. Skipped when
 * TEST_DATABASE_URL is unset; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("top-up reminder (integration)", { timeout: 30_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA }) as never;
  const raw = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;

  afterAll(async () => {
    await client.end();
  });

  /** A seller whose first store is `storeAgeHours` old. */
  async function newSeller(storeAgeHours: number) {
    const id = randomUUID();
    const sub = `tur-${id.slice(0, 8)}`;
    await createAuthUsers(id);
    await raw.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await raw.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      supportEmail: "tur@example.com",
      status: "approved",
    });
    const [store] = [
      ...(await raw.execute(sql`SELECT id FROM stores WHERE seller_id = ${id} AND deleted_at IS NULL LIMIT 1`)),
    ] as { id: string }[];
    if (!store) await raw.execute(sql`INSERT INTO stores (seller_id, name, subdomain) VALUES (${id}, ${sub}, ${sub})`);
    await raw.execute(sql`UPDATE stores SET created_at = now() - make_interval(hours => ${storeAgeHours}) WHERE seller_id = ${id}`);
    return id;
  }

  const load = (sellerId: string) => loadTopUpReminderCandidates({ sellerId }, db);

  it("selects a seller who isn't activated 24 hours after the first store", async () => {
    const id = await newSeller(30);
    const [candidate] = await load(id);
    expect(candidate).toMatchObject({ sellerId: id, hasTopUp: false, hasHadPositiveBalance: false, alreadyReminded: false });
    expect(isTopUpReminderDue(candidate!, true)).toBe(true);
  });

  it("leaves out stores under 24 hours or past the window, and suspended or fake sellers", async () => {
    const fresh = await newSeller(2);
    const old = await newSeller(15 * 24);
    const suspended = await newSeller(30);
    await raw.execute(sql`UPDATE users SET is_suspended = true WHERE id = ${suspended}`);
    const fake = await newSeller(30);
    await raw.execute(sql`UPDATE sellers SET referral_excluded_at = now() WHERE id = ${fake}`);
    for (const id of [fresh, old, suspended, fake]) expect(await load(id)).toEqual([]);
  });

  it("leaves out activated sellers and a manual top-up in review", async () => {
    const toppedUp = await newSeller(30);
    const reviewing = await newSeller(30);
    const pro = await newSeller(30);
    for (const [sellerId, status, provider] of [
      [toppedUp, "succeeded", "kashier"],
      [reviewing, "pending", "instapay"],
    ] as const) {
      const ref = randomUUID();
      await raw.execute(sql`
        INSERT INTO seller_wallet_top_ups (id, seller_id, amount, provider, status, provider_reference, created_by)
        VALUES (${ref}, ${sellerId}, 250, ${provider}, ${status}, ${ref}, ${sellerId})`);
    }
    await raw.execute(sql`UPDATE sellers SET plan = 'pro', plan_expires_at = now() + interval '20 days' WHERE id = ${pro}`);
    for (const id of [toppedUp, reviewing, pro]) expect(await load(id)).toEqual([]);
  });

  it("inserts one row per seller, once", async () => {
    const [check] = [
      ...(await raw.execute(
        sql`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'seller_notifications_type_check'`,
      )),
    ] as { def: string }[];
    if (!check?.def.includes("top_up_reminder")) return; // 0172 not applied on this database.

    const id = await newSeller(30);
    const candidates = await load(id);
    expect(await insertTopUpReminders(candidates, db)).toBe(1);
    expect(await insertTopUpReminders(candidates, db)).toBe(0);
    expect(await load(id)).toEqual([]);
    const rows = [
      ...(await raw.execute(sql`SELECT type, dedupe_key FROM seller_notifications WHERE seller_id = ${id} AND type = 'top_up_reminder'`)),
    ];
    expect(rows).toEqual([{ type: "top_up_reminder", dedupe_key: `top_up_reminder_24h:${id}` }]);
  });
});
