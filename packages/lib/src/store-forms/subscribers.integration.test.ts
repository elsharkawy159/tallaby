import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { createStoreForm, submitStoreForm } from "./server";
import type { FormInput } from "./store-forms.lib";
import {
  deleteStoreSubscribers,
  listAllStoreSubscribers,
  listSignUpFormIds,
  listStoreSubscribers,
  setStoreSubscribersStatus,
} from "./subscribers.server";

/**
 * Store newsletter subscribers (ROADMAP.md F-16d): sign-ups come only from the
 * store's sign-up forms, one row per email, and only the owning seller can
 * read or change them. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const newsletter: FormInput = {
  name: "Newsletter",
  fields: [
    { id: "f1", type: "email", key: "email", label: "Email", required: true },
    { id: "f2", type: "text", key: "name", label: "Name" },
  ],
  settings: { submitLabel: "Subscribe", successMessage: "Thanks!" },
};
const contact: FormInput = {
  name: "Contact",
  fields: [
    { id: "f1", type: "email", key: "email", label: "Email", required: true },
    { id: "f2", type: "textarea", key: "message", label: "Message", required: true },
  ],
};

const meta = { ipHash: null, userAgent: "vitest", sourceUrl: "https://x.test/" };

describe.skipIf(!TEST_DATABASE_URL)("store subscribers (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;
  const f = { news: "", contact: "", b: "" };

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    const news = await createStoreForm(w.a.sellerId, w.a.a1, newsletter, db);
    const con = await createStoreForm(w.a.sellerId, w.a.a1, contact, db);
    const b = await createStoreForm(w.b.sellerId, w.b.b1, newsletter, db);
    if (!news.success || !con.success || !b.success) throw new Error("fixture forms failed");
    f.news = news.data.id;
    f.contact = con.data.id;
    f.b = b.data.id;
    await submitStoreForm(w.a.a1, f.news, { email: "Mona@X.com", name: "Mona" }, meta, db);
    await submitStoreForm(w.a.a1, f.news, { email: "sara@x.com" }, meta, db);
    await submitStoreForm(w.a.a1, f.news, { email: "mona@x.com", name: "Mona A" }, meta, db);
    await submitStoreForm(w.a.a1, f.contact, { email: "contact@x.com", message: "hi" }, meta, db);
    await submitStoreForm(w.b.b1, f.b, { email: "b@x.com" }, meta, db);
  }, 60_000);

  afterAll(async () => {
    if (w) await w.cleanup();
    await client.end();
  });

  it("finds only sign-up forms of the seller's own store", async () => {
    expect(await listSignUpFormIds(w.a.sellerId, w.a.a1, db)).toEqual([f.news]);
    expect(await listSignUpFormIds(w.b.sellerId, w.a.a1, db)).toEqual([]);
  });

  it("lists one row per email, newest first, without contact-form rows", async () => {
    const page = await listStoreSubscribers(w.a.sellerId, w.a.a1, {}, db);
    expect(page.rows.map((r) => r.identity)).toEqual(["mona@x.com", "sara@x.com"]);
    expect(page.rows[0]).toMatchObject({ name: "Mona A", signups: 2, status: "subscribed" });
    expect(page.counts).toEqual({ subscribed: 2, unsubscribed: 0 });
    expect((await listStoreSubscribers(w.a.sellerId, w.a.a1, { query: "SAR" }, db)).rows.map((r) => r.identity)).toEqual([
      "sara@x.com",
    ]);
    expect(await listStoreSubscribers(w.b.sellerId, w.a.a1, {}, db)).toMatchObject({ rows: [], hasSignUpForm: false });
  });

  it("unsubscribes, re-subscribes and deletes only the owner's subscribers", async () => {
    const [mona] = (await listStoreSubscribers(w.a.sellerId, w.a.a1, {}, db)).rows;
    expect(await setStoreSubscribersStatus(w.b.sellerId, w.a.a1, [mona!.id], "unsubscribed", db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await setStoreSubscribersStatus(w.a.sellerId, w.a.a1, [mona!.id], "unsubscribed", db)).toEqual({ success: true, count: 1 });
    let page = await listStoreSubscribers(w.a.sellerId, w.a.a1, {}, db);
    expect(page.rows.map((r) => r.identity)).toEqual(["sara@x.com"]);
    expect(page.counts).toEqual({ subscribed: 1, unsubscribed: 1 });
    expect((await listAllStoreSubscribers(w.a.sellerId, w.a.a1, { status: "unsubscribed" }, db)).map((r) => r.identity)).toEqual([
      "mona@x.com",
    ]);

    await setStoreSubscribersStatus(w.a.sellerId, w.a.a1, [mona!.id], "subscribed", db);
    expect((await listStoreSubscribers(w.a.sellerId, w.a.a1, {}, db)).counts).toEqual({ subscribed: 2, unsubscribed: 0 });

    expect(await deleteStoreSubscribers(w.b.sellerId, w.a.a1, [mona!.id], db)).toEqual({ success: false, error: "not_found" });
    expect(await deleteStoreSubscribers(w.a.sellerId, w.a.a1, [mona!.id], db)).toEqual({ success: true, count: 1 });
    page = await listStoreSubscribers(w.a.sellerId, w.a.a1, { status: "all" }, db);
    expect(page.rows.map((r) => r.identity)).toEqual(["sara@x.com"]);
    // B's subscriber is untouched.
    expect((await listStoreSubscribers(w.b.sellerId, w.b.b1, {}, db)).rows.map((r) => r.identity)).toEqual(["b@x.com"]);
  });
});
