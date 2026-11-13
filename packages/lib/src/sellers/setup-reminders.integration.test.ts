import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";
import { dueSetupReminder } from "./setup-reminders.lib";
import {
  claimSetupReminder,
  countSetupRemindersSentToday,
  listSetupRemindersForSeller,
  loadSetupReminderSellers,
  markSetupReminderFailed,
  markSetupReminderSent,
  optOutOfSetupReminders,
} from "./setup-reminders.server";

/**
 * Store setup reminders (ROADMAP.md F-94) against a real Postgres with 0170
 * applied. Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store setup reminders (integration)", { timeout: 30_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA }) as never;
  const raw = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;

  afterAll(async () => {
    await client.end();
  });

  async function newSeller(opts: { ageHours: number; confirmed?: boolean }) {
    const id = randomUUID();
    const sub = `sr-${id.slice(0, 8)}`;
    await createAuthUsers(id);
    if (opts.confirmed !== false) await raw.execute(sql`UPDATE auth.users SET email_confirmed_at = now() WHERE id = ${id}`);
    await raw.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await raw.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "sr@example.com",
      status: "approved",
    });
    await raw.execute(sql`UPDATE sellers SET created_at = now() - make_interval(hours => ${opts.ageHours}) WHERE id = ${id}`);
    return id;
  }

  it("selects a new seller whose store isn't set up, with their store flags", async () => {
    const id = await newSeller({ ageHours: 30 });
    const [seller] = await loadSetupReminderSellers({ sellerId: id }, db);
    expect(seller?.email).toMatch(/@example\.test$/);
    expect(seller?.stores.length).toBeGreaterThan(0);
    expect(seller?.stores[0]?.flags.product).toBe(false);
    expect(dueSetupReminder(seller!, new Date())?.kind).toBe("day1");
  });

  it("leaves out unconfirmed emails, accounts under 24 hours and outside the 30-day window", async () => {
    const unconfirmed = await newSeller({ ageHours: 30, confirmed: false });
    const fresh = await newSeller({ ageHours: 2 });
    const old = await newSeller({ ageHours: 31 * 24 });
    for (const id of [unconfirmed, fresh, old]) expect(await loadSetupReminderSellers({ sellerId: id }, db)).toEqual([]);
  });

  it("claims once, retries a failure, counts today's sends and opts out by token", async () => {
    const id = await newSeller({ ageHours: 30 });
    const first = await claimSetupReminder(id, "day1", db);
    expect(first?.attempts).toBe(1);
    expect(await claimSetupReminder(id, "day1", db)).toBeNull();

    await markSetupReminderFailed(id, "day1", "boom", db);
    const retry = await claimSetupReminder(id, "day1", db);
    expect(retry).toEqual({ token: first!.token, attempts: 2 });

    const before = await countSetupRemindersSentToday(db);
    await markSetupReminderSent(id, "day1", "re_test", db);
    expect(await countSetupRemindersSentToday(db)).toBe(before);
    expect(await claimSetupReminder(id, "day1", db)).toBeNull();

    expect(await optOutOfSetupReminders("0".repeat(48), db)).toBe(false);
    expect(await optOutOfSetupReminders(first!.token, db)).toBe(true);
    const kinds = (await listSetupRemindersForSeller(id, db)).map((r) => `${r.kind}:${r.status}`);
    expect(kinds).toEqual(["day1:sent", "opt_out:opted_out"]);
    const [seller] = await loadSetupReminderSellers({ sellerId: id }, db);
    expect(dueSetupReminder(seller!, new Date(Date.now() + 7 * 86_400_000))).toBeNull();
  });
});
