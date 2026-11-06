import { db, eq, orders } from "@workspace/db";

export { orderMovesStock, orderPaysPlatformFee } from "@workspace/db/wallet";

/**
 * Test orders (0155, ROADMAP.md F-76). The buyer is the seller trying their own
 * store before activation, so nothing goes to "the buyer": no email, no SMS, no
 * WhatsApp. Senders call this with the order id they were given; a missing order
 * reads as not a test order, so real mail is never dropped by mistake.
 */
export async function isTestOrder(orderId: string): Promise<boolean> {
  const [row] = await db.select({ isTest: orders.isTest }).from(orders).where(eq(orders.id, orderId)).limit(1);
  return row?.isTest === true;
}
