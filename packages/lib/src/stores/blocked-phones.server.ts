/**
 * Store phone blocklist queries (ROADMAP.md F-02, 0118). Server-only.
 *
 * Callers pass a storeId they already checked: the dashboard through
 * requireStore (the store belongs to the session seller), checkout through
 * the cart's own store. Every query filters by that store_id.
 */
import { and, db, desc, eq, storeBlockedPhones } from "@workspace/db";
import { normalizeBlockedPhone } from "./blocked-phones.lib";

export type StoreBlockedPhone = {
  id: string;
  phone: string;
  reason: string | null;
  createdAt: string;
};

/** True when this store blocked the phone (any spelling of it). */
export async function isStorePhoneBlocked(storeId: string, rawPhone: string | null | undefined): Promise<boolean> {
  const phone = rawPhone ? normalizeBlockedPhone(rawPhone) : null;
  if (!phone) return false;
  const [row] = await db
    .select({ id: storeBlockedPhones.id })
    .from(storeBlockedPhones)
    .where(and(eq(storeBlockedPhones.storeId, storeId), eq(storeBlockedPhones.phone, phone)))
    .limit(1);
  return !!row;
}

export async function listStoreBlockedPhones(storeId: string): Promise<StoreBlockedPhone[]> {
  return db
    .select({
      id: storeBlockedPhones.id,
      phone: storeBlockedPhones.phone,
      reason: storeBlockedPhones.reason,
      createdAt: storeBlockedPhones.createdAt,
    })
    .from(storeBlockedPhones)
    .where(eq(storeBlockedPhones.storeId, storeId))
    .orderBy(desc(storeBlockedPhones.createdAt))
    .limit(1000);
}

/** Blocks a normalised phone; blocking it again only updates the reason. */
export async function blockStorePhone(input: {
  storeId: string;
  phone: string;
  reason?: string;
  createdBy: string;
}): Promise<StoreBlockedPhone> {
  const [row] = await db
    .insert(storeBlockedPhones)
    .values({
      storeId: input.storeId,
      phone: input.phone,
      reason: input.reason ?? null,
      createdBy: input.createdBy,
    })
    .onConflictDoUpdate({
      target: [storeBlockedPhones.storeId, storeBlockedPhones.phone],
      set: { reason: input.reason ?? null },
    })
    .returning({
      id: storeBlockedPhones.id,
      phone: storeBlockedPhones.phone,
      reason: storeBlockedPhones.reason,
      createdAt: storeBlockedPhones.createdAt,
    });
  return row!;
}

/** Unblocks by row id or phone; false when nothing on this store matched. */
export async function unblockStorePhone(storeId: string, target: { id: string } | { phone: string }): Promise<boolean> {
  const match =
    "id" in target ? eq(storeBlockedPhones.id, target.id) : eq(storeBlockedPhones.phone, target.phone);
  const removed = await db
    .delete(storeBlockedPhones)
    .where(and(eq(storeBlockedPhones.storeId, storeId), match))
    .returning({ id: storeBlockedPhones.id });
  return removed.length > 0;
}
