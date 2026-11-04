import { and, db, desc, eq, orders, sql, userAddresses, users } from "@workspace/db";
import type { ParsedCheckoutAddress } from "./checkout-address.lib";

type ValidAddress = Extract<ParsedCheckoutAddress, { ok: true }>["value"];
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A guest's first address also becomes their profile, as the other address flows do. */
async function syncGuestProfile(tx: Tx, userId: string, value: ValidAddress) {
  const [row] = await tx
    .select({ isGuest: users.isGuest, count: sql<number>`(SELECT count(*)::int FROM user_addresses WHERE user_id = ${userId})` })
    .from(users)
    .where(eq(users.id, userId));
  if (!row?.isGuest || row.count !== 0) return;
  await tx
    .update(users)
    .set({ fullName: value.fullName, phone: value.phone, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

/**
 * Saves the simple checkout form's address for this user (ROADMAP.md F-64).
 * Every read and write is scoped to `userId`, which the caller takes from the session.
 *
 * Editing updates the row, unless a past order points at it: an order's address
 * must not change afterwards, so a new row takes its place. The same address
 * reuses its row. A user's first address, or one replacing the default, is the default.
 */
export async function saveCheckoutAddressRow(
  userId: string,
  value: ValidAddress,
  addressId: string | null | undefined,
  q: typeof db = db,
): Promise<{ id: string; created: boolean }> {
  return q.transaction(async (tx) => {
    // One save at a time per user, so two tabs can't create the same address twice.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`checkout-address:${userId}`}, 0))`);
    const columns = {
      fullName: value.fullName,
      phone: value.phone,
      addressLine1: value.addressLine1,
      addressLine2: null,
      state: value.state,
      city: value.city,
      country: value.country,
      ...(value.latitude != null && value.longitude != null
        ? { latitude: value.latitude, longitude: value.longitude }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    const current =
      addressId && UUID_RE.test(addressId)
        ? await tx.query.userAddresses.findFirst({
            where: and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)),
            columns: { id: true, isDefault: true },
          })
        : null;

    if (current) {
      const [used] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.shippingAddressId, current.id))
        .limit(1);
      if (!used) {
        await tx
          .update(userAddresses)
          .set(columns)
          .where(and(eq(userAddresses.id, current.id), eq(userAddresses.userId, userId)));
        return { id: current.id, created: false };
      }
    }

    const same = await tx.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.userId, userId),
        eq(userAddresses.phone, value.phone),
        eq(userAddresses.addressLine1, value.addressLine1),
        eq(userAddresses.state, value.state),
      ),
      columns: { id: true },
      orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)],
    });
    if (same) {
      await tx
        .update(userAddresses)
        .set({ fullName: value.fullName, updatedAt: columns.updatedAt })
        .where(and(eq(userAddresses.id, same.id), eq(userAddresses.userId, userId)));
      return { id: same.id, created: false };
    }

    await syncGuestProfile(tx, userId, value);
    const defaultRow = await tx.query.userAddresses.findFirst({
      where: and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)),
      columns: { id: true },
    });
    const isDefault = !defaultRow || current?.isDefault === true;
    if (isDefault && defaultRow) {
      await tx.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
    }
    const [created] = await tx
      .insert(userAddresses)
      .values({ ...columns, userId, addressType: "both", postalCode: "", isDefault })
      .returning({ id: userAddresses.id });
    return { id: created!.id, created: true };
  });
}
