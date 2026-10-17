/**
 * Test-only fixtures for the tenant isolation harness (PLAN.md P1-05, §17):
 * seller A with stores A1 (primary) + A2, seller B with B1. Each seller gets a
 * users row, a sellers row (the 0050 trigger creates the primary store) and a
 * published revision on its primary store. `cleanup()` deletes everything
 * (cascade from users → sellers → stores).
 */
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import * as s from "@workspace/db/schema";
import { createStore } from "./server";
import { getStoreForEditor, publishStoreSite, saveStorePageDraft } from "../store-sites/server";

/** The handle the server functions accept (any Drizzle db over @workspace/db schema). */
type TestDb = NonNullable<Parameters<typeof createStore>[2]>;

export type IsolationWorld = {
  a: { sellerId: string; a1: string; a2: string; a1Home: string; a2Home: string; a1Revision: string; a1Sub: string; a2Sub: string };
  b: { sellerId: string; b1: string; b1Home: string; b1Revision: string; b1Sub: string };
  cleanup: () => Promise<void>;
};

const hero = (title: string) => ({ sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title } }] });

async function insertSeller(db: TestDb, id: string, subdomain: string) {
  await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
  await db.insert(s.sellers).values({
    id,
    businessName: `Iso ${subdomain}`,
    displayName: `Iso ${subdomain}`,
    slug: subdomain,
    subdomain,
    businessType: "individual",
    legalAddress: { country: "EG" },
    supportEmail: "iso@example.com",
    status: "approved",
  });
  const [primary] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, id));
  return primary!.id;
}

async function homePageId(db: TestDb, sellerId: string, storeId: string) {
  const editor = await getStoreForEditor(sellerId, storeId, db);
  return editor!.pages.find((p) => p.isHome)!.id;
}

async function publishHome(db: TestDb, sellerId: string, storeId: string, pageId: string, title: string) {
  const saved = await saveStorePageDraft(sellerId, storeId, pageId, hero(title), 1, {}, db);
  if (!saved.success) throw new Error(`fixture save failed: ${saved.error}`);
  const published = await publishStoreSite(sellerId, storeId, sellerId, {}, db);
  if (!published.success) throw new Error(`fixture publish failed: ${published.error}`);
  return published.data.revisionId;
}

export async function createIsolationWorld(db: TestDb): Promise<IsolationWorld> {
  const aId = randomUUID();
  const bId = randomUUID();
  const tag = aId.slice(0, 8);
  const a1Sub = `iso-${tag}-a1`;
  const a2Sub = `iso-${tag}-a2`;
  const b1Sub = `iso-${tag}-b1`;

  const a1 = await insertSeller(db, aId, a1Sub);
  const b1 = await insertSeller(db, bId, b1Sub);
  const created = await createStore(aId, { name: "A2", subdomain: a2Sub }, db);
  if (!created.success) throw new Error(`fixture createStore failed: ${created.error}`);
  const a2 = created.data.id;

  const a1Home = await homePageId(db, aId, a1);
  const a2Home = await homePageId(db, aId, a2);
  const b1Home = await homePageId(db, bId, b1);
  const a1Revision = await publishHome(db, aId, a1, a1Home, "A1 live");
  const b1Revision = await publishHome(db, bId, b1, b1Home, "B1 live");

  return {
    a: { sellerId: aId, a1, a2, a1Home, a2Home, a1Revision, a1Sub, a2Sub },
    b: { sellerId: bId, b1, b1Home, b1Revision, b1Sub },
    cleanup: async () => {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, [aId, bId]));
      await db.delete(s.users).where(inArray(s.users.id, [aId, bId]));
    },
  };
}
