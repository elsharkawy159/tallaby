import { and, carts, db, eq, sql } from "@workspace/db";

/**
 * Notes that the customer changed this cart's lines (`carts.last_activity`, read
 * by the abandoned-cart job and Admin's Pending carts). Call it after the write,
 * outside any transaction. It's one update by primary key, and a failure is only
 * logged: a cart write never fails because of this. A completed cart isn't changed.
 *
 * Only a customer's own changes count. Placing an order and a seller trashing a
 * product also remove lines, and they don't call this.
 */
export async function touchCartActivity(cartId: string): Promise<void> {
  try {
    await db
      .update(carts)
      .set({ lastActivity: sql`now()` })
      .where(and(eq(carts.id, cartId), eq(carts.status, "active")));
  } catch (error) {
    // Name only: Drizzle's error message repeats the query's values.
    console.error("[cart] last activity update failed", (error as Error)?.name);
  }
}
